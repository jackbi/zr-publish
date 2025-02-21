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

export const projectDoc: DbDoc = {
  _id: 'zr-publish/project',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getProjectDoc = () => window.utools.db.promises.get('zr-publish/project');
export const getProjectDocSync = () => window.utools.db.get('zr-publish/project');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getProjectList: () => Promise<ProjectItemType[]> = () => {
  return new Promise((resolve, reject) => {
    getProjectDoc()
      .then((res) => {
        if (res) {
          resolve(res.datas ? JSON.parse(res.datas) : []);
        } else {
          resolve([]);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * @description: 删除项目
 * @param {string} id
 * @return {*}
 */
export const removeProject = (id: string) => {
  const docs = getProjectDocSync() || projectDoc;
  return new Promise((resolve, reject) => {
    getProjectList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        const index = datas.findIndex((item) => item.id === id);
        if (index !== -1) {
          datas.splice(index, 1);
          docs.datas = JSON.stringify(datas);
          window.utools.db.promises
            .put(docs)
            .then((res) => {
              if (res.ok) {
                resolve(true);
                docs._rev = res.rev || '';
              } else {
                reject(res);
              }
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          resolve(false);
        }
      }
    });
  });
};

/**
 * @description: 新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const addProject: (project: ProjectItemType) => Promise<ProjectItemType | Error> = (
  project: ProjectItemType,
) => {
  const params = cloneDeep(project);
  const doc = getProjectDocSync() || projectDoc;
  params.id = nanoid();
  return new Promise((resolve, reject) => {
    getProjectList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        datas.push(params);
        doc.datas = JSON.stringify(datas);
        window.utools.db.promises
          .put(doc)
          .then((res) => {
            if (res.ok) {
              resolve(params);
              doc._rev = res.rev || '';
            }
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        doc.datas = JSON.stringify([params]);
        window.utools.db.promises
          .put(doc)
          .then((res) => {
            if (res.ok) {
              resolve(params);
              doc._rev = res.rev || '';
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  });
};

/**
 * @description: 新增项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const batchAddProject: (project: ProjectItemType[]) => Promise<boolean | Error> = (
  projects: ProjectItemType[],
) => {
  const params = cloneDeep(projects);
  const doc = getProjectDocSync() || projectDoc;
  params.forEach((el) => (el.id = nanoid()));
  return new Promise((resolve, reject) => {
    getProjectList().then((res) => {
      if (res) {
        let datas = cloneDeep(res);
        datas = [...params, ...datas];
        doc.datas = JSON.stringify(datas);
        window.utools.db.promises
          .put(doc)
          .then((res) => {
            if (res.ok) {
              resolve(true);
              doc._rev = res.rev || '';
            }
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        doc.datas = JSON.stringify(params);
        window.utools.db.promises
          .put(doc)
          .then((res) => {
            if (res.ok) {
              resolve(true);
              doc._rev = res.rev || '';
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  });
};

/**
 * @description: 更新项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const updateProject: (project: ProjectItemType) => Promise<ProjectItemType | Error> = (
  project: ProjectItemType,
) => {
  const docs = getProjectDocSync() || projectDoc;
  return new Promise((resolve, reject) => {
    getProjectList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        const index = datas.findIndex((item) => item.id === project.id);
        if (index !== -1) {
          // datas.splice(index, 1, project);
          datas[index] = project;
          // projectDoc.datas = JSON.stringify(datas);
          if (!docs) return;
          docs.datas = JSON.stringify(datas);
          window.utools.db.promises
            .put(docs)
            .then((res) => {
              if (res.ok) {
                resolve(project);
                docs._rev = res.rev || '';
              } else {
                reject(res);
              }
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          resolve(new Error('项目不存在'));
        }
      }
    });
  });
};
