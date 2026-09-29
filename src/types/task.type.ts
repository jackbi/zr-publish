/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-13 16:45:33
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 15:22:45
 * @FilePath: /zr-publish/src/types/task.type.ts
 * Copyright (c) 2025 wenbin
 */
export interface TaskItemType {
  id: string;
  name: string;
  group_id?: string;
  project_id: string;
  project_name: string;
  ssh_ids: string[];
  ssh_names: string[];
  remote_path: string;
  local_path: string;
  remote_command?: string;
  desc?: string;
  is_removed?: boolean;
  is_save?: boolean;
  exclude_paths?: string[];
}

export interface TaskItemTypeNoId extends Omit<TaskItemType, 'id'> {
  id?: string;
}

export interface TaskGroupView {
  id: string;
  name: string;
  allTasks: TaskItemType[];
  tasks: TaskItemType[];
  totalCount: number;
  isUngrouped?: boolean;
}
