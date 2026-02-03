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
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">远程路径管理</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input w-[220px]"
          type="text"
          v-model="searchInput"
          placeholder="搜索远程路径"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @input="triggerSearch"
          @clear="triggerSearch"
        >
        </el-input>
        <el-button @click="addProjectItem" type="primary">新增远程路径</el-button>
      </div>
    </header>
    <div class="page-content">
      <el-table :data="filterTableData" style="width: 100%" border height="100%">
        <el-table-column prop="content" label="内容" min-width="120" />
        <el-table-column label="操作" fixed="right" width="150">
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
              :icon="DocumentCopy"
              size="default"
              @click="handleCopy(row)"
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
      <changeRemote ref="changeRemoteRef" @success="handleSuccess"></changeRemote>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Delete, Search, DocumentCopy, Edit } from '@element-plus/icons-vue';
import { getRemoteList, removeRemote, addRemote, updateRemote } from '@/DB/index.db';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { createDebounce } from '@/utils/timing';
import { confirmDelete } from '@/utils/feedback';

const RemoteData = ref<{ content: string }[]>([]);
const searchInput = ref('');
const search = ref('');
const changeRemoteRef = ref();
const editingRemote = ref<string | null>(null);
const changeRemote = defineAsyncComponent(() => import('@/components/remote/change.vue'));

const getTableData = () => {
  getRemoteList().then((res) => {
    RemoteData.value = res.map((el) => ({
      content: el,
    }));
  });
};

const filterTableData = computed(() => {
  return RemoteData.value.filter(
    (data) => !search.value || data.content.includes(search.value),
  );
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

const addProjectItem = () => {
  editingRemote.value = null;
  changeRemoteRef.value.init();
};

const handleEdit = (row: { content: string }) => {
  editingRemote.value = row.content;
  changeRemoteRef.value.init(row.content);
};

const handleDelete = (row: { content: string }) => {
  confirmDelete('确定要删除该远程路径吗？')
    .then(() => {
      removeRemote(row.content).then(() => {
        getTableData();
      });
    })
    .catch(() => {
      // 取消操作
    });
};

const handleCopy = (row: { content: string }) => {
  addRemote(`${row.content} 副本`).then(() => {
    getTableData();
  });
};

const handleSuccess = (value: string) => {
  if (editingRemote.value) {
    updateRemote(editingRemote.value, value).then(() => {
      editingRemote.value = null;
      getTableData();
    });
    return;
  }
  getTableData();
};

getTableData();
</script>
<style lang="scss" scoped></style>
