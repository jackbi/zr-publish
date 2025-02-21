<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-14 16:43:56
 * @FilePath: /zr-publish/src/App.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <DefaultLayout>
    <router-view></router-view>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import DefaultLayout from './components/layout/index.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const enterAction = ref({});
onMounted(() => {
  window.utools.onPluginEnter(async (action) => {
    enterAction.value = action;
    router.push({ name: action.code });
  });
  window.utools.onPluginOut((isKill) => {});
  window.utools.showNotification('hello test');
});
</script>
<style lang="scss" scoped></style>
