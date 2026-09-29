/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2026-02-02 10:20:08
 * @LastEditors: wenbin
 * @LastEditTime: 2026-02-02 10:20:08
 * @FilePath: /zr-publish/src/types/task-group.type.ts
 * Copyright (c) 2026 wenbin
 */
export interface TaskGroupItemType {
  id: string;
  name: string;
  desc?: string;
}

export interface TaskGroupItemTypeNoId extends Omit<TaskGroupItemType, 'id'> {
  id?: string;
}
