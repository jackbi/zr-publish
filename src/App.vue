<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-14 16:43:56
 * @FilePath: /zr-publish/src/App.vue
 * Copyright (c) 2025 wenbin
-->
<template>
  <!-- 不再 app.use(ElementPlus)（组件 JS 已按需引入），语言包通过 ConfigProvider 提供 -->
  <el-config-provider :locale="zhCn">
    <div class="app-root">
      <main class="app-root__content">
        <router-view></router-view>
      </main>
      <nav class="bottom-nav bottom-nav--pill" aria-label="主导航">
        <div class="bottom-nav__track" :style="{ '--nav-index': activeIndex }">
          <div class="bottom-nav__indicator" aria-hidden="true"></div>
          <button
            v-for="item in navItems"
            :key="item.name"
            type="button"
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': isActiveName(item.name) }"
            :aria-current="isActiveName(item.name) ? 'page' : undefined"
            @click="goTo(item.name)"
          >
            <el-icon aria-hidden="true"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </nav>
      <div class="fab-menu" :class="{ 'fab-menu--open': fabOpen }" ref="fabMenuRef">
        <button
          class="fab-menu__main"
          type="button"
          :aria-expanded="fabOpen"
          aria-label="更多工具"
          title="更多工具"
          @click="toggleFab"
        >
          <el-icon><Operation /></el-icon>
        </button>
        <div class="fab-menu__items">
          <button
            class="fab-menu__item"
            type="button"
            @click="goToDoc"
            title="使用文档"
            aria-label="使用文档"
          >
            <el-icon><Document /></el-icon>
          </button>
          <button
            class="fab-menu__item"
            type="button"
            @click="goToSettings"
            title="设置"
            aria-label="设置"
          >
            <el-icon><Setting /></el-icon>
          </button>
          <button
            class="fab-menu__item"
            type="button"
            @click="goToDataSync"
            title="数据同步"
            aria-label="数据同步"
          >
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Operation,
  Setting,
  Refresh,
  Document,
  HomeFilled,
  Folder,
  Monitor,
  Tools,
  FolderOpened,
} from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

const router = useRouter();
const route = useRoute();

const navItems = [
  { name: 'Home', label: '首页', icon: HomeFilled },
  { name: 'Project', label: '项目管理', icon: Folder },
  { name: 'SSh', label: '远程管理', icon: Monitor },
  { name: 'Command', label: '指令管理', icon: Tools },
  { name: 'Remote', label: '远程目录', icon: FolderOpened },
];

const goTo = (name: string) => {
  router.push({ name });
};

const activeName = computed(() => route.name);
const isActiveName = (name: string) => activeName.value === name;
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

const enterAction = ref<Record<string, unknown>>({});
onMounted(() => {
  window.utools.onPluginEnter(async (action) => {
    enterAction.value = action;
    // 只跳转已注册的路由，避免 action.code 与路由名不一致时抛未捕获异常
    const target = router.getRoutes().find((item) => item.name === action.code);
    if (target) {
      router.push({ name: action.code });
    }
  });

  // 添加点击外部监听
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // 移除点击外部监听
  document.removeEventListener('click', handleClickOutside);
});
</script>
<style lang="scss" scoped></style>
