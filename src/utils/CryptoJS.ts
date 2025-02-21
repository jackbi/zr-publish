/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 17:32:18
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-12 17:33:37
 * @FilePath: /zr-publish/src/utils/CryptoJS.ts
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
import CryptoJS from 'crypto-js';

const secretKey = 'percf5ohFjFGj7uF';

export const encrypt = (data: string) => {
  const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
  return encrypted;
};

export const decrypt = (encrypted: string) => {
  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
  return decrypted;
};
