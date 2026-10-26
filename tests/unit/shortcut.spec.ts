// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatShortcut, matchesShortcut } from '../../src/app/commands/shortcut';

const key = (
  code: string,
  mods: Partial<Record<'ctrl' | 'meta' | 'shift' | 'alt', boolean>> = {},
) => ({
  code,
  ctrlKey: !!mods.ctrl,
  metaKey: !!mods.meta,
  shiftKey: !!mods.shift,
  altKey: !!mods.alt,
});

describe('formatShortcut', () => {
  it('Windows 按 CS5 顺序 Shift+Alt+Ctrl+键', () => {
    expect(formatShortcut({ code: 'KeyN', ctrl: true, shift: true, alt: true })).toBe(
      'Shift+Alt+Ctrl+N',
    );
    expect(formatShortcut({ code: 'F5', shift: true })).toBe('Shift+F5');
    expect(formatShortcut({ code: 'Backspace', shift: true })).toBe('Shift+Backspace');
  });

  it('macOS 显示 ⌥⇧⌘ 符号', () => {
    expect(formatShortcut({ code: 'KeyN', ctrl: true, shift: true, alt: true }, true)).toBe('⌥⇧⌘N');
    expect(formatShortcut({ code: 'KeyO', ctrl: true }, true)).toBe('⌘O');
  });
});

describe('matchesShortcut', () => {
  const ctrlO = { code: 'KeyO', ctrl: true };

  it('修饰键必须完全一致', () => {
    expect(matchesShortcut(key('KeyO', { ctrl: true }), ctrlO)).toBe(true);
    expect(matchesShortcut(key('KeyO', { ctrl: true, shift: true }), ctrlO)).toBe(false);
    expect(matchesShortcut(key('KeyO'), ctrlO)).toBe(false);
    expect(matchesShortcut(key('KeyO', { ctrl: true, meta: true }), ctrlO)).toBe(false);
  });

  it('macOS 上 ctrl 匹配 ⌘', () => {
    expect(matchesShortcut(key('KeyO', { meta: true }), ctrlO, true)).toBe(true);
    expect(matchesShortcut(key('KeyO', { ctrl: true }), ctrlO, true)).toBe(false);
  });
});
