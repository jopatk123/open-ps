import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** 从 docs/PRODUCT.md 读取菜单与工具清单，作为测试的唯一期望来源。 */
const PRODUCT_MD = readFileSync(
  fileURLToPath(new URL('../../docs/PRODUCT.md', import.meta.url)),
  'utf8',
);

function section(startHeading: string, endHeading: string): string {
  const start = PRODUCT_MD.indexOf(startHeading);
  const end = PRODUCT_MD.indexOf(endHeading, start + 1);
  if (start < 0 || end < 0) throw new Error(`PRODUCT.md 中找不到 ${startHeading}`);
  return PRODUCT_MD.slice(start, end);
}

function tableRows(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim()),
    )
    .filter((cells) => !/^-+$/.test(cells[0] ?? '') && cells[0] !== '菜单项' && cells[0] !== '#');
}

export interface DocMenuItem {
  label: string;
  /** 实际绑定的快捷键（去掉括号中 PS 原键位的说明），第一个用于菜单显示 */
  shortcuts: string[];
}

export interface DocMenu {
  title: string;
  items: DocMenuItem[];
}

export function productMenus(): DocMenu[] {
  const text = section('### 6.1', '### 6.2');
  return text
    .split('\n#### ')
    .slice(1)
    .map((block) => {
      const title = block.split('\n')[0]!.trim();
      const items = tableRows(block).map(([label = '', shortcutCell = '']) => {
        const withoutNotes = shortcutCell.replace(/（[^）]*）/g, '');
        const shortcuts = [...withoutNotes.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
        return { label, shortcuts };
      });
      return { title, items };
    });
}

export interface DocTool {
  label: string;
  key: string;
}

export function productTools(): DocTool[] {
  const text = section('### 6.2', '### 6.3');
  return tableRows(text).map(([, label = '', key = '']) => ({
    label,
    key: key.replace(/`/g, ''),
  }));
}
