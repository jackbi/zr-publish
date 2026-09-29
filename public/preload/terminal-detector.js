const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const execFileAsync = promisify(execFile);

// 这些常量原本是通过 `exec('where xxx')` / `test -d "..."` 探测的，
// 既不必要地经过 shell，也把探测结果和引号处理耦合在一起，这里直接查文件系统/PATH。
const hasCommand = async (command) => {
  try {
    await execFileAsync(process.platform === 'win32' ? 'where' : 'which', [command]);
    return true;
  } catch {
    return false;
  }
};

const existsDirectory = (target) => {
  try {
    return !!target && fs.existsSync(target) && fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
};

const detectAvailableTerminals = async () => {
  const platform = process.platform;

  if (platform === 'darwin') {
    const macTerminals = [
      { type: 'Tabby', name: 'Tabby', command: 'Tabby', path: '/Applications/Tabby.app' },
      {
        type: 'Terminal',
        name: 'Terminal',
        command: 'Terminal',
        path: '/System/Applications/Utilities/Terminal.app',
      },
      { type: 'iTerm', name: 'iTerm2', command: 'iTerm', path: '/Applications/iTerm.app' },
      { type: 'Warp', name: 'Warp', command: 'Warp', path: '/Applications/Warp.app' },
    ];

    return macTerminals.map((terminal) => ({
      ...terminal,
      available: fs.existsSync(terminal.path),
    }));
  }

  if (platform === 'win32') {
    const winTerminals = [
      { type: 'Tabby', name: 'Tabby', command: 'tabby.exe' },
      { type: 'WindowsTerminal', name: 'Windows Terminal', command: 'wt.exe' },
      { type: 'powershell', name: 'PowerShell', command: 'powershell.exe' },
      { type: 'cmd', name: 'Command Prompt', command: 'cmd.exe' },
    ];

    const results = [];
    for (const terminal of winTerminals) {
      results.push({ ...terminal, available: await hasCommand(terminal.command) });
    }
    return results;
  }

  const linuxTerminals = [
    { type: 'Tabby', name: 'Tabby', command: 'tabby' },
    { type: 'gnome-terminal', name: 'GNOME Terminal', command: 'gnome-terminal' },
    { type: 'konsole', name: 'Konsole', command: 'konsole' },
    { type: 'xterm', name: 'XTerm', command: 'xterm' },
  ];

  const results = [];
  for (const terminal of linuxTerminals) {
    results.push({ ...terminal, available: await hasCommand(terminal.command) });
  }
  return results;
};

const getDefaultTerminal = async () => {
  const platform = process.platform;

  // 优先 Tabby
  if (platform === 'darwin') {
    if (existsDirectory('/Applications/Tabby.app')) return 'Tabby';
    return 'Terminal';
  }

  if (platform === 'win32') {
    return (await hasCommand('tabby.exe')) ? 'Tabby' : 'cmd';
  }

  return (await hasCommand('tabby')) ? 'Tabby' : 'gnome-terminal';
};

module.exports = {
  detectAvailableTerminals,
  getDefaultTerminal,
};
