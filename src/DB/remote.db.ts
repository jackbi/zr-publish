import { cloneDeep } from 'lodash-es';

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
export const getRemoteDoc = () => window.utools.db.promises.get('zr-publish/remote');
export const getRemoteDocSync = () => window.utools.db.get('zr-publish/remote');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getRemoteList: () => Promise<string[]> = () => {
  return new Promise((resolve, reject) => {
    getRemoteDoc()
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
export const removeRemote = (str: string) => {
  const docs = getRemoteDocSync() || remoteDoc;
  return new Promise((resolve, reject) => {
    getRemoteList().then((res) => {
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
export const addRemote: (project: string) => Promise<string | Error> = (project: string) => {
  const params = cloneDeep(project);
  const doc = getRemoteDocSync() || remoteDoc;
  return new Promise((resolve, reject) => {
    getRemoteList().then((res) => {
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
