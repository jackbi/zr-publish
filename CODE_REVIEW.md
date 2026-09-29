# zr-publish 全项目代码评审报告

> 评审对象：本仓库当前工作区（HEAD = `6875755` 离线包，含未提交的 `.gitignore` 改动）
> 评审方式：3 个并行子评审（preload 原生层 / views 视图层 / components 组件层）+ 主评审对核心层（DB、utils、services、构建配置）逐文件阅读
> 已实测验证：`npx vite build` 通过（3.10s）；CryptoJS 对明文解密行为；git 分支名命令注入复现；`grep` 全仓引用关系扫描

## 0. 项目速览

| 项目 | 情况 |
| --- | --- |
| 形态 | uTools 插件（Electron 渲染进程 + `preload` 原生能力），代码发布工具 |
| 前端 | Vue 3.5 `<script setup>` + TypeScript + Element Plus 2.13 + Vue Router 4 + Tailwind 4 + Vite 7 |
| 原生 | `public/preload/*.js`（CommonJS，`node-ssh` 13 / `ssh2`，随包内置 `node_modules`） |
| 规模 | `src` 约 7.3k 行（19 个 .vue / 13 个 .ts）、preload 约 1.5k 行 |
| 数据 | 全部存 uTools DB（`window.utools.db`），按 `_id` 每类一个文档，`datas` 字段存 JSON 字符串 |
| 构建 | 通过；主 chunk 1.03 MB（gzip 338 kB，Element Plus 全量引入） |
| 类型检查 | **不存在**：无 `tsconfig.json`、未安装 `typescript`/`vue-tsc`、无 `typecheck`/`lint`/`test` 脚本 |
| 测试 | 无 |

结论：**功能完整度远高于工程完整度**。核心链路（拉取项目 → 组任务 → SSH 上传 → 远程命令）是通的，但安全边界（原生层的 shell/远端命令拼接）、凭据处理、错误处理与抽象层是明显短板。下面按严重度列出，每条都给了位置、证据与修法。

---

## 1. P0 致命问题（建议立即处理）

### 1.1 【实测复现】git 分支名命令注入 → 任意本地命令执行

- 位置：[public/preload/git.service.js:37](public/preload/git.service.js#L37)、[:66](public/preload/git.service.js#L66)、[:288](public/preload/git.service.js#L288)、[public/preload/shell.service.js:42](public/preload/shell.service.js#L42)
- 证据：

```js
// git.service.js:37
remoteName = execSync(`git config branch.${currentBranch}.remote`, { cwd: projectPath, ... })
```

  `currentBranch` 来自 `git rev-parse --abbrev-ref HEAD`。**git 允许分支名包含反引号、`$`、`;`、`&`**（仅禁空格、`~^:?*[\`、`..` 等），实测：

```
branch = "pwn`touch${IFS}/tmp/INJ_MARKER`"
执行 git config branch.<该分支>.remote 后 /tmp/INJ_MARKER 被创建 → 注入确认
```

- 影响：打开/导入任意第三方仓库（或拉取到恶意分支）即可在用户机器上执行任意命令。同类拼接还有 `git rev-list ... ${currentBranch}...`、`switchBranch` 的 `checkout ${branchName}`，以及 shell.service.js 中把 `filePath`/`workingDir` 拼进 `exec`/`osascript`/`-Command`。
- 修法：一律改 `execFileSync('git', ['config', \`branch.${b}.remote\`])`（不经过 shell）；分支名加白名单校验；shell 侧改 `execFile/spawn` 传参数数组，禁止字符串拼接。

### 1.2 【核心风险】远程 `rm -rf` 未校验、未转义，且删除在前上传在后

- 位置：[public/preload/ssh.js:138](public/preload/ssh.js#L138)（同类拼接：[:112](public/preload/ssh.js#L112)、[:125](public/preload/ssh.js#L125)、[:129](public/preload/ssh.js#L129)、[:147](public/preload/ssh.js#L147)、[:200](public/preload/ssh.js#L200)、[:277](public/preload/ssh.js#L277)）
- 证据：

```js
const deleteResult = await ssh.execCommand(`rm -rf ${remoteFolder}`);
```

  `remote_path` 在 UI 里是 `allow-create` 的自由文本（[src/components/task/change.vue:49-58](src/components/task/change.vue#L49-L58)），校验只有 `required`。填入 `/` 会删远端根目录；含空格/`;`/`$()` 则命令注入。
- 影响：一次误操作或一条恶意任务即可清空线上服务器；`exclude_paths` 的恢复用 `mv ${tempDir}/* ...`，**不匹配隐藏文件**，随后的 `rm -rf ${tempDir}` 会把未恢复的 `.env` 之类永久删除；且上传失败时**没有回滚**，远端目录已空。
- 修法：`remote_path` 强制绝对路径白名单（拒绝 `/`、含 `..`、空白与 shell 元字符）；远端参数统一单引号转义或用 sftp 删除；`mv -f ${tempDir}/. ${remoteFolder}/` 并校验退出码；先上传到临时目录成功后再原子切换。

### 1.3 上传失败被吞掉 → 发布“假成功”

- 位置：[public/preload/ssh.js:220-229](public/preload/ssh.js#L220-L229)
- 证据：

```js
await ssh.putFile(localFilePath, remoteFilePath + '/' + fileName).then(
  function () { console.log('The File thing is done'); },
  function (error) { console.log("Something's wrong"); console.log(error); },
);
onProcess(`File uploaded to server ${server.host}`);   // 无条件执行
```

  拒绝分支只打日志、不抛出，`putFile` 失败后仍上报“File uploaded”，最终 `publish` 正常返回 → 队列状态写 `success`。
- 影响：用户看到“发布完成”，服务器上其实是旧文件。这是最危险的一类 bug（静默错误）。
- 修法：`await ssh.putFile(...)` 让异常冒泡，删除调试日志。

### 1.4 凭据加解密不对称 → passphrase 永久丢失、私钥认证必然失败

- 位置：写入端 [src/DB/ssh.db.ts:61](src/DB/ssh.db.ts#L61)、[:82](src/DB/ssh.db.ts#L82)；读取端 [src/views/SSh/index.vue:174](src/views/SSh/index.vue#L174)（及 [:185](src/views/SSh/index.vue#L185)、[:204](src/views/SSh/index.vue#L204)、[:237](src/views/SSh/index.vue#L237)）、[src/views/DataSync/index.vue:280](src/views/DataSync/index.vue#L280)
- 证据：`addSsh`/`updateSsh` 只加密 `password`，**`passphrase` 明文入库**；但读取端对 `passphrase` 也调用 `decrypt()`。实测（node + crypto-js，key 与源码一致）：

```
decrypt("mypassphrase") => ""      // 对非密文返回空串，不抛错
```

- 影响：① 编辑一次私钥认证的服务器，passphrase 被静默清空并写回；② `testConnect`/`openSSHTerminal` 以空 passphrase 认证 → **私钥+口令的服务器永远连不上**，且报错与真实原因无关。
- 修法：抽 `services/secrets.ts` 统一加解密，password/passphrase 成对处理；`decrypt` 失败要显式报错而不是返回空串。

### 1.5 指令/远程路径的“编辑”实际执行“新增” → 每次编辑产生重复记录

- 位置：[src/components/command/change.vue:63-64](src/components/command/change.vue#L63-L64)、[src/components/remote/change.vue:63-64](src/components/remote/change.vue#L63-L64) + [src/utils/dialog.ts:16](src/utils/dialog.ts#L16) + [src/views/Command/index.vue:137](src/views/Command/index.vue#L137)
- 证据：`init(datas: string)` 只传 `{ content: datas }`，而 `useDialogForm.openDialog` 里 `id.value = data?.id` 因此恒为 `undefined` → `if (id.value)` 永假 → 走 `addCommand/addRemote`（新增）；emit 后父组件又按 `editingCommand` 调一次 `updateCommand(old, new)`。
- 影响：编辑一条指令 → 列表出现两条同内容记录；对话框标题也恒为“新增”。（对比 `project/ssh/task` 三个 change.vue 传的是整对象，`id` 正常 —— 典型的兄弟组件行为漂移。）
- 修法：`init` 传 `{ id, content }`；`update*` 分支与父组件二次写入二者只留其一。

### 1.6 明文凭据外发：导出/上传 Gist 含 SSH 明文密码，密钥硬编码在 bundle

- 位置：[src/views/DataSync/index.vue:256-281](src/views/DataSync/index.vue#L256-L281)（导出解密）、[:305](src/views/DataSync/index.vue#L305)/[:413](src/views/DataSync/index.vue#L413)（上传 Gist）、[:476](src/views/DataSync/index.vue#L476)（Gitee token 拼进 URL）；[src/utils/CryptoJS.ts:13](src/utils/CryptoJS.ts#L13)
- 证据：`password: decrypt(item.password)` 让导出 JSON 携带**全部服务器明文口令**（passphrase 本来就是明文），再上传到 GitHub/Gitee Gist；AES 口令 `const secretKey = 'percf5ohFjFGj7uF'` 硬编码在前端产物里，等于混淆而非加密；Gitee 请求把 `access_token` 放在 query string（会进日志/代理）。
- 修法：导出默认脱敏（只给 host/username/私钥路径），需要凭据时要求用户输入一次性导出口令；token 走 `Authorization` 头或 uTools 加密存储；密钥改为每台机器随机生成、存在 uTools 安全存储，或干脆不在渲染层持有凭据。

### 1.7 发布“超时”无取消语义 + `publishBusy` 全局锁死

- 位置：[src/utils/utools.ts:39-49](src/utils/utools.ts#L39-L49)、[public/preload/ssh.js:251-255](public/preload/ssh.js#L251-L255)
- 证据：`Promise.race([publish(...), timeout])` 只让**调用方**超时，底层上传仍在跑且 `publishBusy` 保持 `true`；此后所有发布（含队列）都抛 `Publish in progress`，直到重载插件。
- 影响：一次网络慢就“永久锁死发布功能”，且用户会认为任务已失败而重试。
- 修法：按 `runId` 管理任务 + 显式 abort（`ssh.end`）或超时后显式复位 `publishBusy`；队列状态与真实执行状态对齐。

---

## 2. P1 高危问题

### 2.1 DB 层用 `resolve(Error)` 表示失败，对话框当成功处理

[src/DB/project.db.ts:97](src/DB/project.db.ts#L97)、[src/DB/ssh.db.ts:80](src/DB/ssh.db.ts#L80)、[src/DB/task.db.ts:78](src/DB/task.db.ts#L78) 是 `return new Error('...')`；而 [src/components/project/change.vue:151-157](src/components/project/change.vue#L151-L157) 是 `api().then((res) => { emit('success', res); notifySuccess(); })`。记录不存在时照样弹“操作成功”，还把 `Error` 当 payload 抛给父组件。相似地 [src/DB/helpers.ts:30](src/DB/helpers.ts#L30) `throw res`（`res` 是 `{ok:false}` 普通对象，所有 `catch(e){ e.message }` 都是 `undefined`）。→ 统一改 `throw new Error(...)`，`helpers` 包装成 `Error`。

### 2.2 5 个弹窗无防重复提交

[project/change.vue:52](src/components/project/change.vue#L52)、[ssh/change.vue:49](src/components/ssh/change.vue#L49)、[task/change.vue:127](src/components/task/change.vue#L127)、[remote/change.vue:34](src/components/remote/change.vue#L34)、[command/change.vue:34](src/components/command/change.vue#L34) 的“确定”按钮无 `:loading`/`:disabled`，`validate()` 异步回调期间不加锁 → 双击即写两次（新增路径直接产生重复记录）。→ 加 `submitting` 状态。

### 2.3 删除/新增失败被静默吞掉

[src/views/Home/index.vue:487-497](src/views/Home/index.vue#L487-L497)、[src/views/Project/index.vue:515-524](src/views/Project/index.vue#L515-L524)：`removeX(row.id).then(...)` **未 return**，内层 rejection 不会进入外层 `.catch`；[src/views/SSh/index.vue:271](src/views/SSh/index.vue#L271) 是 `.catch(() => {})`。→ DB 失败时用户看不到任何提示，列表也不刷新。复制/新增路径（`addTask`/`addProject`/`addSsh`）同样全无 catch。

### 2.4 无类型检查：`lang="ts"` 是装饰性的

无 `tsconfig.json`、`node_modules` 里没有 `typescript`/`vue-tsc`，`package.json` 也没有 `typecheck` 脚本；`jsconfig.json` 仅在编辑器里对 .js 生效。全仓 `any`/`as any` 共 36 处，`.ts` 只是被 esbuild 剥类型。→ 至少补 `tsconfig.json`（可复用 jsconfig 的 `paths`）+ `vue-tsc --noEmit` 脚本，先修 P0/P1 相关类型。

### 2.5 构建/依赖配置问题

- [src/utils/CryptoJS.ts:11](src/utils/CryptoJS.ts#L11) 运行时 `import CryptoJS from 'crypto-js'`，`@element-plus/icons-vue` 也在 SFC 里运行时导入，但二者都写在 `devDependencies`（[package.json](package.json)）→ `npm i --production` 后构建/运行会缺包。
- `marked@^17` 是声明依赖但全仓零引用；[tailwind.config.js](tailwind.config.js) 22KB 是 v3 默认配置全量转储、**无 `extend`**，而 Tailwind 4 不会自动读取它（[src/main.css:1](src/main.css#L1) 只有 `@import 'tailwindcss'`，无 `@config`）→ 纯死文件，可删。
- [src/main.js:12-24](src/main.js#L12-L24) 全量 `app.use(ElementPlus)` + 全量 CSS，同时 vite 还配了 `unplugin-auto-import`/`unplugin-vue-components` 的 `ElementPlusResolver` → 两套机制并存，主 chunk 1.03 MB。二选一（推荐按需 + 手动引 ElMessage 样式）。

### 2.6 云端同步无校验、无回滚、无备份

[src/views/DataSync/index.vue:276-294](src/views/DataSync/index.vue#L276-L294)：Gist 内容 `JSON.parse` 后直接 `Promise.all` 覆盖 6 个文档，无 schema/版本校验、无事务、失败不回滚、覆盖前不自动备份；`error !== 'cancel'` 的判定（[:395](src/views/DataSync/index.vue#L395)）在 `'close'`/字符串 reject 时会打印“下载失败: undefined”。→ 导入前 `JSON` 结构校验 + 自动导出备份 + 串行写入按失败回滚。

### 2.7 原生层同步阻塞 + 假并发

[src/utils/git-worker.ts](src/utils/git-worker.ts) 用 `maxConcurrent = 3` 的队列包装 `window.services.getGitInfo`，但 preload 侧是 `execSync`（[git.service.js:29/59/95/176/256](public/preload/git.service.js#L29)），**preload 与渲染同线程**，队列对阻塞毫无帮助；`getGitInfo` 还会对每个项目执行 `git fetch`（5s 超时）→ 项目多时导入即卡 UI。另外 `git status` 超默认 1MB `maxBuffer` 抛 ENOBUFS 被降级成“无改动”（[:100](public/preload/git.service.js#L100)），发布前检查形同虚设。→ 改异步 `execFile` + `timeout`/`maxBuffer`，并把 git 放进主进程/子进程。

### 2.8 私钥认证的服务器无法列远程目录（前后端契约不一致）

[src/components/task/change.vue:300-308](src/components/task/change.vue#L300-L308) 只传 `{host, port, username, password}`，而 [public/preload/ssh.js:16](public/preload/ssh.js#L16) 需要 `auth_type === 'privateKey' && private_key`，否则 `config.password = undefined` → 密钥登录的服务器在“排除删除”面板必然失败。另外 `listRemoteDirectory` 抛异常、`testConnect` 返回 `{success,error}`，两套契约并存。→ 传完整配置，统一返回值。

### 2.9 发布日志串流 / 日志抽屉先开再校验

[src/views/Home/index.vue:342-367](src/views/Home/index.vue#L342-L367)：`onLog` 闭包写同一个 `taskUpInfo` ref，前一次仍在跑的发布会把日志追加到新抽屉里，且无法按 `runId` 区分；同时 `isShowDrawer = true` 在路径/服务器校验之前，校验失败时留下空白抽屉。→ 日志按 `runId` 收归 `publish-manager`，先校验后开抽屉。

### 2.10 项目 Git 状态可能写错行

[src/views/Project/index.vue:272-278](src/views/Project/index.vue#L272-L278) 用闭包 `index` 写 `projectData.value[index].git_info`，而列表在 `@success="getTableData"` 时会整体重建（[:163](src/views/Project/index.vue#L163)）→ 刷新期间编辑/删除会导致状态写到别的项目；`getTableData()` 在 setup 里被调用两次（[:400](src/views/Project/index.vue#L400)、[:527](src/views/Project/index.vue#L527)），每次都同步探测全部项目类型。→ 按 `id` 匹配回写，去重初始化。

### 2.11 弹窗生命周期脏：校验状态与跨记录脏数据残留

[src/utils/dialog.ts:8-12](src/utils/dialog.ts#L8-L12) 的 `resetDialog` 从不 `clearValidate()` → 重开对话框带上一轮红色错误态；[src/components/project/change.vue:68-76](src/components/project/change.vue#L68-L76) 的 initial 不含 `project_type`，`Object.assign` 不删旧键 → 编辑过 Vue 项目后点“新增”，仍会渲染上一轮的“Vue”标签并可能落库；`:before-close="cancel"`（[:17](src/components/project/change.vue#L17)）没有接收 `done` 回调。→ `resetDialog` 里 `clearValidate()` + 用 `@closed` 收尾，`project_type` 进 initial。

### 2.12 取消文件选择被当成已选择

[safeOpenDialog](src/utils/utools.ts#L71-L77) 取消时返回 `[]`（真值），而 [src/components/project/change.vue:114](src/components/project/change.vue#L114) 写的是 `if (!files) return;`，于是 `formData.path = undefined`（并触发一次无意义探测）；[src/components/task/change.vue:244-246](src/components/task/change.vue#L244-L246) 同型。对照正确写法 [src/components/ssh/change.vue:144](src/components/ssh/change.vue#L144) `if (files && files.length > 0)`。→ 统一守卫。

### 2.13 `task/change.vue` 的定时器与未捕获 Promise

[src/components/task/change.vue:363-367](src/components/task/change.vue#L363-L367) 用 `setTimeout(..., 500)` 等 5 个并行 DB 读取完成，慢一点就静默拿不到 ssh 配置（“排除删除”永远为空、`remoteFileList` 还是上一个任务的残留），定时器也不清理；[:258-287](src/components/task/change.vue#L258-L287) 的 5 个 `.then(...)` 全无 `.catch` → unhandled rejection、下拉静默为空。→ 改 `Promise.all` + `await`，统一 catch。

### 2.14 文件型任务隐藏了破坏性开关，值却是 `true`

[src/components/task/change.vue:60](src/components/task/change.vue#L60) 把“删除远程/备份远程”整块 `v-if="isDir"` 隐藏，但 initial 是 `is_removed: true, is_save: true`（[:170-171](src/components/task/change.vue#L170-L171)）且原样落库。上传单个文件时用户**无法在 UI 里关掉**这两个会删远端目录/打 zip 的开关（服务端 `publish` 对文件走另一分支，但语义已埋雷）。→ 按类型给不同默认值，或在提交时按路径类型归一化。

---

## 3. P2 中危与工程质量

### 3.1 死代码（可直接删，约 1.5k 行）

| 位置 | 说明 |
| --- | --- |
| [src/components/layout/](src/components/layout/index.vue)（4 文件 222 行） | 全仓零 import；`App.vue` 自带底部导航。`RecursiveMenu.vue` 还依赖全局 `AnyObject`、读不存在的 `extend.icon` |
| [src/mock/menu.ts](src/mock/menu.ts)（70 行） | 零引用，且菜单已在 router/App.vue 各维护一份（文案已漂移：`远程管理` vs `SSH管理`） |
| [src/views/Hello/index.vue](src/views/Hello/index.vue)、[Read](src/views/Read/index.vue)、[Write](src/views/Write/index.vue) | router 与 `plugin.json` 均无对应入口，不可达 |
| [src/types/index.type.ts:15](src/types/index.type.ts#L15) `treeItemType` | 仅被上面两个死文件使用 |
| [src/utils/git-worker.ts:120-131](src/utils/git-worker.ts#L120-L131) `clear/getQueueSize/isProcessing`、[src/utils/utools.ts:27](src/utils/utools.ts#L27) `safePublish` | 未使用 |
| [public/preload/ssh.js:32-80](public/preload/ssh.js#L32-L80) 连接池 + 60s `setInterval` | `getPooledConnection` 未被 `ssh.service.js` 导出、`publish` 也不用它；命中判定读 `connection.state`（ssh2 无此属性）恒为 false，命中即 `delete` 却不 `dispose` → 死代码 + 连接泄漏 |
| preload 未使用导出 | `executeRemoteCommand`、`getAllBranches`、`executeGitCommand`、`gitPull/Push/Fetch`、`switchBranch`、`readDoc`。其中 `switchBranch`/`executeGitCommand` 等于把“任意 git 命令”暴露给渲染层，建议直接删 |
| [src/utils/git-worker.ts:56-62](src/utils/git-worker.ts#L56-L62) `refresh/uncommitted/lastCommit` 分支 | 无调用方（只用了 `'full'`） |

### 3.2 重复与结构性债

- **5 个 `change.vue` 共 952 行，≥250 行逐字重复**；`remote/change.vue` 与 `command/change.vue` 仅差 9 行（已 diff 验证）。→ 建议抽 `components/common/ChangeDialog.vue`：props `visible/title/rules/initial/submit`，emits `update:visible/success/closed`，内置防重复提交、`clearValidate`、统一 catch；先用它替换等价的 remote/command。
- **`Command` 与 `Remote` 两个 148 行页面逐行同构**；GitHub/Gitee 同步逻辑在 [DataSync](src/views/DataSync/index.vue#L297-L512) 里逐行抄了两遍（约 200 行）。→ `useCrudList` + `createGistSync(provider)`。
- **列表页样板复制 5 份**（Home/Project/SSh/Command/Remote 各写 searchInput + `createDebounce(300)` + 过滤 computed + 异步弹窗 ref + 删除确认）；其中 Project/SSh/Command/Remote 同时有 `@input="triggerSearch"` 和 `watch(searchInput, ...)`，重复触发，Home 只有 watch。
- [src/views/Doc/index.vue](src/views/Doc/index.vue) 676 行里约 450 行是硬编码静态 HTML 文档，与 [README.md](README.md)、[public/preload/read.md](public/preload/read.md)、[SHELL_FEATURES.md](SHELL_FEATURES.md) 构成 4 份会漂移的文档。
- [src/views/Home/index.vue](src/views/Home/index.vue) 517 行同时承担筛选、分组、发布编排、日志渲染；`filterTableData`（[:243](src/views/Home/index.vue#L243)）是死 computed，同一筛选谓词写了 3 遍。

### 3.3 工程化/配置

- [public/plugin.json](public/plugin.json) 只有 `main/preload/logo/development/features`，缺 `pluginName`、`version`、`description`、`author`、`homepage` 等 uTools 元数据；[index.html](index.html) 无 `<title>`、无 CSP。
- [vite.config.js:44-52](vite.config.js#L44-L52)：`host: '0.0.0.0'` + `cors: true` + `Access-Control-Allow-Origin: *`（开发服务器暴露到局域网；建议仅本机）。
- 路由用 `createWebHistory()`（[src/router/index.ts:111](src/router/index.ts#L111)），而 `base: './'` 与 `plugin.json` 的 `main: index.html` 说明产物是被本地路径加载的：**若打包后以 `file://` 打开，`pushState` 会抛 SecurityError（白屏）**，开发态走 `http://localhost:3020` 掩盖了这一点。**需在真实 uTools 打包环境验证**；为稳妥建议改 `createWebHashHistory()`（[参考](https://www.bytezonex.com/archives/electron-vue-router-production-white-screen-fix.html)）。
- [src/App.vue:114](src/App.vue#L114) `window.utools.showNotification('hello test')` 调试残留，每次进入插件都弹通知；[:107](src/App.vue#L107) `enterAction` 赋值后从未使用；[:113](src/App.vue#L113) 空回调。
- 缺 `typecheck`/`lint`/`test`；仓库里装了 `prettier.config.cjs` 但未装 prettier；`.npmrc` 有 `engine-strict=true` 而 `package.json` 无 `engines`。
- `public/preload/node_modules` 内置 `sshcrypto.node`/`cpufeatures.node` 等原生二进制（当前目录里是 darwin 构建，已被 .gitignore 排除），跨平台分发时需按平台重装。

### 3.4 小问题与体验

- `settings` 里的 `git_auto_refresh_enabled`/`git_auto_refresh_interval`/`terminal_custom_command` 只存不读，是空功能（[src/views/Settings/index.vue:72](src/views/Settings/index.vue#L72)）。
- [src/views/Settings/index.vue:45](src/views/Settings/index.vue#L45) `<component :is="'CircleCheck'">` 用字符串解析动态组件，icons 未全局注册 → 图标不渲染（终端列表只剩文字）；同文件 [:121](src/views/Settings/index.vue#L121) 的 import 因此未被使用。
- 底部导航 `tabindex="0"` 但无 `@keydown.enter/space`（[src/App.vue:19-29](src/App.vue#L19-L29)）；Project/Command/Remote 的图标按钮无 `title`/`aria-label`（SSh 有），行内刷新按钮无 loading 可连点重复入队。
- [src/views/Project/index.vue:434](src/views/Project/index.vue#L434)/[:445](src/views/Project/index.vue#L445) `element.split('/').pop()` 在 Windows 反斜杠路径下取不到目录名；[src/utils/project.ts:30](src/utils/project.ts#L30) 的 `a || b || c && d` 优先级会让 React+Vite 项目被判成 Vue。
- [src/utils/git-worker.ts:120-123](src/utils/git-worker.ts#L120-L123) `clear()` 把 `activeCount` 归零会让在途任务的计数漂移、排队 Promise 永挂。
- `services/publish-manager.ts`：插件重启后 DB 里的队列不会被恢复处理（只有新入队才会触发 drain）且会因 `queueCache` 丢失被标记失败（[:88-103](src/services/publish-manager.ts#L88-L103)）；`state.byTask` 无清理会无限增长；`setPublishConcurrency` 修改模块级状态、组发布写 1 之后不还原（[Home:373](src/views/Home/index.vue#L373)）。
- `safePublish`/`safeReadFile` 等在 `window.services` 缺失时静默返回成功/空值（[src/utils/utools.ts:27-37](src/utils/utools.ts#L27-L37)），浏览器里调试时会掩盖问题。
- `ssh.js` 用 `stderr` 非空判定 `zip`/`rm` 失败（[:114](public/preload/ssh.js#L114)、[:139](public/preload/ssh.js#L139)），`zip` 打警告会误判中断发布；`onProcess` 被当必选参数（[:264](public/preload/ssh.js#L264)），不传时 catch 自身抛错。
- `shell.service.js:10` `exec(\`open "${filePath}"\`)` 不传 callback：失败既不抛也不触发 uncaught，`try/catch` 是死代码，永远返回 `{success:true}` → UI 永远提示“已打开”；`shell.service.js:199` 还把完整 ssh 命令（含密码形态）写入剪贴板。

---

## 4. 建议的修复顺序

**第 0 阶段（当天，防事故）**
1. `execSync` → `execFileSync`（git.service.js）+ 远端命令参数转义/白名单（ssh.js 的 `rm -rf`/`mv`/`zip`/`ls`/`mkdir`）。
2. `putFile` 失败抛出（1.3）＋ `decrypt` 失败显式报错、`passphrase` 加解密对称（1.4）＋ `rm -rf` 前加二次确认（校验路径为绝对路径且非 `/`）。
3. 删掉 `App.vue:114` 调试通知。

**第 1 阶段（本周，正确性）**
4. DB 层失败改 `throw`；对话框统一 `submitting` 防重复提交 + `res instanceof Error` 判定。
5. 修 command/remote 的 `init` id 传递（1.5）；统一取消选择的 `files.length > 0` 守卫；`resetDialog` 补 `clearValidate()`。
6. 发布超时/`publishBusy` 有取消与复位；日志按 `runId` 隔离。
7. DataSync：导入校验 + 自动备份 + 脱敏导出；token 移出 query。

**第 2 阶段（两周内，结构与工程化）**
8. 抽 `ChangeDialog` + `useCrudList`，合并 5 个 change.vue 与 5 个列表页；DataSync 抽 `createGistSync`。
9. 补 `tsconfig.json` + `vue-tsc --noEmit` + eslint/prettier 脚本，纳入 CI；把 `crypto-js`、`@element-plus/icons-vue` 移到 `dependencies`。
10. 清理死代码（§3.1）、删 [tailwind.config.js](tailwind.config.js)、去掉 `marked`、Element Plus 改按需引入，主 chunk 目标 < 400 kB。
11. git 调用异步化（`execFile` + timeout）并移出渲染线程。

---

## 5. 复核结论：这些地方是好的

- 数据层虽朴素但一致：每个实体一个 uTools 文档、`helpers.ts` 统一读写、写失败会抛（虽然抛的是裸对象），没有直接写 localStorage。
- 没有 `v-html`/`innerHTML`，路由与列表均用模板插值，**当前未发现 XSS 面**；把原生能力统一收敛到 `window.services` 是对的方向（问题在于收敛后未做参数校验）。
- 发布流程有队列、并发控制、`runId`、状态汇总与重试封装的雏形（`publish-manager.ts`），方向正确，只是缺少恢复/取消语义。
- `vite build` 干净通过，无编译错误；`public/` 与 `dist/` 的 preload 文件逐字节一致，构建链路本身是可信的。
- 搜索/过滤、分组视图、git 状态展示、终端探测等交互细节打磨得比较完整。

> 报告中标注「实测」的结论均已在本机复现（git 分支注入、CryptoJS 明文解密、`vite build`）；标注「needs verification」的仅路由 history 模式与 uTools 打包环境的组合，需在真实插件环境确认。

---

## 6. 修复记录（本轮已提交到工作区）

`npx vite build` 通过（4.06s）。共 27 个文件，+786 / -641。

### 6.1 你点名的「远程路径管理编辑后会新建数据」

**根因**：远程路径/指令这两类实体的主键就是字符串本身（`getRemoteList(): Promise<string[]>`），
但弹窗沿用了 `useDialogForm` 的 `id` 机制，而 `init(datas: string)` 只传了 `{ content: datas }`，
`id.value = data?.id` 恒为 `undefined` → `if (id.value)` 永远走 `addRemote`（新增）；
emit 之后父组件又按 `editingRemote` 调了一次 `updateRemote(old, new)` → **一条编辑变成"改一条 + 新增一条"**。

修复（三处一起改，缺一不可）：

| 文件 | 改动 |
| --- | --- |
| [src/utils/dialog.ts](src/utils/dialog.ts) | `openDialog` 不再把 `id` 混进 `formData`（顺带修掉 `id` 污染表单、破坏 `*NoId` 契约的问题） |
| [src/components/remote/change.vue](src/components/remote/change.vue)、[command/change.vue](src/components/command/change.vue) | `init(datas?: string)` 传 `{ id: datas, content: datas }`，编辑即走 `update*`；标题也会正确显示"编辑" |
| [src/views/Remote/index.vue](src/views/Remote/index.vue)、[Command/index.vue](src/views/Command/index.vue) | 删掉 `editingRemote/editingCommand` + `handleSuccess` 的二次写入，改 `@success="getTableData"`，单一写入方 |

顺带在数据层加了去重护栏：`addRemote/addCommand` 拒绝同名，`updateRemote/updateCommand` 拒绝改成已存在的值，
删除/更新目标不存在时抛错（不再是 `return false` 被忽略）。

**验证**：用 esbuild 打包真实模块 + mock uTools DB 跑了 26 条断言全部通过，其中直接覆盖：
「编辑后仍只有一条记录（原来会产生 2 条）」「原值保存不误判重复」「编辑已删除的记录报错」以及弹窗 `id` 契约。
真实 `git.service.js` 也用带反引号分支名的仓库跑过（注入不再发生、状态仍能正常读取）。

### 6.2 同批修掉的问题

| 分类 | 改动 | 文件 |
| --- | --- | --- |
| 命令注入 | 全部 `execSync(模板串)` → `execFileSync('git', [args])`；`switchBranch` 走 argv；补 `timeout`/`maxBuffer` | [git.service.js](public/preload/git.service.js) |
| 远端注入/误删 | 远端路径做结构校验（绝对路径、非 `/`、无 `..`），所有远端命令参数统一单引号转义；`putFile` 失败上抛（不再"上传失败但提示成功"）；`zip`/`rm` 改按退出码判定；排除项恢复改 `cp -a`（带隐藏文件）且只在成功后才删临时目录；删除连接池死代码与常驻定时器 | [ssh.js](public/preload/ssh.js) |
| 发布锁死 | 渲染端超时后，等底层上传真正结束再释放 native 的 `publishBusy`（新增 `resetPublishState`）；`window.services.publish` 缺失时返回错误而不是假成功 | [utools.ts](src/utils/utools.ts)、[ssh.service.js](public/preload/ssh.service.js) |
| 凭据 | 新增 `safeEncrypt/safeDecrypt/isEncrypted`：`passphrase` 与 `password` 成对加密；**历史明文口令原样保留不再被清空**；所有读取点改用 `safeDecrypt`；Home 发布前也解密 `passphrase`（私钥+口令的服务器之前必然认证失败） | [CryptoJS.ts](src/utils/CryptoJS.ts)、[ssh.db.ts](src/DB/ssh.db.ts)、[SSh](src/views/SSh/index.vue)/[Home](src/views/Home/index.vue)/[task](src/components/task/change.vue)/[DataSync](src/views/DataSync/index.vue) |
| DB 语义 | `return new Error(...)` → `throw new Error(...)`；`helpers` 把 uTools 的裸错误对象包装成 `Error`（否则 `e.message` 恒为 undefined） | [project](src/DB/project.db.ts)/[ssh](src/DB/ssh.db.ts)/[task](src/DB/task.db.ts)/[task-group](src/DB/task-group.db.ts)、[helpers.ts](src/DB/helpers.ts) |
| 失败不再静默 | 删除/复制/新增全部补 `catch` 并回显真实错误；`removeX(...).then(...)` 补 `return` 让 rejection 能被外层捕获 | Project/SSh/Home/Command/Remote |
| 表单 | 5 个弹窗加 `submitting` 防重复提交；`closeDialog` 统一 `clearValidate`；`:before-close` 正确接收 `done`；取消选择文件不再覆盖已填路径；project 的 `project_type` 不再跨记录残留 | 5 个 `change.vue` |
| 任务弹窗 | 去掉 `setTimeout(500)` 猜时间，改 `await Promise.all(...)` 后再拉远端目录；`listRemoteDirectory` 传完整 ssh 配置（私钥认证之前必然失败）；两个重复函数合并；保存前校验服务器是否已被删除 | [task/change.vue](src/components/task/change.vue) |
| 首页流程 | 先校验再开日志抽屉；任务组保存包 try/catch；`normalizeTaskGroups` 判断反了（每次进首页都重写任务表）并补 catch；删除失败可感知 | [Home/index.vue](src/views/Home/index.vue) |
| 项目页 | Git 状态改为写在当前行对象上（按 index 回写会串行）；去掉重复的 `getTableData()`；刷新按钮加 loading 防连点；Windows 路径取目录名 | [Project/index.vue](src/views/Project/index.vue) |
| 其他 | 去掉每次进插件都弹的 `showNotification('hello test')`；`onPluginEnter` 只跳转已注册路由；Settings 终端列表图标改真实组件（之前不渲染） | [App.vue](src/App.vue)、[Settings](src/views/Settings/index.vue) |

### 6.3 第二轮：导出凭据改密文 + Gitee 鉴权

**导出改成密文会不会影响原有数据？结论：不会，三种情况都验证通过。**

新增 [src/services/data-port.ts](src/services/data-port.ts) 统一收口导出/导入格式（顺带补上了导入结构校验）：

| 场景 | 结果 |
| --- | --- |
| 老备份（1.0 明文）→ 新版本导入 | ✓ `safeEncrypt` 自动加密入库，口令可正常还原 |
| 新备份（1.1 密文）→ 新版本导入 | ✓ `safeEncrypt` 幂等直通，**不会二次加密** |
| 导出操作本身 | ✓ 只读，本地 DB 一个字节都不会变（已断言导出前后数据完全一致） |
| DB 里残留的历史明文行 | ✓ 导出时顺带补加密，导入后仍可还原 |
| 新备份（1.1 密文）→ **旧版本**插件导入 | ✗ 旧版会二次加密导致口令不可用（需要同版本或更新版本恢复） |

实现要点：导出不再 `decrypt`，改成 `safeEncrypt`（已是密文则原样保留，是明文则补加密），
格式版本升到 `1.1` 并写入 `credentialFormat: 'encrypted'` 自描述字段；
导入端不改分支即可兼容两种格式。验证脚本 17 条断言全通过。

**需要你知情的一点**：密文用的是插件内置密钥（[CryptoJS.ts:13](src/utils/CryptoJS.ts#L13)），
所以它的作用是**避免口令被直接看到/被密钥扫描器命中**，而不是对拿到插件本体的攻击者的保护。
真要抗攻击，需要改成"用户自定义口令 + PBKDF2 派生密钥"的加密导出（可另开一轮）。
UI 上也补了一句说明。

**Gitee：查了官方 spec，结论是"文档不支持请求头，但实测支持，已做成带头回退"。**

拉到了官方 OpenAPI 规范本体 `https://gitee.com/api/v5/swagger_doc`（swagger 2.0，info.version = 5.4.93，175 个路径），统计结果：

- `access_token` 出现 **264 次，全部是 `in: query`（194）或 `in: formData`（70）**；
- **全 spec 中 `in: header` 的参数数量为 0**，顶层既无 `security` 也无 `securityDefinitions`。

所以：**官方文档里没有请求头鉴权这条路**，原先把 token 放 query 其实是照文档写的。实测对照（公开仓库接口，匿名应 200）：

```
无鉴权                              -> 200
Authorization: token bogus          -> 401   ← 说明这个头确实被解析
Authorization: Bearer bogus         -> 401   ← Bearer 也认
Authorization: bogus（无 scheme）    -> 200   ← 没有 scheme 会被忽略
X-Gitee-Token: bogus                -> 200   ← 不认
?access_token=bogus                 -> 401   ← 文档写法
```

据此把 [handleGiteeDownload](src/views/DataSync/index.vue#L436) 改成：**优先用 `Authorization: token <pat>` 头，
遇到 401/403 自动回退到文档的 query 写法**，并用一个复刻控制流的脚本确认了"2 次请求 + 最终判定"符合预期。
上传/更新接口（POST/PATCH）按文档把 token 放在 JSON body 里，本来就不进 URL，未改动。

### 6.4 第三轮：把上面这份「待拍板」清单逐项做掉

| 原条目 | 处理结果 | 验证方式 |
| --- | --- | --- |
| 1. 导出密文只是混淆 | ✅ 按你的决定：**不引入备份口令**，导出继续用内置密钥密文（`credentialFormat: 'encrypted'`），只保留 1.0 明文兼容与 1.1 格式标记。曾实现的 PBKDF2+AES+HMAC 口令方案已完整移除，不留无用表面 | 回归脚本：新格式可导入、1.0 老格式仍可导入、结构错误被拦 |
| 2. 导入无回滚 | ✅ 新增 `runWithRollback`：写入前快照 6 个文档，任一步失败按**当前 `_rev`** 把 `datas` 恢复原状；错误文案区分「已回滚」与「回滚不完整（列出失败文档）」 | 用带 `_rev` 冲突语义、`get` 返回深拷贝的 mock DB 验证：注入一处写入失败后，3 个文档内容与导入前逐字节一致 |
| 3. 重启残留队列 / `byTask` 膨胀 | ✅ 启动时 `recoverPublishState()`：残留队列与 `running` 统一收尾为「插件重启导致上一次发布中断，请重新发布」（**不自动续跑**，避免一开插件就往服务器推代码），并清理已删除任务的历史状态 | 11 条断言（含幂等性） |
| 4. 结构重构 + 死代码 | ✅ 删掉约 1.5k 行死代码（`components/layout/*`、`mock/menu.ts`、`views/Hello\|Read\|Write`、`tailwind.config.js`、`marked`、未使用的 preload 导出）；指令/远程路径两页两弹窗**合并为一套**（494 → 294 行）；5 个弹窗统一到 `useEntityDialog`，消灭「有的防重复提交、有的不清校验」这类行为漂移 | 19 条弹窗引擎断言 + 构建 + 类型检查 |
| 5. 工程化 | ✅ 装 `typescript` / `vue-tsc` / `prettier` / `@types/*`，新增 [tsconfig.json](tsconfig.json) 与 `typecheck` `format` `format:check` 脚本，**33 个类型错误全部清零**（含 2 个真实类型 bug：项目页读错字段、终端类型在 IPC 边界退化成 string） | `vue-tsc --noEmit` → 0 error |
| 6. 路由 history 模式 | ✅ 改 `createWebHashHistory()`，http（开发）与 `file://`（打包）都能用，无副作用 | 构建通过 |
| 7. `shell.service.js` | ✅ 全部改 `spawn/execFile` 传 argv；AppleScript 经 `osascript -e` argv 传入（不再拼 `sh -c`）；抽出 [shell-quote.js](public/preload/shell-quote.js) 统一 POSIX/AppleScript/PowerShell 转义；ssh 主机/用户名/端口加白名单校验；**失败不再无条件返回 `success:true`**（前置检查 `code`/`idea`/`Tabby.exe`/路径是否存在） | 22 条断言：脏主机名被拒、含空格与单引号的路径在 shell 里完整还原、注入 payload 未被执行 |
| 8. Element Plus 体积 | ✅ **先量化再动手**：模板侧共用到 28 种组件（`el-button` 55、`el-form-item` 43、`el-input` 29…）、`ElMessage` 26 处、`ElMessageBox` 5 处、无指令用法。已做**「组件 JS 按需 + 样式全量」**：移除 `app.use(ElementPlus)`，语言包改走 `el-config-provider`；**CSS 按需按决定不做**，`importStyle: false` 已写进注释锁死 | 实测 A/B（同一份代码）：JS **1176 → 653 KB（−44%）**，CSS 364 KB 不变（=全量 index.css，无重复注入），合计 **1541 → 1017 KB（−33%）**；主 chunk 1038 kB → 最大 171 kB；28/28 组件均被 resolver 解析（有守卫脚本），类型检查 0 错 |

**关于 Element Plus：已按「JS 按需 + CSS 全量」定稿**

量化结果（模板侧）：28 种组件、272 处标签；`el-button` 55、`el-form-item` 43、`el-input` 29、`el-table-column` 18、`el-option` 17、`el-icon` 16；
JS API 只有 `ElMessage`（26 处）与 `ElMessageBox`（5 处）；没有 `v-loading` 等指令用法。Element Plus 共有 80+ 个组件，所以**约 2/3 的组件 JS 原本是白打的**。

已落地：移除 `app.use(ElementPlus)`，组件由 `unplugin-vue-components` + `ElementPlusResolver({ importStyle: false })` 按需引入，
语言包改由 `<el-config-provider :locale="zhCn">` 提供，**样式一律使用全量 `element-plus/dist/index.css`**（因此不可能出现样式缺失，新增组件也不用补样式）。
A/B 实测同一份代码：**JS 1176 → 653 KB（−44%），CSS 364 KB 不变，合计 −33%**，主 chunk 从 1038 kB 降到最大 171 kB。
`importStyle: false` 的必要性已写进 [vite.config.js](vite.config.js) 与 [src/main.js](src/main.js) 注释，避免以后被误改回按需样式而叠加重复 CSS。

### 6.5 三个待定项已全部定稿

| 事项 | 决定 | 落地状态 |
| --- | --- | --- |
| 备份口令（PBKDF2 加密导出） | 不需要 | 相关代码已完整移除，导出维持内置密钥密文 + 1.0 明文兼容 |
| `pnpm typecheck` 接 pre-commit / CI | 不接 | 脚本保留，可手动 `pnpm typecheck`（当前 0 error） |
| Element Plus | JS 按需、CSS 不按需 | 已落地并用注释锁死，JS −44% |

另外两件只是「知情」：本轮新增了 5 个 devDependencies（已写入 [package.json](package.json) 与 `pnpm-lock.yaml`，`pnpm install` 即可）；
装了 typescript 之后 unplugin 会自动生成 `auto-imports.d.ts` / `components.d.ts`，已加入 [.gitignore](.gitignore)。
