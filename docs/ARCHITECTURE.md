# open-ps 架构设计（ARCHITECTURE）

> 状态：规划稿（Step 1）。产品范围见 [PRODUCT.md](./PRODUCT.md)，实施顺序见 [ROADMAP.md](./ROADMAP.md)。
> 本文档中的 TypeScript 接口是**设计意图**，实现时可调整命名，但分层边界和数据流不应改变；若要改变，先改本文档。

## 1. 技术选型

| 层面 | 选择 | 理由 |
| --- | --- | --- |
| 框架 | **Vue 3**（`<script setup>` + Composition API） | owner 首选；单文件组件写密集的面板/对话框/选项栏很顺手；像素处理本来就不走框架，框架只负责外壳，选 Vue 还是 React 对核心影响很小，没有理由偏离首选。 |
| 状态 | **Pinia** | 与 Vue 3 官方配套，store 写法简单。只存 UI 状态和文档的"摘要"，**不存像素**（见 §4.5）。 |
| 构建 | **Vite** + **TypeScript**（`strict`） | 原生支持 Worker（`new Worker(new URL(...), { type: 'module' })`）、静态产物、`base: './'`。 |
| 渲染 | **Canvas 2D** + `OffscreenCanvas` | 能力足够（合成、变换、`globalAlpha`、`filter`、`drawImage` 缩放），调试简单。v1 不上 WebGL / WASM。 |
| 重计算 | **Web Workers** | 高斯模糊、锐化、选区扩展/收缩、大图洪水填充、智能填充（PatchMatch）。 |
| UI 组件 | 全部自绘 | 不用 Ant Design / Element Plus / Material 等组件库；CS5 外观靠自己的 CSS 变量和 SVG 图标。 |
| 测试 | **Vitest**（单元）+ **Playwright**（端到端冒烟） | 与 Vite 同源配置；纯算法在 Node 下测试，交互在真实浏览器中测试。 |
| 代码规范 | ESLint（`@typescript-eslint`、`eslint-plugin-vue`）+ Prettier + `vue-tsc --noEmit` | |

运行时依赖尽量只有 `vue` 和 `pinia`。新增运行时依赖需在 PR 中说明理由。

## 2. 目录结构

```
open-ps/
├─ docs/                      # 规划文档（本目录）
├─ public/                    # 原样拷贝的静态资源（极少）
├─ scripts/
│  └─ pack.mjs                # dist/ → release/open-ps-<version>.zip
├─ src/
│  ├─ main.ts                 # 创建 Vue app、Pinia，挂载 App
│  ├─ app/                    # 应用层：把 document / tools / canvas / ui 粘起来
│  │  ├─ App.vue
│  │  ├─ stores/              # Pinia：workspace、tools、ui（对话框、进度）
│  │  ├─ commands/            # 命令注册表：菜单项 + 快捷键 + 可用性 + 执行（§7）
│  │  ├─ keyboard.ts          # 全局键盘分发（code 识别、IME/输入框过滤、临时工具）
│  │  └─ strings.ts           # 全部中文文案
│  ├─ document/               # 文档模型（纯 TS，不依赖 Vue）
│  │  ├─ Document.ts
│  │  ├─ Layer.ts
│  │  ├─ Selection.ts
│  │  ├─ surface.ts           # 像素表面工厂：OffscreenCanvas / HTMLCanvasElement 兜底
│  │  ├─ history/
│  │  │  ├─ History.ts
│  │  │  ├─ Command.ts
│  │  │  └─ commands/         # PixelPatch、AddLayer、RemoveLayer、Reorder、SetSelection …
│  │  └─ ops/                 # 文档级操作：canvasSize、imageSize、crop、merge、duplicate …
│  ├─ canvas/                 # 视口与渲染（不依赖 Vue）
│  │  ├─ Viewport.ts          # 缩放/平移数学、屏幕↔文档坐标
│  │  ├─ Compositor.ts        # 图层合成 + 合成缓存 + 脏矩形
│  │  ├─ ViewRenderer.ts      # 把合成结果画到屏幕 canvas
│  │  └─ overlays/            # 蚂蚁线、变换框、裁剪框、钢笔路径、笔刷光标
│  ├─ tools/                  # 10 个工具 + 自由变换模式
│  │  ├─ Tool.ts              # 工具接口
│  │  ├─ ToolManager.ts       # 当前工具、临时工具（空格/Alt）
│  │  ├─ move/  marquee/  magicWand/  crop/  brush/
│  │  ├─ eyedropper/  pen/  clone/  fill/  text/
│  │  └─ transform/           # 自由变换（编辑菜单触发的模式，不是工具栏工具）
│  ├─ filters/                # 高斯模糊、锐化（USM）、选区形态学
│  │  ├─ gaussianBlur.ts      # 纯函数，操作 RGBA 缓冲
│  │  ├─ unsharpMask.ts
│  │  ├─ morphology.ts        # 选区扩展/收缩
│  │  ├─ filters.worker.ts
│  │  └─ client.ts            # 主线程侧：任务派发、进度、取消
│  ├─ caf/                    # 智能填充（PatchMatch），后续迁入（§9）
│  │  ├─ caf.worker.ts        # 迁移自仓库外备份，算法不改
│  │  ├─ protocol.ts          # 主线程 ↔ Worker 消息类型
│  │  └─ client.ts            # 裁剪区域、发送、回填、取消
│  ├─ export/                 # 文件进出
│  │  ├─ importImage.ts       # File → ImageBitmap → 新文档
│  │  ├─ encode.ts            # 合成 → Blob（PNG/JPEG/WebP）
│  │  └─ download.ts          # <a download> + iframe 降级
│  ├─ ui/                     # CS5 外壳（Vue 组件）
│  │  ├─ shell/               # MenuBar、OptionsBar、Toolbar、DocumentTabs、PanelDock、StatusBar
│  │  ├─ canvas/              # CanvasHost.vue：承载屏幕 canvas，转发指针事件给 ToolManager
│  │  ├─ panels/              # LayersPanel.vue 及其行组件
│  │  ├─ dialogs/             # Dialog 基础组件 + 新建/打开/导出/画布大小/图像大小/…/拾色器
│  │  ├─ controls/            # 自绘基础控件：按钮、数值输入（可拖动标签）、滑杆、下拉、复选框
│  │  ├─ icons/               # 自绘 SVG 图标
│  │  └─ theme/               # tokens.css（CS5 浅灰配色、尺寸）、base.css
│  └─ lib/                    # 极小的通用工具：geometry（Rect/Point/Matrix）、id、color、emitter
├─ tests/
│  └─ e2e/                    # Playwright
├─ index.html
├─ vite.config.ts
└─ package.json
```

### 2.1 依赖方向（硬约束）

```
ui ──► app ──► tools ──► canvas ──► document ──► lib
                 │                     ▲
                 ├──► filters ─────────┤
                 └──► caf ─────────────┘
export ──► document, canvas(Compositor)
```

- `document/`、`canvas/`、`tools/`、`filters/`、`caf/`、`export/`、`lib/` **不得 import Vue 或 Pinia**。这样它们能在 Node 下单元测试，也能在 Worker 中复用纯函数。
- `ui/` 只通过 `app/`（store 与命令注册表）操作文档，不直接调用 `document/` 的修改方法。
- Worker 文件只 import 纯函数（`filters/*.ts`、`lib/`），不 import 任何 DOM 相关模块。
- 这条依赖规则在 Step 3 起用 ESLint `no-restricted-imports` 强制。

## 3. 核心概念总览

```
Workspace（app/stores/workspace）
 ├─ documents: Document[]          多标签，每个标签一个 Document
 ├─ activeDocumentId
 ├─ foregroundColor                全局唯一前景色
 └─ activeToolId + 各工具选项       全局共享

Document
 ├─ width, height                  画布尺寸（像素）
 ├─ layers: Layer[]                下标 0 = 最底层
 ├─ activeLayerId
 ├─ selection: Selection | null
 ├─ history: History
 └─ view: ViewState                缩放、平移（每个文档独立，不进历史）

Layer（只有一种）
 ├─ id, name, visible, opacity
 ├─ x, y                           像素表面左上角在文档中的偏移
 ├─ surface                        像素表面（OffscreenCanvas），尺寸可与文档不同
 └─ text?: TextSource              可选：有则为"文字图层"，栅格化 = 删掉它
```

## 4. 文档模型（`src/document/`）

### 4.1 Layer

```ts
export interface TextSource {
  content: string;
  fontFamily: string;
  fontSizePx: number;
  color: RGBA;
  align: 'left' | 'center' | 'right';
}

export class Layer {
  readonly id: LayerId;
  name: string;
  visible: boolean;
  opacity: number;            // 0..1
  x: number;                  // 整数像素偏移
  y: number;
  surface: Surface;           // 像素
  text?: TextSource;          // 存在 = 文字图层；像素始终由 text 渲染而来并保持同步
}
```

设计要点：

- **只有一种图层**。是否"文字图层"只看 `text` 是否存在；合成、导出、缩略图、合并都只读 `surface`，完全不关心 `text`。这就是与 BitMappery `LAYER_IMAGE` / `LAYER_GRAPHIC` 双类型的根本区别。
- 图层带偏移 `(x, y)` 且表面大小独立于文档：移动图层只改偏移，无损且 O(1)；移出画布的像素不丢（与 PS 一致）。
- 裁剪会把所有图层裁到新画布范围（与 CS5 默认"删除裁剪像素"一致），避免表面无限增长。
- 混合模式字段 v1 不存在；以后加入时只影响 `Compositor` 的 `globalCompositeOperation`。

### 4.2 Surface（像素表面）

```ts
export type Surface = OffscreenCanvas | HTMLCanvasElement;
export function createSurface(w: number, h: number): Surface;      // 优先 OffscreenCanvas
export function get2d(s: Surface): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
export function readPixels(s: Surface, rect: Rect): ImageData;
export function writePixels(s: Surface, data: ImageData, x: number, y: number): void;
```

- 2D 上下文统一以 `{ willReadFrequently: true }` 创建会降低绘制性能，因此**只在需要频繁读的临时表面上开启**，图层表面默认不开。
- 需要像素数组的算法（魔棒、填充、滤镜、CAF）统一经 `readPixels` 取出 `ImageData`，结果用 `writePixels` 写回。

### 4.3 Selection

```ts
export class Selection {
  readonly width: number;     // = 文档宽高
  readonly height: number;
  readonly mask: Uint8Array;  // 0 = 未选，255 = 选中（v1 无羽化，只有 0/255，但类型保留 0..255）
  readonly bounds: Rect;      // 非零像素的包围盒，用于加速

  static fromRect(docW, docH, rect): Selection;
  static fromPolygon(docW, docH, points): Selection;   // 钢笔 v1
  combine(other: Selection, mode: 'replace' | 'add' | 'subtract' | 'intersect'): Selection;
  invert(): Selection;
  translate(dx, dy): Selection;
  isEmpty(): boolean;
}
```

- **不可变值对象**：每次修改产生新的 `Selection`，因此历史记录只需保存前后两个引用。
- 文档尺寸的 `Uint8Array`（4000×3000 约 12MB）可接受；扩展/缩小在 Worker 中做（`filters/morphology.ts`，距离变换或逐像素膨胀/腐蚀）。
- 绘画类工具使用选区时，从 mask 生成一张 alpha 遮罩表面（缓存，选区变化时失效），以 `destination-in` 裁剪笔触。
- 蚂蚁线：从 mask 提取边界线段（缓存），在 overlay 层以虚线绘制，`lineDashOffset` 约每 120ms 推进一次。

### 4.4 Document

```ts
export class Document {
  readonly id: DocumentId;
  name: string;
  width: number;
  height: number;
  layers: Layer[];            // 0 = 最底层
  activeLayerId: LayerId;
  selection: Selection | null;
  readonly history: History;
  dirty: boolean;             // 自上次导出后是否有修改

  execute(cmd: Command): void;          // 执行并入栈
  commit(cmd: Command): void;           // 已在外部实时应用（如画笔），只入栈
  readonly events: Emitter<DocumentEvents>;
}

type DocumentEvents = {
  pixels: { layerId: LayerId; rect: Rect };   // 像素脏区（文档坐标）
  structure: void;                            // 图层增删、排序、属性、画布尺寸
  selection: void;
  history: void;
};
```

- **所有修改都经过 `execute` / `commit`**，没有第二条路径。UI 和工具都不直接改 `layers` 数组。
- `events` 是唯一的"变化通知"渠道：`Compositor` 订阅 `pixels`/`structure` 做脏区重绘；`app/stores` 订阅后刷新响应式摘要。

### 4.5 与 Pinia 的边界

- `Document` 实例用 `markRaw` 放进 store，**永不变成响应式对象**（否则 Vue 会代理 canvas 和大数组，既慢又出错）。
- store 维护每个文档的**响应式摘要**，供 UI 渲染：

```ts
interface DocumentSummary {
  id: DocumentId;
  title: string;                 // "未命名-1 @ 100% (图层 1, RGB/8)*"
  width: number; height: number;
  zoom: number;
  hasSelection: boolean;
  canUndo: boolean; canRedo: boolean;
  undoLabel?: string; redoLabel?: string;
  layers: Array<{ id; name; visible; opacity; isText: boolean; thumbVersion: number }>;
  activeLayerId: LayerId;
}
```

- 摘要由 `Document.events` 驱动重建（`structure`/`selection`/`history` 时全量重建，`pixels` 时只递增对应图层的 `thumbVersion`，并节流约 300ms）。
- 图层缩略图由 `LayersPanel` 根据 `thumbVersion` 从 `layer.surface` 绘制到行内的小 `<canvas>`，不生成 dataURL。

## 5. 历史记录（命令模式，`src/document/history/`）

```ts
export interface Command {
  readonly label: string;            // 中文，如"画笔"、"新建图层"，用于"撤销 画笔"
  apply(doc: Document): void;        // 执行 / 重做
  revert(doc: Document): void;       // 撤销
  readonly byteSize: number;         // 估算占用内存，供预算淘汰
}

export class History {
  constructor(opts: { budgetBytes: number });
  execute(doc: Document, cmd: Command): void;   // cmd.apply + push
  commit(cmd: Command): void;                   // 只 push（调用方已应用）
  undo(doc: Document): void;
  redo(doc: Document): void;
  clear(): void;
  canUndo / canRedo / undoLabel / redoLabel;
}
```

规则：

- 新命令入栈时清空 redo 栈；总 `byteSize` 超预算时从最旧处丢弃。
- **一步用户操作 = 一个命令**。复合操作用 `CompositeCommand([...])` 包起来（例如"向下合并" = 修改下层像素 + 删除上层）。
- 主要命令类型：

| 命令 | 保存内容 | 用于 |
| --- | --- | --- |
| `PixelPatchCommand` | 图层 id + 脏矩形 + 前后两份 `ImageData` | 画笔、仿制、填充、删除、Alt+Backspace、滤镜、智能填充 |
| `ReplaceSurfaceCommand` | 图层 id + 前后 `surface` 与偏移 | 自由变换、图像大小、裁剪（每层一个，组合成 Composite） |
| `AddLayerCommand` / `RemoveLayerCommand` | 图层对象 + 下标 | 新建、复制、删除、合并 |
| `ReorderLayerCommand` | 前后下标 | 拖动排序 |
| `SetLayerPropsCommand` | 前后 `{name, visible, opacity, x, y, text}` | 重命名、显隐、不透明度、移动工具、栅格化 |
| `SetSelectionCommand` | 前后 `Selection` 引用 | 所有选区变化 |
| `ResizeCanvasCommand` | 前后宽高 + 各层偏移 | 画布大小、裁剪 |
| `SetActiveLayerCommand` | — | **不入历史**（PS 也不记录选中图层的切换） |

- 实时操作（画笔、仿制、移动选区内像素）采用"先应用后提交"：开始时记录脏区原始像素，过程中直接画到表面，结束时构造 `PixelPatchCommand` 调 `commit`。
- 不透明度滑杆、移动工具拖动等连续操作在松手时只产生一个命令。
- 可选优化（不在 v1 必做）：`PixelPatchCommand` 按 256×256 瓦片存储，只存实际变化的瓦片。

## 6. 渲染与合成（`src/canvas/`）

### 6.1 坐标系

- **文档坐标**：像素，原点为画布左上角。
- **屏幕坐标**：CSS 像素，相对画布宿主元素。
- `Viewport` 持有 `zoom` 与 `pan`（文档原点在屏幕上的位置），提供 `toDoc(p)` / `toScreen(p)`，并负责 `devicePixelRatio` 换算（屏幕 canvas 的位图尺寸 = CSS 尺寸 × DPR）。
- 缩放以指针为中心：`pan' = p - (p - pan) * (zoom' / zoom)`。档位表与边界约束见 PRODUCT §5.2。

### 6.2 三层画面

```
屏幕 canvas（CanvasHost 内，每个文档标签共用一个，切换标签时换数据源）
  ① 粘贴板灰色背景
  ② 棋盘格（只在画布范围内）
  ③ 合成缓存（按 viewport 变换绘制；zoom ≥ 2 时关闭 imageSmoothing）
overlay canvas（叠在上面，同尺寸）
  ④ 蚂蚁线、裁剪框与压暗、变换框、钢笔路径、笔刷光标、文字编辑框占位
```

- **合成缓存**：每个文档一张文档尺寸的 `OffscreenCanvas`。`Compositor` 订阅 `pixels`/`structure` 事件，累积脏矩形，在下一帧只重合成脏区：清空脏区 → 从下到上 `drawImage(layer.surface)`（`globalAlpha = opacity`，跳过隐藏层）→ 叠加正在进行的笔触缓冲（见 §8.3）。
- **按需渲染**：没有常驻循环。任何变化调用 `requestRender()`，用 `requestAnimationFrame` 合并到一帧；蚂蚁线动画是唯一的定时刷新，且只重画 overlay。
- 平移/缩放只重画 ①–③ 的屏幕投影，不触碰合成缓存，保证手感。
- 自由变换预览：合成时对目标图层改用 `setTransform` 绘制，不修改像素，直到提交。
- 导出与"合并所有图层"复用 `Compositor` 的同一套合成函数（不含棋盘格与 overlay），保证所见即所得。

## 7. 命令注册表与键盘（`src/app/commands/`、`src/app/keyboard.ts`）

菜单和快捷键共用一张表，菜单从表生成，避免文案和键位两处维护：

```ts
interface AppCommand {
  id: string;                       // 'file.new'、'edit.contentAwareFill' …
  label: string;                    // 来自 strings.ts
  menu?: { menu: 'file' | 'edit' | 'image' | 'layer' | 'select' | 'effects'; order: number; separatorBefore?: boolean };
  shortcuts?: Shortcut[];           // 第一个用于菜单显示
  enabled?(ctx: AppContext): boolean;
  run(ctx: AppContext): void | Promise<void>;
}
interface Shortcut { code: string; ctrl?: boolean; shift?: boolean; alt?: boolean }
```

- `ctrl` 在 macOS 上自动匹配 `metaKey`；菜单显示按 CS5 顺序 `Shift+Alt+Ctrl+键`。
- 键盘分发顺序：
  1. `event.isComposing` 或焦点在 `input` / `textarea` / `contenteditable` → 只处理 `Esc`、`Enter`（以及文字工具的 `Ctrl+Enter`）。
  2. 有模态对话框 → 交给对话框（`Enter` 确定 / `Esc` 取消）。
  3. 有进行中的模式（裁剪、自由变换、钢笔、文字编辑）→ 先交给该模式（`Enter` / `Esc` / `Backspace`）。
  4. 匹配命令注册表（带修饰键的组合）。
  5. 当前工具的按键（`[`、`]`、方向键…）。
  6. 无修饰键字母 → 切换工具（`V M W C B I P S G T`）；`D` → 前景色复位。
- 临时工具由 `ToolManager` 处理：`空格` 按下 → 抓手，松开恢复；画笔/填充下 `Alt` → 吸管；仿制工具下 `Alt+点击` 为设定取样点（工具自身逻辑）。
- 匹配成功的组合一律 `preventDefault()`，用于压掉浏览器的 `Ctrl+O`（打开文件）、`Ctrl+S`（保存网页）、`Ctrl+D`（书签）、`Ctrl+=`（页面缩放）等默认行为。浏览器保留键（PRODUCT §8.3）不注册。
- 完整快捷键表以 PRODUCT §6、§8.2 为准；实现时在 `commands/` 中一处定义，并有单元测试校验"无重复绑定"和"每个菜单项都存在"。

## 8. 工具（`src/tools/`）

### 8.1 接口

```ts
interface ToolPointerEvent {
  doc: Point;                // 文档坐标（浮点）
  screen: Point;
  pressure: number;
  buttons: number;
  shift: boolean; alt: boolean; ctrl: boolean;
  coalesced: Point[];        // getCoalescedEvents() 转成文档坐标，画笔用
}

interface Tool {
  readonly id: ToolId;       // 'move' | 'marquee' | 'magicWand' | 'crop' | 'brush' | 'eyedropper' | 'pen' | 'clone' | 'fill' | 'text'
  readonly cursor: (ctx) => string;          // CSS cursor 或自绘光标标记
  activate?(ctx: ToolContext): void;
  deactivate?(ctx: ToolContext): void;       // 必须收尾：提交或取消进行中的操作
  pointerDown?(e: ToolPointerEvent, ctx: ToolContext): void;
  pointerMove?(e: ToolPointerEvent, ctx: ToolContext): void;
  pointerUp?(e: ToolPointerEvent, ctx: ToolContext): void;
  keyDown?(e: KeyboardEvent, ctx: ToolContext): boolean;   // true = 已处理
  drawOverlay?(g: CanvasRenderingContext2D, ctx: ToolContext): void;
}

interface ToolContext {
  doc: Document;
  viewport: Viewport;
  options: ToolOptions;              // 来自 tools store 的普通对象快照
  foreground: RGBA;
  requestRender(): void;
  requireRasterized(layer: Layer): Promise<boolean>;   // 文字图层弹窗确认栅格化
}
```

- `CanvasHost.vue` 用 Pointer Events + `setPointerCapture` 统一收事件并转换坐标，再交给 `ToolManager`；工具不接触 DOM。
- 工具选项（大小、容差…）存在 Pinia `tools` store，选项栏组件双向绑定；工具读取的是普通值快照。

### 8.2 各工具实现要点

| 工具 | 实现要点 |
| --- | --- |
| 移动 V | 无选区：改 `layer.x/y`（预览即改属性，松手 `SetLayerPropsCommand`）。有选区：按下时把选区内像素"抬起"到浮动表面并从图层挖掉，拖动只移动浮动表面，松手贴回并生成一个 `CompositeCommand`（像素 + 选区平移）。 |
| 选择 M | 拖动生成矩形 → `Selection.fromRect` → 按模式 `combine` → `SetSelectionCommand`。拖动中只在 overlay 画虚框。 |
| 魔棒 W | 读当前图层像素 → 扫描线洪水填充（`连续`）或全图阈值（不连续）→ mask → `combine`。容差按 RGBA 各通道最大差判断。大图（> 400 万像素）放 Worker。 |
| 裁剪 C | overlay 画框与压暗；`Enter` 生成 `CompositeCommand`：每层 `ReplaceSurfaceCommand`（裁到新范围）+ `ResizeCanvasCommand` + 清除选区。 |
| 画笔 B | 沿 coalesced 点按间距（直径 25%）盖印圆形笔尖（径向渐变表现硬度）到**笔触缓冲**（文档尺寸或脏区大小的临时表面），笔触内不透明度不叠加（与 PS 一致）；合成时把缓冲按不透明度叠在当前图层上方预览；松手时按选区遮罩裁剪后画入图层，`commit(PixelPatchCommand)`。 |
| 吸管 I | 从合成缓存（所有图层）或当前图层读 1×1 / 3×3 → 设前景色。不入历史。 |
| 钢笔 P | v1 维护折线点列表，overlay 绘制；`Enter` → `Selection.fromPolygon`（离屏 canvas `fill()` 后读 alpha 转 mask）→ `combine`。贝塞尔推迟：数据结构预留每个锚点的 `in/out` 控制柄字段但 v1 恒为空。 |
| 仿制 S | 与画笔共用盖印框架；笔尖内容来自"按下时当前图层的快照"偏移取样（避免自我复制反馈）；`对齐` 决定偏移是否跨笔触保持。 |
| 填充 G | 与魔棒共用洪水填充 → mask ∩ 选区 → 用前景色 + 不透明度画入 → `PixelPatchCommand`。 |
| 文字 T | 点击处放置一个绝对定位的 `<textarea>`（由 `ui/canvas` 根据 viewport 定位缩放），编辑结束后用 Canvas 2D `fillText` 按行渲染进图层表面；新建为 `AddLayerCommand`，再编辑为 `SetLayerPropsCommand`（含新旧 surface 与 text）。 |
| 自由变换 | `transform/` 维护仿射矩阵（平移、等比/非等比缩放、旋转），overlay 画 8 手柄 + 旋转区；预览用 `setTransform`；提交时以 `imageSmoothingQuality = 'high'` 一次性重采样到新表面 → `ReplaceSurfaceCommand`。有选区时与移动工具一样先抬起像素。 |

## 9. Worker 边界

### 9.1 通用约定

- 每类 Worker 一个实例，懒加载创建：`filters.worker.ts`（模糊、锐化、形态学、大图洪水填充）、`caf.worker.ts`（智能填充）。
- 消息全部带 `jobId`；像素以 `ArrayBuffer` **transfer**（不拷贝）传递；返回同样 transfer 回来。
- 进度消息 `{ type: 'progress', jobId, value: 0..1 }`；主线程用统一的进度对话框显示（`app/stores/ui`）。
- 取消：主线程直接 `worker.terminate()` 并在下次需要时重建。算法不需要支持协作式取消。
- 只发送**需要的区域**：选区包围盒（加边距）与图层表面的交集，而不是整张图。
- Worker 内只用纯函数，不触 DOM；`filters/*.ts` 的同一份函数在单元测试中直接调用。
- 打包：使用 Vite 的 `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })`。若 Toy 环境不允许 module Worker 或跨源加载 Worker，改用 `?worker&inline`（Blob URL）作为构建开关，业务代码不变。

### 9.2 滤镜协议（示意）

```ts
type FilterRequest =
  | { type: 'gaussianBlur'; jobId: number; width: number; height: number; pixels: ArrayBuffer; radius: number }
  | { type: 'unsharpMask'; jobId: number; width: number; height: number; pixels: ArrayBuffer; amount: number; radius: number }
  | { type: 'morphology'; jobId: number; width: number; height: number; mask: ArrayBuffer; op: 'expand' | 'contract'; px: number }
  | { type: 'floodFill'; jobId: number; width: number; height: number; pixels: ArrayBuffer; x: number; y: number; tolerance: number; contiguous: boolean };

type FilterResponse =
  | { type: 'progress'; jobId: number; value: number }
  | { type: 'done'; jobId: number; pixels?: ArrayBuffer; mask?: ArrayBuffer }
  | { type: 'error'; jobId: number; message: string };
```

- 高斯模糊：三次盒式模糊近似（O(1) 每像素，与半径无关），按预乘 alpha 计算以避免透明边缘发黑；半径小（< 2）时用真实可分离高斯核。
- 锐化：`result = src + amount × (src − blur(src, radius))`，复用同一模糊函数。
- 选区限制：Worker 返回整个区域的结果，主线程按选区 mask 混合回图层（未选中区域保持原像素），然后 `PixelPatchCommand`。
- 预览：对话框打开时在当前视口可见区域（或降采样）上跑同一任务，参数变化防抖约 150ms；确定时对全区域执行。

## 10. 智能填充（CAF）迁移计划（`src/caf/`）

现状：PatchMatch Worker（约 14KB，多尺度）已经在仓库外验证可用，源码备份在仓库外。**v1 不重写、不调参、不引入 ONNX**，只做迁移和协议适配。

迁移步骤（ROADMAP 中对应的 Step）：

1. 将备份源码原样拷入 `src/caf/caf.worker.ts`（必要时只做 TS 类型标注，算法逻辑不改），在 PR 中注明来源与版本。
2. 编写 `protocol.ts` 描述它**现有**的消息格式；若现有格式与下方目标不同，由 `client.ts` 做适配，不改 Worker。
3. `client.ts` 负责：
   - 计算区域：选区包围盒向外扩展边距（暂定 `max(64, 0.5 × 包围盒长边)`，与图层表面求交）；
   - 读出该区域 RGBA 与对应 mask（1 = 待填充）；
   - transfer 给 Worker，转发进度；
   - 结果只在 mask 内写回当前图层，生成 `PixelPatchCommand`（标签"智能填充"）。
4. 用 3–5 张固定测试图做回归（结果对比基线截图 + 耗时记录），存放在 `tests/fixtures/caf/`。

目标协议（适配后主线程视角）：

```ts
type CafRequest = { type: 'run'; jobId: number; width: number; height: number; pixels: ArrayBuffer; mask: ArrayBuffer };
type CafResponse =
  | { type: 'progress'; jobId: number; value: number }
  | { type: 'done'; jobId: number; pixels: ArrayBuffer }
  | { type: 'error'; jobId: number; message: string };
```

## 11. 文件进出（`src/export/`）

- 打开：`File` → `createImageBitmap(file, { imageOrientation: 'from-image' })`（按 EXIF 方向）→ 新 `Document`（尺寸 = 图片尺寸）+ 名为"背景"的图层。超出 PRODUCT §8.4 上限时报错并不创建文档。
- 导出：`Compositor` 合成到离屏表面 → `convertToBlob({ type, quality })`（`HTMLCanvasElement` 兜底用 `toBlob`）；JPEG 先铺白底。
- 下载：`URL.createObjectURL` + `<a download>`；若检测到失败（iframe sandbox 禁止下载），在导出对话框中显示结果图片并提示"右键另存为"。
- 文档名：打开时取文件名（去扩展名）；导出默认文件名 = 文档名 + 扩展名。
- v1 没有工程文件格式；`dirty` 在成功导出后清零。

## 12. UI 外壳（`src/ui/`）

- **主题**：`theme/tokens.css` 定义全部颜色、字号、尺寸 CSS 变量（如 `--ps-panel-bg`、`--ps-pasteboard`、`--ps-highlight`、`--ps-menubar-h`）。组件只引用变量。
- **布局**：CSS Grid 固定区域——菜单栏 / 选项栏 / 工具栏 / 文档区（标签 + 画布宿主 + 状态栏）/ 右侧面板坞。尺寸参考：菜单栏约 22px、选项栏约 32px、工具栏单列约 36px 宽、标签约 22px、状态栏约 22px、面板坞约 250px。
- **基础控件**自绘：菜单（含子项快捷键右对齐、禁用置灰、悬停展开相邻菜单的 CS5 行为）、按钮、可拖动标签的数值输入（CS5 "scrubby" 手感）、滑杆、下拉框、复选框、单选、对话框框架、进度对话框、确认框。
- **对话框**：统一的 `Dialog` 组件处理模态、拖动、`Enter`/`Esc`、焦点圈定；具体对话框只写表单。
- 全局禁用文本选中（`user-select: none`），输入框除外。

## 13. 测试

| 层级 | 工具 | 范围 |
| --- | --- | --- |
| 单元 | Vitest（Node） | `lib/` 几何与颜色；`Selection` 运算；`History` 入栈/撤销/重做/预算淘汰；文档 ops（画布大小、图像大小的偏移与尺寸计算、合并顺序）；`filters/` 纯函数（小尺寸固定输入 → 期望输出，允许 ±1 误差）；洪水填充；命令注册表（无重复键位、菜单项完整）。 |
| 组件 | Vitest + `@vue/test-utils`（jsdom） | 少量：菜单渲染与禁用状态、对话框 Enter/Esc。不在 jsdom 中测试 canvas。 |
| 端到端 | Playwright（Chromium 为主，Firefox 冒烟） | 冒烟流程：启动 → 菜单文案齐全 → 新建文档 → 画一笔 → 撤销/重做 → 打开测试图 → 魔棒 → 智能填充 → 导出得到文件。必要时对画布截图做像素比对（带容差）。 |

需要 canvas 的单元逻辑尽量改写为操作 `ImageData` 形状的纯函数（`{ data, width, height }`），从而不依赖浏览器。

## 14. 构建与发布

- `npm run dev`：Vite 开发服务器。
- `npm run build`：`vue-tsc --noEmit && vite build`，`base: './'`，产物 `dist/`。
- `npm run pack`：`scripts/pack.mjs` 把 `dist/` 打成 `release/open-ps-<package.json version>.zip`（`index.html` 在 zip 根）。
- `npm run lint` / `npm run typecheck` / `npm test` / `npm run e2e`。
- CI（GitHub Actions，Step 2 加入）：lint + typecheck + unit + build；e2e 在相应功能出现后加入。
- Node 20 LTS 及以上；包管理器 npm（提交 `package-lock.json`）。
- 浏览器支持：最新版 Chrome / Edge（主力）、Firefox、Safari 16.4+（`OffscreenCanvas` 2D）。不支持 IE、旧版 Safari。

## 15. 刻意的简化（决策记录）

| 决策 | 原因 |
| --- | --- |
| 只有一种图层，文字只是可选元数据 | 认知简单；合成、导出、合并代码只有一条路径 |
| 单前景色 | owner 要求；去掉交换/默认双色逻辑 |
| 无特殊"背景"图层 | 少一套锁定与例外规则 |
| 选区为不可变 mask | 历史记录简单、可在 Worker 中处理 |
| Canvas 2D 而非 WebGL | 能力够用、调试简单；性能瓶颈出现后再局部替换 `Compositor` |
| 多级撤销而非 CS5 的 Ctrl+Z 切换 | 更符合当代用户习惯 |
| 不复用 BitMappery 代码 | 全新实现，避免继承其双图层类型设计与许可问题 |
