<!--
  * 通用「字符串列表」管理页：指令管理 / 远程路径管理 共用。
  * 这两类实体的主键就是字符串本身，UI 与交互完全一致，只差文案与数据源，
  * 之前是两份逐行复制的文件（改一处 bug 要改两遍）。
-->
<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">{{ config.title }}</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input"
          type="text"
          v-model="searchInput"
          :placeholder="config.searchPlaceholder"
          clearable
          :prefix-icon="Search"
        ></el-input>
        <el-button @click="addItem" type="primary">{{ config.addLabel }}</el-button>
      </div>
    </header>
    <div class="page-content">
      <el-table :data="filterTableData" style="width: 100%" border height="100%" row-key="content">
        <el-table-column
          prop="content"
          :label="config.columnLabel"
          min-width="120"
          class-name="cell-mono"
        />
        <el-table-column
          label="操作"
          fixed="right"
          width="104"
          align="center"
          class-name="cell-actions"
        >
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="Edit"
              size="default"
              title="编辑"
              @click="handleEdit(row)"
            ></el-button>
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="DocumentCopy"
              size="default"
              title="复制"
              @click="handleCopy(row)"
            ></el-button>
            <el-button
              text
              type="danger"
              style="padding: 0"
              :icon="Delete"
              size="default"
              title="删除"
              @click="handleDelete(row)"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>
      <stringListChange
        ref="stringListChangeRef"
        :kind="kind"
        @success="getTableData"
      ></stringListChange>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { Delete, DocumentCopy, Edit, Search } from '@element-plus/icons-vue';
import {
  addCommand,
  addRemote,
  getCommandList,
  getRemoteList,
  removeCommand,
  removeRemote,
} from '@/DB/index.db';
import { confirmDelete, notifyError } from '@/utils/feedback';
import { createDebounce } from '@/utils/timing';

type StringListKind = 'command' | 'remote';

const props = defineProps<{ kind: StringListKind }>();

const stringListChange = defineAsyncComponent(
  () => import('@/components/common/string-list-change.vue'),
);
const stringListChangeRef = ref<{ init: (value?: string) => void }>();

const configs = {
  command: {
    title: '指令管理',
    searchPlaceholder: '搜索指令内容',
    addLabel: '新增指令',
    columnLabel: '指令内容',
    emptyTip: '该指令',
    loadError: '加载指令失败',
    copyError: '复制失败',
  },
  remote: {
    title: '远程路径管理',
    searchPlaceholder: '搜索远程路径',
    addLabel: '新增远程路径',
    columnLabel: '远程路径',
    emptyTip: '该远程路径',
    loadError: '加载远程路径失败',
    copyError: '复制失败',
  },
} as const;

const config = computed(() => configs[props.kind]);

const api = computed(() =>
  props.kind === 'command'
    ? { list: getCommandList, remove: removeCommand, add: addCommand }
    : { list: getRemoteList, remove: removeRemote, add: addRemote },
);

const data = ref<{ content: string }[]>([]);
const searchInput = ref('');
const search = ref('');

const filterTableData = computed(() =>
  data.value.filter((item) => !search.value || item.content.includes(search.value)),
);

const debounceSearch = createDebounce(300);
watch(searchInput, () => {
  debounceSearch(() => {
    search.value = searchInput.value.trim();
  });
});

const getTableData = async () => {
  try {
    const res = await api.value.list();
    data.value = res.map((content) => ({ content }));
  } catch (error) {
    notifyError(config.value.loadError);
  }
};

const addItem = () => {
  stringListChangeRef.value?.init();
};

const handleEdit = (row: { content: string }) => {
  stringListChangeRef.value?.init(row.content);
};

const handleDelete = (row: { content: string }) => {
  confirmDelete(`确定要删除${config.value.emptyTip}吗？`)
    .then(() => api.value.remove(row.content).then(() => getTableData()))
    .catch((error) => {
      // 用户取消（'cancel'/'close'）不提示，真实失败给出反馈
      if (error !== 'cancel' && error !== 'close') {
        notifyError(error instanceof Error ? error.message : '删除失败');
      }
    });
};

const handleCopy = (row: { content: string }) => {
  api.value
    .add(`${row.content} 副本`)
    .then(() => getTableData())
    .catch((error) => notifyError(error instanceof Error ? error.message : config.value.copyError));
};

getTableData();
</script>
<style lang="scss" scoped></style>
