<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-01-30 15:32:29
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:30:48
 * @FilePath: /zr-publish/src/components/layout/sider.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-scrollbar height="100%">
    <el-menu
      :collapse="!isExpand"
      :default-active="$route.name as string || ''"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      @select="selectMenu"
    >
      <el-menu-item index="Doc">
        <el-icon><Document /></el-icon>
        <span>使用说明</span>
      </el-menu-item>
      <el-menu-item index="Home">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="Project">
        <el-icon><Folder /></el-icon>
        <span>项目管理</span>
      </el-menu-item>
      <el-menu-item index="SSh">
        <el-icon><Connection /></el-icon>
        <span>远程管理</span>
      </el-menu-item>
      <el-menu-item index="Command">
        <el-icon><MessageBox /></el-icon>
        <span>指令管理</span>
      </el-menu-item>
      <el-menu-item index="Remote">
        <el-icon><Box /></el-icon>
        <span>远程目录</span>
      </el-menu-item>
    </el-menu>
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { HomeFilled, Folder, Connection, MessageBox, Document, Box } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
defineOptions({
  name: 'LayoutSider',
});

defineProps({
  isExpand: {
    type: Boolean,
    default: true,
  },
});

const selectMenu = (index: string) => {
  router.push({ name: index });
};
</script>
<style lang="scss" scoped></style>
