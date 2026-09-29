import {
  enqueuePublish,
  dequeuePublish,
  upsertPublishStatus,
  getPublishState,
  savePublishState,
} from '@/DB/publish-state.db';
import { getTaskList } from '@/DB/task.db';
import type { PublishQueueItem, PublishStatusSummary } from '@/types/publish.type';
import type { TaskItemType, sshItemType } from '@/types/index.type';
import { safePublishWithRetry } from '@/utils/utools';
import { nanoid } from 'nanoid';

type PublishParams = {
  task: TaskItemType;
  servers: sshItemType[];
  onLog?: (message: string) => void;
};

type QueueEntry = {
  task: TaskItemType;
  servers: sshItemType[];
  onLog?: (message: string) => void;
  runId: string;
  enqueuedAt: number;
};

let isDraining = false;
let maxConcurrency = 1;
let activeCount = 0;

const now = () => Date.now();

const createSummary = (taskId: string, runId: string): PublishStatusSummary => ({
  taskId,
  runId,
  status: 'queued',
  enqueuedAt: now(),
});

const updateSummary = async (summary: PublishStatusSummary) => {
  await upsertPublishStatus(summary);
};

const runEntry = async (entry: QueueEntry) => {
  const { task, servers, onLog, runId, enqueuedAt } = entry;
  const runningSummary: PublishStatusSummary = {
    taskId: task.id,
    runId,
    status: 'running',
    enqueuedAt,
    startedAt: now(),
  };
  await updateSummary(runningSummary);

  onLog?.(`开始发布任务 ${task.id}`);

  const result = await safePublishWithRetry(
    {
      serverData: servers,
      remoteData: task,
      onProcess: (message: string) => onLog?.(message),
    },
    { retries: 0, timeoutMs: 120000 },
  );

  if (!result.ok) {
    const errorMessage = result.error instanceof Error ? result.error.message : '发布失败';
    const failedSummary: PublishStatusSummary = {
      ...runningSummary,
      status: 'failed',
      finishedAt: now(),
      errorMessage,
      lastMessage: errorMessage,
    };
    await updateSummary(failedSummary);
    onLog?.(`发布失败：${errorMessage}`);
  } else {
    const successSummary: PublishStatusSummary = {
      ...runningSummary,
      status: 'success',
      finishedAt: now(),
      lastMessage: '发布完成',
    };
    await updateSummary(successSummary);
    onLog?.('发布完成');
  }
};

const startWorkers = async () => {
  if (isDraining) return;
  isDraining = true;
  try {
    while (true) {
      if (activeCount >= maxConcurrency) break;
      const { next } = await dequeuePublish();
      if (!next) break;
      const active = queueCache.get(next.runId);
      if (!active) {
        const failedSummary: PublishStatusSummary = {
          taskId: next.taskId,
          runId: next.runId,
          status: 'failed',
          enqueuedAt: next.enqueuedAt,
          finishedAt: now(),
          errorMessage: '任务参数丢失，请重试',
        };
        await updateSummary(failedSummary);
        continue;
      }
      activeCount += 1;
      const entry: QueueEntry = {
        task: active.task,
        servers: active.servers,
        onLog: active.onLog,
        runId: next.runId,
        enqueuedAt: next.enqueuedAt,
      };
      runEntry(entry)
        .catch(() => {
          // errors handled inside runEntry
        })
        .finally(() => {
          queueCache.delete(entry.runId);
          activeCount -= 1;
          void startWorkers();
        });
    }
  } finally {
    isDraining = false;
  }
};

const queueCache = new Map<
  string,
  { task: TaskItemType; servers: sshItemType[]; onLog?: (message: string) => void }
>();

export const setPublishConcurrency = (count: number) => {
  maxConcurrency = Math.max(1, count);
};

export const getPublishConcurrency = () => maxConcurrency;

export const isTaskQueuedOrRunning = async (taskId: string) => {
  const state = await getPublishState();
  const queued = state.queue.some((item) => item.taskId === taskId);
  const summary = state.byTask[taskId];
  const running = summary?.status === 'running' || summary?.status === 'queued';
  return queued || running;
};

export const enqueuePublishTask = async ({ task, servers, onLog }: PublishParams) => {
  const runId = nanoid();
  const item: PublishQueueItem = {
    runId,
    taskId: task.id,
    enqueuedAt: now(),
  };
  queueCache.set(runId, { task, servers, onLog });
  await enqueuePublish(item);
  await updateSummary(createSummary(task.id, runId));
  onLog?.('已加入发布队列');
  await startWorkers();
  return runId;
};

export const enqueuePublishTasks = async (
  tasks: Array<{ task: TaskItemType; servers: sshItemType[] }>,
  options?: { onLog?: (message: string) => void },
) => {
  const runIds: string[] = [];
  for (const item of tasks) {
    const runId = nanoid();
    const queueItem: PublishQueueItem = {
      runId,
      taskId: item.task.id,
      enqueuedAt: now(),
    };
    queueCache.set(runId, { task: item.task, servers: item.servers, onLog: options?.onLog });
    await enqueuePublish(queueItem);
    await updateSummary(createSummary(item.task.id, runId));
    runIds.push(runId);
  }
  options?.onLog?.('已加入发布队列');
  await startWorkers();
  return runIds;
};

export const getPublishStateSummary = async () => {
  return getPublishState();
};

/** 插件重启后残留发布的状态收尾文案 */
const INTERRUPTED_MESSAGE = '插件重启导致上一次发布中断，请重新发布';

/**
 * 启动时调用：收拾上一次运行留下的发布状态。
 * - 队列里残留的任务不会自动续跑（重启后自动往服务器推代码太危险），只把状态收尾成「已中断」；
 * - running/queued 在重启后不可能仍在运行，同样收尾；
 * - 顺手清掉已删除任务的历史状态，避免 byTask 越积越多。
 */
export const recoverPublishState = async () => {
  // 进程内计数在重启后必然失真，先复位
  activeCount = 0;
  isDraining = false;
  queueCache.clear();

  const state = await getPublishState();
  let changed = false;

  for (const item of state.queue) {
    state.byTask[item.taskId] = {
      taskId: item.taskId,
      runId: item.runId,
      status: 'failed',
      enqueuedAt: item.enqueuedAt,
      finishedAt: now(),
      errorMessage: INTERRUPTED_MESSAGE,
    };
    changed = true;
  }
  if (state.queue.length) {
    state.queue = [];
  }

  for (const [taskId, summary] of Object.entries(state.byTask)) {
    if (summary.status === 'running' || summary.status === 'queued') {
      state.byTask[taskId] = {
        ...summary,
        status: 'failed',
        finishedAt: now(),
        errorMessage: INTERRUPTED_MESSAGE,
      };
      changed = true;
    }
  }

  try {
    const tasks = await getTaskList();
    const aliveTaskIds = new Set(tasks.map((task) => task.id));
    for (const taskId of Object.keys(state.byTask)) {
      if (!aliveTaskIds.has(taskId)) {
        delete state.byTask[taskId];
        changed = true;
      }
    }
  } catch (error) {
    // 任务列表读不出来时不要动历史状态
  }

  if (changed) {
    await savePublishState(state);
  }

  return state;
};
