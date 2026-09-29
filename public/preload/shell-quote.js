/**
 * 跨 preload 模块共用的转义原语。
 * 出现在 shell / AppleScript / PowerShell 里的外部输入（路径、主机名、用户名…）
 * 一律经过这里的函数处理，避免各文件各写一份、各漏一处。
 */

/** POSIX shell 单引号转义：' -> '\'' */
const posixQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

/** 把 argv 数组拼成一条安全的 shell 命令（每个 token 单独加引号） */
const posixQuoteArgv = (argv) => argv.map(posixQuote).join(' ');

/** AppleScript 字符串字面量转义（脚本本身以 argv 传给 osascript，不进 shell） */
const appleScriptQuote = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** PowerShell 单引号字面量转义：' -> '' */
const powerShellQuote = (value) => `'${String(value).replace(/'/g, "''")}'`;

/** 校验主机名/用户名等是否只含安全字符（用于 Windows cmd 这类必须经过解释器的场景） */
const SAFE_SSH_FIELD = /^[A-Za-z0-9._:@%+-]+$/;
const isSafeSshField = (value) => typeof value === 'string' && SAFE_SSH_FIELD.test(value);

module.exports = {
  posixQuote,
  posixQuoteArgv,
  appleScriptQuote,
  powerShellQuote,
  isSafeSshField,
};
