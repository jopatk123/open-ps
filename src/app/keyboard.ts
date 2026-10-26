import { isEnabled } from './commands/registry';
import { matchesShortcut } from './commands/shortcut';
import type { AppCommand, AppContext } from './commands/types';
import { toolByCode, type ToolId } from './toolDefs';

export interface KeyboardDeps {
  commands: readonly AppCommand[];
  isMac: boolean;
  getContext(): AppContext;
  /** 有模态对话框或菜单打开时为 true：按键交给它们自己处理 */
  isBlocked(): boolean;
  runCommand(c: AppCommand): void;
  setTool(id: ToolId): void;
  resetForeground(): void;
}

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** 焦点是否在可输入文字的控件上（此时不触发快捷键）。 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(target.type);
  return false;
}

/**
 * 全局 keydown 分发（ARCHITECTURE §7 的 Step 2 子集）：
 * IME/输入框 → 忽略；对话框/菜单打开 → 交给它们；命令注册表；无修饰键字母 → 切换工具；`D` → 前景色复位。
 */
export function createKeyDownHandler(deps: KeyboardDeps): (e: KeyboardEvent) => void {
  return (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (deps.isBlocked()) return;
    if (isEditableTarget(e.target)) return;

    for (const c of deps.commands) {
      if (!c.shortcuts?.some((s) => matchesShortcut(e, s, deps.isMac))) continue;
      e.preventDefault();
      if (isEnabled(c, deps.getContext())) deps.runCommand(c);
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

    const tool = toolByCode(e.code);
    if (tool) {
      e.preventDefault();
      deps.setTool(tool.id);
      return;
    }
    if (e.code === 'KeyD') {
      e.preventDefault();
      deps.resetForeground();
    }
  };
}
