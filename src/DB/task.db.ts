/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 10:11:37
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-13 17:36:29
 * @FilePath: /zr-publish/src/DB/task.db.ts
 * Copyright (c) 2025 wenbin
 */
import { TaskItemType } from '@/types/index.type';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

export const taskDoc: DbDoc = {
  _id: 'zr-publish/task',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getTaskDoc = () => getDoc('zr-publish/task');
export const getTaskDocSync = () => getDocSync('zr-publish/task');

/**
 * @description: 获取任务列表
 * @param {*} return
 * @return {*}
 */
export const getTaskList: () => Promise<TaskItemType[]> = () =>
  readList<TaskItemType>('zr-publish/task');

/**
 * @description: 删除任务
 * @param {string} id
 * @return {*}
 */
export const removeTask = async (id: string) => {
  const list = await getTaskList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('该任务已不存在，请刷新后重试');
  datas.splice(index, 1);
  await writeDbList(taskDoc, datas);
  return true;
};

/**
 * @description: 新增任务
 * @param {TaskItemType} task
 * @return {*}
 */
export const addTask: (task: TaskItemType) => Promise<TaskItemType> = async (
  task: TaskItemType,
) => {
  const params = cloneDeep(task);
  params.id = nanoid();
  const list = await getTaskList();
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(taskDoc, datas);
  return params;
};

/**
 * @description: 更新任务
 * @param {TaskItemType} task
 * @return {*}
 */
export const updateTask: (task: TaskItemType) => Promise<TaskItemType> = async (
  task: TaskItemType,
) => {
  const list = await getTaskList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === task.id);
  if (index === -1) throw new Error('该任务已不存在，请刷新后重试');
  datas[index] = task;
  await writeDbList(taskDoc, datas);
  return task;
};

export const saveTaskList = async (list: TaskItemType[]) => {
  const datas = cloneDeep(list);
  await writeDbList(taskDoc, datas);
  return true;
};
