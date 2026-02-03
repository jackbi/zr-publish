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
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import router from '@/router/index.ts';
import 'element-plus/dist/index.css';

import './main.css';
import '@/assets/index.scss';
import App from './App.vue';
createApp(App)
  .use(ElementPlus, {
    locale: zhCn,
    size: 'default',
  })
  .use(router)
  .mount('#app');
