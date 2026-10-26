import { S, type MenuId } from '../strings';
import type { AppCommand } from './types';

/** 顶部菜单，仅 6 个，顺序固定（PRODUCT §6.1）。 */
export const MENU_ORDER: readonly MenuId[] = [
  'file',
  'edit',
  'image',
  'layer',
  'select',
  'effects',
];

export interface MenuItem {
  command: AppCommand;
  separatorBefore: boolean;
}

export interface Menu {
  id: MenuId;
  title: string;
  items: MenuItem[];
}

export function buildMenus(commands: readonly AppCommand[]): Menu[] {
  return MENU_ORDER.map((id) => {
    const items = commands
      .filter((c) => c.menu?.menu === id)
      .sort((a, b) => (a.menu?.order ?? 0) - (b.menu?.order ?? 0))
      .map((command, i) => ({
        command,
        separatorBefore: i > 0 && !!command.menu?.separatorBefore,
      }));
    return { id, title: S.menus[id], items };
  });
}
