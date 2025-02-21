/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 16:34:18
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-13 17:15:14
 * @FilePath: /zr-publish/src/types/index.type.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
/**
 * @description: 树节点类型
 * @return {*}
 */
export interface treeItemType {
  nodePid?: string;
  nodeId?: string;
  entityId?: string;
  entityType?: string;
  text?: string;
  icon?: string;
  iconCls?: string;
  checked?: boolean;
  expanded?: boolean;
  leaf?: boolean;
  extend: Record<string, any>;
  children?: treeItemType[];
}

export * from './project.type';
export * from './ssh.type';
export * from './task.type';
