import { ElMessage, ElMessageBox } from 'element-plus';

export const notifySuccess = (message = '操作成功') => {
  ElMessage.success(message);
};

export const notifyError = (message = '操作失败') => {
  ElMessage.error(message);
};

export const notifyWarning = (message = '警告') => {
  ElMessage.warning(message);
};

export const notifyInfo = (message = '提示') => {
  ElMessage.info(message);
};

export const confirmDelete = (message = '确定要删除吗？') => {
  return ElMessageBox.confirm(message, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
};
