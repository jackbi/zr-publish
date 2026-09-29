<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">数据同步</div>
      <div class="page-actions page-actions--inline">
        <el-button @click="handleExport" type="primary" :icon="Download">导出到文件</el-button>
        <el-button @click="handleImport" type="success" :icon="Upload">从文件导入</el-button>
      </div>
    </header>
    <div class="page-content">
      <div class="doc-content">
        <el-descriptions title="数据统计" :column="2" border>
          <el-descriptions-item label="项目数量">{{ stats.projects }}</el-descriptions-item>
          <el-descriptions-item label="SSH 配置">{{ stats.ssh }}</el-descriptions-item>
          <el-descriptions-item label="指令数量">{{ stats.commands }}</el-descriptions-item>
          <el-descriptions-item label="远程路径">{{ stats.remotes }}</el-descriptions-item>
          <el-descriptions-item label="任务数量">{{ stats.tasks }}</el-descriptions-item>
          <el-descriptions-item label="任务组数量">{{ stats.taskGroups }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">云端同步</el-divider>

        <el-card class="sync-card">
          <template #header>
            <div class="card-header">
              <span>GitHub Gist 同步</span>
              <el-tag :type="githubConfig.token ? 'success' : 'info'">
                {{ githubConfig.token ? '已配置' : '未配置' }}
              </el-tag>
            </div>
          </template>

          <el-form :model="githubConfig" label-width="120px" size="default">
            <el-form-item label="Personal Token">
              <el-input
                v-model="githubConfig.token"
                type="password"
                placeholder="请输入 GitHub Personal Access Token"
                show-password
                clearable
              />
            </el-form-item>
            <el-form-item label="Gist ID">
              <el-input
                v-model="githubConfig.gistId"
                placeholder="首次上传自动生成，后续同步请填写"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleGithubUpload" :loading="githubLoading">
                上传到 GitHub
              </el-button>
              <el-button type="success" @click="handleGithubDownload" :loading="githubLoading">
                从 GitHub 下载
              </el-button>
              <el-button @click="saveGithubConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="sync-card">
          <template #header>
            <div class="card-header">
              <span>Gitee 代码片段同步</span>
              <el-tag :type="giteeConfig.token ? 'success' : 'info'">
                {{ giteeConfig.token ? '已配置' : '未配置' }}
              </el-tag>
            </div>
          </template>

          <el-form :model="giteeConfig" label-width="120px" size="default">
            <el-form-item label="Access Token">
              <el-input
                v-model="giteeConfig.token"
                type="password"
                placeholder="请输入 Gitee 私人令牌"
                show-password
                clearable
              />
            </el-form-item>
            <el-form-item label="Gist ID">
              <el-input
                v-model="giteeConfig.gistId"
                placeholder="首次上传自动生成，后续同步请填写"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleGiteeUpload" :loading="giteeLoading">
                上传到 Gitee
              </el-button>
              <el-button type="success" @click="handleGiteeDownload" :loading="giteeLoading">
                从 Gitee 下载
              </el-button>
              <el-button @click="saveGiteeConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-divider />

        <el-alert title="使用说明" type="info" :closable="false">
          <template #default>
            <div style="line-height: 1.8">
              <p>
                <strong>本地文件同步：</strong>
                将所有数据导出为 JSON 文件保存到本地，或从本地文件导入数据。
              </p>
              <p><strong>GitHub Gist 同步：</strong></p>
              <ol style="margin: 8px 0; padding-left: 20px">
                <li>
                  访问
                  <a href="#" @click.prevent="openLink('https://github.com/settings/tokens')">
                    GitHub Token 设置
                  </a>
                  ，创建 Personal Access Token，勾选 gist 权限
                </li>
                <li>首次上传会自动创建私密 Gist，记录返回的 Gist ID</li>
                <li>后续同步时使用相同的 Token 和 Gist ID 即可</li>
              </ol>
              <p><strong>Gitee 代码片段同步：</strong></p>
              <ol style="margin: 8px 0; padding-left: 20px">
                <li>
                  访问
                  <a
                    href="#"
                    @click.prevent="openLink('https://gitee.com/profile/personal_access_tokens')"
                  >
                    Gitee 令牌设置
                  </a>
                  ，创建私人令牌，勾选 gist 权限
                </li>
                <li>首次上传会自动创建私有代码片段，记录返回的 Gist ID</li>
                <li>后续同步时使用相同的 Token 和 Gist ID 即可</li>
              </ol>
              <p style="color: #e6a23c">
                <strong>⚠️ 注意：</strong>
                云端同步会覆盖现有数据，请谨慎操作。Token 和配置会保存在本地。
              </p>
              <p style="color: #67c23a">
                <strong>🔒 凭据：</strong>
                导出文件中 SSH 密码/私钥口令以密文保存（格式版本 1.1）； 1.0
                的老备份文件仍可直接导入（按明文处理并自动加密）。密文用插件内置密钥生成，
                仅能避免口令被直接看到，不构成对拿到插件本体的攻击者的保护。
              </p>
            </div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Download, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getProjectList,
  getSshList,
  getCommandList,
  getRemoteList,
  getTaskList,
  getTaskGroupList,
  projectDoc,
  sshDoc,
  commandDoc,
  remoteDoc,
  taskDoc,
  taskGroupDoc,
  writeDbList,
  runWithRollback,
} from '@/DB/index.db';
import {
  safeOpenDialog,
  safeSaveDialog,
  safeWriteFile,
  safeReadFile,
  safeShellOpenExternal,
} from '@/utils/utools';
import { buildExportData, parseImportData, type ExportData } from '@/services/data-port';

interface SyncConfig {
  token: string;
  gistId: string;
}

const stats = ref({
  projects: 0,
  ssh: 0,
  commands: 0,
  remotes: 0,
  tasks: 0,
  taskGroups: 0,
});

const githubConfig = ref<SyncConfig>({
  token: '',
  gistId: '',
});

const giteeConfig = ref<SyncConfig>({
  token: '',
  gistId: '',
});

const githubLoading = ref(false);
const giteeLoading = ref(false);

const isUserCancel = (error: unknown) => error === 'cancel' || error === 'close';
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

// 获取统计数据
const loadStats = async () => {
  const [projects, ssh, commands, remotes, tasks, taskGroups] = await Promise.all([
    getProjectList(),
    getSshList(),
    getCommandList(),
    getRemoteList(),
    getTaskList(),
    getTaskGroupList(),
  ]);

  stats.value = {
    projects: projects.length,
    ssh: ssh.length,
    commands: commands.length,
    remotes: remotes.length,
    tasks: tasks.length,
    taskGroups: taskGroups.length,
  };
};

// 加载同步配置
const loadSyncConfigs = () => {
  try {
    const githubConfigStr = window.utools.dbStorage.getItem('sync_config_github');
    const giteeConfigStr = window.utools.dbStorage.getItem('sync_config_gitee');

    if (githubConfigStr) {
      githubConfig.value = JSON.parse(githubConfigStr);
    }
    if (giteeConfigStr) {
      giteeConfig.value = JSON.parse(giteeConfigStr);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 保存 GitHub 配置
const saveGithubConfig = () => {
  window.utools.dbStorage.setItem('sync_config_github', JSON.stringify(githubConfig.value));
  ElMessage.success('GitHub 配置已保存');
};

// 保存 Gitee 配置
const saveGiteeConfig = () => {
  window.utools.dbStorage.setItem('sync_config_gitee', JSON.stringify(giteeConfig.value));
  ElMessage.success('Gitee 配置已保存');
};

// 获取导出数据（SSH 凭据以密文形态导出）
const getExportData = async (): Promise<ExportData> => {
  const [projects, ssh, commands, remotes, tasks, taskGroups] = await Promise.all([
    getProjectList(),
    getSshList(),
    getCommandList(),
    getRemoteList(),
    getTaskList(),
    getTaskGroupList(),
  ]);

  return buildExportData({ projects, ssh, commands, remotes, tasks, taskGroups });
};

/**
 * 导入数据。
 * 支持 1.0（明文）/ 1.1（内置密钥）/ 1.1 口令加密三种格式；
 * 口令加密的文件会先询问口令（先校验再确认覆盖，避免口令错了还吓一跳），
 * 写入过程中任何一步失败都会整体回滚。
 */
const importData = async (exportData: ExportData) => {
  const parsed = parseImportData(exportData);

  await ElMessageBox.confirm('导入数据将覆盖当前所有数据，此操作不可撤销，是否继续？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  await runWithRollback(
    [projectDoc, sshDoc, commandDoc, remoteDoc, taskDoc, taskGroupDoc],
    async () => {
      await Promise.all([
        writeDbList(projectDoc, parsed.projects),
        writeDbList(sshDoc, parsed.ssh),
        writeDbList(commandDoc, parsed.commands),
        writeDbList(remoteDoc, parsed.remotes),
        writeDbList(taskDoc, parsed.tasks),
        writeDbList(taskGroupDoc, parsed.taskGroups),
      ]);
    },
  );

  await loadStats();
};

// GitHub Gist 上传
const handleGithubUpload = async () => {
  if (!githubConfig.value.token) {
    ElMessage.error('请先配置 GitHub Personal Access Token');
    return;
  }

  githubLoading.value = true;
  try {
    const exportData = await getExportData();
    const jsonStr = JSON.stringify(exportData, null, 2);

    const gistData = {
      description: 'zr-publish 配置数据备份',
      public: false,
      files: {
        'zr-publish-config.json': {
          content: jsonStr,
        },
      },
    };

    let url = 'https://api.github.com/gists';
    let method = 'POST';

    // 如果有 gistId，则更新已有的 Gist
    if (githubConfig.value.gistId) {
      url = `https://api.github.com/gists/${githubConfig.value.gistId}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gistData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '上传失败');
    }

    const result = await response.json();
    githubConfig.value.gistId = result.id;
    saveGithubConfig();

    ElMessage.success(`上传成功！Gist ID: ${result.id}`);
  } catch (error: any) {
    console.error('GitHub 上传失败:', error);
    ElMessage.error(`上传失败: ${error.message}`);
  } finally {
    githubLoading.value = false;
  }
};

// GitHub Gist 下载
const handleGithubDownload = async () => {
  if (!githubConfig.value.token || !githubConfig.value.gistId) {
    ElMessage.error('请先配置 Token 和 Gist ID');
    return;
  }

  githubLoading.value = true;
  try {
    const response = await fetch(`https://api.github.com/gists/${githubConfig.value.gistId}`, {
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取数据失败');
    }

    const result = await response.json();
    const fileContent = result.files['zr-publish-config.json']?.content;

    if (!fileContent) {
      throw new Error('未找到配置文件');
    }

    const exportData: ExportData = JSON.parse(fileContent);

    await importData(exportData);
    ElMessage.success('从 GitHub 下载成功！');
  } catch (error) {
    if (!isUserCancel(error)) {
      console.error('GitHub 下载失败:', error);
      ElMessage.error(`下载失败: ${messageOf(error)}`);
    }
  } finally {
    githubLoading.value = false;
  }
};

// Gitee Gist 上传
const handleGiteeUpload = async () => {
  if (!giteeConfig.value.token) {
    ElMessage.error('请先配置 Gitee Access Token');
    return;
  }

  giteeLoading.value = true;
  try {
    const exportData = await getExportData();
    const jsonStr = JSON.stringify(exportData, null, 2);

    const gistData = {
      description: 'zr-publish 配置数据备份',
      public: false,
      files: {
        'zr-publish-config.json': {
          content: jsonStr,
        },
      },
    };

    let url = 'https://gitee.com/api/v5/gists';
    let method = 'POST';
    let body: any = {
      ...gistData,
      access_token: giteeConfig.value.token,
    };

    // 如果有 gistId，则更新已有的 Gist
    if (giteeConfig.value.gistId) {
      url = `https://gitee.com/api/v5/gists/${giteeConfig.value.gistId}`;
      method = 'PATCH';
      body.access_token = giteeConfig.value.token;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '上传失败');
    }

    const result = await response.json();
    giteeConfig.value.gistId = result.id;
    saveGiteeConfig();

    ElMessage.success(`上传成功！Gist ID: ${result.id}`);
  } catch (error: any) {
    console.error('Gitee 上传失败:', error);
    ElMessage.error(`上传失败: ${error.message}`);
  } finally {
    giteeLoading.value = false;
  }
};

// Gitee Gist 下载
const handleGiteeDownload = async () => {
  if (!giteeConfig.value.token || !giteeConfig.value.gistId) {
    ElMessage.error('请先配置 Token 和 Gist ID');
    return;
  }

  giteeLoading.value = true;
  try {
    // Gitee 官方文档（swagger 5.4.93）只声明 access_token 作为 query/formData 参数，
    // 并未声明 Authorization 头；但实测 `Authorization: token <pat>` 可用。
    // 因此优先用请求头（避免 token 出现在 URL 与各级日志里），
    // 一旦被拒绝就回退到文档写法，保证不会因为平台调整而失效。
    const gistUrl = `https://gitee.com/api/v5/gists/${giteeConfig.value.gistId}`;
    let response = await fetch(gistUrl, {
      headers: { Authorization: `token ${giteeConfig.value.token}` },
    });
    if (response.status === 401 || response.status === 403) {
      response = await fetch(
        `${gistUrl}?access_token=${encodeURIComponent(giteeConfig.value.token)}`,
      );
    }

    if (!response.ok) {
      throw new Error(`获取数据失败（HTTP ${response.status}）`);
    }

    const result = await response.json();
    const fileContent = result.files['zr-publish-config.json']?.content;

    if (!fileContent) {
      throw new Error('未找到配置文件');
    }

    const exportData: ExportData = JSON.parse(fileContent);

    await importData(exportData);
    ElMessage.success('从 Gitee 下载成功！');
  } catch (error) {
    if (!isUserCancel(error)) {
      console.error('Gitee 下载失败:', error);
      ElMessage.error(`下载失败: ${messageOf(error)}`);
    }
  } finally {
    giteeLoading.value = false;
  }
};

// 导出数据到文件
const handleExport = async () => {
  try {
    const exportData = await getExportData();
    const jsonStr = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultPath = `zr-publish-data-${timestamp}.json`;

    const savePath = safeSaveDialog({
      title: '保存数据文件',
      defaultPath,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (savePath) {
      const result = safeWriteFile(savePath, jsonStr);

      if (result) {
        ElMessage.success(`数据导出成功！文件保存在：${savePath}`);
      } else {
        ElMessage.error('文件写入失败，请检查路径和权限');
      }
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(`导出数据失败: ${messageOf(error)}`);
  }
};

// 从文件导入数据
const handleImport = async () => {
  const files = safeOpenDialog({
    title: '选择数据文件',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (!files || files.length === 0) return;

  const filePath = files[0];
  const fileContent = safeReadFile(filePath);

  if (!fileContent) {
    ElMessage.error('读取文件失败');
    return;
  }

  let exportData: ExportData;
  try {
    exportData = JSON.parse(fileContent);
  } catch (error) {
    ElMessage.error('文件格式不正确，请选择有效的 JSON 文件');
    return;
  }

  if (!exportData.data || !exportData.version) {
    ElMessage.error('文件格式不正确：缺少 data/version 字段');
    return;
  }

  try {
    await importData(exportData);
    ElMessage.success('数据导入成功！');
  } catch (error) {
    if (!isUserCancel(error)) {
      console.error('导入失败:', error);
      ElMessage.error(`导入失败: ${messageOf(error)}`);
    }
  }
};

// 打开外部链接
const openLink = (url: string) => {
  safeShellOpenExternal(url);
};

onMounted(() => {
  loadStats();
  loadSyncConfigs();
});
</script>

<style lang="scss" scoped>
.page-content {
  overflow: auto;
}

.doc-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.el-divider {
  margin: 24px 0;
}

.el-alert {
  margin-top: 16px;
}

.sync-card {
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 16px 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

:deep(.el-alert__description) {
  p {
    margin: 8px 0;
  }

  ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  a {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
