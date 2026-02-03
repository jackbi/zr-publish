<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-20 17:04:09
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 17:06:43
 * @FilePath: /zr-publish/src/components/command/change.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="id ? '编辑指令' : '新增指令'"
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
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button @click="confirm" type="primary">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { addCommand, updateCommand } from '@/DB/index.db';
import { notifyError, notifySuccess } from '@/utils/feedback';
import { useDialogForm } from '@/utils/dialog';

const { dialogVisible, id, formData, resetDialog, openDialog } = useDialogForm<{ content: string }>(
  () => ({
    content: '',
  }),
);
const emit = defineEmits(['success']);

const formRef = ref();

const formRules = reactive({
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});

const cancel = () => {
  resetDialog();
};

const init = (datas: string) => {
  openDialog(datas ? { content: datas } : undefined);
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (id.value) {
        updateCommand(id.value, formData.content)
          .then(() => {
            emit('success', formData.content);
            cancel();
            notifySuccess();
          })
          .catch(() => {
            notifyError();
          });
        return;
      }
      addCommand(formData.content)
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
