<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:18:48
 * @LastEditors: wenbin
 * @LastEditTime: 2026-02-02 10:59:55
 * @FilePath: /zr-publish/src/views/Home/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="home-page">
    <header class="page-header page-header--sticky">
      <div class="page-title">任务管理</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input"
          type="text"
          v-model="searchInput"
          placeholder="搜索任务名称/备注"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @clear="triggerSearch"
        ></el-input>
        <el-select
          class="search-input"
          v-model="selectedGroupId"
          placeholder="任务组筛选"
          clearable
        >
          <el-option label="全部" :value="''" />
          <el-option label="未分组" value="ungrouped" />
          <el-option
            v-for="item in taskGroups"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
        <el-button
          class="fold-toggle"
          :icon="allGroupsCollapsed ? Expand : Fold"
          :disabled="!filteredGroups.length"
          :title="allGroupsCollapsed ? '全部展开' : '全部折叠'"
          @click="toggleAllGroups"
        >
          <span class="fold-toggle__label">
            {{ allGroupsCollapsed ? '全部展开' : '全部折叠' }}
          </span>
        </el-button>
        <el-button type="primary" @click="addTaskItem">新增任务</el-button>
        <el-button @click="addGroup">新增任务组</el-button>
      </div>
    </header>

    <section v-if="filteredGroups.length" class="task-group-list">
      <article v-for="group in filteredGroups" :key="group.id" class="task-group">
        <header class="task-group__header">
          <button
            type="button"
            class="task-group__toggle"
            :aria-expanded="isGroupBodyVisible(group)"
            :aria-controls="`task-group-body-${group.id}`"
            @click="toggleGroupCollapsed(group.id)"
          >
            <el-icon
              class="task-group__caret"
              :class="{ 'is-collapsed': !isGroupBodyVisible(group) }"
            >
              <ArrowDown />
            </el-icon>
            <span class="task-group__title">
              <el-icon><Folder /></el-icon>
              <span>{{ group.name }}</span>
              <span class="task-group__count">({{ group.totalCount }})</span>
            </span>
          </button>
          <div class="task-group__actions">
            <el-button
              text
              :icon="Promotion"
              :disabled="group.totalCount === 0"
              @click="handleGroupPublish(group)"
            >
              发布
            </el-button>
            <el-button
              text
              :icon="Edit"
              :disabled="group.isUngrouped"
              @click="handleGroupEdit(group)"
            >
              重命名
            </el-button>
            <el-button
              text
              type="danger"
              :icon="Delete"
              :disabled="group.isUngrouped"
              @click="handleGroupDelete(group)"
            >
              删除
            </el-button>
          </div>
        </header>
        <el-collapse-transition>
          <div v-show="isGroupBodyVisible(group)" :id="`task-group-body-${group.id}`">
            <section v-if="group.tasks.length" class="task-grid">
              <article v-for="row in group.tasks" :key="row.id" class="task-card">
                <div class="task-card__head">
                  <div>
                    <div class="task-card__title">{{ row.name }}</div>
                    <div class="task-card__meta">{{ row.desc || '暂无备注' }}</div>
                  </div>
                  <div class="task-card__actions">
                    <el-button
                      circle
                      class="shrink-0"
                      :icon="Edit"
                      @click="handleEdit(row)"
                      title="编辑"
                    />
                    <el-button
                      circle
                      class="shrink-0"
                      :icon="DocumentCopy"
                      @click="handleCopy(row)"
                      title="复制"
                    />
                    <el-button
                      circle
                      class="shrink-0"
                      :icon="Promotion"
                      @click="handlePublish(row)"
                      title="发布"
                    />
                    <el-button
                      circle
                      class="shrink-0"
                      type="danger"
                      :icon="Delete"
                      @click="handleDelete(row)"
                      title="删除"
                    />
                  </div>
                </div>
                <div class="task-card__body">
                  <div class="task-field">
                    <span class="task-field__label">本地项目</span>
                    <span class="task-field__value">{{ row.project_name || '-' }}</span>
                  </div>
                  <div class="task-field">
                    <span class="task-field__label">目标服务器</span>
                    <span class="task-field__value">
                      {{ row.ssh_names.length ? row.ssh_names.join('、') : '-' }}
                    </span>
                  </div>
                  <div class="task-field task-field--full">
                    <span class="task-field__label">目标路径</span>
                    <span class="task-field__value">{{ row.remote_path || '-' }}</span>
                  </div>
                </div>
              </article>
            </section>
            <div v-else class="task-group__empty">暂无匹配任务</div>
          </div>
        </el-collapse-transition>
      </article>
    </section>

    <div v-else class="task-empty">
      <div class="task-empty__title">暂无任务</div>
      <div class="task-empty__desc">点击“新增任务”创建你的第一个发布任务。</div>
      <div class="task-empty__actions">
        <el-button @click="addTaskItem" type="primary">新增任务</el-button>
        <el-button @click="addGroup">新增任务组</el-button>
      </div>
    </div>

    <taskChange ref="taskChangeRef" @success="getTableData"></taskChange>
    <el-dialog
      v-model="groupDialogVisible"
      modal-class="current-dialog"
      :title="groupDialogTitle"
      width="40%"
      :before-close="closeGroupDialog"
      draggable
    >
      <el-form ref="groupFormRef" :model="groupForm" :rules="groupFormRules" label-width="auto">
        <el-form-item label="任务组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入任务组名称" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="groupForm.desc" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeGroupDialog">取消</el-button>
          <el-button type="primary" @click="saveGroup">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <el-drawer v-model="isShowDrawer" :size="600" direction="rtl">
      <template #header>
        <h4>任务日志</h4>
      </template>
      <template #default>
        <div>
          <pre class="task-log">{{ taskUpInfo }}</pre>
        </div>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button @click="isShowDrawer = false">取消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowDown,
  Delete,
  DocumentCopy,
  Edit,
  Expand,
  Fold,
  Folder,
  Promotion,
  Search,
} from '@element-plus/icons-vue';
import {
  getTaskList,
  removeTask,
  getSshList,
  getTaskGroupList,
  addTaskGroup,
  updateTaskGroup,
  removeTaskGroup,
  saveTaskList,
  addTask,
  getSettings,
  updateSettings,
} from '@/DB/index.db';
import {
  TaskGroupItemType,
  TaskGroupItemTypeNoId,
  TaskGroupView,
  TaskItemType,
  sshItemType,
} from '@/types/index.type';
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue';
import { createDebounce } from '@/utils/timing';
import { notifyError, notifySuccess, confirmDelete } from '@/utils/feedback';
import {
  enqueuePublishTask,
  enqueuePublishTasks,
  isTaskQueuedOrRunning,
  setPublishConcurrency,
} from '@/services/publish-manager';
import { safeDecrypt } from '@/utils/CryptoJS';

const taskChange = defineAsyncComponent(() => import('@/components/task/change.vue'));
const taskData = ref<TaskItemType[]>([]);
const taskChangeRef = ref();
const searchInput = ref('');
const search = ref('');
const sshList = ref<sshItemType[]>([]);
const taskUpInfo = ref('');
const isShowDrawer = ref(false);
const taskGroups = ref<TaskGroupItemType[]>([]);
const selectedGroupId = ref('');
const groupDialogVisible = ref(false);
const groupDialogTitle = ref('新增任务组');
const groupFormRef = ref();
const editingGroupId = ref<string | undefined>(undefined);
const groupForm = reactive<TaskGroupItemTypeNoId>({
  name: '',
  desc: '',
});
const groupFormRules = reactive({
  name: [
    {
      required: true,
      message: '请输入任务组名称',
      trigger: 'blur',
    },
  ],
});

const groupedTasks = computed<TaskGroupView[]>(() => {
  const groups: TaskGroupView[] = [];
  const groupMap = new Map<string, TaskGroupView>();
  taskGroups.value.forEach((group) => {
    const entry: TaskGroupView = {
      id: group.id,
      name: group.name,
      allTasks: [],
      tasks: [],
      totalCount: 0,
    };
    groupMap.set(group.id, entry);
    groups.push(entry);
  });

  const ungrouped: TaskGroupView = {
    id: 'ungrouped',
    name: '未分组',
    allTasks: [],
    tasks: [],
    totalCount: 0,
    isUngrouped: true,
  };

  taskData.value.forEach((task) => {
    if (task.group_id && groupMap.has(task.group_id)) {
      const entry = groupMap.get(task.group_id);
      if (entry) {
        entry.totalCount += 1;
        entry.allTasks.push(task);
        if (
          !search.value ||
          task.name.toLowerCase().includes(search.value.toLowerCase()) ||
          (task.desc && task.desc.toLowerCase().includes(search.value.toLowerCase()))
        ) {
          entry.tasks.push(task);
        }
      }
    } else {
      ungrouped.totalCount += 1;
      ungrouped.allTasks.push(task);
      if (
        !search.value ||
        task.name.toLowerCase().includes(search.value.toLowerCase()) ||
        (task.desc && task.desc.toLowerCase().includes(search.value.toLowerCase()))
      ) {
        ungrouped.tasks.push(task);
      }
    }
  });

  return [ungrouped, ...groups];
});

const filteredGroups = computed(() => {
  if (selectedGroupId.value) {
    const group = groupedTasks.value.find((item) => item.id === selectedGroupId.value);
    return group ? [group] : [];
  }
  return groupedTasks.value.filter((group) => group.totalCount > 0 || group.tasks.length > 0);
});

/**
 * 任务组折叠状态：持久化在 settings 文档里（属于本地视图偏好，不参与数据导出/备份）。
 * 用记录表而不是 Set，读写都走响应式对象，避免集合类型带来的响应式边界问题。
 */
const collapsedGroups = reactive<Record<string, boolean>>({});

const isGroupCollapsed = (id: string) => !!collapsedGroups[id];

/** 搜索时自动展开有命中的分组，否则用户会以为没搜到 */
const isGroupBodyVisible = (group: TaskGroupView) =>
  !isGroupCollapsed(group.id) || (!!search.value && group.tasks.length > 0);

const debounceSaveCollapsed = createDebounce(300);

/** 只落库当前仍存在的分组，避免删除分组后留下越攒越多的历史 id */
const saveCollapsedGroups = () => {
  debounceSaveCollapsed(async () => {
    try {
      const known = taskGroups.value.map((group) => group.id).concat('ungrouped');
      await updateSettings({ collapsed_groups: known.filter((id) => collapsedGroups[id]) });
    } catch {
      // 视图偏好保存失败不影响使用，静默处理
    }
  });
};

const toggleGroupCollapsed = (id: string) => {
  collapsedGroups[id] = !collapsedGroups[id];
  saveCollapsedGroups();
};

onMounted(async () => {
  try {
    const settings = await getSettings();
    (settings.collapsed_groups || []).forEach((id) => {
      collapsedGroups[id] = true;
    });
  } catch {
    // 读取失败时保持默认（全部展开）
  }
});

/** 可见分组是否全部已折叠：决定全局按钮显示「全部折叠」还是「全部展开」 */
const allGroupsCollapsed = computed(
  () =>
    filteredGroups.value.length > 0 &&
    filteredGroups.value.every((group) => collapsedGroups[group.id]),
);

const toggleAllGroups = () => {
  const next = !allGroupsCollapsed.value;
  filteredGroups.value.forEach((group) => {
    collapsedGroups[group.id] = next;
  });
  saveCollapsedGroups();
};

const debounceSearch = createDebounce(300);
const triggerSearch = () => {
  debounceSearch(() => {
    search.value = searchInput.value.trim();
  });
};

watch(searchInput, () => {
  triggerSearch();
});

const getTableData = async () => {
  try {
    const [tasks, groups, sshs] = await Promise.all([
      getTaskList(),
      getTaskGroupList(),
      getSshList(),
    ]);
    taskData.value = tasks;
    taskGroups.value = groups;
    sshList.value = sshs.map((el) => ({
      ...el,
      password: safeDecrypt(el.password),
      // 私钥 + passphrase 的服务器必须一起解密，否则发布时认证会失败
      passphrase: safeDecrypt(el.passphrase),
    }));
  } catch (error) {
    notifyError('加载任务数据失败');
  }
};

const handlePublish = async (row: TaskItemType) => {
  const servers = row.ssh_ids
    .map((id) => sshList.value.find((el) => el.id === id))
    .filter(Boolean) as sshItemType[];

  // 先校验再打开日志抽屉，避免留下一个空白抽屉
  if (!row.local_path || !row.remote_path) {
    notifyError('请先完善本地路径与目标路径');
    return;
  }

  if (servers.length === 0) {
    notifyError('请先选择目标服务器');
    return;
  }

  taskUpInfo.value = '';
  isShowDrawer.value = true;
  taskUpInfo.value += '开始排队发布...\n';

  try {
    await enqueuePublishTask({
      task: row,
      servers,
      onLog: (message) => {
        taskUpInfo.value += `${message}\n`;
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '入队失败';
    taskUpInfo.value += `${message}\n`;
    notifyError(message);
  }
};

const handleGroupPublish = async (group: TaskGroupView) => {
  if (!group.totalCount) return;

  const publishItems: Array<{ task: TaskItemType; servers: sshItemType[] }> = [];
  let message = '';

  for (const task of group.allTasks) {
    if (!task.local_path || !task.remote_path) {
      message += `任务 ${task.name} 缺少路径，已跳过\n`;
      continue;
    }
    const servers = task.ssh_ids
      .map((id) => sshList.value.find((el) => el.id === id))
      .filter(Boolean) as sshItemType[];
    if (servers.length === 0) {
      message += `任务 ${task.name} 未选择服务器，已跳过\n`;
      continue;
    }
    const isBusy = await isTaskQueuedOrRunning(task.id);
    if (isBusy) {
      message += `任务 ${task.name} 已在队列/运行中，已跳过\n`;
      continue;
    }
    publishItems.push({ task, servers });
  }

  if (!publishItems.length) {
    notifyError('没有可发布的任务');
    return;
  }

  taskUpInfo.value = message;
  isShowDrawer.value = true;
  setPublishConcurrency(1);

  try {
    await enqueuePublishTasks(publishItems, {
      onLog: (log) => {
        taskUpInfo.value += `${log}\n`;
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '入队失败';
    taskUpInfo.value += `${errorMessage}\n`;
    notifyError(errorMessage);
  }
};

const addTaskItem = () => {
  taskChangeRef.value?.init();
};

const addGroup = () => {
  openGroupDialog();
};

const openGroupDialog = (group?: TaskGroupItemType) => {
  groupDialogTitle.value = group ? '重命名任务组' : '新增任务组';
  editingGroupId.value = group?.id;
  groupForm.name = group?.name || '';
  groupForm.desc = group?.desc || '';
  groupDialogVisible.value = true;
};

const closeGroupDialog = () => {
  groupDialogVisible.value = false;
  editingGroupId.value = undefined;
  groupForm.name = '';
  groupForm.desc = '';
};

const saveGroup = () => {
  groupFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      if (editingGroupId.value) {
        await updateTaskGroup({
          id: editingGroupId.value,
          name: groupForm.name,
          desc: groupForm.desc,
        });
        notifySuccess('任务组已更新');
      } else {
        await addTaskGroup({
          id: '',
          name: groupForm.name,
          desc: groupForm.desc,
        });
        notifySuccess('任务组已创建');
      }
      closeGroupDialog();
      getTableData();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : '保存任务组失败');
    }
  });
};

const handleEdit = (row: TaskItemType) => {
  taskChangeRef.value?.init(row);
};

const handleCopy = (row: TaskItemType) => {
  const { id, ...rest } = row;
  addTask({
    ...(rest as TaskItemType),
    id: '',
    name: `${row.name} 副本`,
  })
    .then(() => getTableData())
    .catch((error) => notifyError(error instanceof Error ? error.message : '复制失败'));
};

const handleGroupEdit = (group: TaskGroupView) => {
  if (group.isUngrouped) return;
  const target = taskGroups.value.find((item) => item.id === group.id);
  if (target) {
    openGroupDialog(target);
  }
};

const handleGroupDelete = (group: TaskGroupView) => {
  if (group.isUngrouped) return;
  if (group.totalCount > 0) {
    notifyError('任务组下存在任务，无法删除');
    return;
  }
  confirmDelete(`确定要删除任务组「${group.name}」吗？`)
    .then(() => removeTaskGroup(group.id))
    .then(() => {
      notifySuccess('任务组已删除');
      getTableData();
    })
    .catch((error) => {
      if (error !== 'cancel' && error !== 'close') {
        notifyError(error instanceof Error ? error.message : '删除任务组失败');
      }
    });
};

const handleDelete = (row: TaskItemType) => {
  confirmDelete(`确定要删除任务「${row.name}」吗？`)
    .then(() => removeTask(row.id).then(() => getTableData()))
    .catch((error) => {
      // 用户取消（'cancel'/'close'）不提示，真实失败给出反馈
      if (error !== 'cancel' && error !== 'close') {
        notifyError(error instanceof Error ? error.message : '删除失败');
      }
    });
};

/**
 * 兼容历史数据：把 group_id 为空字符串/undefined 的任务上的该字段真正删掉
 * （原实现判断反了，导致每次进入首页都会重写一遍任务表）
 */
const normalizeTaskGroups = async () => {
  const list = await getTaskList();
  const needsUpdate = list.some(
    (item) => Object.prototype.hasOwnProperty.call(item, 'group_id') && !item.group_id,
  );
  if (!needsUpdate) return;
  const updated = list.map((item) => {
    if (!item.group_id) {
      const { group_id, ...rest } = item as TaskItemType & { group_id?: string };
      return rest as TaskItemType;
    }
    return item;
  });
  await saveTaskList(updated);
};

// 初始化失败也要把列表渲染出来，否则首页会一直空白
normalizeTaskGroups()
  .catch(() => {})
  .finally(() => {
    getTableData();
  });
</script>
<style lang="scss" scoped></style>
