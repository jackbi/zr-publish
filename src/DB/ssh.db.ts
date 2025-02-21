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

export const sshDoc: DbDoc = {
  _id: 'zr-publish/ssh',
  datas: '',
};

/**
 * @description: 获取文档信息
 * @return {*}
 */
export const getSshDoc = () => window.utools.db.promises.get('zr-publish/ssh');
export const getSshDocSync = () => window.utools.db.get('zr-publish/ssh');

/**
 * @description: 获取项目列表
 * @param {*} return
 * @return {*}
 */
export const getSshList: () => Promise<sshItemType[]> = () => {
  return new Promise((resolve, reject) => {
    getSshDoc()
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
export const removeSsh = (id: string) => {
  const docs = getSshDocSync() || sshDoc;
  return new Promise((resolve, reject) => {
    getSshList().then((res) => {
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
export const addSsh: (project: sshItemType) => Promise<sshItemType | Error> = (
  project: sshItemType,
) => {
  const params = cloneDeep(project);
  const doc = getSshDocSync() || sshDoc;
  params.id = nanoid();
  params.password = encrypt(params.password);
  return new Promise((resolve, reject) => {
    getSshList().then((res) => {
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
 * @description: 更新项目
 * @param {ProjectItemType} project
 * @return {*}
 */
export const updateSsh: (project: sshItemType) => Promise<sshItemType | Error> = (
  project: sshItemType,
) => {
  const docs = getSshDocSync() || sshDoc;
  return new Promise((resolve, reject) => {
    getSshList().then((res) => {
      if (res) {
        const datas = cloneDeep(res);
        const index = datas.findIndex((item) => item.id === project.id);
        if (project.password) {
          project.password = encrypt(project.password);
        }
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
