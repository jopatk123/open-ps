import { S, type ToolId } from './strings';

export type { ToolId };

export interface ToolDef {
  id: ToolId;
  label: string;
  /** 显示用的字母，如 `V` */
  key: string;
  /** 对应的物理键位 `KeyboardEvent.code` */
  code: string;
}

const def = (id: ToolId, key: string): ToolDef => ({
  id,
  label: S.tools[id],
  key,
  code: `Key${key}`,
});

/** 左侧工具栏，顺序固定（PRODUCT §6.2）。 */
export const TOOLS: readonly ToolDef[] = [
  def('move', 'V'),
  def('marquee', 'M'),
  def('magicWand', 'W'),
  def('crop', 'C'),
  def('brush', 'B'),
  def('eyedropper', 'I'),
  def('pen', 'P'),
  def('clone', 'S'),
  def('fill', 'G'),
  def('text', 'T'),
];

export function toolByCode(code: string): ToolDef | undefined {
  return TOOLS.find((t) => t.code === code);
}

export function toolTooltip(t: ToolDef): string {
  return S.toolTooltip(t.label, t.key);
}
