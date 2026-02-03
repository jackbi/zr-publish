<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="id ? '编辑任务' : '新增任务'"
    width="60%"
    :before-close="cancel"
    draggable
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
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
          <el-option :key="'ungrouped'" label="未分组" :value="undefined" />
          <el-option v-for="item in taskGroupList" :key="item.id" :label="item.name" :value="item.id" />
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
          <div style="display: flex; gap: 24px; align-items: center;">
            <el-checkbox v-model="formData.is_removed" label="删除远程" @change="handleRemoveChange" />
            <el-tooltip content="开启会先把远程文件夹删除" placement="top">
              <el-icon style="color: #909399; cursor: help;"><InfoFilled /></el-icon>
            </el-tooltip>
            
            <el-checkbox v-model="formData.is_save" label="备份远程" />
            <el-tooltip content="开启会先把远程文件夹使用zip打包" placement="top">
              <el-icon style="color: #909399; cursor: help;"><InfoFilled /></el-icon>
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
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon :style="{ color: item.isDirectory ? '#409EFF' : '#67C23A' }">
                  <Folder v-if="item.isDirectory" />
                  <Document v-else />
                </el-icon>
                <span>{{ item.name }}</span>
              </div>
            </el-option>
          </el-select>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
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
        <el-button @click="cancel">取消</el-button>
        <el-button @click="confirm" type="primary">确定</el-button>
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
import { decrypt } from '@/utils/CryptoJS';
import { safeIsDir, safeReadFile, safeOpenDialog } from '@/utils/utools';
import { notifyError, notifySuccess } from '@/utils/feedback';
import { useDialogForm } from '@/utils/dialog';
import { cloneDeep } from 'lodash-es';

const { dialogVisible, id, formData, resetDialog, openDialog } = useDialogForm<TaskItemTypeNoId>(() => ({
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
}));

const projectList = ref<ProjectItemType[]>([]);
const sshList = ref<sshItemType[]>([]);
const commandList = ref<string[]>([]);
const remoteList = ref<string[]>([]);
const packageScripts = ref<string[]>([]);
const taskGroupList = ref<TaskGroupItemType[]>([]);
const remoteFileList = ref<Array<{ name: string; isDirectory: boolean }>>([]);
const loadingRemoteFiles = ref(false);
const emit = defineEmits(['success']);

const formRef = ref();

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

const cancel = () => {
  resetDialog();
};

const handleSelectPath = () => {
  const projectData = projectList.value.find((el) => el.id === formData.project_id);
  // 通过 uTools 的 api 打开文件选择窗口
  const files = safeOpenDialog({
    title: '选择项目路径',
    defaultPath: projectData?.path,
    properties: ['openDirectory', 'openFile'],
  });
  if (!files) return;
  const _filePath = files[0];
  formData.local_path = _filePath;
  const packageJsonData = safeReadFile(`${projectData?.path}/package.json`);
  if (packageJsonData) {
    try {
      const data = JSON.parse(packageJsonData);
      packageScripts.value = Object.values(data.scripts);
    } catch (error) {
      notifyError('读取 package.json 失败');
    }
  }
};

const getProjectListData = () => {
  getProjectList().then((res) => {
    projectList.value = res;
  });
};
const getTaskGroupListData = () => {
  getTaskGroupList().then((res) => {
    taskGroupList.value = res;
  });
};
const getCommandListData = () => {
  getCommandList().then((res) => {
    commandList.value = res;
  });
};
const getRemoteListData = () => {
  getRemoteList().then((res) => {
    remoteList.value = res;
  });
};
const getSshListData = () => {
  getSshList().then((res) => {
    sshList.value = res.map((el) => {
      return {
        ...el,
        password: decrypt(el.password),
      };
    });
  });
};

const handleRemoveChange = async (checked: boolean) => {
  if (checked && formData.remote_path && formData.ssh_ids.length > 0) {
    loadingRemoteFiles.value = true;
    remoteFileList.value = [];
    formData.exclude_paths = [];
    
    try {
      const firstSshId = formData.ssh_ids[0];
      const sshConfig = sshList.value.find(ssh => ssh.id === firstSshId);
      
      if (sshConfig && window.services?.listRemoteDirectory) {
        const files = await window.services.listRemoteDirectory(
          {
            host: sshConfig.host,
            port: sshConfig.port,
            username: sshConfig.username,
            password: sshConfig.password,
          },
          formData.remote_path
        );
        remoteFileList.value = files || [];
      }
    } catch (error) {
      notifyError('获取远程目录内容失败: ' + (error as Error).message);
    } finally {
      loadingRemoteFiles.value = false;
    }
  } else {
    remoteFileList.value = [];
    formData.exclude_paths = [];
  }
};

const fetchRemoteFileList = async () => {
  if (formData.remote_path && formData.ssh_ids.length > 0) {
    loadingRemoteFiles.value = true;
    remoteFileList.value = [];
    
    try {
      const firstSshId = formData.ssh_ids[0];
      const sshConfig = sshList.value.find(ssh => ssh.id === firstSshId);
      
      if (sshConfig && window.services?.listRemoteDirectory) {
        const files = await window.services.listRemoteDirectory(
          {
            host: sshConfig.host,
            port: sshConfig.port,
            username: sshConfig.username,
            password: sshConfig.password,
          },
          formData.remote_path
        );
        remoteFileList.value = files || [];
      }
    } catch (error) {
      notifyError('获取远程目录内容失败: ' + (error as Error).message);
    } finally {
      loadingRemoteFiles.value = false;
    }
  }
};

const init = (datas: TaskItemType) => {
  if (datas) {
    openDialog(datas);
  } else {
    openDialog();
  }
  getProjectListData();
  getSshListData();
  getCommandListData();
  getRemoteListData();
  getTaskGroupListData();
  
  if (datas && datas.is_removed && datas.remote_path && datas.ssh_ids?.length > 0) {
    setTimeout(() => {
      fetchRemoteFileList();
    }, 500);
  }
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      let api: () => Promise<TaskItemType | Error>;
      const params = cloneDeep(formData);
      if (!params.group_id) {
        params.group_id = undefined;
      }
      params.ssh_names = params.ssh_ids.map((el) => {
        const sshData = sshList.value.find((_el) => _el.id === el);
        return sshData?.host || '';
      });
      params.project_name = projectList.value.find((el) => el.id === params.project_id)?.name || '';
      if (id.value) {
        api = () => updateTask({ ...params, id: id.value });
      } else {
        api = () => addTask(params as TaskItemType);
      }
      api()
        .then((res) => {
          emit('success', res);
          cancel();
          notifySuccess();
        })
        .catch(() => {
          notifyError();
        });
    }
  });
};

defineExpose({
  init,
});
</script>
<style lang="scss" scoped></style>
