import { cloneDeep } from 'lodash-es';

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
export const getCommandDoc = () => window.utools.db.promises.get('zr-publish/command');
export const getCommandDocSync = () => window.utools.db.get('zr-publish/command');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getCommandList: () => Promise<string[]> = () => {
  return new Promise((resolve, reject) => {
    getCommandDoc()
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
export const removeCommand = (str: string) => {
  const docs = getCommandDocSync() || commandDoc;
  return new Promise((resolve, reject) => {
    getCommandList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        const index = datas.findIndex((item) => item === str);
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
export const addCommand: (project: string) => Promise<string | Error> = (project: string) => {
  const params = cloneDeep(project);
  const doc = getCommandDocSync() || commandDoc;
  return new Promise((resolve, reject) => {
    getCommandList().then((res) => {
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
