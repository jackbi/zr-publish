<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="id ? '编辑任务' : '新增任务'"
    width="60%"
    :before-close="beforeClose"
    draggable
  >
    <el-form :ref="setFormRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入任务名称"></el-input>
      </el-form-item>
      <el-form-item label="选择项目" prop="project_id">
        <el-select v-model="formData.project_id" placeholder="请选择项目">
          <el-option
            v-for="item in projectList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="任务组" prop="group_id">
        <el-select v-model="formData.group_id" clearable placeholder="选择任务组">
          <el-option :key="'ungrouped'" label="未分组" value="" />
          <el-option
            v-for="item in taskGroupList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="选择文件" v-if="formData.project_id" prop="local_path">
        <el-input v-model="formData.local_path" placeholder="请选择需要上传的文件">
          <template #append>
            <el-button type="primary" :icon="FolderOpened" @click="handleSelectPath"></el-button>
          </template>
        </el-input>
      </el-form-item>
      <!-- <el-form-item label="上传前执行命令" v-if="formData.local_path" prop="local_command">
        <el-select v-model="formData.local_command" clearable placeholder="上传前执行命令">
          <el-option v-for="item in packageScripts" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item> -->
      <el-form-item label="选择目标服务器" prop="ssh_ids">
        <el-select v-model="formData.ssh_ids" multiple collapse-tags placeholder="请选择服务器">
          <el-option v-for="item in sshList" :key="item.id" :label="item.host" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标路径" prop="remote_path">
        <!-- <el-input v-model="formData.remote_path" placeholder="请输入目标路径" /> -->
        <el-select
          v-model="formData.remote_path"
          filterable
          clearable
          allow-create
          :reserve-keyword="false"
          placeholder="请输入目标路径"
        >
          <el-option v-for="item in remoteList" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <template v-if="isDir">
        <el-form-item label="远程数据操作">
          <div style="display: flex; gap: 24px; align-items: center">
            <el-checkbox
              v-model="formData.is_removed"
              label="删除远程"
              @change="handleRemoveChange"
            />
            <el-tooltip content="开启会先把远程文件夹删除" placement="top">
              <el-icon style="color: var(--color-text-muted); cursor: help"><InfoFilled /></el-icon>
            </el-tooltip>

            <el-checkbox v-model="formData.is_save" label="备份远程" />
            <el-tooltip content="开启会先把远程文件夹使用zip打包" placement="top">
              <el-icon style="color: var(--color-text-muted); cursor: help"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item label="排除删除" v-if="formData.is_removed">
          <el-select
            v-model="formData.exclude_paths"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择要排除删除的文件或文件夹"
            :loading="loadingRemoteFiles"
            style="width: 100%"
          >
            <el-option
              v-for="item in remoteFileList"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon
                  :style="{
                    color: item.isDirectory ? 'var(--color-primary)' : 'var(--color-success)',
                  }"
                >
                  <Folder v-if="item.isDirectory" />
                  <Document v-else />
                </el-icon>
                <span>{{ item.name }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="form-hint">
            <el-icon><InfoFilled /></el-icon>
            选中的文件或文件夹在删除远程目录时将被保留
          </div>
        </el-form-item>
      </template>

      <el-form-item label="上传后执行命令" prop="remote_command">
        <!-- <el-input v-model="formData.remote_command" placeholder="请输入上传后执行命令" /> -->
        <el-select
          v-model="formData.remote_command"
          filterable
          clearable
          allow-create
          :reserve-keyword="false"
          placeholder="请输入上传后执行命令"
        >
          <el-option v-for="item in commandList" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="desc">
        <el-input v-model="formData.desc" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button @click="confirm" type="primary" :loading="submitting">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import {
  TaskItemType,
  TaskItemTypeNoId,
  ProjectItemType,
  sshItemType,
  TaskGroupItemType,
} from '@/types/index.type';
import { FolderOpened, InfoFilled, Document, Folder } from '@element-plus/icons-vue';
import {
  getProjectList,
  getSshList,
  addTask,
  updateTask,
  getCommandList,
  getRemoteList,
  getTaskGroupList,
} from '@/DB/index.db';
import { safeDecrypt } from '@/utils/CryptoJS';
import { safeIsDir, safeReadFile, safeOpenDialog } from '@/utils/utools';
import { notifyError } from '@/utils/feedback';
import { useEntityDialog } from '@/utils/entity-dialog';
import { cloneDeep } from 'lodash-es';

const projectList = ref<ProjectItemType[]>([]);
const sshList = ref<sshItemType[]>([]);
const commandList = ref<string[]>([]);
const remoteList = ref<string[]>([]);
const packageScripts = ref<string[]>([]);
const taskGroupList = ref<TaskGroupItemType[]>([]);
const remoteFileList = ref<Array<{ name: string; isDirectory: boolean }>>([]);
const loadingRemoteFiles = ref(false);
const emit = defineEmits<{ success: [payload: TaskItemType] }>();

const {
  dialogVisible,
  id,
  submitting,
  formData,
  setFormRef,
  openDialog,
  closeDialog,
  beforeClose,
  confirm,
} = useEntityDialog<TaskItemTypeNoId, TaskItemType>({
  createInitial: () => ({
    name: '',
    group_id: undefined,
    project_id: '',
    project_name: '',
    ssh_ids: [],
    ssh_names: [],
    remote_path: '',
    local_path: '',
    remote_command: '',
    local_command: '',
    desc: '',
    is_removed: true,
    is_save: true,
    exclude_paths: [],
  }),
  save: (data, currentId) => {
    const params = cloneDeep(data);
    if (!params.group_id) {
      params.group_id = undefined;
    }
    params.ssh_names = params.ssh_ids.map(
      (el) => sshList.value.find((item) => item.id === el)?.host || '',
    );
    params.project_name = projectList.value.find((el) => el.id === params.project_id)?.name || '';
    if (params.ssh_names.some((name) => !name)) {
      throw new Error('所选服务器已被删除，请重新选择');
    }
    return currentId ? updateTask({ ...params, id: currentId }) : addTask(params as TaskItemType);
  },
  onSuccess: (saved) => emit('success', saved),
  // 只有本表单才有的子状态，关闭时一并清掉
  onClose: () => {
    remoteFileList.value = [];
  },
});

const formRules = reactive({
  name: [
    {
      required: true,
      message: '请输入项目名称',
      trigger: 'blur',
    },
  ],
  project_id: [
    {
      required: true,
      message: '请选择项目',
      trigger: 'change',
    },
  ],
  ssh_ids: [
    {
      required: true,
      message: '请选择远程服务器',
      trigger: 'change',
    },
  ],
  remote_path: [
    {
      required: true,
      message: '请输入目标路径',
      trigger: 'blur',
    },
  ],
  local_path: [
    {
      required: true,
      message: '请选择需要上传的文件',
      trigger: 'change',
    },
  ],
});

const isDir = computed(() => {
  if (!formData.local_path) {
    return false;
  }
  return safeIsDir(formData.local_path);
});

const handleSelectPath = () => {
  const projectData = projectList.value.find((el) => el.id === formData.project_id);
  // 通过 uTools 的 api 打开文件选择窗口
  const files = safeOpenDialog({
    title: '选择项目路径',
    defaultPath: projectData?.path,
    properties: ['openDirectory', 'openFile'],
  });
  // 取消选择时返回空数组，用 !files 判断会把已填路径覆盖成 undefined
  if (!files || files.length === 0) return;
  const _filePath = files[0];
  formData.local_path = _filePath;
  const packageJsonData = safeReadFile(`${projectData?.path}/package.json`);
  if (packageJsonData) {
    try {
      const data = JSON.parse(packageJsonData);
      packageScripts.value = data.scripts ? Object.values(data.scripts) : [];
    } catch (error) {
      notifyError('读取 package.json 失败');
    }
  }
};

const getProjectListData = async () => {
  projectList.value = await getProjectList();
};
const getTaskGroupListData = async () => {
  taskGroupList.value = await getTaskGroupList();
};
const getCommandListData = async () => {
  commandList.value = await getCommandList();
};
const getRemoteListData = async () => {
  remoteList.value = await getRemoteList();
};
const getSshListData = async () => {
  const res = await getSshList();
  sshList.value = res.map((el) => ({
    ...el,
    password: safeDecrypt(el.password),
    passphrase: safeDecrypt(el.passphrase),
  }));
};

/**
 * 加载远端目录列表。
 * 必须把完整的 ssh 配置（含 auth_type/private_key/passphrase）传给 preload，
 * 否则私钥认证的服务器会以空密码连接而失败。
 */
const fetchRemoteFileList = async (resetExcludePaths = false) => {
  if (!formData.remote_path || formData.ssh_ids.length === 0) {
    remoteFileList.value = [];
    return;
  }

  loadingRemoteFiles.value = true;
  remoteFileList.value = [];
  if (resetExcludePaths) {
    formData.exclude_paths = [];
  }

  try {
    const firstSshId = formData.ssh_ids[0];
    const sshConfig = sshList.value.find((ssh) => ssh.id === firstSshId);

    if (!sshConfig) {
      notifyError('未找到所选服务器，请重新选择');
      return;
    }
    if (!window.services?.listRemoteDirectory) {
      notifyError('远程目录服务不可用');
      return;
    }

    const files = await window.services.listRemoteDirectory(
      {
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        password: sshConfig.password,
        auth_type: sshConfig.auth_type,
        private_key: sshConfig.private_key,
        passphrase: sshConfig.passphrase,
      },
      formData.remote_path,
    );
    remoteFileList.value = files || [];
  } catch (error) {
    notifyError('获取远程目录内容失败: ' + (error as Error).message);
  } finally {
    loadingRemoteFiles.value = false;
  }
};

const handleRemoveChange = async (checked: string | number | boolean) => {
  if (checked) {
    await fetchRemoteFileList(true);
  } else {
    remoteFileList.value = [];
    formData.exclude_paths = [];
  }
};

const init = async (datas?: TaskItemType) => {
  openDialog(datas);
  remoteFileList.value = [];

  // 等下拉数据全部就绪后再拉远端目录，避免用 setTimeout 猜时间导致拿不到 ssh 配置
  try {
    await Promise.all([
      getProjectListData(),
      getSshListData(),
      getCommandListData(),
      getRemoteListData(),
      getTaskGroupListData(),
    ]);
  } catch (error) {
    notifyError('加载表单数据失败，请重试');
    return;
  }

  if (datas && datas.is_removed && datas.remote_path && datas.ssh_ids?.length > 0) {
    await fetchRemoteFileList();
  }
};

defineExpose({
  init,
});
</script>
<style lang="scss" scoped></style>
