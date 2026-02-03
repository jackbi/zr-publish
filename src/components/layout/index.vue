<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-01-23 14:56:05
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-11 17:36:55
 * @FilePath: /zr-publish/src/components/layout/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="app-shell">
    <aside class="app-sidebar" :class="isExpand ? '' : 'app-sidebar--collapsed'">
      <header class="app-brand">
        <div class="app-brand__mark">ZR</div>
        <span class="app-brand__text" :class="isExpand ? 'inline-block' : 'hidden'">PUBLISH</span>
      </header>
      <nav class="app-nav">
        <LayoutSider :is-expand="isExpand"></LayoutSider>
      </nav>
    </aside>
    <main class="app-main">
      <header class="app-header">
        <LayoutHeader v-model:expand="isExpand"></LayoutHeader>
      </header>
      <main class="app-content">
        <slot></slot>
      </main>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';

const LayoutHeader = defineAsyncComponent(() => import('./header.vue'));
const LayoutSider = defineAsyncComponent(() => import('./sider.vue'));

defineOptions({
  name: 'ZrAdminLayout',
});

const isExpand = ref(false);
</script>
<style lang="scss" scoped></style>
