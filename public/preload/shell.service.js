const { spawn, execFile, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { detectAvailableTerminals, getDefaultTerminal } = require('./terminal-detector');
const {
  posixQuote,
  posixQuoteArgv,
  appleScriptQuote,
  powerShellQuote,
  isSafeSshField,
} = require('./shell-quote');

/*
 * 说明：本模块所有外部程序都用 spawn/execFile 以 argv 形式启动，不经过 shell；
 * AppleScript 也以 argv 传给 osascript，因此路径/主机名里的引号、空格、$( ) 都不会被解释。
 * 返回值保持同步 { success, error } 契约（调用方是同步判断的），
 * 因此对「命令不存在」这类可预判的失败做了前置检查，不再无条件返回 success: true。
 */

const ok = () => ({ success: true });

const fail = (error) => ({
  success: false,
  error: error instanceof Error ? error.message : String(error),
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const launch = (command, args, options = {}) => {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', ...options });
  // spawn 对「命令不存在」是异步 emit error，不会同步抛错，这里至少留下日志（前置检查已挡住常见情况）
  child.on('error', (error) => {
    console.error(`[zr-publish] 启动 ${command} 失败: ${error.message}`);
  });
  child.unref();
};

/** 命令是否在 PATH 中 */
const hasCommand = (command) => {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/** 进程是否在运行（macOS，用于判断终端是冷启动还是已启动） */
const isProcessRunning = (name) => {
  try {
    execFileSync('pgrep', ['-x', name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/** 执行 AppleScript：脚本以 -e 逐行作为 argv 传入，完全不经过 shell */
const runAppleScript = (lines, waitMs = 0) => {
  const run = () => {
    const args = [];
    for (const line of lines) {
      args.push('-e', line);
    }
    execFile('osascript', args, (error) => {
      if (error) {
        console.error(`[zr-publish] AppleScript 执行失败: ${error.message}`);
      }
    });
  };

  if (waitMs > 0) {
    setTimeout(run, waitMs);
  } else {
    run();
  }
};

const assertDirectory = (dir) => {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`目录不存在: ${dir}`);
  }
};

/** macOS：Tabby 不支持 --working-directory，沿用「剪贴板 + 粘贴回车」方案 */
const openMacTabby = (shellCommand, cwd) => {
  launch('open', ['-na', 'Tabby', '--args', 'open'], { cwd });
  const wait = isProcessRunning('Tabby') ? 400 : 2000;
  runAppleScript(
    [
      'tell application "Tabby" to activate',
      `set the clipboard to "${appleScriptQuote(shellCommand)}"`,
      'tell application "System Events" to tell process "Tabby" to keystroke "v" using {command down}',
      'tell application "System Events" to key code 36',
    ],
    wait,
  );
};

/** macOS：iTerm2 —— 新窗口或新标签页里写入命令 */
const openMacITerm = (shellCommand, cwd) => {
  launch('open', ['-na', 'iTerm'], { cwd });
  runAppleScript([
    'on waitUntilRunning()',
    '  repeat 50 times',
    '    tell application "System Events"',
    '      if (exists process "iTerm2") then exit repeat',
    '    end tell',
    '    delay 0.1',
    '  end repeat',
    'end waitUntilRunning',
    'waitUntilRunning()',
    'tell application "iTerm2"',
    '  if (count of windows) = 0 then',
    '    create window with default profile',
    '    delay 0.3',
    '  else',
    '    tell current window',
    '      create tab with default profile',
    '    end tell',
    '    delay 0.3',
    '  end if',
    `  tell current session of current window to write text "${appleScriptQuote(shellCommand)}"`,
    '  activate',
    'end tell',
  ]);
};

/** macOS：系统自带 Terminal */
const openMacTerminal = (shellCommand, cwd) => {
  launch('open', ['-na', 'Terminal'], { cwd });
  runAppleScript(
    [
      'tell application "Terminal" to activate',
      `tell application "Terminal" to do script "${appleScriptQuote(shellCommand)}" in front window`,
    ],
    500,
  );
};

/** Windows：Tabby 安装路径兜底查找 */
const findWindowsTabby = () => {
  const candidates = [
    'C:\\Program Files\\Tabby\\Tabby.exe',
    'C:\\Program Files (x86)\\Tabby\\Tabby.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs\\Tabby\\Tabby.exe') : '',
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
};

const openInFileManager = (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return fail(new Error(`路径不存在: ${filePath}`));
    }

    if (process.platform === 'darwin') {
      launch('open', [filePath]);
    } else if (process.platform === 'win32') {
      launch('explorer', [filePath]);
    } else {
      launch('xdg-open', [filePath]);
    }
    return ok();
  } catch (error) {
    return fail(error);
  }
};

const openWithVSCode = (filePath) => {
  try {
    if (!hasCommand('code')) {
      return fail(new Error('未找到 code 命令，请在 VS Code 中执行 “Shell Command: Install \'code\' command in PATH”'));
    }
    launch('code', [filePath]);
    return ok();
  } catch (error) {
    return fail(error);
  }
};

const openWithIDEA = (filePath) => {
  try {
    if (process.platform === 'darwin') {
      launch('open', ['-a', 'IntelliJ IDEA', filePath]);
    } else if (process.platform === 'win32') {
      if (!hasCommand('idea64') && !hasCommand('idea64.exe')) {
        return fail(new Error('未找到 idea64 命令，请把 IntelliJ IDEA 加入 PATH'));
      }
      launch('idea64', [filePath]);
    } else {
      if (!hasCommand('idea')) {
        return fail(new Error('未找到 idea 命令，请创建 IntelliJ IDEA 命令行启动器'));
      }
      launch('idea', [filePath]);
    }
    return ok();
  } catch (error) {
    return fail(error);
  }
};

const openInTerminal = (workingDir, terminalType) => {
  try {
    assertDirectory(workingDir);
    const shellCommand = `cd ${posixQuote(workingDir)} && clear`;

    if (process.platform === 'darwin') {
      if (terminalType === 'Tabby') {
        openMacTabby(shellCommand, workingDir);
      } else if (terminalType === 'iTerm') {
        openMacITerm(shellCommand, workingDir);
      } else if (terminalType === 'Warp') {
        launch('open', ['-a', 'Warp', workingDir], { cwd: workingDir });
      } else {
        openMacTerminal(shellCommand, workingDir);
      }
    } else if (process.platform === 'win32') {
      if (terminalType === 'Tabby') {
        const tabby = findWindowsTabby();
        if (!tabby) {
          return fail(new Error('未找到 Tabby.exe，请确认安装路径'));
        }
        launch('cmd', ['/c', 'start', '', tabby, 'open'], { cwd: workingDir });
      } else if (terminalType === 'WindowsTerminal') {
        launch('cmd', ['/c', 'start', '', 'wt.exe', '-d', workingDir], { cwd: workingDir });
      } else if (terminalType === 'powershell') {
        launch(
          'cmd',
          ['/c', 'start', '', 'powershell', '-NoExit', '-Command', `Set-Location -LiteralPath ${powerShellQuote(workingDir)}`],
          { cwd: workingDir },
        );
      } else {
        launch('cmd', ['/c', 'start', '', 'cmd', '/k', `cd /d "${workingDir}"`], { cwd: workingDir });
      }
    } else if (terminalType === 'Tabby') {
      launch('tabby', ['open'], { cwd: workingDir });
    } else if (terminalType === 'konsole') {
      launch('konsole', ['--workdir', workingDir]);
    } else if (terminalType === 'xterm') {
      // sh -c 的脚本作为单个 argv 传入，路径已经过 POSIX 引号处理
      launch('xterm', ['-e', 'sh', '-c', `cd ${posixQuote(workingDir)} && bash`]);
    } else {
      launch('gnome-terminal', [`--working-directory=${workingDir}`]);
    }

    return ok();
  } catch (error) {
    return fail(error);
  }
};

const buildSshArgv = (serverConfig) => {
  const { host, username, port, private_key: privateKey } = serverConfig;

  if (!isSafeSshField(host)) {
    throw new Error(`主机地址包含不安全字符: ${host}`);
  }
  if (!isSafeSshField(username)) {
    throw new Error(`用户名包含不安全字符: ${username}`);
  }
  const portNumber = Number(port);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new Error(`端口不合法: ${port}`);
  }
  if (privateKey && !fs.existsSync(privateKey)) {
    throw new Error(`私钥文件不存在: ${privateKey}`);
  }

  const argv = ['ssh'];
  if (privateKey) {
    argv.push('-i', privateKey);
  }
  argv.push('-p', String(portNumber), `${username}@${host}`);
  return argv;
};

const openSSHTerminal = (serverConfig, terminalType) => {
  try {
    const sshArgv = buildSshArgv(serverConfig);
    const sshCommand = posixQuoteArgv(sshArgv);

    if (process.platform === 'darwin') {
      if (terminalType === 'Tabby') {
        openMacTabby(sshCommand, '/');
      } else if (terminalType === 'iTerm') {
        openMacITerm(sshCommand, '/');
      } else if (terminalType === 'Warp') {
        launch('open', ['-na', 'Warp']);
        runAppleScript(
          [
            'tell application "Warp" to activate',
            `tell application "Warp" to do script "${appleScriptQuote(sshCommand)}"`,
          ],
          500,
        );
      } else {
        openMacTerminal(sshCommand, '/');
      }
    } else if (process.platform === 'win32') {
      if (terminalType === 'Tabby') {
        const tabby = findWindowsTabby();
        if (!tabby) {
          return fail(new Error('未找到 Tabby.exe，请确认安装路径'));
        }
        launch('cmd', ['/c', 'start', '', tabby, ...sshArgv]);
      } else if (terminalType === 'WindowsTerminal') {
        launch('cmd', ['/c', 'start', '', 'wt.exe', ...sshArgv]);
      } else if (terminalType === 'powershell') {
        launch('cmd', [
          '/c',
          'start',
          '',
          'powershell',
          '-NoExit',
          '-Command',
          sshArgv.map(powerShellQuote).join(' '),
        ]);
      } else {
        launch('cmd', ['/c', 'start', '', 'cmd', '/k', ...sshArgv]);
      }
    } else if (terminalType === 'Tabby') {
      launch('tabby', ['ssh', ...sshArgv.slice(1)]);
    } else if (terminalType === 'konsole') {
      launch('konsole', ['-e', ...sshArgv]);
    } else if (terminalType === 'xterm') {
      launch('xterm', ['-e', ...sshArgv]);
    } else {
      launch('gnome-terminal', ['--', ...sshArgv]);
    }

    return ok();
  } catch (error) {
    return fail(error);
  }
};

module.exports = {
  openInFileManager,
  openWithVSCode,
  openWithIDEA,
  openInTerminal,
  openSSHTerminal,
  detectAvailableTerminals,
  getDefaultTerminal,
};
