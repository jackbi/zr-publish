# Shell 功能修复文档

## 问题描述
1. 文件管理器打开项目功能无效
2. SSH 终端打开功能无效

## 修复方案

### 新增文件
创建了 `public/preload/shell.service.js` 文件，提供以下功能：

#### 1. `openInFileManager(filePath)` - 在文件管理器中打开
- **macOS**: 使用 `open` 命令
- **Windows**: 使用 `explorer` 命令
- **Linux**: 使用 `xdg-open` 命令

#### 2. `openWithVSCode(filePath)` - 使用 VS Code 打开
- 所有平台: 使用 `code` 命令
- 需要确保 VS Code 的 `code` 命令已安装到 PATH

#### 3. `openWithIDEA(filePath)` - 使用 IntelliJ IDEA 打开
- **macOS**: 使用 `open -a "IntelliJ IDEA"`
- **Windows**: 使用 `idea64.exe`
- **Linux**: 使用 `idea` 命令

#### 4. `openSSHTerminal(serverConfig)` - 打开 SSH 终端
- **macOS**: 使用 AppleScript 打开 Terminal.app
- **Windows**: 使用 cmd 打开命令行
- **Linux**: 使用 x-terminal-emulator

## 技术实现

### 使用 Node.js child_process
```javascript
const { spawn, exec } = require('child_process');

// 执行命令
exec(`open "${filePath}"`);
```

### SSH 终端打开逻辑
```javascript
// 密钥认证
ssh -i "/path/to/key" -p 22 user@host

// 密码认证
ssh -p 22 user@host
```

## 使用方法

### 项目管理 - 打开项目
在项目列表中，点击文件夹图标下拉菜单：
1. **VS Code 打开** - 使用 VS Code 打开项目
2. **IDEA 打开** - 使用 IntelliJ IDEA 打开项目
3. **文件管理器打开** - 在系统文件管理器中打开项目目录

### SSH 管理 - 打开终端
在 SSH 列表中，点击 Monitor 图标（显示器图标）：
- 自动识别认证方式（密码/密钥）
- 打开系统终端并建立 SSH 连接
- 显示操作结果通知

## 前置条件

### VS Code
确保 `code` 命令已安装：
```bash
# macOS/Linux
which code

# Windows
where code
```

如未安装，在 VS Code 中执行：
- 打开命令面板 (Cmd/Ctrl+Shift+P)
- 输入 "Shell Command: Install 'code' command in PATH"

### IntelliJ IDEA
确保 IDEA 命令行工具已安装：
- **macOS**: Tools → Create Command-line Launcher
- **Windows**: 安装时选择添加到 PATH
- **Linux**: 通过工具箱或手动添加到 PATH

### SSH（密码认证 - Windows）
Windows 需要安装 OpenSSH 客户端：
- Windows 10/11: 设置 → 应用 → 可选功能 → OpenSSH 客户端

## 错误处理

所有函数都返回结果对象：
```javascript
{
  success: boolean,
  error?: string
}
```

UI 层会显示相应的成功/失败通知。

## 调试方法

### 检查服务是否加载
在浏览器控制台执行：
```javascript
console.log(window.services);
```

应该看到：
```javascript
{
  openInFileManager: function,
  openWithVSCode: function,
  openWithIDEA: function,
  openSSHTerminal: function,
  // ... 其他服务
}
```

### 测试打开功能
```javascript
// 测试文件管理器打开
window.services.openInFileManager('/path/to/project');

// 测试 VS Code 打开
window.services.openWithVSCode('/path/to/project');

// 测试 SSH 终端
window.services.openSSHTerminal({
  host: '192.168.1.100',
  port: 22,
  username: 'root',
  password: 'password',
  auth_type: 'password'
});
```

## 已知限制

1. **VS Code / IDEA**: 需要预先安装并配置命令行工具
2. **SSH 终端（Windows）**: 需要 OpenSSH 客户端
3. **文件管理器**: 路径中包含特殊字符可能需要额外处理

## 构建状态

✅ 构建成功 (2.87s)
✅ 无编译错误
✅ 所有功能已集成
