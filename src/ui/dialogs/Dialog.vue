<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { S } from '../../app/strings';
import Icon from '../icons/Icon.vue';

const props = withDefaults(defineProps<{ title: string; okDisabled?: boolean }>(), {
  okDisabled: false,
});
const emit = defineEmits<{ ok: []; cancel: [] }>();

const titleId = useId();
const box = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const okButton = ref<HTMLButtonElement | null>(null);
const offset = ref({ x: 0, y: 0 });

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ok() {
  if (props.okDisabled) return;
  // 先让正在编辑的输入框失焦提交，再确定。
  const activeEl = document.activeElement;
  if (activeEl instanceof HTMLElement && box.value?.contains(activeEl)) activeEl.blur();
  emit('ok');
}

function trapFocus(e: KeyboardEvent) {
  const els = Array.from(box.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
  const first = els[0];
  const last = els[els.length - 1];
  if (!first || !last) return;
  const activeEl = document.activeElement;
  if (!box.value?.contains(activeEl)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && activeEl === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && activeEl === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    emit('cancel');
  } else if (e.key === 'Enter') {
    const t = e.target;
    if (t instanceof HTMLTextAreaElement || t instanceof HTMLButtonElement) return;
    e.preventDefault();
    ok();
  } else if (e.key === 'Tab') {
    trapFocus(e);
  }
}

// ---------- 拖动标题栏 ----------
let dragStart: { x: number; y: number; ox: number; oy: number; rect: DOMRect } | null = null;

function onDragStart(e: PointerEvent) {
  if (e.button !== 0 || !box.value) return;
  e.preventDefault();
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    ox: offset.value.x,
    oy: offset.value.y,
    rect: box.value.getBoundingClientRect(),
  };
}

function onDragMove(e: PointerEvent) {
  if (!dragStart) return;
  const { rect } = dragStart;
  const minDx = 40 - rect.right;
  const maxDx = window.innerWidth - 40 - rect.left;
  const minDy = -rect.top;
  const maxDy = window.innerHeight - 24 - rect.top;
  const dx = Math.max(minDx, Math.min(maxDx, e.clientX - dragStart.x));
  const dy = Math.max(minDy, Math.min(maxDy, e.clientY - dragStart.y));
  offset.value = { x: dragStart.ox + dx, y: dragStart.oy + dy };
}

function onDragEnd() {
  dragStart = null;
}

let previousFocus: Element | null = null;

onMounted(() => {
  previousFocus = document.activeElement;
  window.addEventListener('keydown', onKeydown);
  const first = content.value?.querySelector<HTMLElement>(FOCUSABLE);
  const target = first ?? okButton.value;
  target?.focus();
  if (target instanceof HTMLInputElement && target.type === 'text') target.select();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
});
</script>

<template>
  <div class="overlay" @pointerdown.self.prevent @contextmenu.prevent>
    <div
      ref="box"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :style="{ transform: `translate(${offset.x}px, ${offset.y}px)` }"
    >
      <header
        class="titlebar"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span :id="titleId" class="title">{{ title }}</span>
        <button
          type="button"
          class="close"
          tabindex="-1"
          :aria-label="S.dialogs.close"
          @pointerdown.stop
          @click="emit('cancel')"
        >
          <Icon name="close" :size="12" />
        </button>
      </header>
      <div class="body">
        <div ref="content" class="content"><slot /></div>
        <div class="buttons">
          <button
            ref="okButton"
            type="button"
            class="ps-btn ps-btn--primary"
            data-dialog-ok
            :disabled="okDisabled"
            @click="ok"
          >
            {{ S.dialogs.ok }}
          </button>
          <button type="button" class="ps-btn" data-dialog-cancel @click="emit('cancel')">
            {{ S.dialogs.cancel }}
          </button>
          <slot name="aside" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 8vh;
  background: rgba(0, 0, 0, 0.04);
}

.dialog {
  min-width: 360px;
  border: 1px solid var(--ps-border-strong);
  background: var(--ps-dialog-bg);
  box-shadow: var(--ps-dialog-shadow);
}

.titlebar {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 4px 0 8px;
  background: var(--ps-dialog-title-gradient);
  border-bottom: 1px solid var(--ps-bevel-dark);
  cursor: default;
  touch-action: none;
}

.title {
  flex: 1;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 16px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
}

.close:hover {
  color: #fff;
  border-color: #a33;
  background: #d24c4c;
}

.body {
  display: flex;
  gap: 16px;
  padding: 14px 12px 14px 14px;
}

.content {
  flex: 1;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 82px;
}

.buttons .ps-btn {
  width: 100%;
  height: 22px;
}
</style>
