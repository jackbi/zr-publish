const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const { posixQuote: quote } = require('./shell-quote');

let publishBusy = false;

const noop = () => {};

/**
 * 远端路径校验：必须是绝对路径、不能是根目录、不能包含 ..
 * 这里只做结构性校验，空格等特殊字符由 quote() 处理。
 */
const assertSafeRemotePath = (remotePath) => {
  if (typeof remotePath !== 'string' || !remotePath.trim()) {
    throw new Error('远端路径不能为空');
  }
  const value = remotePath.trim();
  if (!value.startsWith('/')) {
    throw new Error('远端路径必须是绝对路径（以 / 开头）');
  }
  if (value === '/') {
    throw new Error('远端路径不能是根目录 /');
  }
  if (value.split('/').includes('..')) {
    throw new Error('远端路径不能包含 ..');
  }
  return value;
};

const buildSSHConfig = (serverConfig) => {
  const config = {
    host: serverConfig.host,
    port: serverConfig.port,
    username: serverConfig.username,
    readyTimeout: 10000,
  };

  if (serverConfig.auth_type === 'privateKey' && serverConfig.private_key) {
    try {
      config.privateKey = fs.readFileSync(serverConfig.private_key, 'utf8');
      if (serverConfig.passphrase) {
        config.passphrase = serverConfig.passphrase;
      }
    } catch (error) {
      throw new Error(`Failed to read private key file: ${error.message}`);
    }
  } else {
    config.password = serverConfig.password;
  }

  return config;
};

const testConnect = async (datas) => {
  const ssh = new NodeSSH();
  try {
    const config = buildSSHConfig(datas);
    await ssh.connect(config);
    return {
      success: true,
      message: '连接成功',
      authType: datas.auth_type || 'password',
    };
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      error: error.toString(),
    };
  } finally {
    ssh.dispose();
  }
};

async function uploadViaSftp(remoteData, serverConfig, onProcess = noop) {
  const ssh = new NodeSSH();
  const remoteFolder = assertSafeRemotePath(remoteData.remote_path);
  const { local_path: localFolder } = remoteData;
  let tempDir = '';
  let remoteFolderCleared = false;

  try {
    const config = buildSSHConfig(serverConfig);
    await ssh.connect(config);

    if (remoteData.is_save || remoteData.is_save === undefined) {
      const backupPath = `${remoteFolder}_backup_${Date.now()}.zip`;
      const saveResult = await ssh.execCommand(`zip -r ${quote(backupPath)} ${quote(remoteFolder)}`);
      if (saveResult.code !== 0) {
        onProcess(`备份失败: ${saveResult.stderr || saveResult.stdout}`);
        throw new Error(`备份失败: ${saveResult.stderr || 'zip 执行失败'}`);
      }
      onProcess(`已备份到: ${backupPath}`);
    }

    if (remoteData.is_removed || remoteData.is_removed === undefined) {
      const excludePaths = remoteData.exclude_paths || [];
      tempDir = `/tmp/zr_publish_temp_${Date.now()}`;

      if (excludePaths.length > 0) {
        await ssh.execCommand(`mkdir -p ${quote(tempDir)}`);

        for (const excludePath of excludePaths) {
          const sourcePath = `${remoteFolder}/${excludePath}`;
          const moveResult = await ssh.execCommand(`mv ${quote(sourcePath)} ${quote(tempDir)}/`);
          if (moveResult.code !== 0) {
            onProcess(`Warning: Failed to preserve ${excludePath}: ${moveResult.stderr}`);
          } else {
            onProcess(`Preserved: ${excludePath}`);
          }
        }
      }

      const deleteResult = await ssh.execCommand(`rm -rf ${quote(remoteFolder)}`);
      if (deleteResult.code !== 0) {
        onProcess(`Delete failed: ${deleteResult.stderr}`);
        throw new Error(`Delete failed: ${deleteResult.stderr}`);
      }
      remoteFolderCleared = true;

      if (excludePaths.length > 0) {
        await ssh.execCommand(`mkdir -p ${quote(remoteFolder)}`);

        // cp -a 才能带上隐藏文件（.env 之类）；mv 的 * 通配不会匹配隐藏文件。
        // 只有恢复成功才删除临时目录，失败时保留现场数据。
        const restoreResult = await ssh.execCommand(
          `cp -a ${quote(`${tempDir}/.`)} ${quote(`${remoteFolder}/`)}`,
        );
        if (restoreResult.code === 0) {
          onProcess('Restored excluded files/folders');
          await ssh.execCommand(`rm -rf ${quote(tempDir)}`);
        } else {
          onProcess(
            `Warning: 排除项恢复失败，文件仍保留在 ${tempDir}: ${restoreResult.stderr}`,
          );
        }
      }
    }

    const transferResult = await ssh.putDirectory(localFolder, remoteFolder, {
      concurrency: 5,
      recursive: true,
      tick: (localPath, remotePath, error) => {
        if (error) {
          onProcess(`Upload failed: ${localPath} -> ${remotePath}`);
        } else {
          onProcess(`Uploaded: ${localPath} -> ${remotePath}`);
        }
      },
    });

    if (!transferResult) {
      throw new Error('Upload failed without specific error');
    }

    return transferResult;
  } catch (error) {
    if (remoteFolderCleared) {
      onProcess(`上传未完成，远端目录 ${remoteFolder} 已被清空，请检查后再重试`);
    }
    throw error;
  } finally {
    ssh.dispose();
  }
}

const uploadToMultipleServers = async (remoteData, servers, onProcess = noop) => {
  const uploadPromises = servers.map(async (server) => {
    onProcess(`Uploading to server: ${server.host}`);
    try {
      await uploadViaSftp(remoteData, server, onProcess);
      onProcess(`Successfully uploaded to server: ${server.host}`);
      return { host: server.host, success: true };
    } catch (err) {
      onProcess(`Failed to upload to server ${server.host}: ${err.message}`);
      return { host: server.host, success: false, error: err.message };
    }
  });

  const results = await Promise.all(uploadPromises);
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    throw new Error(`Failed servers: ${failed.map((f) => f.host).join(', ')}`);
  }
};

const ensureRemoteDirExists = async (ssh, remotePath) => {
  const dir = path.posix.dirname(remotePath);
  const result = await ssh.execCommand(`mkdir -p ${quote(dir)}`);
  if (result.code !== 0) {
    throw new Error(`Failed to create remote directory: ${result.stderr}`);
  }
};

const uploadFileToMultipleServers = async (remoteData, servers, onProcess = noop) => {
  const localFilePath = remoteData.local_path;
  const remoteFilePath = assertSafeRemotePath(remoteData.remote_path);
  const failedServers = [];

  for (const server of servers) {
    const ssh = new NodeSSH();
    try {
      const config = buildSSHConfig(server);
      await ssh.connect(config);

      const fileName = path.basename(localFilePath);

      await ensureRemoteDirExists(ssh, remoteFilePath + '/' + fileName);

      // putFile 失败必须让异常冒泡，否则会“上传失败但提示成功”
      await ssh.putFile(localFilePath, remoteFilePath + '/' + fileName);
      onProcess(`File uploaded to server ${server.host}`);

      if (remoteData.remote_command) {
        const result = await ssh.execCommand(remoteData.remote_command);
        if (result.code !== 0) {
          onProcess(`Failed to execute custom command on server ${server.host}: ${result.stderr}`);
        } else {
          onProcess(
            `Custom command executed successfully on server ${server.host}: ${result.stdout}`,
          );
        }
      }
    } catch (err) {
      onProcess(`Failed to upload file to server ${server.host}: ${err.message}`);
      failedServers.push(server.host);
    } finally {
      ssh.dispose();
    }
  }

  if (failedServers.length > 0) {
    throw new Error(`Failed servers: ${failedServers.join(', ')}`);
  }
};

const publish = async ({ serverData, remoteData, onProcess = noop }) => {
  if (publishBusy) {
    throw new Error('Publish in progress');
  }
  publishBusy = true;
  try {
    let isFolder = false;
    try {
      isFolder = fs.statSync(remoteData.local_path).isDirectory();
    } catch (error) {
      throw new Error(`本地路径不存在或不可读: ${remoteData.local_path}`);
    }

    if (isFolder) {
      await uploadToMultipleServers(remoteData, serverData, onProcess);
    } else {
      await uploadFileToMultipleServers(remoteData, serverData, onProcess);
    }
  } catch (error) {
    onProcess(`发布失败: ${error.message}`);
    throw error;
  } finally {
    publishBusy = false;
  }
};

const listRemoteDirectory = async (serverConfig, remotePath) => {
  const safePath = assertSafeRemotePath(remotePath);
  const ssh = new NodeSSH();
  try {
    const config = buildSSHConfig(serverConfig);
    await ssh.connect(config);

    const result = await ssh.execCommand(`ls -F ${quote(safePath)}`);

    if (result.code !== 0) {
      throw new Error(`Failed to list directory: ${result.stderr || 'Directory not found'}`);
    }

    const items = result.stdout.split('\n').filter(item => item.trim());

    return items.map(item => {
      const isDirectory = item.endsWith('/');
      const name = isDirectory ? item.slice(0, -1) : item.replace(/[*@|=]$/, '');
      return {
        name,
        isDirectory,
      };
    });
  } catch (error) {
    throw new Error(`Failed to connect or list directory: ${error.message}`);
  } finally {
    ssh.dispose();
  }
};

/**
 * 释放发布锁。
 * 渲染端超时后底层上传可能仍在进行，调用方应在真正结束后再调用本方法，
 * 否则会出现并发发布。
 */
const resetPublishState = () => {
  publishBusy = false;
};

const isPublishBusy = () => publishBusy;

module.exports = {
  testConnect,
  publish,
  listRemoteDirectory,
  resetPublishState,
  isPublishBusy,
  assertSafeRemotePath,
  // 仅用于自测：确认远端参数转义确实生效
  quoteForShell: quote,
};
