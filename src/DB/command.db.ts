import { cloneDeep } from 'lodash-es';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-20 16:39:59
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 16:50:54
 * @FilePath: /zr-publish/src/DB/command.db.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
export const commandDoc: DbDoc = {
  _id: 'zr-publish/command',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getCommandDoc = () => getDoc('zr-publish/command');
export const getCommandDocSync = () => getDocSync('zr-publish/command');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getCommandList: () => Promise<string[]> = () => readList<string>('zr-publish/command');

/**
 * @description: 删除项目
 * @param {string} id
 * @return {*}
 */
export const removeCommand = async (str: string) => {
  const list = await getCommandList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item === str);
  if (index === -1) return false;
  datas.splice(index, 1);
  await writeDbList(commandDoc, datas);
  return true;
};

/**
 * @description: 新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const addCommand: (project: string) => Promise<string | Error> = async (project: string) => {
  const params = cloneDeep(project);
  const list = await getCommandList();
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(commandDoc, datas);
  return params;
};

export const updateCommand = async (oldValue: string, nextValue: string) => {
  const list = await getCommandList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item === oldValue);
  if (index === -1) return false;
  datas[index] = nextValue;
  await writeDbList(commandDoc, datas);
  return true;
};
