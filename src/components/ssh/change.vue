<template>
  <el-dialog
    v-model="dialogVisible"
    :title="id ? '编辑SSH链接' : '新增SSH链接'"
    width="60%"
    :before-close="cancel"
    draggable
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="ip地址" prop="host">
        <el-input v-model="formData.host" placeholder="ip地址" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input-number v-model="formData.port" placeholder="端口" />
      </el-form-item>
      <el-form-item label="用户名" :rules="[]" prop="username">
        <el-input v-model="formData.username" placeholder="用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="密码" />
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
import { sshItemTypeNoId, sshItemType } from '@/types/index.type';
import { addSsh, updateSsh } from '@/DB/index.db';
import { ElMessage } from 'element-plus';

const dialogVisible = ref(false);

const id = ref();
const emit = defineEmits(['success']);

const formRef = ref();
const formData = reactive<sshItemTypeNoId>({
  name: '',
  host: '',
  port: 22,
  username: 'root',
  password: '',
});

const formRules = reactive({
  host: [
    {
      required: true,
      message: '请输入ip地址',
      pattern:
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      trigger: 'blur',
    },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
});

const cancel = () => {
  dialogVisible.value = false;
  id.value = undefined;
  formData.name = '';
  formData.host = '';
  formData.port = 22;
  formData.username = 'root';
  formData.password = '';
};

const init = (datas: sshItemType) => {
  if (datas) {
    Object.assign(formData, datas);
    id.value = datas.id;
  }
  dialogVisible.value = true;
};

const confirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      let api: () => Promise<sshItemType | Error>;
      if (id.value) {
        api = () => updateSsh({ ...formData, id: id.value });
      } else {
        api = () => addSsh(formData as sshItemType);
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
