import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMANDS } from '../../src/app/commands/registry';
import type { AppCommand, AppContext } from '../../src/app/commands/types';
import { createKeyDownHandler, isEditableTarget } from '../../src/app/keyboard';
import { TOOLS } from '../../src/app/toolDefs';

function context(overrides: Partial<AppContext> = {}): AppContext {
  return {
    hasDocument: true,
    hasSelection: false,
    canUndo: false,
    canRedo: false,
    layerCount: 3,
    activeLayerIndex: 2,
    activeLayerIsText: false,
    activeLayerVisible: true,
    layerBelowVisible: true,
    openDialog: () => {},
    comingSoon: () => {},
    ...overrides,
  };
}

describe('全局键盘分发', () => {
  let blocked = false;
  let isMac = false;
  const setTool = vi.fn();
  const resetForeground = vi.fn();
  const runCommand = vi.fn<(c: AppCommand) => void>();
  let handler: (e: KeyboardEvent) => void;

  function press(code: string, init: KeyboardEventInit = {}, target: HTMLElement = document.body) {
    const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(e);
    return e;
  }

  beforeEach(() => {
    blocked = false;
    isMac = false;
    setTool.mockReset();
    resetForeground.mockReset();
    runCommand.mockReset();
    handler = (e) =>
      createKeyDownHandler({
        commands: COMMANDS,
        isMac,
        getContext: () => context(),
        isBlocked: () => blocked,
        runCommand,
        setTool,
        resetForeground,
      })(e);
    document.addEventListener('keydown', handler);
  });

  afterEach(() => {
    document.removeEventListener('keydown', handler);
    document.body.innerHTML = '';
  });

  it('10 个字母键切换到对应工具', () => {
    for (const t of TOOLS) {
      const e = press(t.code);
      expect(setTool).toHaveBeenLastCalledWith(t.id);
      expect(e.defaultPrevented).toBe(true);
    }
    expect(setTool).toHaveBeenCalledTimes(10);
  });

  it('按物理键位识别，不受大小写/布局影响', () => {
    press('KeyB', { key: 'B' });
    press('KeyM', { key: 'ь' });
    expect(setTool.mock.calls).toEqual([['brush'], ['marquee']]);
  });

  it('在输入框、文本域、下拉框、可编辑区域中打字不会切换工具', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    document.body.append(input, textarea, select, editable);
    for (const el of [input, textarea, select, editable]) press('KeyB', {}, el);
    expect(setTool).not.toHaveBeenCalled();
  });

  it('复选框获得焦点时字母键仍可切换工具', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.append(checkbox);
    press('KeyT', {}, checkbox);
    expect(setTool).toHaveBeenCalledWith('text');
  });

  it('输入法组字时忽略', () => {
    press('KeyB', { isComposing: true });
    expect(setTool).not.toHaveBeenCalled();
  });

  it('带修饰键时不切换工具', () => {
    press('KeyB', { shiftKey: true });
    press('KeyB', { altKey: true });
    press('KeyV', { ctrlKey: true });
    press('KeyB', { metaKey: true });
    expect(setTool).not.toHaveBeenCalled();
  });

  it('D 复位前景色', () => {
    press('KeyD');
    expect(resetForeground).toHaveBeenCalledTimes(1);
    expect(setTool).not.toHaveBeenCalled();
  });

  it('对话框或菜单打开时不处理', () => {
    blocked = true;
    press('KeyB');
    press('KeyO', { ctrlKey: true });
    expect(setTool).not.toHaveBeenCalled();
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('匹配命令快捷键并阻止浏览器默认行为', () => {
    const e = press('KeyO', { ctrlKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(runCommand.mock.calls[0]?.[0].id).toBe('file.open');

    press('KeyN', { ctrlKey: true, altKey: true });
    expect(runCommand.mock.calls[1]?.[0].id).toBe('file.new');

    press('KeyS', { ctrlKey: true });
    press('KeyS', { ctrlKey: true, shiftKey: true });
    expect(runCommand.mock.calls.slice(2).map((c) => c[0].id)).toEqual([
      'file.export',
      'file.export',
    ]);
  });

  it('禁用的命令仍阻止默认行为但不执行（如无选区时 Ctrl+D）', () => {
    const e = press('KeyD', { ctrlKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(runCommand).not.toHaveBeenCalled();
    expect(resetForeground).not.toHaveBeenCalled();
  });

  it('macOS 上 ⌘ 代替 Ctrl', () => {
    isMac = true;
    press('KeyO', { metaKey: true });
    expect(runCommand.mock.calls[0]?.[0].id).toBe('file.open');
  });

  it('isEditableTarget', () => {
    const text = document.createElement('input');
    const range = document.createElement('input');
    range.type = 'range';
    expect(isEditableTarget(text)).toBe(true);
    expect(isEditableTarget(range)).toBe(false);
    expect(isEditableTarget(document.createElement('button'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
