<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import Icon from '../icons/Icon.vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min: number;
    max: number;
    label?: string;
    /** 显示在数字后的单位，如 `%`、` px` */
    suffix?: string;
    width?: number;
    /** 显示 ▼ 按钮，弹出滑杆 */
    slider?: boolean;
    disabled?: boolean;
  }>(),
  { label: '', suffix: '', width: 48, slider: false, disabled: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const format = (v: number) => `${v}${props.suffix}`;
const text = ref(format(props.modelValue));
watch(
  () => props.modelValue,
  (v) => (text.value = format(v)),
);

const clamp = (v: number) => Math.max(props.min, Math.min(props.max, Math.round(v)));

function set(v: number) {
  const next = clamp(v);
  if (next !== props.modelValue) emit('update:modelValue', next);
  text.value = format(next);
}

function commit() {
  const n = parseFloat(text.value);
  if (Number.isFinite(n)) set(n);
  else text.value = format(props.modelValue);
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing) return;
  const input = e.target as HTMLInputElement;
  if (e.key === 'Enter') {
    commit();
    input.blur();
  } else if (e.key === 'Escape') {
    text.value = format(props.modelValue);
    input.blur();
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    set(props.modelValue + (e.key === 'ArrowUp' ? step : -step));
  }
}

// CS5 "scrubby"：在标签上左右拖动调整数值，Shift 加速 10 倍。
let scrub: { x: number; value: number } | null = null;

function onScrubDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  scrub = { x: e.clientX, value: props.modelValue };
  e.preventDefault();
}

function onScrubMove(e: PointerEvent) {
  if (!scrub) return;
  const dx = e.clientX - scrub.x;
  set(scrub.value + dx * (e.shiftKey ? 10 : 1));
}

function onScrubUp() {
  scrub = null;
}

const popupOpen = ref(false);
const root = ref<HTMLElement | null>(null);

function onOutsidePointer(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) closePopup();
}

function togglePopup() {
  if (popupOpen.value) closePopup();
  else {
    popupOpen.value = true;
    document.addEventListener('pointerdown', onOutsidePointer, true);
  }
}

function closePopup() {
  popupOpen.value = false;
  document.removeEventListener('pointerdown', onOutsidePointer, true);
}

onBeforeUnmount(closePopup);
</script>

<template>
  <span ref="root" class="number-field" :class="{ disabled }">
    <span
      v-if="label"
      class="scrub-label"
      @pointerdown="onScrubDown"
      @pointermove="onScrubMove"
      @pointerup="onScrubUp"
      @pointercancel="onScrubUp"
      >{{ label }}</span
    >
    <input
      v-model="text"
      class="ps-input"
      type="text"
      inputmode="numeric"
      :aria-label="label || undefined"
      :disabled="disabled"
      :style="{ width: `${width}px` }"
      @keydown="onKeydown"
      @blur="commit"
    />
    <button
      v-if="slider"
      type="button"
      class="popup-btn"
      tabindex="-1"
      :disabled="disabled"
      :aria-expanded="popupOpen"
      @click="togglePopup"
    >
      <Icon name="chevronDown" :size="12" />
    </button>
    <span v-if="popupOpen" class="popup">
      <input
        type="range"
        :min="min"
        :max="max"
        :value="modelValue"
        :aria-label="label || undefined"
        @input="set(Number(($event.target as HTMLInputElement).value))"
      />
    </span>
  </span>
</template>

<style scoped>
.number-field {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.scrub-label {
  cursor: ew-resize;
  white-space: nowrap;
}

.disabled .scrub-label {
  color: var(--ps-text-disabled);
  cursor: default;
}

.ps-input {
  text-align: left;
}

.popup-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: var(--ps-control-h);
  margin-left: -4px;
  padding: 0;
  border: 1px solid var(--ps-input-border);
  border-left: none;
  background: var(--ps-button-gradient);
}

.popup {
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  z-index: 50;
  padding: 6px 8px;
  border: 1px solid var(--ps-menu-border);
  background: var(--ps-menu-bg);
  box-shadow: var(--ps-menu-shadow);
}

.popup input {
  width: 140px;
  margin: 0;
}
</style>
