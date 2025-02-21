<template>
  <el-card style="width: 100%; height: 100%" body-class="w-full h-[calc(100%-51px)] box-border">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="text-[#333] text-[16px]">SSH管理</div>
        <div class="flex items-center">
          <el-button @click="addProjectItem" type="primary">新增SSH链接</el-button>
          <el-input
            class="w-[200px] ml-[15px]"
            type="text"
            v-model="search"
            placeholder="请输入名称或ip"
          ></el-input>
        </div>
      </div>
    </template>
    <div class="w-full h-full">
      <el-table :data="filterTableData" style="width: 100%" border script height="100%">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="host" label="ip地址" min-width="120" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="username" label="用户名" width="80" />
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
              :icon="Connection"
              :loading="connectLoading"
              @click="handleConnect(row)"
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
      <sshChange ref="sshChangeRef" @success="getTableData"></sshChange>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Delete, Edit, Connection } from '@element-plus/icons-vue';
import { getSshList, removeSsh } from '@/DB/index.db';
import { sshItemType } from '@/types/index.type';
import { computed, defineAsyncComponent, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { decrypt } from '@/utils/CryptoJS';
import { cloneDeep } from 'lodash-es';

const sshChange = defineAsyncComponent(() => import('@/components/ssh/change.vue'));
const sshData = ref<sshItemType[]>([]);
const sshChangeRef = ref();
const search = ref('');
const connectLoading = ref(false);

const filterTableData = computed(() =>
  sshData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      data.host.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

const getTableData = () => {
  getSshList().then((res) => {
    sshData.value = res;
  });
};

const addProjectItem = () => {
  sshChangeRef.value.init();
};

const handleEdit = (row: sshItemType) => {
  const params = cloneDeep(row);
  params.password = decrypt(params.password);
  sshChangeRef.value.init(params);
};

const handleConnect = (row: sshItemType) => {
  connectLoading.value = true;
  const params = cloneDeep(row);
  params.password = decrypt(params.password);
  (window as any).services
    .testConnect(params)
    .then(() => {
      ElMessage.success('连接成功');
    })
    .catch(() => {
      ElMessage.error('连接失败');
    })
    .finally(() => {
      connectLoading.value = false;
    });
};

const handleDelete = (row: sshItemType) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeSsh(row.id).then(() => {
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
