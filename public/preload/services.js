/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-11 14:10:21
 * @LastEditors: wenbin
 * @LastEditTime: 2025-03-03 17:09:07
 * @FilePath: /zr-publish/public/preload/services.js
 * Copyright (c) 2025 wenbin
 */
const fsService = require('./fs.service');
const sshService = require('./ssh.service');
const shellService = require('./shell.service');
const gitService = require('./git.service');

window.services = {
  ...fsService,
  ...sshService,
  ...shellService,
  ...gitService,
};
