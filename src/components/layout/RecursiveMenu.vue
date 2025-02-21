<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2023-06-26 09:47:08
 * @LastEditors: wenbin
 * @LastEditTime: 2025-01-30 15:31:25
 * @FilePath: /zr-admin-ui/src/components/layout/RecursiveMenu.vue
 * Copyright (C) 2023 wenbin. All rights reserved.
-->
<template>
  <template v-for="item in menuData">
    <template v-if="item.children && item.children.length > 0">
      <el-sub-menu :key="item.nodeId" :teleported="true" :index="item.nodeId.toString()">
        <template #title>
          <i
            v-if="item.extend && item.extend.icon"
            class="menu-icon magusdip-iconfont"
            :class="item.extend.icon"
          ></i>
          <span>{{ item.text }}</span>
        </template>
        <recursive-menu :menu-data="item.children"></recursive-menu>
      </el-sub-menu>
    </template>
    <template v-else>
      <el-menu-item :key="item.nodeId" :index="item.nodeId.toString()">
        <i
          v-if="item.extend && item.extend.icon"
          class="menu-icon magusdip-iconfont"
          :class="item.extend.icon"
        ></i>
        <span>{{ item.text }}</span>
      </el-menu-item>
    </template>
  </template>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  menuData: {
    type: Array as PropType<AnyObject[]>,
    required: true,
  },
});
</script>
