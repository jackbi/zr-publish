<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-25 09:43:04
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-25 10:08:09
 * @FilePath: /zr-publish/src/views/Doc/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="w-full h-full">
    <el-scrollbar height="100%">
      <div v-html="doc"></div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { marked } from 'marked';

defineOptions({
  name: 'DocIndex',
});

const doc = marked.parse((window as any).services.readDoc());
</script>
<style lang="scss" scoped></style>
