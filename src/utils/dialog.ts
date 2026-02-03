import { reactive, ref } from 'vue';

export const useDialogForm = <T extends Record<string, any>>(createInitial: () => T) => {
  const dialogVisible = ref(false);
  const id = ref<any>();
  const formData = reactive(createInitial()) as T;

  const resetDialog = () => {
    Object.assign(formData, createInitial());
    id.value = undefined;
    dialogVisible.value = false;
  };

  const openDialog = (data?: Partial<T> & { id?: any }) => {
    Object.assign(formData, createInitial(), data || {});
    id.value = data?.id;
    dialogVisible.value = true;
  };

  return {
    dialogVisible,
    id,
    formData,
    resetDialog,
    openDialog,
  };
};
