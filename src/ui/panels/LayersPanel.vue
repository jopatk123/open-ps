<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { useShellStore, type MockLayer } from '../../app/stores/shell';
import { S } from '../../app/strings';
import NumberField from '../controls/NumberField.vue';
import Icon from '../icons/Icon.vue';

const THUMB_MAX = 30;
const DRAG_THRESHOLD = 4;

const shell = useShellStore();
const tab = computed(() => shell.activeTab);
const active = computed(() => shell.activeLayer);
/** 列表顶部为最上层 */
const rows = computed(() => (tab.value ? [...tab.value.layers].reverse() : []));

const opacity = computed({
  get: () => active.value?.opacity ?? 100,
  set: (v: number) => {
    if (active.value) shell.setLayerOpacity(active.value.id, v);
  },
});

const thumbStyle = computed(() => {
  const w = tab.value?.width ?? 1;
  const h = tab.value?.height ?? 1;
  const s = THUMB_MAX / Math.max(w, h);
  return { width: `${Math.round(w * s)}px`, height: `${Math.round(h * s)}px` };
});

// ---------- 重命名 ----------
const editingId = ref<number | null>(null);
const editText = ref('');
const editInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null);

async function startRename(l: MockLayer) {
  editingId.value = l.id;
  editText.value = l.name;
  await nextTick();
  const el = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value;
  el?.focus();
  el?.select();
}

function commitRename() {
  if (editingId.value !== null) shell.renameLayer(editingId.value, editText.value);
  editingId.value = null;
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.isComposing) return;
  if (e.key === 'Enter') commitRename();
  else if (e.key === 'Escape') editingId.value = null;
}

// ---------- 拖动排序 / 拖到"创建新图层"复制 ----------
interface DragState {
  layerId: number;
  /** 显示顺序中的下标（0 = 最上层） */
  from: number;
  startY: number;
  active: boolean;
  /** 插入位置（显示顺序，0..rows.length） */
  insertAt: number;
  overNew: boolean;
}

const list = ref<HTMLElement | null>(null);
const newButton = ref<HTMLButtonElement | null>(null);
const drag = ref<DragState | null>(null);

function onRowPointerDown(e: PointerEvent, l: MockLayer, index: number) {
  if (e.button !== 0 || editingId.value === l.id) return;
  shell.selectLayer(l.id);
  drag.value = {
    layerId: l.id,
    from: index,
    startY: e.clientY,
    active: false,
    insertAt: index,
    overNew: false,
  };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', cancelDrag);
}

function onDragMove(e: PointerEvent) {
  const d = drag.value;
  if (!d) return;
  if (!d.active && Math.abs(e.clientY - d.startY) < DRAG_THRESHOLD) return;
  d.active = true;
  const els = list.value?.querySelectorAll<HTMLElement>('.layer-row') ?? [];
  let at = els.length;
  for (let i = 0; i < els.length; i++) {
    const r = els[i]!.getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) {
      at = i;
      break;
    }
  }
  d.insertAt = at;
  const nb = newButton.value?.getBoundingClientRect();
  d.overNew =
    !!nb &&
    e.clientX >= nb.left &&
    e.clientX <= nb.right &&
    e.clientY >= nb.top &&
    e.clientY <= nb.bottom;
}

function removeDragListeners() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', cancelDrag);
}

function cancelDrag() {
  removeDragListeners();
  drag.value = null;
}

function onDragEnd() {
  const d = drag.value;
  cancelDrag();
  if (!d?.active) return;
  if (d.overNew) {
    shell.duplicateLayer(d.layerId);
    return;
  }
  const n = rows.value.length;
  const to = d.insertAt > d.from ? d.insertAt - 1 : d.insertAt;
  if (to !== d.from) shell.moveLayer(n - 1 - d.from, n - 1 - to);
}

function dropClass(i: number) {
  const d = drag.value;
  if (!d?.active || d.overNew || d.insertAt === d.from || d.insertAt === d.from + 1) return '';
  if (d.insertAt === i) return 'drop-before';
  if (d.insertAt === rows.value.length && i === rows.value.length - 1) return 'drop-after';
  return '';
}

onBeforeUnmount(removeDragListeners);
</script>

<template>
  <section class="layers-panel" :aria-label="S.layers.panelTitle">
    <div class="panel-tabs">
      <span class="panel-tab active">{{ S.layers.panelTitle }}</span>
      <span class="panel-menu" :title="S.layers.panelMenu" aria-hidden="true">
        <Icon name="panelMenu" :size="16" />
      </span>
    </div>

    <div class="layer-props">
      <select class="ps-select blend" disabled :aria-label="S.layers.blendMode">
        <option>{{ S.layers.blendNormal }}</option>
      </select>
      <NumberField
        v-model="opacity"
        :label="S.layers.opacity"
        :min="0"
        :max="100"
        suffix="%"
        :width="42"
        slider
        :disabled="!active"
      />
    </div>

    <ul ref="list" class="layer-list" role="listbox" :aria-label="S.layers.panelTitle">
      <li
        v-for="(l, i) in rows"
        :key="l.id"
        class="layer-row"
        role="option"
        :class="[
          { active: l.id === active?.id, dragging: drag?.active && drag.layerId === l.id },
          dropClass(i),
        ]"
        :aria-selected="l.id === active?.id"
        :data-layer="l.name"
        @pointerdown="onRowPointerDown($event, l, i)"
      >
        <button
          type="button"
          class="eye"
          :title="S.layers.toggleVisibility"
          :aria-label="S.layers.toggleVisibility"
          :aria-pressed="l.visible"
          @pointerdown.stop
          @click="shell.toggleVisibility(l.id)"
        >
          <Icon v-if="l.visible" name="eye" :size="16" />
        </button>
        <span class="thumb-cell">
          <span v-if="l.isText" class="thumb text-thumb"><Icon name="text" :size="18" /></span>
          <span
            v-else
            class="thumb"
            :class="l.filled ? 'filled' : 'ps-checker'"
            :style="thumbStyle"
          />
        </span>
        <input
          v-if="editingId === l.id"
          ref="editInput"
          v-model="editText"
          class="ps-input rename"
          type="text"
          @pointerdown.stop
          @keydown="onRenameKeydown"
          @blur="commitRename"
        />
        <span v-else class="name" @dblclick="startRename(l)">{{ l.name }}</span>
      </li>
    </ul>

    <div class="panel-footer">
      <button
        ref="newButton"
        type="button"
        class="ps-icon-btn"
        :class="{ 'drop-target': drag?.active && drag.overNew }"
        :title="S.layers.newLayer"
        :aria-label="S.layers.newLayer"
        :disabled="!tab"
        @click="shell.createLayer()"
      >
        <Icon name="newLayer" :size="18" />
      </button>
      <button
        type="button"
        class="ps-icon-btn"
        :title="S.layers.deleteLayer"
        :aria-label="S.layers.deleteLayer"
        :disabled="!tab || rows.length <= 1"
        @click="active && shell.deleteLayer(active.id)"
      >
        <Icon name="trash" :size="18" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.layers-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  background: var(--ps-panel-bg);
}

.panel-tabs {
  display: flex;
  align-items: flex-end;
  height: var(--ps-panel-tab-h);
  padding-left: 2px;
  background: var(--ps-panel-tabstrip-bg);
  border-bottom: 1px solid var(--ps-border);
}

.panel-tab {
  display: flex;
  align-items: center;
  height: calc(var(--ps-panel-tab-h) - 2px);
  margin-bottom: -1px;
  padding: 0 12px;
  border: 1px solid var(--ps-border);
  border-bottom: none;
  border-radius: 2px 2px 0 0;
  background: var(--ps-panel-bg);
  font-weight: bold;
}

.panel-menu {
  display: flex;
  align-items: center;
  margin: 0 4px 1px auto;
  color: var(--ps-text-muted);
}

.layer-props {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px;
  border-bottom: 1px solid var(--ps-separator);
}

.blend {
  width: 92px;
}

.layer-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  background: var(--ps-layer-list-bg);
  border-bottom: 1px solid var(--ps-border);
}

.layer-row {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--ps-layer-row-h);
  border-bottom: 1px solid var(--ps-layer-row-border);
  cursor: default;
}

.layer-row.active {
  color: var(--ps-highlight-text);
  background: var(--ps-highlight);
}

.layer-row.dragging {
  opacity: 0.6;
}

.layer-row.drop-before::before,
.layer-row.drop-after::after {
  position: absolute;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--ps-text);
  content: '';
}

.layer-row.drop-before::before {
  top: -1px;
}

.layer-row.drop-after::after {
  bottom: -1px;
}

.eye {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin: 0 3px;
  padding: 0;
  color: var(--ps-text);
  border: 1px solid var(--ps-bevel-dark);
  background: var(--ps-chrome-bg-light);
}

.thumb-cell {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  border-left: 1px solid var(--ps-layer-row-border);
}

.thumb {
  display: block;
  --checker: 6px;
  border: 1px solid #777;
}

.thumb.filled {
  background: #fff;
}

.text-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--ps-text);
  background: var(--ps-chrome-bg-light);
}

.name {
  flex: 1;
  overflow: hidden;
  padding: 0 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rename {
  flex: 1;
  min-width: 0;
  margin: 0 6px;
  color: var(--ps-text);
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  padding: 3px 6px;
}

.drop-target {
  border-color: var(--ps-highlight);
  background: var(--ps-hover);
}
</style>
