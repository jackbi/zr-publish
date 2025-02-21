import { treeItemType } from '@/types/index.type';

/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2021-12-07 15:17:07
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 10:02:46
 * @FilePath: /zr-publish/src/mock/menu.ts
 * Copyright (C) 2021 wenbin. All rights reserved.
 */

export const getMenu: { code: number; message: string; data: treeItemType[] } = {
  code: 2000,
  message: '',
  data: [
    {
      nodeId: 'Home',
      nodePid: '',
      entityId: '',
      entityType: '',
      icon: 'magusdipjiankong-',
      text: '首页',
      leaf: false,
      checked: false,
      expanded: false,
      extend: {
        appUri: '',
        uri: '',
        uriType: '',
        params: '',
      },
    },
    {
      nodeId: 'Project',
      nodePid: '',
      entityId: '',
      entityType: '',
      icon: 'magusdipjiankong-',
      text: '项目管理',
      leaf: false,
      checked: false,
      expanded: false,
      extend: {
        appUri: '',
        uri: '',
        uriType: '',
        params: '',
      },
    },
    {
      nodeId: 'SSh',
      nodePid: '',
      entityId: '',
      entityType: '',
      icon: 'magusdipjiankong-',
      text: 'SSH管理',
      leaf: false,
      checked: false,
      expanded: false,
      extend: {
        appUri: '',
        uri: '',
        uriType: '',
        params: '',
      },
    },
  ],
};
