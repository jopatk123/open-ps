// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hexToRgb, hueToHex, normalizeHex, rgbToHex, rgbToHsb } from '../../src/lib/color';

describe('lib/color', () => {
  it('normalizeHex 接受 3/6 位，可带 #，大小写不限', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('1a2B3c')).toBe('#1a2b3c');
    expect(normalizeHex(' #000000 ')).toBe('#000000');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('zzzzzz')).toBeNull();
  });

  it('hex 与 RGB 互转', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe('#ff8000');
    expect(rgbToHex({ r: 300, g: -5, b: 12.4 })).toBe('#ff000c');
  });

  it('RGB → HSB', () => {
    expect(rgbToHsb({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, b: 0 });
    expect(rgbToHsb({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, b: 100 });
    expect(rgbToHsb({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, b: 100 });
    expect(rgbToHsb({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, b: 50 });
  });

  it('hueToHex', () => {
    expect(hueToHex(0)).toBe('#ff0000');
    expect(hueToHex(120)).toBe('#00ff00');
    expect(hueToHex(240)).toBe('#0000ff');
    expect(hueToHex(360)).toBe('#ff0000');
  });
});
