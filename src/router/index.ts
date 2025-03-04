/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2023-10-31 09:26:04
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:31:17
 * @FilePath: /zr-publish/src/router/index.ts
 * Copyright (C) 2023 wenbin. All rights reserved.
 */
/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2022-04-18 15:16:58
 * @LastEditors: wenbin
 * @LastEditTime: 2023-10-08 09:30:14
 * @FilePath: /new-energy-view/src/router/index.ts
 * Copyright (C) 2022 wenbin. All rights reserved.
 */
import { createRouter, createWebHistory } from 'vue-router';

// const files: AnyObject = import.meta.globEager('./routers/*.js');
// /*  */
// let routers: AnyObject[] = [];

// for (const key in files) {
//   routers = [...routers, ...files[key].default];
// }

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: {
      title: '首页',
    },
    children: [],
  },
  {
    path: '/doc',
    name: 'Doc',
    component: () => import('@/views/Doc/index.vue'),
    meta: {
      title: '使用说明',
    },
    children: [],
  },
  {
    path: '/project',
    name: 'Project',
    component: () => import('@/views/Project/index.vue'),
    meta: {
      title: '项目管理',
    },
    children: [],
  },
  {
    path: '/ssh',
    name: 'SSh',
    component: () => import('@/views/SSh/index.vue'),
    meta: {
      title: 'SSh管理',
    },
    children: [],
  },
  {
    path: '/command',
    name: 'Command',
    component: () => import('@/views/Command/index.vue'),
    meta: {
      title: '指令管理',
    },
    children: [],
  },
  {
    path: '/remote',
    name: 'Remote',
    component: () => import('@/views/Remote/index.vue'),
    meta: {
      title: '远程路径',
    },
    children: [],
  },
  {
    path: '/',
    redirect: '/doc',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
