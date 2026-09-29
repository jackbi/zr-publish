<!--
  * 通用「字符串主键实体」编辑弹窗：指令 / 远程路径 共用。
  * 传入原值即为编辑（把原值同时作为 id 交给 openDialog），否则为新增。
-->
<template>
  <el-dialog
    modal-class="current-dialog"
    v-model="dialogVisible"
    :title="dialogTitle"
    width="60%"
    :before-close="beforeClose"
    draggable
  >
    <el-form :ref="setFormRef" :model="formData" :rules="formRules" label-width="auto" status-icon>
      <el-form-item :label="config.columnLabel" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          resize="none"
          :rows="6"
          :placeholder="config.placeholder"
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
import { computed, reactive } from 'vue';
import { addCommand, addRemote, updateCommand, updateRemote } from '@/DB/index.db';
import { useEntityDialog } from '@/utils/entity-dialog';

type StringListKind = 'command' | 'remote';

const props = defineProps<{ kind: StringListKind }>();
const emit = defineEmits<{ success: [payload: string] }>();

const configs = {
  command: { name: '指令', columnLabel: '指令内容', placeholder: '请输入指令内容' },
  remote: { name: '远程路径', columnLabel: '远程路径', placeholder: '请输入远程路径' },
} as const;

const config = computed(() => configs[props.kind]);

const api = computed(() =>
  props.kind === 'command'
    ? { add: addCommand, update: updateCommand }
    : { add: addRemote, update: updateRemote },
);

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
} = useEntityDialog<{ content: string }, string>({
  createInitial: () => ({ content: '' }),
  save: (data, currentId) =>
    currentId
      ? api.value.update(currentId, data.content).then(() => data.content)
      : api.value.add(data.content),
  onSuccess: (saved) => emit('success', saved),
});

const dialogTitle = computed(() =>
  id.value ? `编辑${config.value.name}` : `新增${config.value.name}`,
);

const formRules = reactive({
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
});

/**
 * 传入原值即为编辑。
 * 这类实体以字符串本身为主键，因此把原值同时作为 id 传给 openDialog，
 * 否则 id 恒为空，编辑会走成新增并产生重复记录。
 */
const init = (value?: string) => {
  openDialog(value ? { id: value, content: value } : undefined);
};

defineExpose({ init });
</script>
<style lang="scss" scoped></style>
