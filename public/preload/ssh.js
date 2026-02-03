const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

let publishBusy = false;
const connectionPool = new Map();

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

const getPooledConnection = async (serverConfig) => {
  const key = `${serverConfig.host}:${serverConfig.port}:${serverConfig.username}`;
  
  if (connectionPool.has(key)) {
    const pooled = connectionPool.get(key);
    if (pooled.ssh && pooled.ssh.connection && pooled.ssh.connection.state === 'authenticated') {
      pooled.lastUsed = Date.now();
      return { ssh: pooled.ssh, fromPool: true };
    } else {
      connectionPool.delete(key);
    }
  }

  const ssh = new NodeSSH();
  const config = buildSSHConfig(serverConfig);
  await ssh.connect(config);
  
  connectionPool.set(key, {
    ssh,
    lastUsed: Date.now(),
    serverConfig,
  });

  return { ssh, fromPool: false };
};

const releaseConnection = (serverConfig, dispose = false) => {
  const key = `${serverConfig.host}:${serverConfig.port}:${serverConfig.username}`;
  const pooled = connectionPool.get(key);
  
  if (pooled) {
    if (dispose) {
      pooled.ssh.dispose();
      connectionPool.delete(key);
    }
  }
};

const cleanupIdleConnections = (maxIdleTime = 300000) => {
  const now = Date.now();
  for (const [key, pooled] of connectionPool.entries()) {
    if (now - pooled.lastUsed > maxIdleTime) {
      pooled.ssh.dispose();
      connectionPool.delete(key);
    }
  }
};

setInterval(() => cleanupIdleConnections(), 60000);

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

async function uploadViaSftp(remoteData, serverConfig, onProcess) {
  const ssh = new NodeSSH();
  const { remote_path: remoteFolder, local_path: localFolder } = remoteData;
  try {
    const config = buildSSHConfig(serverConfig);
    await ssh.connect(config);

    if (remoteData.is_save || remoteData.is_save === undefined) {
      const saveResult = await ssh.execCommand(
        `zip -r ${remoteFolder}_backup_${new Date().getTime()}.zip ${remoteFolder}`,
      );
      if (saveResult.stderr) {
        onProcess(`Saved failed: ${saveResult.stderr}`);
        throw new Error(`Saved failed: ${saveResult.stderr}`);
      }
    }

    if (remoteData.is_removed || remoteData.is_removed === undefined) {
      const excludePaths = remoteData.exclude_paths || [];
      const tempDir = `/tmp/zr_publish_temp_${new Date().getTime()}`;
      
      if (excludePaths.length > 0) {
        await ssh.execCommand(`mkdir -p ${tempDir}`);
        
        for (const excludePath of excludePaths) {
          const sourcePath = `${remoteFolder}/${excludePath}`;
          const moveResult = await ssh.execCommand(`mv ${sourcePath} ${tempDir}/`);
          if (moveResult.code !== 0) {
            onProcess(`Warning: Failed to preserve ${excludePath}: ${moveResult.stderr}`);
          } else {
            onProcess(`Preserved: ${excludePath}`);
          }
        }
      }
      
      const deleteResult = await ssh.execCommand(`rm -rf ${remoteFolder}`);
      if (deleteResult.stderr) {
        onProcess(`Delete failed: ${deleteResult.stderr}`);
        throw new Error(`Delete failed: ${deleteResult.stderr}`);
      }
      
      if (excludePaths.length > 0) {
        await ssh.execCommand(`mkdir -p ${remoteFolder}`);
        
        const restoreResult = await ssh.execCommand(`mv ${tempDir}/* ${remoteFolder}/`);
        if (restoreResult.code === 0) {
          onProcess(`Restored excluded files/folders`);
        }
        
        await ssh.execCommand(`rm -rf ${tempDir}`);
      }
    }

    const transferResult = await ssh.putDirectory(localFolder, remoteFolder, {
      concurrency: 5,
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

const uploadFileToMultipleServers = async (remoteData, servers, onProcess) => {
  const localFilePath = remoteData.local_path;
  const remoteFilePath = remoteData.remote_path;

  for (const server of servers) {
    const ssh = new NodeSSH();
    try {
      const config = buildSSHConfig(server);
      await ssh.connect(config);

      const fileName = path.basename(localFilePath);

      await ensureRemoteDirExists(ssh, remoteFilePath + '/' + fileName);
      
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

    } catch (err) {
      onProcess(`Failed to upload file to server ${server.host}: ${err.message}`);
      throw err;
    } finally {
      ssh.dispose();
    }
  }
};

const publish = async ({ serverData, remoteData, onProcess }) => {
  if (publishBusy) {
    throw new Error('Publish in progress');
  }
  publishBusy = true;
  try {
    const isFolder = fs.statSync(remoteData.local_path).isDirectory();
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
  const ssh = new NodeSSH();
  try {
    const config = buildSSHConfig(serverConfig);
    await ssh.connect(config);

    const result = await ssh.execCommand(`ls -F ${remotePath}`);
    
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

const executeRemoteCommand = async (serverConfig, command) => {
  const ssh = new NodeSSH();
  try {
    const config = buildSSHConfig(serverConfig);
    await ssh.connect(config);

    const result = await ssh.execCommand(command);
    
    return {
      success: result.code === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    ssh.dispose();
  }
};

module.exports = {
  testConnect,
  publish,
  listRemoteDirectory,
  executeRemoteCommand,
  getPooledConnection,
  releaseConnection,
};
