/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-25 10:03:56
 * @FilePath: /zr-publish/public/preload/services.js
 * Copyright (C) 2025 wenbin. All rights reserved.
 */
const fs = require('node:fs');
const path = require('node:path');
const { testConnect, publish } = require('./ssh');
// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  // 读文件
  readFile(file) {
    return fs.readFileSync(file, { encoding: 'utf-8' });
  },
  readDoc() {
    const file = path.join(__dirname, 'read.md');
    return fs.readFileSync(file, { encoding: 'utf-8' });
  },
  readDir(dir) {
    return fs.readdirSync(dir);
  },
  // 文本写入到下载目录
  writeTextFile(text) {
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.txt');
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' });
    return filePath;
  },
  // 图片写入到下载目录
  writeImageFile(base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url);
    if (!matchs) return;
    const filePath = path.join(
      window.utools.getPath('downloads'),
      Date.now().toString() + '.' + matchs[1],
    );
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' });
    return filePath;
  },
  testConnect,
  publish,
};
