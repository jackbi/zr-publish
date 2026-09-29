/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 16:38:55
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 16:46:25
 * @FilePath: /zr-publish/src/types/ssh.type.ts
 * Copyright (c) 2025 wenbin
 */

export type SSHAuthType = 'password' | 'privateKey';

export interface sshItemType {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  auth_type?: SSHAuthType; // 认证方式: 'password' | 'privateKey'
  private_key?: string; // 私钥文件路径
  passphrase?: string; // 私钥密码（如果有）
  desc?: string; // 描述备注
}

export interface sshItemTypeNoId extends Omit<sshItemType, 'id'> {
  id?: string;
}
