import { reactive, ref } from 'vue';
import { notifyError, notifySuccess } from '@/utils/feedback';

type AnyRecord = Record<string, any>;

export interface EntityDialogOptions<T extends AnyRecord, S> {
  /** 表单初始值（同时用于重置） */
  createInitial: () => T;
  /** 保存动作：id 存在为编辑，否则为新增；失败请直接 throw */
  save: (data: T, id?: string) => Promise<S>;
  /** 保存成功后的副作用（例如 emit 给父组件） */
  onSuccess?: (saved: S) => void;
  successMessage?: string;
  /** 自定义失败文案（save 抛出的 Error.message 优先） */
  errorMessage?: string;
  /** 关闭时的额外清理（例如清空只有本表单才有的子状态） */
  onClose?: () => void;
}

/**
 * 实体编辑弹窗的公共行为：打开/重置、清校验、防重复提交、统一错误提示。
 * 5 个 change.vue 之前各自复制了这套逻辑，已经漂移出「有的防重复提交、有的不清校验」
 * 等差异，这里统一收口。
 */
export const useEntityDialog = <T extends AnyRecord, S = unknown>(
  options: EntityDialogOptions<T, S>,
) => {
  const {
    createInitial,
    save,
    onSuccess,
    successMessage,
    errorMessage = '保存失败',
    onClose,
  } = options;

  const dialogVisible = ref(false);
  const id = ref<string | undefined>(undefined);
  const submitting = ref(false);
  const formData = reactive(createInitial()) as T;

  let formRef: {
    validate?: (callback: (valid: boolean) => void) => void;
    clearValidate?: (fields?: string[]) => void;
  } | null = null;

  /**
   * 供模板 `:ref="setFormRef"` 使用。
   * 用函数式 ref 而不是 `ref="formRef"`：后者在 <script setup> 里只发生写入，
   * 会被 noUnusedLocals 判定为「声明未读取」。
   */
  const setFormRef = (instance: unknown) => {
    formRef = instance as typeof formRef;
  };

  const clearValidate = (fields?: string[]) => {
    formRef?.clearValidate?.(fields);
  };

  const resetDialog = () => {
    Object.assign(formData, createInitial());
    id.value = undefined;
    dialogVisible.value = false;
  };

  /** 关闭弹窗：清掉上一次的校验红字，避免重开时残留 */
  const closeDialog = () => {
    clearValidate();
    onClose?.();
    resetDialog();
  };

  const beforeClose = (done: () => void) => {
    closeDialog();
    done();
  };

  /**
   * 打开弹窗。
   * `id` 只用于区分新增/编辑，不会混进 formData，避免破坏 *NoId 契约与脏值残留。
   */
  const openDialog = (data?: Partial<T> & { id?: string }) => {
    const { id: nextId, ...rest } = data || {};
    Object.assign(formData, createInitial(), rest);
    id.value = nextId;
    dialogVisible.value = true;
  };

  const confirm = () => {
    if (submitting.value) return;
    formRef?.validate?.(async (valid: boolean) => {
      if (!valid) return;
      submitting.value = true;
      try {
        const saved = await save(formData, id.value);
        closeDialog();
        notifySuccess(successMessage);
        onSuccess?.(saved);
      } catch (error) {
        notifyError(error instanceof Error ? error.message : errorMessage);
      } finally {
        submitting.value = false;
      }
    });
  };

  return {
    dialogVisible,
    id,
    submitting,
    formData,
    setFormRef,
    clearValidate,
    resetDialog,
    openDialog,
    closeDialog,
    beforeClose,
    confirm,
  };
};
