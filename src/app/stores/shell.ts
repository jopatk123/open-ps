/**
 * Shell store —— mock 数据，Step 3 由真实 Document 摘要替换。
 *
 * Step 2 只有界面：这里保存假的文档标签、图层列表、当前工具、工具选项与前景色，
 * 所有操作只修改这些 mock 列表，不涉及任何像素或历史记录。
 */
import { defineStore } from 'pinia';
import { S } from '../strings';
import type { ToolId } from '../toolDefs';

export interface MockLayer {
  id: number;
  name: string;
  visible: boolean;
  /** 0..100 */
  opacity: number;
  isText: boolean;
  /** 缩略图显示为白色（不透明）而非棋盘格 */
  filled: boolean;
}

export interface MockTab {
  id: number;
  name: string;
  zoom: number;
  width: number;
  height: number;
  dirty: boolean;
  /** 下标 0 = 最底层 */
  layers: MockLayer[];
  activeLayerId: number;
  nextLayerNumber: number;
}

export type SelectionMode = 'new' | 'add' | 'subtract' | 'intersect';
export type TextAlign = 'left' | 'center' | 'right';

export interface ToolOptions {
  marquee: { mode: SelectionMode };
  magicWand: { mode: SelectionMode; tolerance: number; contiguous: boolean };
  brush: { size: number; hardness: number; opacity: number };
  eyedropper: { sampleSize: 'point' | 'average3'; sample: 'all' | 'current' };
  clone: { size: number; hardness: number; opacity: number; aligned: boolean };
  fill: { tolerance: number; contiguous: boolean; opacity: number };
  text: { fontFamily: string; fontSize: number; align: TextAlign };
}

export const DEFAULT_FOREGROUND = '#000000';

let nextId = 1;
const newId = () => nextId++;

function layer(name: string, extra: Partial<MockLayer> = {}): MockLayer {
  return { id: newId(), name, visible: true, opacity: 100, isText: false, filled: false, ...extra };
}

function mockTabs(): MockTab[] {
  const doc1Layers = [
    layer(S.layers.background, { filled: true }),
    layer(S.layers.textLayerSample, { isText: true }),
    layer(S.layers.layerName(2)),
  ];
  const doc2Layers = [layer(S.layers.background, { filled: true }), layer(S.layers.layerName(1))];
  return [
    {
      id: newId(),
      name: S.tabs.untitled(1),
      zoom: 100,
      width: 1920,
      height: 1080,
      dirty: false,
      layers: doc1Layers,
      activeLayerId: doc1Layers[2]!.id,
      nextLayerNumber: 3,
    },
    {
      id: newId(),
      name: S.tabs.untitled(2),
      zoom: 100,
      width: 1280,
      height: 720,
      dirty: false,
      layers: doc2Layers,
      activeLayerId: doc2Layers[1]!.id,
      nextLayerNumber: 2,
    },
  ];
}

function defaultToolOptions(): ToolOptions {
  return {
    marquee: { mode: 'new' },
    magicWand: { mode: 'new', tolerance: 32, contiguous: true },
    brush: { size: 20, hardness: 100, opacity: 100 },
    eyedropper: { sampleSize: 'point', sample: 'all' },
    clone: { size: 20, hardness: 100, opacity: 100, aligned: true },
    fill: { tolerance: 32, contiguous: true, opacity: 100 },
    text: { fontFamily: S.fonts[0].value, fontSize: 24, align: 'left' },
  };
}

export function tabTitle(tab: MockTab): string {
  const active = tab.layers.find((l) => l.id === tab.activeLayerId);
  const title = S.tabs.title(tab.name, tab.zoom, active?.name ?? '');
  return tab.dirty ? title + S.tabs.dirtyMark : title;
}

export const useShellStore = defineStore('shell', {
  state: () => {
    const tabs = mockTabs();
    return {
      tabs,
      activeTabId: tabs[0]?.id ?? -1,
      nextUntitled: tabs.length + 1,
      activeToolId: 'move' as ToolId,
      toolOptions: defaultToolOptions(),
      foregroundColor: DEFAULT_FOREGROUND,
    };
  },

  getters: {
    activeTab(state): MockTab | undefined {
      return state.tabs.find((t) => t.id === state.activeTabId);
    },
    activeLayer(): MockLayer | undefined {
      const tab = this.activeTab;
      return tab?.layers.find((l) => l.id === tab.activeLayerId);
    },
    activeLayerIndex(): number {
      const tab = this.activeTab;
      return tab ? tab.layers.findIndex((l) => l.id === tab.activeLayerId) : -1;
    },
    suggestedUntitledName(state): string {
      return S.tabs.untitled(state.nextUntitled);
    },
  },

  actions: {
    setTool(id: ToolId) {
      this.activeToolId = id;
    },
    setForeground(hex: string) {
      this.foregroundColor = hex;
    },
    resetForeground() {
      this.foregroundColor = DEFAULT_FOREGROUND;
    },

    activateTab(id: number) {
      if (this.tabs.some((t) => t.id === id)) this.activeTabId = id;
    },
    closeTab(id: number) {
      const i = this.tabs.findIndex((t) => t.id === id);
      if (i < 0) return;
      this.tabs.splice(i, 1);
      if (this.activeTabId === id) {
        const next = this.tabs[Math.min(i, this.tabs.length - 1)];
        this.activeTabId = next?.id ?? -1;
      }
    },

    selectLayer(layerId: number) {
      const tab = this.activeTab;
      if (tab?.layers.some((l) => l.id === layerId)) tab.activeLayerId = layerId;
    },
    toggleVisibility(layerId: number) {
      const l = this.activeTab?.layers.find((x) => x.id === layerId);
      if (l) l.visible = !l.visible;
    },
    renameLayer(layerId: number, name: string) {
      const trimmed = name.trim();
      const l = this.activeTab?.layers.find((x) => x.id === layerId);
      if (l && trimmed) l.name = trimmed;
    },
    setLayerOpacity(layerId: number, opacity: number) {
      const l = this.activeTab?.layers.find((x) => x.id === layerId);
      if (l) l.opacity = Math.max(0, Math.min(100, Math.round(opacity)));
    },
    /** 下标均为自底向上（0 = 最底层）。 */
    moveLayer(from: number, to: number) {
      const layers = this.activeTab?.layers;
      if (!layers || from === to) return;
      if (from < 0 || from >= layers.length || to < 0 || to >= layers.length) return;
      const [moved] = layers.splice(from, 1);
      if (moved) layers.splice(to, 0, moved);
    },
    createLayer() {
      const tab = this.activeTab;
      if (!tab) return;
      const l = layer(S.layers.layerName(tab.nextLayerNumber++));
      const at = tab.layers.findIndex((x) => x.id === tab.activeLayerId);
      tab.layers.splice(at + 1, 0, l);
      tab.activeLayerId = l.id;
    },
    duplicateLayer(layerId: number) {
      const tab = this.activeTab;
      if (!tab) return;
      const at = tab.layers.findIndex((x) => x.id === layerId);
      const src = tab.layers[at];
      if (!src) return;
      const copy = layer(src.name + S.layers.copySuffix, {
        visible: src.visible,
        opacity: src.opacity,
        isText: src.isText,
        filled: src.filled,
      });
      tab.layers.splice(at + 1, 0, copy);
      tab.activeLayerId = copy.id;
    },
    deleteLayer(layerId: number) {
      const tab = this.activeTab;
      if (!tab || tab.layers.length <= 1) return;
      const at = tab.layers.findIndex((x) => x.id === layerId);
      if (at < 0) return;
      tab.layers.splice(at, 1);
      if (tab.activeLayerId === layerId) {
        const next = tab.layers[Math.max(0, at - 1)];
        if (next) tab.activeLayerId = next.id;
      }
    },
  },
});
