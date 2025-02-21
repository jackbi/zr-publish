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
  <div class="w-full h-full flex items-center justify-between px-[15px] bg-[#fff]">
    <div class="flex items-center">
      <el-button :icon="isExpand ? Fold : Expand" @click="upDateExpand"></el-button>
    </div>
    <div class="flex items-center">
      <div class="text-[16px] text-[#333] mr-[15px]">{{ nowDate }}</div>
      <div class="flex items-center">
        <el-avatar shape="square" :size="30" :src="user?.avatar" />
        <div class="ml-[10px]">{{ user?.nickname }}</div>
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
