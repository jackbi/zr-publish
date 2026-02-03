const { spawn, exec } = require('child_process');
const path = require('path');
const { detectAvailableTerminals, getDefaultTerminal } = require('./terminal-detector');

const openInFileManager = (filePath) => {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') {
      exec(`open "${filePath}"`);
    } else if (platform === 'win32') {
      exec(`explorer "${filePath}"`);
    } else {
      exec(`xdg-open "${filePath}"`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const openWithVSCode = (filePath) => {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin' || platform === 'linux') {
      exec(`code "${filePath}"`);
    } else if (platform === 'win32') {
      exec(`code "${filePath}"`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const openWithIDEA = (filePath) => {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') {
      exec(`open -a "IntelliJ IDEA" "${filePath}"`);
    } else if (platform === 'win32') {
      exec(`start idea64.exe "${filePath}"`);
    } else {
      exec(`idea "${filePath}"`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const openInTerminal = (workingDir, terminalType) => {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') {
      if (terminalType === 'Tabby') {
        const cdCommand = `cd "${workingDir}" && clear`;
        const escapedCommand = cdCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `if pgrep -x "Tabby" > /dev/null; then
  open -na Tabby --args open && sleep 0.3
else
  open -na Tabby --args open && sleep 2
fi && osascript -e 'tell application "Tabby" to activate' -e 'set the clipboard to "${escapedCommand}"' -e 'tell application "System Events" to tell process "Tabby" to keystroke "v" using {command down}' -e 'tell application "System Events" to key code 36'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else if (terminalType === 'iTerm') {
        const cdCommand = `cd "${workingDir}" && clear`;
        const escapedCommand = cdCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `open -na iTerm && sleep 0.8 && osascript -e 'on waitUntilRunning()
  repeat 50 times
    tell application "System Events"
      if (exists process "iTerm2") then exit repeat
    end tell
    delay 0.1
  end repeat
end waitUntilRunning

waitUntilRunning()

tell application "iTerm2"
  if (count of windows) = 0 then
    create window with default profile
    delay 0.3
  else
    tell current window
      create tab with default profile
    end tell
    delay 0.3
  end if
  tell current session of current window to write text "${escapedCommand}"
  activate
end tell'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else if (terminalType === 'Warp') {
        spawn('open', ['-a', 'Warp', workingDir], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else {
        const cdCommand = `cd "${workingDir}" && clear`;
        const escapedCommand = cdCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `open -na Terminal && sleep 0.5 && osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "${escapedCommand}" in front window'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      }
    } else if (platform === 'win32') {
      if (terminalType === 'Tabby') {
        spawn('cmd', ['/c', 'start', 'Tabby', 'open'], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else if (terminalType === 'WindowsTerminal') {
        spawn('cmd', ['/c', 'start', 'wt.exe', '-d', workingDir], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else if (terminalType === 'powershell') {
        spawn('cmd', ['/c', 'start', 'powershell', '-NoExit', '-Command', `cd '${workingDir}'`], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else {
        spawn('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${workingDir}"`], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      }
    } else {
      if (terminalType === 'Tabby') {
        spawn('tabby', ['open'], {
          detached: true,
          stdio: 'ignore',
          cwd: workingDir
        }).unref();
      } else if (terminalType === 'konsole') {
        spawn('konsole', ['--workdir', workingDir], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else if (terminalType === 'xterm') {
        spawn('xterm', ['-e', `cd '${workingDir}' && bash`], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else {
        spawn('gnome-terminal', [`--working-directory=${workingDir}`], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const openSSHTerminal = (serverConfig, terminalType) => {
  const platform = process.platform;
  
  try {
    let sshCommand;
    
    if (serverConfig.auth_type === 'privateKey' && serverConfig.private_key) {
      sshCommand = `ssh -i "${serverConfig.private_key}" -p ${serverConfig.port} ${serverConfig.username}@${serverConfig.host}`;
    } else {
      sshCommand = `ssh -p ${serverConfig.port} ${serverConfig.username}@${serverConfig.host}`;
    }

    if (platform === 'darwin') {
      if (terminalType === 'Tabby') {
        // Use clipboard approach for Tabby to avoid encoding issues
        const escapedCommand = sshCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `if pgrep -x "Tabby" > /dev/null; then
  open -na Tabby --args open && sleep 0.3
else
  open -na Tabby --args open && sleep 2
fi && osascript -e 'tell application "Tabby" to activate' -e 'set the clipboard to "${escapedCommand}"' -e 'tell application "System Events" to tell process "Tabby" to keystroke "v" using {command down}' -e 'tell application "System Events" to key code 36'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: '/'
        }).unref();
      } else if (terminalType === 'iTerm') {
        const escapedCommand = sshCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `open -na iTerm && sleep 0.8 && osascript -e 'on waitUntilRunning()
  repeat 50 times
    tell application "System Events"
      if (exists process "iTerm2") then exit repeat
    end tell
    delay 0.1
  end repeat
end waitUntilRunning

waitUntilRunning()

tell application "iTerm2"
  if (count of windows) = 0 then
    create window with default profile
    delay 0.3
  else
    tell current window
      create tab with default profile
    end tell
    delay 0.3
  end if
  tell current session of current window to write text "${escapedCommand}"
  activate
end tell'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: '/'
        }).unref();
      } else if (terminalType === 'Warp') {
        const escapedCommand = sshCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `open -na Warp && sleep 0.5 && osascript -e 'tell application "Warp" to activate' -e 'tell application "Warp" to do script "${escapedCommand}"'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: '/'
        }).unref();
      } else {
        // Default Terminal
        const escapedCommand = sshCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `open -na Terminal && sleep 0.5 && osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "${escapedCommand}" in front window'`;
        
        spawn('sh', ['-c', script], {
          detached: true,
          stdio: 'ignore',
          cwd: '/'
        }).unref();
      }
    } else if (platform === 'win32') {
      if (terminalType === 'Tabby') {
        const sshArgs = `${serverConfig.username}@${serverConfig.host} -p ${serverConfig.port}`;
        if (serverConfig.auth_type === 'privateKey' && serverConfig.private_key) {
          spawn('cmd', ['/c', 'start', '', 'C:\\Program Files\\Tabby\\Tabby.exe', 'ssh', ...sshArgs.split(' '), '-i', serverConfig.private_key], {
            detached: true,
            stdio: 'ignore'
          }).unref();
        } else {
          spawn('cmd', ['/c', 'start', '', 'C:\\Program Files\\Tabby\\Tabby.exe', 'ssh', ...sshArgs.split(' ')], {
            detached: true,
            stdio: 'ignore'
          }).unref();
        }
      } else if (terminalType === 'WindowsTerminal') {
        spawn('cmd', ['/c', 'start', 'wt.exe', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else if (terminalType === 'powershell') {
        spawn('cmd', ['/c', 'start', 'powershell', '-NoExit', '-Command', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else {
        spawn('cmd', ['/c', 'start', 'cmd', '/k', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      }
    } else {
      // Linux
      if (terminalType === 'Tabby') {
        const sshArgs = [serverConfig.username + '@' + serverConfig.host + ':' + serverConfig.port];
        if (serverConfig.auth_type === 'privateKey' && serverConfig.private_key) {
          spawn('tabby', ['ssh', ...sshArgs, '-i', serverConfig.private_key], {
            detached: true,
            stdio: 'ignore'
          }).unref();
        } else {
          spawn('tabby', ['ssh', ...sshArgs], {
            detached: true,
            stdio: 'ignore'
          }).unref();
        }
      } else if (terminalType === 'konsole') {
        spawn('konsole', ['-e', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else if (terminalType === 'xterm') {
        spawn('xterm', ['-e', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else {
        spawn('gnome-terminal', ['--', sshCommand], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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
