/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2026-02-02 10:20:08
 * @LastEditors: wenbin
 * @LastEditTime: 2026-02-02 10:20:08
 * @FilePath: /zr-publish/src/DB/task-group.db.ts
 * Copyright (C) 2026 wenbin. All rights reserved.
 */
import { TaskGroupItemType } from '@/types/index.type';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

export const taskGroupDoc: DbDoc = {
  _id: 'zr-publish/task-group',
  datas: '',
};

export const getTaskGroupDoc = () => getDoc('zr-publish/task-group');
export const getTaskGroupDocSync = () => getDocSync('zr-publish/task-group');

export const getTaskGroupList: () => Promise<TaskGroupItemType[]> = () =>
  readList<TaskGroupItemType>('zr-publish/task-group');

export const removeTaskGroup = async (id: string) => {
  const list = await getTaskGroupList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === id);
  if (index === -1) return false;
  datas.splice(index, 1);
  await writeDbList(taskGroupDoc, datas);
  return true;
};

export const addTaskGroup: (group: TaskGroupItemType) => Promise<TaskGroupItemType | Error> = async (
  group: TaskGroupItemType,
) => {
  const params = cloneDeep(group);
  params.id = nanoid();
  const list = await getTaskGroupList();
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(taskGroupDoc, datas);
  return params;
};

export const updateTaskGroup: (group: TaskGroupItemType) => Promise<TaskGroupItemType | Error> = async (
  group: TaskGroupItemType,
) => {
  const list = await getTaskGroupList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === group.id);
  if (index === -1) return new Error('任务组不存在');
  datas[index] = group;
  await writeDbList(taskGroupDoc, datas);
  return group;
};
