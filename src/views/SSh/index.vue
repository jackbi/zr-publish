<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">SSH 管理</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input"
          type="text"
          v-model="searchInput"
          placeholder="搜索名称/IP"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @input="triggerSearch"
          @clear="triggerSearch"
        ></el-input>
        <el-button @click="addProjectItem" type="primary">新增 SSH</el-button>
      </div>
    </header>
    <div class="page-content">
      <el-table :data="filterTableData" style="width: 100%" border height="100%">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="host" label="IP 地址" min-width="130" class-name="cell-mono" />
        <el-table-column prop="port" label="端口" width="68" class-name="cell-num" />
        <el-table-column prop="username" label="用户名" width="96" class-name="cell-mono" />
        <el-table-column label="认证方式" width="84">
          <template #default="{ row }">
            <el-tag :type="row.auth_type === 'privateKey' ? 'success' : 'primary'" size="small">
              {{ row.auth_type === 'privateKey' ? '密钥' : '密码' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="160" align="center" class-name="cell-actions">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="Monitor"
              size="default"
              title="打开终端"
              @click="handleOpenTerminal(row)"
            ></el-button>
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
              type="primary"
              style="padding: 0"
              :icon="Connection"
              title="测试连接"
              :loading="connectLoading[row.id]"
              @click="handleConnect(row)"
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
      <sshChange ref="sshChangeRef" @success="getTableData"></sshChange>
    </div>

    <el-dialog v-model="testResultVisible" title="连接测试结果" width="500px" draggable>
      <div class="test-result">
        <el-result :icon="testResult.success ? 'success' : 'error'" :title="testResult.message">
          <template #extra>
            <div v-if="testResult.authType" class="test-detail">
              <p>
                <strong>认证方式:</strong>
                {{ testResult.authType === 'privateKey' ? '私钥认证' : '密码认证' }}
              </p>
            </div>
            <div v-if="testResult.error" class="test-error">
              <el-alert type="error" :closable="false" show-icon>
                <template #title>错误详情</template>
                <pre style="margin: 8px 0 0 0; font-size: 12px">{{ testResult.error }}</pre>
              </el-alert>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button @click="testResultVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Delete, Edit, Connection, Search, DocumentCopy, Monitor } from '@element-plus/icons-vue';
import { getSshList, removeSsh, addSsh, getSettings } from '@/DB/index.db';
import { sshItemType } from '@/types/index.type';
import { computed, defineAsyncComponent, ref, watch, reactive } from 'vue';
import { createDebounce } from '@/utils/timing';
import { notifyError, notifySuccess, confirmDelete } from '@/utils/feedback';
import { safeTestConnect } from '@/utils/utools';
import { safeDecrypt } from '@/utils/CryptoJS';
import { cloneDeep } from 'lodash-es';

const sshChange = defineAsyncComponent(() => import('@/components/ssh/change.vue'));
const sshData = ref<sshItemType[]>([]);
const sshChangeRef = ref();
const searchInput = ref('');
const search = ref('');
const connectLoading = reactive<Record<string, boolean>>({});
const testResultVisible = ref(false);
const testResult = ref<{ success: boolean; message: string; authType?: string; error?: string }>({
  success: false,
  message: '',
});

const filterTableData = computed(() =>
  sshData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      data.host.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

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
    const res = await getSshList();
    sshData.value = res.map((item) => ({
      ...item,
      auth_type: item.auth_type || 'password',
    }));
  } catch (error) {
    notifyError('加载服务器列表失败');
  }
};

const addProjectItem = () => {
  sshChangeRef.value?.init();
};

const handleEdit = (row: sshItemType) => {
  const params = cloneDeep(row);
  if (params.auth_type === 'password') {
    params.password = safeDecrypt(params.password);
  }
  if (params.passphrase) {
    params.passphrase = safeDecrypt(params.passphrase);
  }
  sshChangeRef.value?.init(params);
};

const handleCopy = (row: sshItemType) => {
  const params = cloneDeep(row);
  if (params.auth_type === 'password') {
    params.password = safeDecrypt(params.password);
  }
  if (params.passphrase) {
    params.passphrase = safeDecrypt(params.passphrase);
  }
  addSsh({
    ...(params as sshItemType),
    id: '',
    name: `${row.name} 副本`,
  })
    .then(() => getTableData())
    .catch((error) => notifyError(error instanceof Error ? error.message : '复制失败'));
};

const handleConnect = async (row: sshItemType) => {
  connectLoading[row.id] = true;
  const params = cloneDeep(row);

  if (params.auth_type === 'password') {
    params.password = safeDecrypt(params.password);
  }
  if (params.passphrase) {
    params.passphrase = safeDecrypt(params.passphrase);
  }

  try {
    const result = await safeTestConnect(params);
    testResult.value = result;
    testResultVisible.value = true;

    if (result.success) {
      notifySuccess(result.message);
    } else {
      notifyError(result.message);
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: '连接失败',
      error: error.toString(),
    };
    testResultVisible.value = true;
    notifyError('连接失败');
  } finally {
    connectLoading[row.id] = false;
  }
};

const handleOpenTerminal = async (row: sshItemType) => {
  const params = cloneDeep(row);

  if (params.auth_type === 'password') {
    params.password = safeDecrypt(params.password);
  }
  if (params.passphrase) {
    params.passphrase = safeDecrypt(params.passphrase);
  }

  try {
    const settings = await getSettings();
    let terminalType = settings.default_terminal;

    if (!terminalType && window.services?.getDefaultTerminal) {
      terminalType = await window.services.getDefaultTerminal();
    }

    if (window.services?.openSSHTerminal) {
      const result = window.services.openSSHTerminal(params, terminalType);
      if (result.success) {
        notifySuccess('终端已打开');
      } else {
        notifyError(`打开终端失败: ${result.error || '未知错误'}`);
      }
    } else {
      notifyError('终端功能不可用');
    }
  } catch (error: any) {
    notifyError(`打开终端失败: ${error.message}`);
  }
};

const handleDelete = (row: sshItemType) => {
  confirmDelete(`确定要删除服务器「${row.host}」吗？`)
    .then(() => removeSsh(row.id).then(() => getTableData()))
    .catch((error) => {
      // 用户取消（'cancel'/'close'）不提示，真实失败给出反馈
      if (error !== 'cancel' && error !== 'close') {
        notifyError(error instanceof Error ? error.message : '删除失败');
      }
    });
};

getTableData();
</script>
<style lang="scss" scoped>
.test-result {
  .test-detail {
    margin-top: 16px;
    padding: 12px;
    background: var(--color-surface-sunken);
    border-radius: 4px;

    p {
      margin: 4px 0;
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }

  .test-error {
    margin-top: 16px;
  }
}
</style>
