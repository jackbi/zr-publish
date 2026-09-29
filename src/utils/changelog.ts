/**
 * @Description: 解析 CHANGELOG.md，供「使用文档 → 版本历史」渲染。
 * 版本记录只在 CHANGELOG.md 维护一处，文档页不再手写，避免两边不一致。
 * 通过 Vite 的 ?raw 在构建期把文件内容内联进来；uTools 以 file:// 运行，不能运行时读文件。
 * @FilePath: /zr-publish/src/utils/changelog.ts
 */
import changelogRaw from '../../CHANGELOG.md?raw';

export interface ChangelogSection {
  /** 小节标题（已去掉 emoji）；无小节的版本为空串 */
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  /** 版本标题下的一句话说明（markdown 引用块），可能为空 */
  intro: string;
  sections: ChangelogSection[];
}

const HEADING = /^##\s+(.+)$/;
const SECTION = /^###\s+(.+)$/;
const BULLET = /^[-*]\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;

/** 去掉标题开头的 emoji 与分隔空格：'🔒 安全修复' -> '安全修复' */
const stripEmoji = (text: string) =>
  text
    .replace(/^[\p{Extended_Pictographic}\u{FE0F}\u{20E3}]+\s*/u, '')
    .replace(/[（(]\s*[)）]\s*$/, '')
    .trim();

/**
 * 把条目里的行内 markdown 转成 HTML：**加粗** 与 `代码`。
 * 先做 HTML 转义，CHANGELOG 里出现的 <url> 之类也会被正确显示。
 */
export const renderInline = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

export const parseChangelog = (raw: string): ChangelogEntry[] => {
  const entries: ChangelogEntry[] = [];
  let entry: ChangelogEntry | null = null;
  let section: ChangelogSection | null = null;

  const ensureSection = (title: string) => {
    section = { title, items: [] };
    entry?.sections.push(section);
  };

  raw.split(/\r?\n/).forEach((line) => {
    const heading = line.match(HEADING);
    if (heading) {
      // '## 2.1.0 - 2026-09-29' / '## 2.0.0'
      const [version, date = ''] = heading[1].split(/\s+-\s+/);
      entry = { version: version.trim(), date: date.trim(), intro: '', sections: [] };
      entries.push(entry);
      section = null;
      return;
    }

    if (!entry) return;

    const sub = line.match(SECTION);
    if (sub) {
      ensureSection(stripEmoji(sub[1]));
      return;
    }

    const quote = line.match(QUOTE);
    if (quote) {
      entry.intro = entry.intro ? `${entry.intro} ${quote[1].trim()}` : quote[1].trim();
      return;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      if (!section) ensureSection('');
      // section 在上面的 ensureSection 里已赋值，这里用局部变量取得更明确的类型
      const target = entry.sections[entry.sections.length - 1];
      target.items.push(bullet[1].trim());
    }
  });

  return entries.filter((item) => item.version);
};

export const changelogEntries = parseChangelog(changelogRaw);
