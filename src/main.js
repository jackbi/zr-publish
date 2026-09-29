/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2026-01-30 17:26:38
 * @FilePath: /zr-publish/src/main.js
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import { createApp } from 'vue';
import router from '@/router/index.ts';
import { recoverPublishState } from '@/services/publish-manager';
// 已确定：Element Plus 只做「组件 JS 按需」，样式一律使用全量 CSS，不做按需样式。
// 好处是绝不可能出现样式缺失，新增组件时也无需再补 theme-chalk 样式。
import 'element-plus/dist/index.css';

import './main.css';
import '@/assets/index.scss';
import App from './App.vue';
createApp(App).use(router).mount('#app');

// 启动时收拾上一次运行残留的发布状态（不自动续跑，只把中断状态写明）
recoverPublishState().catch((error) => {
  console.error('[zr-publish] 恢复发布状态失败:', error);
});
