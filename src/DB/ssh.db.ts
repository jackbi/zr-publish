/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 10:07:53
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 17:41:16
 * @FilePath: /zr-publish/src/DB/ssh.db.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import { sshItemType } from '@/types/index.type';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import { encrypt } from '@/utils/CryptoJS';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

export const sshDoc: DbDoc = {
  _id: 'zr-publish/ssh',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getSshDoc = () => getDoc('zr-publish/ssh');
export const getSshDocSync = () => getDocSync('zr-publish/ssh');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getSshList: () => Promise<sshItemType[]> = () => readList<sshItemType>('zr-publish/ssh');

/**
 * @description: 删除项目
 * @param {string} id
 * @return {*}
 */
export const removeSsh = async (id: string) => {
  const list = await getSshList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === id);
  if (index === -1) return false;
  datas.splice(index, 1);
  await writeDbList(sshDoc, datas);
  return true;
};

/**
 * @description: 新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const addSsh: (project: sshItemType) => Promise<sshItemType | Error> = async (
  project: sshItemType,
) => {
  const params = cloneDeep(project);
  params.id = nanoid();
  params.password = encrypt(params.password);
  const list = await getSshList();
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(sshDoc, datas);
  return params;
};

/**
 * @description: 更新项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const updateSsh: (project: sshItemType) => Promise<sshItemType | Error> = async (
  project: sshItemType,
) => {
  const list = await getSshList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === project.id);
  if (index === -1) return new Error('项目不存在');
  const next = cloneDeep(project);
  if (next.password) {
    next.password = encrypt(next.password);
  }
  datas[index] = next;
  await writeDbList(sshDoc, datas);
  return next;
};
