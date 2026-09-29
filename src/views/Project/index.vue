<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 11:13:03
 * @LastEditors: wenbin
 * @LastEditTime: 2026-02-04 09:32:06
 * @FilePath: /zr-publish/src/views/Project/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">项目管理</div>
      <div class="page-actions page-actions--inline">
        <el-input
          class="search-input"
          type="text"
          v-model="searchInput"
          placeholder="搜索项目名称/备注"
          clearable
          :prefix-icon="Search"
          @keyup.enter="triggerSearch"
          @input="triggerSearch"
          @clear="triggerSearch"
        ></el-input>
        <el-button @click="refreshAllGit" :icon="Refresh" :loading="refreshingAll">
          刷新所有 Git 状态
        </el-button>
        <el-button @click="importProject">导入项目</el-button>
        <el-button @click="addProjectItem" type="primary">新增项目</el-button>
      </div>
    </header>
    <div class="page-content">
      <el-table :data="filterTableData" style="width: 100%" border height="100%">
        <el-table-column prop="name" label="项目名称" min-width="120" />
        <el-table-column
          prop="path"
          show-overflow-tooltip
          label="项目路径"
          min-width="160"
          class-name="cell-mono"
        />
        <el-table-column label="项目类型" width="84">
          <template #default="{ row }">
            <el-tag :style="getProjectTypeStyle(row.project_type)" size="small">
              {{ getProjectTypeLabel(row.project_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Git 分支" width="132" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.git_loading" class="git-loading">
              <el-skeleton :rows="1" animated />
            </div>
            <div
              v-else-if="row.git_info?.isGit"
              class="git-info"
              style="display: flex; align-items: center; gap: 4px"
            >
              <el-icon style="margin-right: 4px"><BranchesOutlined /></el-icon>
              <span class="mono">{{ row.git_info.branch || '-' }}</span>
              <el-tooltip
                v-if="row.uncommitted_count > 0"
                effect="dark"
                :content="`${row.uncommitted_count} 个未提交的更改`"
                placement="top"
              >
                <el-icon style="color: var(--color-warning); margin-left: 4px">
                  <WarningFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="代码状态" min-width="104">
          <template #default="{ row }">
            <div v-if="row.git_loading" class="git-loading">
              <el-skeleton :rows="1" animated />
            </div>
            <div v-else style="display: flex; align-items: center; gap: 8px">
              <el-tag
                v-if="row.git_info?.isGit"
                :type="getGitStatusType(row.git_info.status)"
                size="small"
                effect="plain"
              >
                {{ getGitStatusText(row.git_info) }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </div>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="package_name" label="打包后文件名" width="120" /> -->
        <el-table-column prop="version" label="项目版本" width="92" class-name="cell-num" />
        <el-table-column prop="desc" label="备注" min-width="96" show-overflow-tooltip />
        <el-table-column
          label="操作"
          fixed="right"
          width="160"
          align="center"
          class-name="cell-actions"
        >
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleOpenCommand(cmd, row)">
              <el-button
                text
                :icon="FolderOpened"
                title="打开项目"
                aria-label="打开项目"
              ></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="terminal">
                    <el-icon><Monitor /></el-icon>
                    终端打开
                  </el-dropdown-item>
                  <el-dropdown-item command="vscode">
                    <el-icon><Monitor /></el-icon>
                    VS Code 打开
                  </el-dropdown-item>
                  <el-dropdown-item command="idea">
                    <el-icon><Cpu /></el-icon>
                    IDEA 打开
                  </el-dropdown-item>
                  <el-dropdown-item command="finder">
                    <el-icon><FolderOpened /></el-icon>
                    文件管理器打开
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              text
              type="primary"
              :icon="Refresh"
              size="small"
              :loading="row.git_loading"
              :disabled="row.git_loading"
              @click="handleRefreshSingleGit(row)"
              title="刷新 Git 状态"
              style="padding: 4px; margin-left: auto"
            ></el-button>
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
      <projectChange ref="projectChangeRef" @success="getTableData"></projectChange>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Delete,
  Edit,
  FolderOpened,
  Search,
  DocumentCopy,
  Monitor,
  Cpu,
  Refresh,
  WarningFilled,
} from '@element-plus/icons-vue';
import BranchesOutlined from '@/components/icons/BranchesOutlined.vue';
import {
  getProjectList,
  removeProject,
  batchAddProject,
  addProject,
  updateProject,
  batchUpdateProjects,
  getSettings,
} from '@/DB/index.db';
import { ProjectItemType, ProjectItemTypeNoId, TerminalType, GitInfo } from '@/types/index.type';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { createDebounce } from '@/utils/timing';
import { confirmDelete, notifySuccess, notifyError, notifyWarning } from '@/utils/feedback';
import { safeReadDir, safeReadFile, safeOpenDialog } from '@/utils/utools';
import {
  detectProjectType,
  getProjectTypeLabel,
  getProjectTypeStyle,
  openWithEditor,
} from '@/utils/project';
import { gitWorkerQueue } from '@/utils/git-worker';

const projectChange = defineAsyncComponent(() => import('@/components/project/change.vue'));

interface ProjectItemWithRefreshing extends ProjectItemType {
  refreshing?: boolean;
  git_loading?: boolean;
}

const projectData = ref<ProjectItemWithRefreshing[]>([]);
const projectChangeRef = ref();
const searchInput = ref('');
const search = ref('');
const refreshingAll = ref(false);

const filterTableData = computed(() =>
  projectData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (data.desc && data.desc.toLowerCase().includes(search.value.toLowerCase())),
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
    const res = await getProjectList();
    projectData.value = res.map((project) => ({
      ...project,
      project_type: project.project_type || detectProjectType(project.path),
      refreshing: false,
      git_loading: false,
      uncommitted_count: project.uncommitted_count || 0,
      last_commit_info: project.last_commit_info || '',
    }));
  } catch (error) {
    notifyError('加载项目列表失败');
  }
};

const refreshAllGit = async () => {
  if (!window.services?.refreshGitStatus) {
    notifyError('Git 服务不可用');
    return;
  }

  refreshingAll.value = true;

  // Set loading state for all projects (not just known Git projects)
  projectData.value.forEach((project) => {
    project.git_loading = true;
  });

  let successCount = 0;
  let errorCount = 0;
  let notGitCount = 0;
  const projectsToUpdate: ProjectItemType[] = [];

  try {
    // Check all projects, not just those with git_info.isGit
    const promises = projectData.value.map(async (project) => {
      try {
        const result = await gitWorkerQueue.addTask(project.path, 'full');

        // 直接写在当前行对象上：按 index 回写会在列表被重建时把状态写到别的项目上
        project.git_info = result.git_info;
        project.uncommitted_count = result.uncommitted_count;
        project.last_commit_info = result.last_commit_info;
        project.git_loading = false;

        if (result.git_info.isGit) {
          if (result.git_info.status !== 'error') {
            successCount++;
            projectsToUpdate.push({
              ...project,
              git_info: result.git_info,
            });
          } else {
            errorCount++;
          }
        } else {
          notGitCount++;
        }
      } catch (error) {
        errorCount++;
        project.git_loading = false;
      }
    });

    await Promise.all(promises);

    if (projectsToUpdate.length > 0) {
      await batchUpdateProjects(projectsToUpdate);
    }

    if (errorCount === 0) {
      notifySuccess(
        `已刷新 ${successCount} 个 Git 项目${notGitCount > 0 ? `，跳过 ${notGitCount} 个非 Git 项目` : ''}`,
      );
    } else {
      notifyWarning(
        `刷新完成：成功 ${successCount} 个，失败 ${errorCount} 个${notGitCount > 0 ? `，跳过 ${notGitCount} 个非 Git 项目` : ''}`,
      );
    }
  } catch (error: any) {
    notifyError(`批量刷新失败: ${error.message}`);
  } finally {
    refreshingAll.value = false;
  }
};

const handleRefreshSingleGit = async (project: ProjectItemWithRefreshing) => {
  if (!window.services?.getGitInfo) {
    notifyError('Git 服务不可用');
    return;
  }

  if (project.git_loading) return;

  // Find project index
  const index = projectData.value.findIndex((p) => p.id === project.id);
  if (index === -1) return;

  // Set loading state
  projectData.value[index].git_loading = true;

  try {
    const result = await gitWorkerQueue.addTask(project.path, 'full');

    projectData.value[index].git_info = result.git_info;
    projectData.value[index].uncommitted_count = result.uncommitted_count;
    projectData.value[index].last_commit_info = result.last_commit_info;
    projectData.value[index].git_loading = false;

    // Update to database
    if (result.git_info.isGit && result.git_info.status !== 'error') {
      await updateProject({
        ...project,
        git_info: result.git_info,
      });
      notifySuccess(`已刷新项目「${project.name}」的 Git 状态`);
    } else if (result.git_info.isGit && result.git_info.status === 'error') {
      notifyWarning(`项目「${project.name}」刷新失败`);
    } else {
      notifyWarning(`项目「${project.name}」不是 Git 仓库`);
    }
  } catch (error: any) {
    projectData.value[index].git_loading = false;
    notifyError(`刷新失败: ${error.message}`);
  }
};

const getGitStatusType = (status: string) => {
  switch (status) {
    case 'up-to-date':
      return 'success';
    case 'ahead':
      return 'warning';
    case 'behind':
      return 'danger';
    case 'diverged':
      return 'warning';
    case 'no-remote':
      return 'info';
    default:
      return 'info';
  }
};

const getGitStatusText = (gitInfo: GitInfo) => {
  if (!gitInfo) return '-';

  switch (gitInfo.status) {
    case 'up-to-date':
      return '最新';
    case 'ahead':
      return `领先 ${gitInfo.ahead} 个提交`;
    case 'behind':
      return `落后 ${gitInfo.behind} 个提交`;
    case 'diverged':
      return `分叉 (↑${gitInfo.ahead} ↓${gitInfo.behind})`;
    case 'no-remote':
      return '无远程';
    case 'not-git':
      return '非 Git 仓库';
    case 'error':
      return '错误';
    default:
      return '未知';
  }
};

const importProject = () => {
  const files = safeOpenDialog({
    title: '选择项目路径',
    properties: ['openDirectory', 'multiSelections'],
  });

  if (!files || files.length === 0) {
    return;
  }

  const params: ProjectItemTypeNoId[] = [];

  files.forEach((element: string) => {
    const fileList = safeReadDir(element);
    if (fileList && fileList.includes('package.json')) {
      const packageJsonData = safeReadFile(`${element}/package.json`);
      if (packageJsonData) {
        try {
          const data = JSON.parse(packageJsonData);
          if (data) {
            params.push({
              name: data.name,
              path: element,
              package_name: '',
              version: data.version || '',
              desc: '',
              project_type: detectProjectType(element),
            });
          }
        } catch (error) {
          console.error(`Failed to parse package.json for ${element}:`, error);
          params.push({
            name: element.split(/[\\/]/).pop() || element,
            path: element,
            package_name: '',
            version: '',
            desc: '',
            project_type: detectProjectType(element),
          });
        }
      }
    } else {
      params.push({
        name: element.split(/[\\/]/).pop() || element,
        path: element,
        package_name: '',
        version: '',
        desc: '',
        project_type: detectProjectType(element),
      });
    }
  });

  batchAddProject(params as ProjectItemType[])
    .then(() => {
      notifySuccess(`成功导入 ${params.length} 个项目`);
      getTableData();
    })
    .catch((error) => {
      notifyError(`导入项目失败: ${error.message}`);
    });
};

const addProjectItem = () => {
  projectChangeRef.value?.init();
};

const handleEdit = (row: ProjectItemType) => {
  projectChangeRef.value?.init(row);
};

const handleCopy = (row: ProjectItemType) => {
  const { id, ...rest } = row;
  addProject({
    ...(rest as ProjectItemType),
    id: '',
    name: `${row.name} 副本`,
  })
    .then(() => getTableData())
    .catch((error) => notifyError(error instanceof Error ? error.message : '复制失败'));
};

const handleOpenCommand = async (
  command: 'terminal' | 'vscode' | 'idea' | 'finder',
  row: ProjectItemType,
) => {
  if (command === 'terminal') {
    try {
      const settings = await getSettings();
      let terminalType = settings.default_terminal;

      if (!terminalType && window.services?.getDefaultTerminal) {
        terminalType = (await window.services.getDefaultTerminal()) as TerminalType;
      }

      if (window.services?.openInTerminal) {
        const result = window.services.openInTerminal(row.path, terminalType);
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
  } else {
    openWithEditor(row.path, command);
  }
};

const handleDelete = (row: ProjectItemType) => {
  confirmDelete(`确定要删除项目「${row.name}」吗？`)
    .then(() => removeProject(row.id).then(() => getTableData()))
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
.git-loading {
  padding: 4px 0;

  :deep(.el-skeleton__item) {
    height: 20px;
    border-radius: 4px;
  }
}

.git-info,
.git-remote {
  transition: opacity 0.3s ease;
}
</style>
