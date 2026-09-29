/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 10:07:45
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 16:07:07
 * @FilePath: /zr-publish/src/DB/project.db.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import { ProjectItemType } from '@/types/index.type';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
import { getDoc, getDocSync, readList, writeDbList, DbDoc } from './helpers';

export const projectDoc: DbDoc = {
  _id: 'zr-publish/project',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getProjectDoc = () => getDoc('zr-publish/project');
export const getProjectDocSync = () => getDocSync('zr-publish/project');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getProjectList: () => Promise<ProjectItemType[]> = () =>
  readList<ProjectItemType>('zr-publish/project');

/**
 * @description: 删除项目
 * @param {string} id
 * @return {*}
 */
export const removeProject = async (id: string) => {
  const list = await getProjectList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('该项目已不存在，请刷新后重试');
  datas.splice(index, 1);
  await writeDbList(projectDoc, datas);
  return true;
};

/**
 * @description: 新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const addProject: (project: ProjectItemType) => Promise<ProjectItemType> = async (
  project: ProjectItemType,
) => {
  const params = cloneDeep(project);
  params.id = nanoid();
  const list = await getProjectList();
  const datas = cloneDeep(list);
  datas.push(params);
  await writeDbList(projectDoc, datas);
  return params;
};

/**
 * @description: 批量新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const batchAddProject: (project: ProjectItemType[]) => Promise<boolean> = async (
  projects: ProjectItemType[],
) => {
  const params = cloneDeep(projects);
  params.forEach((el) => {
    el.id = nanoid();
  });
  const list = await getProjectList();
  const datas = [...params, ...cloneDeep(list)];
  await writeDbList(projectDoc, datas);
  return true;
};

/**
 * @description: 更新项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const updateProject: (project: ProjectItemType) => Promise<ProjectItemType> = async (
  project: ProjectItemType,
) => {
  const list = await getProjectList();
  const datas = cloneDeep(list);
  const index = datas.findIndex((item) => item.id === project.id);
  if (index === -1) throw new Error('该项目已不存在，请刷新后重试');
  datas[index] = project;
  await writeDbList(projectDoc, datas);
  return project;
};

export const batchUpdateProjects: (projects: ProjectItemType[]) => Promise<boolean> = async (
  projects: ProjectItemType[],
) => {
  const list = await getProjectList();
  const datas = cloneDeep(list);

  projects.forEach((project) => {
    const index = datas.findIndex((item) => item.id === project.id);
    if (index !== -1) {
      datas[index] = project;
    }
  });

  await writeDbList(projectDoc, datas);
  return true;
};
