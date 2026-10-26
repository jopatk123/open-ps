import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { tabTitle, useShellStore } from '../../src/app/stores/shell';

const names = (s: ReturnType<typeof useShellStore>) => s.activeTab!.layers.map((l) => l.name);

describe('shell store（mock）', () => {
  let s: ReturnType<typeof useShellStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    s = useShellStore();
  });

  it('两个 mock 标签，标题格式与 CS5 一致', () => {
    expect(s.tabs).toHaveLength(2);
    expect(s.tabs.map(tabTitle)).toEqual([
      '未命名-1 @ 100% (图层 2, RGB/8)',
      '未命名-2 @ 100% (图层 1, RGB/8)',
    ]);
    expect(names(s)).toEqual(['背景', '文字', '图层 2']);
  });

  it('默认移动工具、黑色前景色；D 复位', () => {
    expect(s.activeToolId).toBe('move');
    s.setForeground('#ff0000');
    s.resetForeground();
    expect(s.foregroundColor).toBe('#000000');
  });

  it('关闭标签后激活相邻标签', () => {
    const [a, b] = s.tabs;
    s.closeTab(a!.id);
    expect(s.activeTabId).toBe(b!.id);
    s.closeTab(b!.id);
    expect(s.activeTab).toBeUndefined();
  });

  it('新建图层插在当前图层上方并递增编号', () => {
    s.selectLayer(s.activeTab!.layers[0]!.id);
    s.createLayer();
    expect(names(s)).toEqual(['背景', '图层 3', '文字', '图层 2']);
    expect(s.activeLayer?.name).toBe('图层 3');
  });

  it('删除图层后选中下方图层；只剩一个时不能删除', () => {
    s.deleteLayer(s.activeLayer!.id);
    expect(names(s)).toEqual(['背景', '文字']);
    expect(s.activeLayer?.name).toBe('文字');
    s.deleteLayer(s.activeLayer!.id);
    s.deleteLayer(s.activeLayer!.id);
    expect(names(s)).toEqual(['背景']);
  });

  it('重排、显隐、重命名、不透明度、复制', () => {
    s.moveLayer(2, 0);
    expect(names(s)).toEqual(['图层 2', '背景', '文字']);

    const l = s.activeLayer!;
    s.toggleVisibility(l.id);
    expect(l.visible).toBe(false);

    s.renameLayer(l.id, '  天空  ');
    expect(l.name).toBe('天空');
    s.renameLayer(l.id, '   ');
    expect(l.name).toBe('天空');

    s.setLayerOpacity(l.id, 140);
    expect(l.opacity).toBe(100);

    s.duplicateLayer(l.id);
    expect(names(s)).toEqual(['天空', '天空 副本', '背景', '文字']);
    expect(s.activeLayer?.visible).toBe(false);
  });
});
