<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-03-03 17:27:15
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:31:45
 * @FilePath: /zr-publish/src/components/remote/change.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="id ? '编辑远程路径' : '新增远程路径'"
    width="60%"
    :before-close="cancel"
    draggable
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          resize="none"
          :rows="6"
          placeholder="请输入名称"
        />
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
import { addRemote } from '@/DB/index.db';
import { ElMessage } from 'element-plus';

const dialogVisible = ref(false);

const id = ref();
const emit = defineEmits(['success']);

const formRef = ref();
const formData = reactive<{ content: string }>({
  content: '',
});

const formRules = reactive({
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});

const cancel = () => {
  dialogVisible.value = false;
  id.value = undefined;
  formData.content = '';
};

const init = (datas: string) => {
  if (datas) {
    formData.content = datas;
  }
  dialogVisible.value = true;
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      addRemote(formData.content).then((res) => {
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
