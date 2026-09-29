#!/usr/bin/env node
/**
 * 从 CHANGELOG.md 提取某个版本的发布说明，用于粘贴到 GitHub / cnb 的 Release。
 * 版本记录只维护 CHANGELOG.md 一处，这里不再手写。
 *
 * 用法：
 *   pnpm release:notes            # 取最新版本
 *   pnpm release:notes 2.1.0      # 取指定版本（可写 v2.1.0）
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const lines = changelog.split(/\r?\n/);

/** '## 2.1.0 - 2026-09-29' / '## 2.0.0' */
const VERSION_RE = /^##\s+(.+?)(?:\s+-\s+(.+))?$/;

const versions = [];
lines.forEach((line, index) => {
  const matched = line.match(VERSION_RE);
  if (matched) {
    versions.push({
      version: matched[1].trim(),
      date: (matched[2] || '').trim(),
      start: index,
    });
  }
});

if (versions.length === 0) {
  console.error('CHANGELOG.md 中没有找到 “## <版本号>” 小节');
  process.exit(1);
}

const wanted = (process.argv[2] || '').replace(/^v/, '');
const entry = wanted ? versions.find((item) => item.version === wanted) : versions[0];

if (!entry) {
  console.error(`CHANGELOG.md 中没有版本 ${wanted}`);
  console.error(`可用版本：${versions.map((item) => item.version).join(', ')}`);
  process.exit(1);
}

const next = versions[versions.indexOf(entry) + 1];
const body = lines
  .slice(entry.start + 1, next ? next.start : lines.length)
  .join('\n')
  // 版本小节末尾自带一条 ---（与下一个版本的分隔线），去掉后由下面的 footer 统一分隔
  .replace(/\n*-{3,}\s*$/, '')
  .trim();

const footer = [
  '---',
  '',
  '**安装 / 升级**',
  '',
  '- uTools 应用市场：<https://www.u-tools.cn/plugins/detail/zr-publish/>',
  '- 离线包：见本 Release 的 Assets 中的 `.upxs` 文件（无需审核，安装时 uTools 会给出安全提示）',
  '',
  '**完整变更**：见仓库中的 `CHANGELOG.md`',
].join('\n');

// 说明写到 stderr，正文写到 stdout，方便直接重定向保存
console.error(`# 版本 v${entry.version}${entry.date ? `  ${entry.date}` : ''}`);
console.log(`${body}\n\n${footer}`);
