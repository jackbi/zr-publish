<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 11:55:56
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 15:18:32
 * @FilePath: /zr-publish/src/components/project/change.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="id ? '编辑项目' : '新增项目'"
    width="60%"
    :before-close="cancel"
    draggable
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item label="项目路径" prop="path">
        <el-input v-model="formData.path" placeholder="请输入项目路径">
          <template #append>
            <el-button type="primary" :icon="FolderOpened" @click="handleSelectPath"></el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入项目名称" />
      </el-form-item>
      <!-- <el-form-item label="打包后的文件名" prop="package_name">
        <el-input v-model="formData.package_name" placeholder="请输入打包后的文件名" />
      </el-form-item> -->
      <el-form-item label="版本号" prop="version">
        <el-input v-model="formData.version" placeholder="请输入版本号" />
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
import { reactive, ref } from 'vue';
import { ProjectItemTypeNoId, ProjectItemType } from '@/types/index.type';
import { FolderOpened } from '@element-plus/icons-vue';
import { addProject, updateProject } from '@/DB/index.db';
import { ElMessage } from 'element-plus';

const dialogVisible = ref(false);

const id = ref();
const emit = defineEmits(['success']);

const formRef = ref();
const formData = reactive<ProjectItemTypeNoId>({
  name: '',
  path: '',
  package_name: '',
  version: '',
  desc: '',
});

const formRules = reactive({
  name: [
    {
      required: true,
      message: '请输入项目名称',
      trigger: 'blur',
    },
  ],
  path: [
    {
      required: true,
      message: '请输入项目路径',
      trigger: 'blur',
    },
  ],
  // package_name: [
  //   {
  //     required: true,
  //     message: '请输入打包后的文件名',
  //     trigger: 'blur',
  //   },
  // ],
});

const cancel = () => {
  dialogVisible.value = false;
  id.value = undefined;
  formData.name = '';
  formData.path = '';
  formData.version = '';
  formData.desc = '';
  formData.package_name = '';
};

const handleSelectPath = () => {
  // 通过 uTools 的 api 打开文件选择窗口
  const files = (window as any).utools.showOpenDialog({
    title: '选择项目路径',
    properties: ['openDirectory'],
  });
  if (!files) return;
  const _filePath = files[0];
  formData.path = _filePath;
  const packageJsonData = (window as any).services.readFile(`${_filePath}/package.json`);
  if (packageJsonData) {
    const data = JSON.parse(packageJsonData);
    formData.name = data.name;
    formData.version = data.version;
  }
};

const init = (datas: ProjectItemTypeNoId) => {
  if (datas) {
    Object.assign(formData, datas);
    id.value = datas.id;
  }
  dialogVisible.value = true;
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      let api: () => Promise<ProjectItemType | Error>;
      if (id.value) {
        api = () => updateProject({ ...formData, id: id.value });
      } else {
        api = () => addProject(formData as ProjectItemType);
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
