<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-03-03 17:04:28
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:31:32
 * @FilePath: /zr-publish/src/views/Remote/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-card style="width: 100%; height: 100%" body-class="w-full h-[calc(100%-51px)] box-border">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="text-[#333] text-[16px]">远程路径管理</div>
        <div class="flex items-center">
          <el-button @click="addProjectItem" type="primary">新增远程路径</el-button>
        </div>
      </div>
    </template>
    <div class="w-full h-full">
      <el-table :data="RemoteData" style="width: 100%" border script height="100%">
        <el-table-column prop="content" label="内容" min-width="120" />
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
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
      <changeRemote ref="changeRemoteRef" @success="getTableData"></changeRemote>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Delete } from '@element-plus/icons-vue';
import { getRemoteList, removeRemote } from '@/DB/index.db';
import { defineAsyncComponent, ref } from 'vue';
import { ElMessageBox } from 'element-plus';

const RemoteData = ref<{ content: string }[]>([]);
const changeRemoteRef = ref();
const changeRemote = defineAsyncComponent(() => import('@/components/remote/change.vue'));

const getTableData = () => {
  getRemoteList().then((res) => {
    RemoteData.value = res.map((el) => ({
      content: el,
    }));
  });
};

const addProjectItem = () => {
  changeRemoteRef.value.init();
};

const handleDelete = (row: { content: string }) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeRemote(row.content).then(() => {
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
