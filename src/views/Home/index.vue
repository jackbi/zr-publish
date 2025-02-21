<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:18:48
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 17:43:04
 * @FilePath: /zr-publish/src/views/Home/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-card style="width: 100%; height: 100%" body-class="w-full h-[calc(100%-51px)] box-border">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="text-[#333] text-[16px]">任务管理</div>
        <div class="flex items-center">
          <el-button @click="addTaskItem" type="primary">新增任务</el-button>
          <el-input
            class="w-[200px] ml-[15px]"
            type="text"
            v-model="search"
            placeholder="请输入任务名称或备注"
          ></el-input>
        </div>
      </div>
    </template>
    <div class="w-full h-full">
      <el-table :data="filterTableData" style="width: 100%" border script height="100%">
        <el-table-column prop="name" label="任务名称" min-width="120" />
        <el-table-column prop="project_name" label="本地项目" min-width="120" />
        <el-table-column
          prop="ssh_names"
          :formatter="(row) => row.ssh_names.join('\n')"
          label="目标服务器"
          width="120"
        />
        <el-table-column prop="remote_path" label="目标路径" min-width="100" />
        <el-table-column prop="desc" label="备注" min-width="100" />
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="Edit"
              size="default"
              @click="handleEdit(row)"
            ></el-button>
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="Promotion"
              size="default"
              @click="handlePublish(row)"
            ></el-button>
            <el-button
              text
              type="danger"
              style="padding: 0"
              :icon="Delete"
              size="default"
              @click="handleDelete(row)"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>
      <taskChange ref="taskChangeRef" @success="getTableData"></taskChange>
      <el-drawer v-model="isShowDrawer" :size="600" direction="rtl">
        <template #header>
          <h4>任务日志</h4>
        </template>
        <template #default>
          <div>
            <pre>{{ taskUpInfo }}</pre>
          </div>
        </template>
        <template #footer>
          <div style="flex: auto">
            <el-button @click="isShowDrawer = false">取消</el-button>
          </div>
        </template>
      </el-drawer>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Delete, Edit, Promotion } from '@element-plus/icons-vue';
import { getTaskList, removeTask, getSshList } from '@/DB/index.db';
import { TaskItemType, sshItemType } from '@/types/index.type';
import { computed, defineAsyncComponent, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { decrypt } from '@/utils/CryptoJS';

const taskChange = defineAsyncComponent(() => import('@/components/task/change.vue'));
const taskData = ref<TaskItemType[]>([]);
const taskChangeRef = ref();
const search = ref('');
const sshList = ref<sshItemType[]>([]);
const taskUpInfo = ref('');
const isShowDrawer = ref(false);

const filterTableData = computed(() =>
  taskData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (data.desc && data.desc.toLowerCase().includes(search.value.toLowerCase())),
  ),
);

const getTableData = () => {
  getTaskList().then((res) => {
    taskData.value = res;
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

const handlePublish = (row: TaskItemType) => {
  taskUpInfo.value = '';
  isShowDrawer.value = true;
  const params: {
    serverData: sshItemType[];
    remoteData: TaskItemType;
    onProcess: (el: string) => void;
  } = {
    serverData: row.ssh_ids.map((id) => {
      const sshData = sshList.value.find((el) => el.id === id);
      return sshData as sshItemType;
    }),
    remoteData: row,
    onProcess: (el) => {
      taskUpInfo.value += `${el}\n`;
    },
  };
  (window as any).services.publish(params);
};

const addTaskItem = () => {
  taskChangeRef.value.init();
};

const handleEdit = (row: TaskItemType) => {
  taskChangeRef.value.init(row);
};

const handleDelete = (row: TaskItemType) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeTask(row.id).then(() => {
        getTableData();
      });
    })
    .catch(() => {
      // 取消操作
    });
};

getTableData();
</script>
<style lang="scss" scoped></style>
