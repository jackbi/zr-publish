<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-20 15:47:14
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 17:08:57
 * @FilePath: /zr-publish/src/views/Command/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">指令管理</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input w-[220px]"
          type="text"
          v-model="searchInput"
          placeholder="搜索指令内容"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @input="triggerSearch"
          @clear="triggerSearch"
        >
        </el-input>
        <el-button @click="addProjectItem" type="primary">新增指令</el-button>
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
      <changeCommand ref="changeCommandRef" @success="handleSuccess"></changeCommand>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Delete, Search, DocumentCopy, Edit } from '@element-plus/icons-vue';
import { getCommandList, removeCommand, addCommand, updateCommand } from '@/DB/index.db';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { createDebounce } from '@/utils/timing';
import { confirmDelete } from '@/utils/feedback';

const CommandData = ref<{ content: string }[]>([]);
const searchInput = ref('');
const search = ref('');
const changeCommandRef = ref();
const editingCommand = ref<string | null>(null);
const changeCommand = defineAsyncComponent(() => import('@/components/command/change.vue'));

const getTableData = () => {
  getCommandList().then((res) => {
    CommandData.value = res.map((el) => ({
      content: el,
    }));
  });
};

const filterTableData = computed(() => {
  return CommandData.value.filter(
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
  editingCommand.value = null;
  changeCommandRef.value.init();
};

const handleEdit = (row: { content: string }) => {
  editingCommand.value = row.content;
  changeCommandRef.value.init(row.content);
};

const handleDelete = (row: { content: string }) => {
  confirmDelete('确定要删除该指令吗？')
    .then(() => {
      removeCommand(row.content).then(() => {
        getTableData();
      });
    })
    .catch(() => {
      // 取消操作
    });
};

const handleCopy = (row: { content: string }) => {
  addCommand(`${row.content} 副本`).then(() => {
    getTableData();
  });
};

const handleSuccess = (value: string) => {
  if (editingCommand.value) {
    updateCommand(editingCommand.value, value).then(() => {
      editingCommand.value = null;
      getTableData();
    });
    return;
  }
  getTableData();
};

getTableData();
</script>
<style lang="scss" scoped></style>
