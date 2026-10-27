import type { Shortcut } from './types';

const KEY_LABELS: Record<string, string> = {
  Backspace: 'Backspace',
  Delete: 'Delete',
  Enter: 'Enter',
  Escape: 'Esc',
  Space: 'Space',
  Equal: '=',
  Minus: '-',
  BracketLeft: '[',
  BracketRight: ']',
};

const MAC_KEY_LABELS: Record<string, string> = {
  Backspace: '⌫',
  Delete: '⌦',
  Enter: '↩',
  Escape: '⎋',
};

export function keyLabel(code: string, mac = false): string {
  if (mac && MAC_KEY_LABELS[code]) return MAC_KEY_LABELS[code];
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1] ?? code;
  const digit = /^Digit(\d)$/.exec(code);
  if (digit) return digit[1] ?? code;
  return code;
}

/**
 * 菜单显示文本。Windows 按 CS5 顺序 `Shift+Alt+Ctrl+键`；macOS 按系统惯例 `⌥⇧⌘键`。
 */
export function formatShortcut(s: Shortcut, mac = false): string {
  if (mac) {
    return `${s.alt ? '⌥' : ''}${s.shift ? '⇧' : ''}${s.ctrl ? '⌘' : ''}${keyLabel(s.code, true)}`;
  }
  const parts: string[] = [];
  if (s.shift) parts.push('Shift');
  if (s.alt) parts.push('Alt');
  if (s.ctrl) parts.push('Ctrl');
  parts.push(keyLabel(s.code));
  return parts.join('+');
}

type KeyLike = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>;

export function matchesShortcut(e: KeyLike, s: Shortcut, mac = false): boolean {
  const primary = mac ? e.metaKey : e.ctrlKey;
  const other = mac ? e.ctrlKey : e.metaKey;
  return (
    e.code === s.code &&
    primary === !!s.ctrl &&
    !other &&
    e.shiftKey === !!s.shift &&
    e.altKey === !!s.alt
  );
}
