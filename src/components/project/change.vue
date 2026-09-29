<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 11:55:56
 * @LastEditors: wenbin
 * @LastEditTime: 2026-01-30 11:07:45
 * @FilePath: /zr-publish/src/components/project/change.vue
 * Copyright (c) 2025 wenbin
-->
<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="id ? '编辑项目' : '新增项目'"
    width="60%"
    :before-close="beforeClose"
    draggable
  >
    <el-form :ref="setFormRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
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
      <el-form-item label="项目类型" v-if="formData.project_type">
        <el-tag :style="getProjectTypeStyle(formData.project_type)">
          {{ getProjectTypeLabel(formData.project_type) }}
        </el-tag>
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
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button @click="confirm" type="primary" :loading="submitting">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import { ProjectItemTypeNoId, ProjectItemType } from '@/types/index.type';
import { FolderOpened } from '@element-plus/icons-vue';
import { addProject, updateProject } from '@/DB/index.db';
import { notifyError } from '@/utils/feedback';
import { useEntityDialog } from '@/utils/entity-dialog';
import { safeOpenDialog, safeReadFile } from '@/utils/utools';
import { detectProjectType, getProjectTypeLabel, getProjectTypeStyle } from '@/utils/project';

const emit = defineEmits<{ success: [payload: ProjectItemType] }>();

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
} = useEntityDialog<ProjectItemTypeNoId, ProjectItemType>({
  createInitial: () => ({
    name: '',
    path: '',
    package_name: '',
    version: '',
    desc: '',
    project_type: undefined,
  }),
  save: (data, currentId) =>
    currentId ? updateProject({ ...data, id: currentId }) : addProject(data as ProjectItemType),
  onSuccess: (saved) => emit('success', saved),
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

const handleSelectPath = () => {
  const files = safeOpenDialog({
    title: '选择项目路径',
    properties: ['openDirectory'],
  });
  // 取消选择时返回空数组，不能用 !files 判断，否则会把已填路径覆盖成 undefined
  if (!files || files.length === 0) return;
  const _filePath = files[0];
  formData.path = _filePath;
  formData.project_type = detectProjectType(_filePath);

  const packageJsonData = safeReadFile(`${_filePath}/package.json`);
  if (packageJsonData) {
    try {
      const data = JSON.parse(packageJsonData);
      formData.name = data.name || formData.name;
      formData.version = data.version || formData.version;
    } catch (error) {
      notifyError('读取 package.json 失败');
    }
  }
};

watch(
  () => formData.path,
  (newPath) => {
    if (newPath && !formData.project_type) {
      formData.project_type = detectProjectType(newPath);
    }
  },
);

const init = (datas?: ProjectItemTypeNoId) => {
  openDialog(datas);
};

defineExpose({
  init,
});
</script>
<style lang="scss" scoped></style>
