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
  <div class="app-root">
    <main class="app-root__content">
      <router-view></router-view>
    </main>
    <nav class="bottom-nav bottom-nav--pill">
      <div class="bottom-nav__track" :style="{ '--nav-index': activeIndex }">
        <div class="bottom-nav__indicator"></div>
        <div
          v-for="item in navItems"
          :key="item.name"
          class="bottom-nav__item"
          :class="isActive(item.name)"
          @click="goTo(item.name)"
          role="button"
          tabindex="0"
        >
          <span>{{ item.label }}</span>
        </div>
      </div>
    </nav>
    <div class="fab-menu" :class="{ 'fab-menu--open': fabOpen }" ref="fabMenuRef">
      <button class="fab-menu__main" type="button" @click="toggleFab">
        <el-icon><Operation /></el-icon>
      </button>
      <div class="fab-menu__items">
        <button class="fab-menu__item" type="button" @click="goToDoc" title="使用文档">
          <el-icon><Document /></el-icon>
        </button>
        <button class="fab-menu__item" type="button" @click="goToSettings" title="设置">
          <el-icon><Setting /></el-icon>
        </button>
        <button class="fab-menu__item" type="button" @click="goToDataSync" title="数据同步">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Operation, Setting, Refresh, Document } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const navItems = [
  { name: 'Home', label: '首页' },
  { name: 'Project', label: '项目管理' },
  { name: 'SSh', label: '远程管理' },
  { name: 'Command', label: '指令管理' },
  { name: 'Remote', label: '远程目录' },
];

const goTo = (name: string) => {
  router.push({ name });
};

const activeName = computed(() => route.name);
const isActive = (name: string) => (activeName.value === name ? 'bottom-nav__item--active' : '');
const activeIndex = computed(() => {
  const index = navItems.findIndex((item) => item.name === activeName.value);
  return index === -1 ? 0 : index;
});

const fabOpen = ref(false);
const fabMenuRef = ref<HTMLElement | null>(null);

const toggleFab = () => {
  fabOpen.value = !fabOpen.value;
};

const goToDoc = () => {
  fabOpen.value = false;
  router.push({ name: 'Doc' });
};

const goToSettings = () => {
  fabOpen.value = false;
  router.push({ name: 'Settings' });
};

const goToDataSync = () => {
  fabOpen.value = false;
  router.push({ name: 'DataSync' });
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (fabOpen.value && fabMenuRef.value && !fabMenuRef.value.contains(event.target as Node)) {
    fabOpen.value = false;
  }
};

const enterAction = ref({});
onMounted(() => {
  window.utools.onPluginEnter(async (action) => {
    enterAction.value = action;
    router.push({ name: action.code });
  });
  window.utools.onPluginOut((isKill) => {});
  window.utools.showNotification('hello test');
  
  // 添加点击外部监听
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // 移除点击外部监听
  document.removeEventListener('click', handleClickOutside);
});
</script>
<style lang="scss" scoped></style>
