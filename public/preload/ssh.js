const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const testConnect = async (datas) => {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: datas.host,
      port: datas.port,
      username: datas.username,
      password: datas.password,
      readyTimeout: 10000,
    });
    return true;
  } finally {
    ssh.dispose();
  }
};

async function uploadViaSftp(remoteData, serverConfig, onProcess) {
  const ssh = new NodeSSH();
  const { remote_path: remoteFolder, local_path: localFolder } = remoteData;
  try {
    // 建立连接
    await ssh.connect({
      host: serverConfig.host,
      port: serverConfig.port,
      username: serverConfig.username,
      password: serverConfig.password,
      readyTimeout: 10000,
    });

    if (remoteData.is_save || remoteData.is_save == undefined) {
      const saveResult = await ssh.execCommand(
        `zip -r ${remoteFolder}_backup_${new Date().getTime()}.zip ${remoteFolder}`,
      );
      if (saveResult.stderr) {
        onProcess(`Saved failed: ${saveResult.stderr}`);
        throw new Error(`Saved failed: ${saveResult.stderr}`);
      }
    }

    if (remoteData.is_removed || remoteData.is_removed == undefined) {
      // 删除远程文件夹
      const deleteResult = await ssh.execCommand(`rm -rf ${remoteFolder}`);
      if (deleteResult.stderr) {
        onProcess(`Delete failed: ${deleteResult.stderr}`);
        throw new Error(`Delete failed: ${deleteResult.stderr}`);
      }
    }

    // 上传文件夹
    const transferResult = await ssh.putDirectory(localFolder, remoteFolder, {
      concurrency: 5, // 控制并发数
      recursive: true,
      tick: (localPath, remotePath, error) => {
        if (error) {
          onProcess(`Upload failed: ${localPath} -> ${remotePath}`, error);
        } else {
          onProcess(`Uploaded: ${localPath} -> ${remotePath}`);
        }
      },
    });

    if (!transferResult) {
      throw new Error('Upload failed without specific error');
    }

    return transferResult;
  } finally {
    ssh.dispose();
  }
}

const uploadToMultipleServers = async (remoteData, servers, onProcess) => {
  const uploadPromises = servers.map(async (server) => {
    onProcess(`Uploading to server: ${server.host}`);
    try {
      await uploadViaSftp(remoteData, server, onProcess);
      onProcess(`Successfully uploaded to server: ${server.host}`);
      return { host: server.host, success: true };
    } catch (err) {
      onProcess(`Failed to upload to server ${server.host}:`, err);
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
  const result = await ssh.execCommand(`mkdir -p ${dir}`);
  if (result.stderr) {
    throw new Error(`Failed to create remote directory: ${result.stderr}`);
  }
};

// 上传文件到多个服务器
const uploadFileToMultipleServers = async (remoteData, servers, onProcess) => {
  const localFilePath = remoteData.local_path;
  const remoteFilePath = remoteData.remote_path;
  const ssh = new NodeSSH();

  for (const server of servers) {
    try {
      // 连接服务器
      await ssh.connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
        readyTimeout: 10000, // 连接超时
        timeout: 30000, // 操作超时
        // debug: console.log,
      });

      const fileName = path.basename(localFilePath);

      await ensureRemoteDirExists(ssh, remoteFilePath + '/' + fileName);
      // 上传文件
      await ssh.putFile(localFilePath, remoteFilePath + '/' + fileName).then(
        function () {
          console.log('The File thing is done');
        },
        function (error) {
          console.log("Something's wrong");
          console.log(error);
        },
      );
      onProcess(`File uploaded to server ${server.host}`);

      // 检查是否有自定义指令
      if (remoteData.remote_command) {
        const result = await ssh.execCommand(remoteData.remote_command);
        if (result.stderr) {
          onProcess(`Failed to execute custom command on server ${server.host}: ${result.stderr}`);
        } else {
          onProcess(
            `Custom command executed successfully on server ${server.host}: ${result.stdout}`,
          );
        }
      }

      ssh.dispose();
    } catch (err) {
      onProcess(`Failed to upload file to server ${server.host}: ${err.message}`);
      throw err;
    }
  }
};

const publish = async ({ serverData, remoteData, onProcess }) => {
  try {
    const isFolder = fs.statSync(remoteData.local_path).isDirectory();
    if (isFolder) {
      uploadToMultipleServers(remoteData, serverData, onProcess);
    } else {
      uploadFileToMultipleServers(remoteData, serverData, onProcess);
    }
  } catch (error) {
    onProcess(`发布失败: ${error.message}`);
    throw error;
  }
};

module.exports = {
  testConnect,
  publish,
};
