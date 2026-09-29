<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">设置</div>
      <div class="page-actions page-actions--inline">
        <el-button @click="refreshTerminals" :loading="detecting">重新检测终端</el-button>
        <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
      </div>
    </header>
    <div class="page-content page-content--plain page-content--scroll">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>终端设置</span>
          </div>
        </template>

        <el-form :model="formData" label-width="140px">
          <el-form-item label="默认终端">
            <el-select
              v-model="formData.default_terminal"
              placeholder="选择默认终端"
              style="width: 240px"
              @change="handleTerminalChange"
            >
              <el-option
                v-for="terminal in availableTerminals"
                :key="terminal.type"
                :label="terminal.name"
                :value="terminal.type"
                :disabled="!terminal.available"
              >
                <div style="display: flex; align-items: center; justify-content: space-between">
                  <span>{{ terminal.name }}</span>
                  <el-tag v-if="!terminal.available" size="small" type="info">未安装</el-tag>
                  <el-tag v-else size="small" type="success">可用</el-tag>
                </div>
              </el-option>
            </el-select>
            <div class="form-hint">选择打开 SSH 和项目时使用的默认终端</div>
          </el-form-item>

          <el-form-item label="检测到的终端">
            <div class="terminal-list">
              <div
                v-for="terminal in availableTerminals"
                :key="terminal.type"
                class="terminal-item"
              >
                <el-icon
                  :style="{
                    color: terminal.available ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }"
                >
                  <CircleCheck v-if="terminal.available" />
                  <CircleClose v-else />
                </el-icon>
                <span class="terminal-name">{{ terminal.name }}</span>
                <el-tag size="small" :type="terminal.available ? 'success' : 'info'">
                  {{ terminal.available ? '已安装' : '未安装' }}
                </el-tag>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card>
        <template #header>
          <div class="card-header" style="padding: 12px 0">
            <span>Git 设置</span>
          </div>
        </template>

        <el-form :model="formData" label-width="140px">
          <el-form-item label="自动刷新 Git 状态">
            <el-switch
              v-model="formData.git_auto_refresh_enabled"
              @change="handleGitAutoRefreshChange"
            />
            <div class="form-hint">启用后将定期自动刷新项目的 Git 状态信息</div>
          </el-form-item>

          <el-form-item label="刷新间隔" v-if="formData.git_auto_refresh_enabled">
            <el-select
              v-model="formData.git_auto_refresh_interval"
              placeholder="选择刷新间隔"
              style="width: 240px"
              @change="handleGitIntervalChange"
            >
              <el-option label="5 分钟" :value="5" />
              <el-option label="10 分钟" :value="10" />
              <el-option label="15 分钟" :value="15" />
              <el-option label="30 分钟" :value="30" />
              <el-option label="60 分钟" :value="60" />
            </el-select>
            <div class="form-hint">自动刷新的时间间隔，建议设置为 10 分钟或更长</div>
          </el-form-item>

          <el-form-item v-if="formData.git_auto_refresh_enabled">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>自动刷新将在后台定期执行 git fetch，可能会消耗网络流量</template>
            </el-alert>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import { getSettings, updateSettings } from '@/DB/index.db';
import { TerminalType, TerminalInfo } from '@/types/index.type';
import { notifySuccess, notifyError } from '@/utils/feedback';

const formData = ref<{
  default_terminal?: TerminalType;
  git_auto_refresh_enabled?: boolean;
  git_auto_refresh_interval?: number;
}>({
  default_terminal: undefined,
  git_auto_refresh_enabled: false,
  git_auto_refresh_interval: 10,
});

const availableTerminals = ref<TerminalInfo[]>([]);
const detecting = ref(false);
const saving = ref(false);

const refreshTerminals = async () => {
  detecting.value = true;
  try {
    const terminals = await window.services?.detectAvailableTerminals();
    if (terminals) {
      availableTerminals.value = terminals;

      if (!formData.value.default_terminal) {
        const firstAvailable = terminals.find((t) => t.available);
        if (firstAvailable) {
          formData.value.default_terminal = firstAvailable.type as TerminalType;
        }
      }
    }
  } catch (error: any) {
    notifyError(`检测终端失败: ${error.message}`);
  } finally {
    detecting.value = false;
  }
};

const loadSettings = async () => {
  try {
    const settings = await getSettings();
    formData.value.default_terminal = settings.default_terminal;
    formData.value.git_auto_refresh_enabled = settings.git_auto_refresh_enabled ?? false;
    formData.value.git_auto_refresh_interval = settings.git_auto_refresh_interval ?? 10;
  } catch (error: any) {
    notifyError(`加载设置失败: ${error.message}`);
  }
};

const handleTerminalChange = () => {
  saveSettings();
};

const handleGitAutoRefreshChange = () => {
  saveSettings();
};

const handleGitIntervalChange = () => {
  saveSettings();
};

const saveSettings = async () => {
  saving.value = true;
  try {
    await updateSettings({
      default_terminal: formData.value.default_terminal,
      git_auto_refresh_enabled: formData.value.git_auto_refresh_enabled,
      git_auto_refresh_interval: formData.value.git_auto_refresh_interval,
    });
    notifySuccess('设置已保存');
  } catch (error: any) {
    notifyError(`保存设置失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadSettings();
  await refreshTerminals();
});
</script>

<style lang="scss" scoped>
.card-header {
  font-weight: 600;
  font-size: 16px;
}

.terminal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.terminal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--color-surface-sunken);
  border-radius: 4px;

  .terminal-name {
    flex: 1;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}
</style>
