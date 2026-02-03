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
    <header class="home-header home-header--sticky">
      <div class="home-title">任务管理</div>
      <div class="home-actions">
        <el-input
          class="search-input w-[260px]"
          type="text"
          v-model="searchInput"
          placeholder="搜索任务名称/备注"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @clear="triggerSearch"
        >
        </el-input>
        <el-select
          class="search-input w-[200px]"
          v-model="selectedGroupId"
          placeholder="任务组筛选"
          clearable
        >
          <el-option label="全部" :value="''" />
          <el-option label="未分组" value="ungrouped" />
          <el-option v-for="item in taskGroups" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-button type="primary" @click="addTaskItem">新增任务</el-button>
        <el-button @click="addGroup">新增任务组</el-button>
      </div>
    </header>

    <section v-if="filteredGroups.length" class="task-group-list">
      <article v-for="group in filteredGroups" :key="group.id" class="task-group">
        <header class="task-group__header">
          <div class="task-group__title">
            <el-icon><Folder /></el-icon>
            <span>{{ group.name }}</span>
            <span class="task-group__count">({{ group.totalCount }})</span>
          </div>
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
        <section v-if="group.tasks.length" class="task-grid">
          <article v-for="row in group.tasks" :key="row.id" class="task-card">
            <div class="task-card__head">
              <div>
                <div class="task-card__title">{{ row.name }}</div>
                <div class="task-card__meta">{{ row.desc || '暂无备注' }}</div>
              </div>
              <div class="task-card__actions task-card__actions--icon">
                <el-button circle class="shrink-0" :icon="Edit" @click="handleEdit(row)" title="编辑" />
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
import { Delete, Edit, Promotion, Search, Folder, DocumentCopy } from '@element-plus/icons-vue';
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
} from '@/DB/index.db';
import {
  TaskGroupItemType,
  TaskGroupItemTypeNoId,
  TaskGroupView,
  TaskItemType,
  sshItemType,
} from '@/types/index.type';
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue';
import { createDebounce } from '@/utils/timing';
import { notifyError, notifySuccess, confirmDelete } from '@/utils/feedback';
import {
  enqueuePublishTask,
  enqueuePublishTasks,
  isTaskQueuedOrRunning,
  setPublishConcurrency,
} from '@/services/publish-manager';
import { decrypt } from '@/utils/CryptoJS';

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

const filterTableData = computed(() =>
  taskData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (data.desc && data.desc.toLowerCase().includes(search.value.toLowerCase())),
  ),
);

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

const debounceSearch = createDebounce(300);
const triggerSearch = () => {
  debounceSearch(() => {
    search.value = searchInput.value.trim();
  });
};

watch(searchInput, () => {
  triggerSearch();
});

const getTableData = () => {
  getTaskList().then((res) => {
    taskData.value = res;
  });
  getTaskGroupList().then((res) => {
    taskGroups.value = res;
  });
  getSshList().then((res) => {
    sshList.value = res.map((el) => {
      return {
        ...el,
        password: decrypt(el.password),
      };
    });
  });
};

const handlePublish = async (row: TaskItemType) => {
  taskUpInfo.value = '';
  isShowDrawer.value = true;
  const servers = row.ssh_ids
    .map((id) => sshList.value.find((el) => el.id === id))
    .filter(Boolean) as sshItemType[];

  if (!row.local_path || !row.remote_path) {
    notifyError('请先完善本地路径与目标路径');
    return;
  }

  if (servers.length === 0) {
    notifyError('请先选择目标服务器');
    return;
  }

  taskUpInfo.value += '开始排队发布...\n';
  await enqueuePublishTask({
    task: row,
    servers,
    onLog: (message) => {
      taskUpInfo.value += `${message}\n`;
    },
  });
};

const handleGroupPublish = async (group: TaskGroupView) => {
  if (!group.totalCount) return;
  taskUpInfo.value = '';
  isShowDrawer.value = true;
  setPublishConcurrency(1);
  const publishItems: Array<{ task: TaskItemType; servers: sshItemType[] }> = [];
  for (const task of group.allTasks) {
    if (!task.local_path || !task.remote_path) {
      taskUpInfo.value += `任务 ${task.name} 缺少路径，已跳过\n`;
      continue;
    }
    const servers = task.ssh_ids
      .map((id) => sshList.value.find((el) => el.id === id))
      .filter(Boolean) as sshItemType[];
    if (servers.length === 0) {
      taskUpInfo.value += `任务 ${task.name} 未选择服务器，已跳过\n`;
      continue;
    }
    const isBusy = await isTaskQueuedOrRunning(task.id);
    if (isBusy) {
      taskUpInfo.value += `任务 ${task.name} 已在队列/运行中，已跳过\n`;
      continue;
    }
    publishItems.push({ task, servers });
  }
  if (!publishItems.length) {
    taskUpInfo.value += '没有可发布的任务\n';
    return;
  }
  await enqueuePublishTasks(publishItems, {
    onLog: (message) => {
      taskUpInfo.value += `${message}\n`;
    },
  });
};

const addTaskItem = () => {
  taskChangeRef.value.init();
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
  });
};

const handleEdit = (row: TaskItemType) => {
  taskChangeRef.value.init(row);
};

const handleCopy = (row: TaskItemType) => {
  const { id, ...rest } = row;
  addTask({
    ...(rest as TaskItemType),
    id: '',
    name: `${row.name} 副本`,
  }).then(() => {
    getTableData();
  });
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
  confirmDelete(`确定要删除任务组「${group.name}」吗？`).then(async () => {
    await removeTaskGroup(group.id);
    notifySuccess('任务组已删除');
    getTableData();
  });
};

const handleDelete = (row: TaskItemType) => {
  confirmDelete(`确定要删除任务「${row.name}」吗？`)
    .then(() => {
      removeTask(row.id).then(() => {
        getTableData();
      });
    })
    .catch(() => {
      // 取消操作
    });
};

const normalizeTaskGroups = async () => {
  const list = await getTaskList();
  const needsUpdate = list.some((item) => Object.prototype.hasOwnProperty.call(item, 'group_id'));
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

normalizeTaskGroups().then(() => {
  getTableData();
});
</script>
<style lang="scss" scoped></style>
