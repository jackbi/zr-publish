/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 10:11:37
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-13 17:36:29
 * @FilePath: /zr-publish/src/DB/task.db.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import { TaskItemType } from '@/types/index.type';
import { cloneDeep } from 'lodash-es';
import { nanoid } from 'nanoid';

export const taskDoc: DbDoc = {
  _id: 'zr-publish/task',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getTaskDoc = () => window.utools.db.promises.get('zr-publish/task');
export const getTaskDocSync = () => window.utools.db.get('zr-publish/task');

/**
 * @description: 获取任务列表
 * @param {*} return
 * @return {*}
 */
export const getTaskList: () => Promise<TaskItemType[]> = () => {
  return new Promise((resolve, reject) => {
    getTaskDoc()
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
 * @description: 删除任务
 * @param {string} id
 * @return {*}
 */
export const removeTask = (id: string) => {
  const docs = getTaskDocSync() || taskDoc;
  return new Promise((resolve, reject) => {
    getTaskList().then((res) => {
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
 * @description: 新增任务
 * @param {TaskItemType} task
 * @return {*}
 */
export const addTask: (task: TaskItemType) => Promise<TaskItemType | Error> = (
  task: TaskItemType,
) => {
  const params = cloneDeep(task);
  const doc = getTaskDocSync() || taskDoc;
  params.id = nanoid();
  return new Promise((resolve, reject) => {
    getTaskList().then((res) => {
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
 * @description: 更新任务
 * @param {TaskItemType} task
 * @return {*}
 */
export const updateTask: (task: TaskItemType) => Promise<TaskItemType | Error> = (
  task: TaskItemType,
) => {
  const docs = getTaskDocSync() || taskDoc;
  return new Promise((resolve, reject) => {
    getTaskList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        const index = datas.findIndex((item) => item.id === task.id);
        if (index !== -1) {
          // datas.splice(index, 1, project);
          datas[index] = task;
          // projectDoc.datas = JSON.stringify(datas);
          if (!docs) return;
          docs.datas = JSON.stringify(datas);
          window.utools.db.promises
            .put(docs)
            .then((res) => {
              if (res.ok) {
                resolve(task);
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
