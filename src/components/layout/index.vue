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
  <div class="w-full h-full flex">
    <aside
      class="h-full bg-[#545c64] flex-col flex-shrink-0"
      :class="isExpand ? 'w-[220px]' : 'w-[63px]'"
      border-r="1px solid #e5e5e5"
    >
      <header
        class="h-[60px] w-full flex-shrink-0 flex items-center justify-center font-bold text-[24px] text-nowrap text-[#fff] border-b-[1px] border-b-[#999]"
      >
        <span>ZR</span>
        <span class="ml-[10px]" :class="isExpand ? 'inline-block' : ' hidden'">PUBLISH</span>
      </header>
      <nav class="w-full h-[calc(100%-60px)] flex-grow">
        <LayoutSider :is-expand="isExpand"></LayoutSider>
      </nav>
    </aside>
    <main class="w-[calc(100%-220px)] h-full flex-col flex-grow">
      <header class="h-[60px] w-full flex-shrink-0" border-b="1px solid #e5e5e5">
        <LayoutHeader v-model:expand="isExpand"></LayoutHeader>
      </header>
      <main class="w-full h-[calc(100%-60px)] flex-grow box-border p-[15px] bg-[#f5f6fb]">
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
