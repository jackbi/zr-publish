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

// CryptoJS 的 OpenSSL 格式密文固定以 base64 的 "Salted__" 开头（U2FsdGVkX1）
const CIPHERTEXT_PREFIX = 'U2FsdGVkX1';

export const encrypt = (data: string) => {
  const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
  return encrypted;
};

export const decrypt = (encrypted: string) => {
  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
  return decrypted;
};

/**
 * @description: 判断是否已是本工具加密后的密文
 */
export const isEncrypted = (value?: string) => !!value && value.startsWith(CIPHERTEXT_PREFIX);

/**
 * @description: 加密（幂等）。空值保持空，已是密文则不重复加密。
 */
export const safeEncrypt = (value?: string) => {
  if (!value) return '';
  return isEncrypted(value) ? value : encrypt(value);
};

/**
 * @description: 解密（容错）。
 * 历史版本只加密了 password，passphrase 是以明文入库的；
 * 而 CryptoJS 对非密文解密会返回空串且不报错，直接用解密结果会把
 * 用户已保存的口令静默清空。因此这里对非密文原样返回。
 */
export const safeDecrypt = (value?: string) => {
  if (!value) return '';
  if (!isEncrypted(value)) return value;
  try {
    return decrypt(value);
  } catch (error) {
    return '';
  }
};
