// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { TOOLS, toolByCode, toolTooltip } from '../../src/app/toolDefs';
import { productTools } from './productDoc';

describe('工具栏与 PRODUCT §6.2 一致', () => {
  it('10 个工具的顺序、名称与字母键一致', () => {
    const doc = productTools();
    expect(doc).toHaveLength(10);
    expect(TOOLS.map((t) => ({ label: t.label, key: t.key }))).toEqual(doc);
  });

  it('悬停提示格式为「移动工具 (V)」', () => {
    expect(toolTooltip(TOOLS[0]!)).toBe('移动工具 (V)');
  });

  it('按物理键位查找工具', () => {
    expect(toolByCode('KeyW')?.id).toBe('magicWand');
    expect(toolByCode('KeyD')).toBeUndefined();
  });
});
