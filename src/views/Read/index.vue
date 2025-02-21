<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});

const filePath = ref('');
const fileContent = ref('');
const error = ref('');

const handleOpenDialog = () => {
  // 通过 uTools 的 api 打开文件选择窗口
  const files = (window as any).utools.showOpenDialog({
    title: '选择文件',
    properties: ['openFile'],
  });
  if (!files) return;
  const _filePath = files[0];
  filePath.value = _filePath;
  try {
    const content = (window as any).services.readFile(_filePath);
    fileContent.value = content;
  } catch (err) {
    error.value = err.message;
    fileContent.value = '';
  }
};

watch(
  () => props.enterAction,
  (enterAction) => {
    if (enterAction.type === 'files') {
      // 匹配文件进入，直接读取文件
      const _filePath = enterAction.payload[0].path;

      filePath.value = _filePath;
      try {
        const content = (window as any).services.readFile(_filePath);
        fileContent.value = content;
      } catch (err) {
        error.value = err.message;
        fileContent.value = '';
      }
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div class="read">
    <button @click="handleOpenDialog">选择文件</button>
    <div class="read-file">{{ filePath }}</div>
    <template v-if="!!fileContent">
      <pre>
        {{ fileContent }}
      </pre>
    </template>
    <template v-if="!!error">
      <div class="read-error">
        {{ error }}
      </div>
    </template>
  </div>
</template>

<style>
.read {
  padding: 20px;
  box-sizing: border-box;
}

.read > pre {
  background-color: #fff;
  width: 100%;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 7px;
  margin-top: 20px;
  white-space: break-spaces;
}

.read-file {
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
}

.read-error {
  color: red;
}

@media (prefers-color-scheme: dark) {
  .read > pre {
    background-color: #424242;
  }
}
</style>
