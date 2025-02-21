/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-13 16:45:33
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-14 11:50:21
 * @FilePath: /zr-publish/src/types/task.type.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
export interface TaskItemType {
  id: string;
  name: string;
  project_id: string;
  project_name: string;
  ssh_ids: string[];
  ssh_names: string[];
  remote_path: string;
  local_path: string;
  remote_command?: string;
  local_command?: string;
  desc?: string;
}

export interface TaskItemTypeNoId extends Omit<TaskItemType, 'id'> {
  id?: string;
}
