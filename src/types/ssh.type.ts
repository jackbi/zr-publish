/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 16:38:55
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 16:46:25
 * @FilePath: /zr-publish/src/types/ssh.type.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
export interface sshItemType {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface sshItemTypeNoId extends Omit<sshItemType, 'id'> {
  id?: string;
}
