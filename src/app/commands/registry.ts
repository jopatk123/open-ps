import { S, type CommandId } from '../strings';
import type { AppCommand, AppContext, MenuPlacement, Shortcut } from './types';

const hasDoc = (ctx: AppContext) => ctx.hasDocument;
const hasSelection = (ctx: AppContext) => ctx.hasDocument && ctx.hasSelection;

function cmd(
  id: CommandId,
  menu: MenuPlacement,
  shortcuts: readonly Shortcut[],
  run: AppCommand['run'],
  enabled?: AppCommand['enabled'],
): AppCommand {
  return { id, label: S.commands[id], menu, shortcuts, run, enabled };
}

const comingSoon = (ctx: AppContext) => ctx.comingSoon();

/**
 * 菜单与快捷键的唯一来源（ARCHITECTURE §7）。文案、顺序与键位以 PRODUCT §6.1 为准。
 * Step 2：`run()` 只打开空对话框或提示"该功能将在后续版本提供"。
 * 浏览器保留键（PRODUCT §8.3）一律不注册。
 */
export const COMMANDS: readonly AppCommand[] = [
  // 文件
  cmd('file.new', { menu: 'file', order: 10 }, [{ code: 'KeyN', ctrl: true, alt: true }], (ctx) =>
    ctx.openDialog('new'),
  ),
  cmd('file.open', { menu: 'file', order: 20 }, [{ code: 'KeyO', ctrl: true }], (ctx) =>
    ctx.openDialog('open'),
  ),
  cmd(
    'file.export',
    { menu: 'file', order: 30, separatorBefore: true },
    [
      { code: 'KeyS', ctrl: true, shift: true },
      { code: 'KeyS', ctrl: true },
    ],
    (ctx) => ctx.openDialog('export'),
    hasDoc,
  ),

  // 编辑
  cmd(
    'edit.undo',
    { menu: 'edit', order: 10 },
    [{ code: 'KeyZ', ctrl: true }],
    comingSoon,
    (ctx) => ctx.canUndo,
  ),
  cmd(
    'edit.redo',
    { menu: 'edit', order: 20 },
    [
      { code: 'KeyZ', ctrl: true, shift: true },
      { code: 'KeyY', ctrl: true },
    ],
    comingSoon,
    (ctx) => ctx.canRedo,
  ),
  cmd(
    'edit.contentAwareFill',
    { menu: 'edit', order: 30, separatorBefore: true },
    [
      { code: 'F5', shift: true },
      { code: 'Backspace', shift: true },
    ],
    comingSoon,
    hasSelection,
  ),
  cmd(
    'edit.freeTransform',
    { menu: 'edit', order: 40, separatorBefore: true },
    [{ code: 'KeyT', ctrl: true, alt: true }],
    comingSoon,
    hasDoc,
  ),

  // 图像
  cmd(
    'image.canvasSize',
    { menu: 'image', order: 10 },
    [{ code: 'KeyC', ctrl: true, alt: true }],
    comingSoon,
    hasDoc,
  ),
  cmd(
    'image.imageSize',
    { menu: 'image', order: 20 },
    [{ code: 'KeyI', ctrl: true, alt: true }],
    comingSoon,
    hasDoc,
  ),

  // 图层
  cmd(
    'layer.duplicate',
    { menu: 'layer', order: 10 },
    [{ code: 'KeyJ', ctrl: true }],
    comingSoon,
    (ctx) => ctx.hasDocument && ctx.activeLayerIndex >= 0,
  ),
  cmd('layer.duplicateTo', { menu: 'layer', order: 20 }, [], comingSoon, (ctx) => {
    return ctx.hasDocument && ctx.activeLayerIndex >= 0;
  }),
  cmd(
    'layer.new',
    { menu: 'layer', order: 30 },
    [{ code: 'KeyN', ctrl: true, shift: true, alt: true }],
    comingSoon,
    hasDoc,
  ),
  cmd(
    'layer.mergeDown',
    { menu: 'layer', order: 40, separatorBefore: true },
    [{ code: 'KeyE', ctrl: true }],
    comingSoon,
    (ctx) =>
      ctx.hasDocument &&
      ctx.activeLayerIndex > 0 &&
      ctx.activeLayerVisible &&
      ctx.layerBelowVisible,
  ),
  cmd(
    'layer.mergeVisible',
    { menu: 'layer', order: 50 },
    [{ code: 'KeyE', ctrl: true, shift: true }],
    comingSoon,
    (ctx) => ctx.hasDocument && ctx.layerCount > 1,
  ),
  cmd(
    'layer.rasterize',
    { menu: 'layer', order: 60, separatorBefore: true },
    [],
    comingSoon,
    (ctx) => ctx.hasDocument && ctx.activeLayerIsText,
  ),

  // 选择
  cmd(
    'select.deselect',
    { menu: 'select', order: 10 },
    [{ code: 'KeyD', ctrl: true }],
    comingSoon,
    hasSelection,
  ),
  cmd(
    'select.inverse',
    { menu: 'select', order: 20 },
    [
      { code: 'KeyI', ctrl: true, shift: true },
      { code: 'F7', shift: true },
    ],
    comingSoon,
    hasSelection,
  ),
  cmd(
    'select.modify',
    { menu: 'select', order: 30, separatorBefore: true },
    [],
    comingSoon,
    hasSelection,
  ),

  // 特效
  cmd('effects.gaussianBlur', { menu: 'effects', order: 10 }, [], comingSoon, hasDoc),
  cmd('effects.sharpen', { menu: 'effects', order: 20 }, [], comingSoon, hasDoc),
];

export function isEnabled(c: AppCommand, ctx: AppContext): boolean {
  return c.enabled ? c.enabled(ctx) : true;
}
