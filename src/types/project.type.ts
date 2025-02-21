/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 10:22:55
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 14:11:43
 * @FilePath: /zr-publish/src/types/project.type.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
export interface ProjectItemType {
  id: string;
  name: string;
  path: string;
  package_name: string;
  version?: string;
  desc?: string;
}

export interface ProjectItemTypeNoId extends Omit<ProjectItemType, 'id'> {
  id?: string;
}
