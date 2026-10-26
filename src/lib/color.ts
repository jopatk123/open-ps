export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSB {
  /** 0..360 */
  h: number;
  /** 0..100 */
  s: number;
  /** 0..100 */
  b: number;
}

/**
 * 解析 `#RGB` / `#RRGGBB`（`#` 可省略，大小写不限），返回规范化的 `#rrggbb`；无效输入返回 null。
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return null;
}

export function hexToRgb(hex: string): RGB {
  const n = normalizeHex(hex);
  if (n === null) throw new Error(`Invalid hex color: ${hex}`);
  const v = parseInt(n.slice(1), 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsb({ r, g, b }: RGB): HSB {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h: Math.round(h), s: Math.round(s * 100), b: Math.round(max * 100) };
}

/** 色相为 h、饱和度与明度均为 100% 的纯色，用于拾色器方块底色。 */
export function hueToHex(h: number): string {
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = 1 - Math.abs((hh % 2) - 1);
  const table: Array<[number, number, number]> = [
    [1, x, 0],
    [x, 1, 0],
    [0, 1, x],
    [0, x, 1],
    [x, 0, 1],
    [1, 0, x],
  ];
  const [r, g, b] = table[Math.floor(hh) % 6] ?? [1, 0, 0];
  return rgbToHex({ r: r * 255, g: g * 255, b: b * 255 });
}
