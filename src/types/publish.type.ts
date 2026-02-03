export type PublishRunStatus = 'idle' | 'queued' | 'running' | 'success' | 'failed';

export interface PublishStatusSummary {
  runId: string;
  taskId: string;
  status: PublishRunStatus;
  enqueuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  lastMessage?: string;
  errorMessage?: string;
}

export interface PublishQueueItem {
  runId: string;
  taskId: string;
  enqueuedAt: number;
}

export interface PublishState {
  version: 1;
  queue: PublishQueueItem[];
  byTask: Record<string, PublishStatusSummary>;
}
