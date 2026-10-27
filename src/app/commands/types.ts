import type { CommandId, MenuId } from '../strings';

export type { CommandId, MenuId };

export interface Shortcut {
  /** `KeyboardEvent.code`，如 `KeyN`、`F5`、`Backspace` */
  code: string;
  /** Windows 为 Ctrl，macOS 自动匹配 ⌘ */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type DialogId = 'new' | 'open' | 'export' | 'colorPicker';

/** 命令执行与可用性判断所需的上下文。Step 2 由 mock 的 shell store 提供。 */
export interface AppContext {
  hasDocument: boolean;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  layerCount: number;
  /** 当前图层下标，0 = 最底层；无文档时为 -1 */
  activeLayerIndex: number;
  activeLayerIsText: boolean;
  activeLayerVisible: boolean;
  layerBelowVisible: boolean;
  openDialog(id: DialogId): void;
  /** 弹出"该功能将在后续版本提供"提示 */
  comingSoon(): void;
}

export interface MenuPlacement {
  menu: MenuId;
  order: number;
  separatorBefore?: boolean;
}

export interface AppCommand {
  id: CommandId;
  label: string;
  menu?: MenuPlacement;
  /** 第一个用于菜单显示 */
  shortcuts?: readonly Shortcut[];
  enabled?(ctx: AppContext): boolean;
  run(ctx: AppContext): void | Promise<void>;
}
