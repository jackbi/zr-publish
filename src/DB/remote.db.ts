import { cloneDeep } from 'lodash-es';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-20 16:39:59
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:25:17
 * @FilePath: /zr-publish/src/DB/remote.db.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
export const remoteDoc: DbDoc = {
  _id: 'zr-publish/remote',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getRemoteDoc = () => getDoc('zr-publish/remote');
export const getRemoteDocSync = () => getDocSync('zr-publish/remote');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getRemoteList: () => Promise<string[]> = () => readList<string>('zr-publish/remote');

/**
 * @description: 删除远程路径
 * @param {string} str
 * @return {*}
 */
export const removeRemote = async (str: string) => {
  const list = await getRemoteList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item === str);
  if (index === -1) throw new Error('该远程路径已不存在，请刷新后重试');
  datas.splice(index, 1);
  await writeDbList(remoteDoc, datas);
  return true;
};

/**
 * @description: 新增远程路径（同名视为重复，直接拒绝）
 * @param {string} project
 * @return {*}
 */
export const addRemote: (project: string) => Promise<string> = async (project: string) => {
  const params = cloneDeep(project);
  const list = await getRemoteList();
  if (list.includes(params)) throw new Error('该远程路径已存在');
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(remoteDoc, datas);
  return params;
};

export const updateRemote = async (oldValue: string, nextValue: string) => {
  const list = await getRemoteList();
  const index = list.findIndex((item) => item === oldValue);
  if (index === -1) throw new Error('该远程路径已不存在，请刷新后重试');
  if (nextValue !== oldValue && list.includes(nextValue)) throw new Error('该远程路径已存在');
  const datas = cloneDeep(list);
  datas[index] = nextValue;
  await writeDbList(remoteDoc, datas);
  return true;
};
