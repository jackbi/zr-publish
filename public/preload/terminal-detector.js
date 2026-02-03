const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const detectAvailableTerminals = async () => {
  const platform = process.platform;
  const terminals = [];

  if (platform === 'darwin') {
    const macTerminals = [
      { type: 'Tabby', name: 'Tabby', command: 'Tabby', path: '/Applications/Tabby.app' },
      { type: 'Terminal', name: 'Terminal', command: 'Terminal', path: '/System/Applications/Utilities/Terminal.app' },
      { type: 'iTerm', name: 'iTerm2', command: 'iTerm', path: '/Applications/iTerm.app' },
      { type: 'Warp', name: 'Warp', command: 'Warp', path: '/Applications/Warp.app' },
    ];

    for (const terminal of macTerminals) {
      try {
        const { stdout } = await execAsync(`test -d "${terminal.path}" && echo "exists"`);
        if (stdout.trim() === 'exists') {
          terminals.push({ ...terminal, available: true });
        }
      } catch {
        terminals.push({ ...terminal, available: false });
      }
    }
  } else if (platform === 'win32') {
    const winTerminals = [
      { type: 'Tabby', name: 'Tabby', command: 'tabby.exe' },
      { type: 'WindowsTerminal', name: 'Windows Terminal', command: 'wt.exe' },
      { type: 'powershell', name: 'PowerShell', command: 'powershell.exe' },
      { type: 'cmd', name: 'Command Prompt', command: 'cmd.exe' },
    ];

    for (const terminal of winTerminals) {
      try {
        await execAsync(`where ${terminal.command}`);
        terminals.push({ ...terminal, available: true });
      } catch {
        terminals.push({ ...terminal, available: false });
      }
    }
  } else {
    const linuxTerminals = [
      { type: 'Tabby', name: 'Tabby', command: 'tabby' },
      { type: 'gnome-terminal', name: 'GNOME Terminal', command: 'gnome-terminal' },
      { type: 'konsole', name: 'Konsole', command: 'konsole' },
      { type: 'xterm', name: 'XTerm', command: 'xterm' },
    ];

    for (const terminal of linuxTerminals) {
      try {
        await execAsync(`which ${terminal.command}`);
        terminals.push({ ...terminal, available: true });
      } catch {
        terminals.push({ ...terminal, available: false });
      }
    }
  }

  return terminals;
};

const getDefaultTerminal = async () => {
  const platform = process.platform;
  
  // 优先检测 Tabby
  try {
    if (platform === 'darwin') {
      const { stdout } = await execAsync('test -d "/Applications/Tabby.app" && echo "exists"');
      if (stdout.trim() === 'exists') {
        return 'Tabby';
      }
    } else if (platform === 'win32') {
      await execAsync('where tabby.exe');
      return 'Tabby';
    } else {
      await execAsync('which tabby');
      return 'Tabby';
    }
  } catch {
    // Tabby 不可用，使用平台默认终端
  }
  
  // 使用平台默认终端
  if (platform === 'darwin') {
    return 'Terminal';
  } else if (platform === 'win32') {
    return 'cmd';
  } else {
    return 'gnome-terminal';
  }
};

module.exports = {
  detectAvailableTerminals,
  getDefaultTerminal,
};
