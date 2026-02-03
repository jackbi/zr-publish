<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-01-23 16:42:16
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-11 17:01:05
 * @FilePath: /zr-publish/src/components/layout/header.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="w-full h-full flex items-center justify-between">
    <div class="flex items-center gap-3">
      <el-button text class="layout-icon" :icon="isExpand ? Fold : Expand" @click="upDateExpand"></el-button>
      <div>
        <div class="text-[15px] font-semibold text-[#1f2430]">ZR Publish 控制台</div>
        <div class="text-[12px] text-[#6b7280]">本地发布与远程部署管理</div>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div class="pill">{{ nowDate }}</div>
      <div class="flex items-center">
        <el-avatar shape="square" :size="34" :src="user?.avatar" />
        <div class="ml-[10px] text-[14px] text-[#1f2430]">{{ user?.nickname }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Fold, Expand } from '@element-plus/icons-vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { dayjs } from 'element-plus';
defineOptions({
  name: 'LayoutHeader',
});

defineProps({
  userInfo: {
    type: Object,
    default: () => ({}),
  },
});

const isExpand = defineModel('expand', { type: Boolean });

const nowDate = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'));

const user = utools.getUser();

const updateTime = () => {
  nowDate.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
};

const upDateExpand = () => {
  isExpand.value = !isExpand.value;
};

onMounted(() => {
  updateTime(); // 立即更新一次
  const timer = setInterval(updateTime, 1000);

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer);
  });
});
</script>
<style lang="scss" scoped></style>
