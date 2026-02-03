<template>
  <el-scrollbar height="100%">
    <el-menu
      class="layout-menu"
      :collapse="!isExpand"
      :default-active="$route.name as string || ''"
      background-color="#121826"
      text-color="#cbd5f5"
      active-text-color="#ffffff"
      @select="selectMenu"
    >
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
      <el-menu-item index="Settings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </el-menu-item>
    </el-menu>
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { HomeFilled, Folder, Connection, MessageBox, Box, Setting } from '@element-plus/icons-vue';
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
