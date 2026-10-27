/** 是否 macOS（菜单快捷键显示 ⌘，`ctrl` 匹配 `metaKey`）。 */
export function isMacPlatform(nav: { platform?: string; userAgent?: string } | undefined): boolean {
  if (!nav) return false;
  return /Mac|iPhone|iPad|iPod/i.test(nav.platform ?? '') || /Mac OS X/i.test(nav.userAgent ?? '');
}

export const IS_MAC = isMacPlatform(typeof navigator === 'undefined' ? undefined : navigator);
