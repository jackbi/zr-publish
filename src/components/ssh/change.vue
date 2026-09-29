<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="id ? '编辑 SSH 链接' : '新增 SSH 链接'"
    width="60%"
    :before-close="beforeClose"
    draggable
  >
    <el-form :ref="setFormRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="IP 地址" prop="host">
        <el-input v-model="formData.host" placeholder="如 10.20.30.11" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input-number v-model="formData.port" placeholder="端口" />
      </el-form-item>
      <el-form-item label="用户名" :rules="[]" prop="username">
        <el-input v-model="formData.username" placeholder="用户名" />
      </el-form-item>
      <el-form-item label="认证方式" prop="auth_type">
        <el-radio-group v-model="formData.auth_type">
          <el-radio value="password">密码认证</el-radio>
          <el-radio value="privateKey">私钥认证</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.auth_type === 'password'" label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="密码" show-password />
      </el-form-item>
      <el-form-item v-if="formData.auth_type === 'privateKey'" label="私钥文件" prop="private_key">
        <el-input v-model="formData.private_key" placeholder="选择私钥文件" readonly>
          <template #append>
            <el-button :icon="FolderOpened" @click="selectPrivateKey">选择</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="formData.auth_type === 'privateKey'" label="私钥密码" prop="passphrase">
        <el-input
          v-model="formData.passphrase"
          type="password"
          placeholder="如果私钥有密码请输入"
          show-password
        />
      </el-form-item>
      <el-form-item label="描述" prop="desc">
        <el-input
          v-model="formData.desc"
          type="textarea"
          placeholder="备注信息（可选）"
          :rows="2"
        />
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
import { sshItemTypeNoId, sshItemType, SSHAuthType } from '@/types/index.type';
import { addSsh, updateSsh } from '@/DB/index.db';
import { useEntityDialog } from '@/utils/entity-dialog';
import { FolderOpened } from '@element-plus/icons-vue';
import { safeOpenDialog } from '@/utils/utools';

const emit = defineEmits<{ success: [payload: sshItemType] }>();

const {
  dialogVisible,
  id,
  submitting,
  formData,
  setFormRef,
  clearValidate,
  openDialog,
  closeDialog,
  beforeClose,
  confirm,
} = useEntityDialog<sshItemTypeNoId, sshItemType>({
  createInitial: () => ({
    name: '',
    host: '',
    port: 22,
    username: 'root',
    password: '',
    auth_type: 'password' as SSHAuthType,
    private_key: '',
    passphrase: '',
    desc: '',
  }),
  save: (data, currentId) =>
    currentId ? updateSsh({ ...data, id: currentId } as sshItemType) : addSsh(data as sshItemType),
  onSuccess: (saved) => emit('success', saved),
});

const formRules = reactive({
  host: [
    {
      required: true,
      message: '请输入正确的 IPv4 地址',
      pattern:
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      trigger: 'blur',
    },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
      validator: (_rule: any, _value: any, callback: any) => {
        if (formData.auth_type === 'password' && !formData.password) {
          callback(new Error('请输入密码'));
        } else {
          callback();
        }
      },
    },
  ],
  private_key: [
    {
      required: true,
      message: '请选择私钥文件',
      trigger: 'change',
      validator: (_rule: any, _value: any, callback: any) => {
        if (formData.auth_type === 'privateKey' && !formData.private_key) {
          callback(new Error('请选择私钥文件'));
        } else {
          callback();
        }
      },
    },
  ],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  auth_type: [{ required: true, message: '请选择认证方式', trigger: 'change' }],
});

const init = (datas?: sshItemType) => {
  openDialog(datas);
  if (!formData.auth_type) {
    formData.auth_type = 'password';
  }
};

const selectPrivateKey = () => {
  const files = safeOpenDialog({
    title: '选择私钥文件',
    properties: ['openFile'],
    filters: [{ name: 'Private Key Files', extensions: ['pem', 'key', 'pub', '*'] }],
  });
  if (files && files.length > 0) {
    formData.private_key = files[0];
  }
};

watch(
  () => formData.auth_type,
  () => {
    clearValidate(['password', 'private_key']);
  },
);

defineExpose({
  init,
});
</script>
<style lang="scss" scoped></style>
