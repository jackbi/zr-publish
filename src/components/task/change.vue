<template>
  <el-dialog
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
        <el-form-item label="是否删除远程数据" prop="is_removed">
          <el-switch
            v-model="formData.is_removed"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            :active-value="true"
            :inactive-value="false"
          />
          <el-tooltip content="开启会先把远程文件夹删除" placement="bottom">
            <el-button type="primary" text :icon="InfoFilled"></el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="是否备份远程数据" prop="is_save">
          <el-switch
            v-model="formData.is_save"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            :active-value="true"
            :inactive-value="false"
          />
          <el-tooltip content="开启会先把远程文件夹使用zip打包" placement="bottom">
            <el-button type="primary" text :icon="InfoFilled"></el-button>
          </el-tooltip>
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
      <el-button @click="cancel">取消</el-button>
      <el-button @click="confirm" type="primary">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { TaskItemType, TaskItemTypeNoId, ProjectItemType, sshItemType } from '@/types/index.type';
import { FolderOpened, InfoFilled } from '@element-plus/icons-vue';
import {
  getProjectList,
  getSshList,
  addTask,
  updateTask,
  getCommandList,
  getRemoteList,
} from '@/DB/index.db';
import { decrypt } from '@/utils/CryptoJS';
import { ElMessage } from 'element-plus';
import { cloneDeep } from 'lodash-es';

const dialogVisible = ref(false);

const projectList = ref<ProjectItemType[]>([]);
const sshList = ref<sshItemType[]>([]);
const commandList = ref<string[]>([]);
const remoteList = ref<string[]>([]);
const packageScripts = ref<string[]>([]);
const id = ref();
const emit = defineEmits(['success']);

const formRef = ref();
const formData = reactive<TaskItemTypeNoId>({
  name: '',
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
  return (window as any).services.isDir(formData.local_path);
});

const cancel = () => {
  dialogVisible.value = false;
  id.value = undefined;
  formData.name = '';
  formData.project_id = '';
  formData.project_name = '';
  formData.desc = '';
  formData.ssh_ids = [];
  formData.ssh_names = [];
  formData.remote_path = '';
  formData.local_path = '';
  formData.remote_command = '';
  formData.local_command = '';
  formData.is_removed = true;
  formData.is_save = true;
};

const handleSelectPath = () => {
  const projectData = projectList.value.find((el) => el.id === formData.project_id);
  // 通过 uTools 的 api 打开文件选择窗口
  const files = (window as any).utools.showOpenDialog({
    title: '选择项目路径',
    defaultPath: projectData?.path,
    properties: ['openDirectory', 'openFile'],
  });
  if (!files) return;
  const _filePath = files[0];
  formData.local_path = _filePath;
  const packageJsonData = (window as any).services.readFile(`${projectData?.path}/package.json`);
  if (packageJsonData) {
    const data = JSON.parse(packageJsonData);
    packageScripts.value = Object.values(data.scripts);
  }
};

const getProjectListData = () => {
  getProjectList().then((res) => {
    projectList.value = res;
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

const init = (datas: TaskItemType) => {
  if (datas) {
    Object.assign(formData, datas);
    id.value = datas.id;
  }
  getProjectListData();
  getSshListData();
  getCommandListData();
  getRemoteListData();
  dialogVisible.value = true;
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      let api: () => Promise<TaskItemType | Error>;
      const params = cloneDeep(formData);
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
      api().then((res) => {
        emit('success', res);
        cancel();
        ElMessage.success('操作成功');
      });
    }
  });
};

defineExpose({
  init,
});
</script>
<style lang="scss" scoped></style>
