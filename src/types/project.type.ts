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
export type ProjectType = 'vue' | 'react' | 'node' | 'java' | 'python' | 'go' | 'unknown';

export type GitStatus =
  | 'up-to-date'
  | 'ahead'
  | 'behind'
  | 'diverged'
  | 'no-remote'
  | 'not-git'
  | 'unknown'
  | 'error';

export interface GitInfo {
  isGit: boolean;
  branch: string;
  remote: string;
  remoteUrl: string;
  status: GitStatus;
  ahead: number;
  behind: number;
  hasChanges: boolean;
  error?: string;
}

export interface ProjectItemType {
  id: string;
  name: string;
  path: string;
  package_name: string;
  version?: string;
  desc?: string;
  project_type?: ProjectType;
  git_info?: GitInfo;
}

export interface ProjectItemTypeNoId extends Omit<ProjectItemType, 'id'> {
  id?: string;
}
