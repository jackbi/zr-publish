<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-11 14:18:24
 * @FilePath: /zr-publish/src/Write/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<script lang="ts" setup>
import { watch } from 'vue';

const props = defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});

watch(
  () => props.enterAction,
  (enterAction) => {
    let outputPath;
    try {
      if (enterAction.type === 'over') {
        outputPath = (window as any).services.writeTextFile(enterAction.payload);
      } else if (enterAction.type === 'img') {
        outputPath = (window as any).services.writeImageFile(enterAction.payload);
      }
    } catch (err) {
      // 写入错误弹出通知
      window.utools.showNotification('文件保存出错了！');
    }
    if (outputPath) {
      // 在资源管理器中显示
      window.utools.shellShowItemInFolder(outputPath);
    }
    // 退出插件应用
    // window.utools.outPlugin();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div></div>
</template>
