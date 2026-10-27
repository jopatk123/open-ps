// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildMenus } from '../../src/app/commands/menus';
import { COMMANDS } from '../../src/app/commands/registry';
import { formatShortcut } from '../../src/app/commands/shortcut';
import { productMenus } from './productDoc';

const menus = buildMenus(COMMANDS);
const docMenus = productMenus();

describe('命令注册表与 PRODUCT §6.1 菜单清单一致', () => {
  it('能从 PRODUCT.md 解析出 6 个菜单', () => {
    expect(docMenus.map((m) => m.title)).toEqual(['文件', '编辑', '图像', '图层', '选择', '特效']);
    expect(docMenus.every((m) => m.items.length > 0)).toBe(true);
  });

  it('菜单标题与顺序一致', () => {
    expect(menus.map((m) => m.title)).toEqual(docMenus.map((m) => m.title));
  });

  for (const doc of docMenus) {
    it(`「${doc.title}」菜单项文案、顺序与快捷键逐字一致`, () => {
      const menu = menus.find((m) => m.title === doc.title);
      expect(menu).toBeDefined();
      const actual = menu!.items.map((item) => ({
        label: item.command.label,
        shortcuts: (item.command.shortcuts ?? []).map((s) => formatShortcut(s)),
      }));
      expect(actual).toEqual(doc.items);
    });
  }

  it('分隔线位置（PRODUCT 未列出，按 CS5 分组约定）', () => {
    const separators = Object.fromEntries(
      menus.map((m) => [m.id, m.items.map((i) => i.separatorBefore)]),
    );
    expect(separators).toEqual({
      file: [false, false, true],
      edit: [false, false, true, true],
      image: [false, false],
      layer: [false, false, false, true, false, true],
      select: [false, false, true],
      effects: [false, false],
    });
  });

  it('所有命令都出现在菜单中，id 唯一', () => {
    const ids = COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(COMMANDS.every((c) => c.menu)).toBe(true);
  });

  it('没有重复的快捷键绑定', () => {
    const keys = COMMANDS.flatMap((c) => (c.shortcuts ?? []).map((s) => formatShortcut(s)));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('不注册浏览器保留键（PRODUCT §8.3）', () => {
    const reserved = new Set([
      'Ctrl+N',
      'Shift+Ctrl+N',
      'Ctrl+T',
      'Shift+Ctrl+T',
      'Ctrl+W',
      'Shift+Ctrl+W',
      'Ctrl+Tab',
      'Ctrl+PageUp',
      'Ctrl+PageDown',
      ...Array.from({ length: 9 }, (_, i) => `Ctrl+${i + 1}`),
    ]);
    const keys = COMMANDS.flatMap((c) => (c.shortcuts ?? []).map((s) => formatShortcut(s)));
    expect(keys.filter((k) => reserved.has(k))).toEqual([]);
  });
});
