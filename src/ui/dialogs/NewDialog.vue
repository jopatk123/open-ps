<script setup lang="ts">
import { ref, watch } from 'vue';
import { useShellStore } from '../../app/stores/shell';
import { S } from '../../app/strings';
import Dialog from './Dialog.vue';

const emit = defineEmits<{ close: [] }>();
const T = S.dialogs.new;
const MAX_SIDE = 8192;

const PRESETS = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 1080, h: 1080 },
  { w: 800, h: 600 },
];
const presetKey = (p: { w: number; h: number }) => `${p.w}x${p.h}`;

const shell = useShellStore();
const name = ref(shell.suggestedUntitledName);
const preset = ref(presetKey(PRESETS[0]!));
const width = ref(PRESETS[0]!.w);
const height = ref(PRESETS[0]!.h);
const background = ref<'white' | 'transparent' | 'foreground'>('white');

watch(preset, (key) => {
  const p = PRESETS.find((x) => presetKey(x) === key);
  if (p) {
    width.value = p.w;
    height.value = p.h;
  }
});

function clampSide(v: number) {
  return Number.isFinite(v) ? Math.max(1, Math.min(MAX_SIDE, Math.round(v))) : 1;
}

function onSizeChange() {
  width.value = clampSide(width.value);
  height.value = clampSide(height.value);
  const match = PRESETS.find((p) => p.w === width.value && p.h === height.value);
  preset.value = match ? presetKey(match) : 'custom';
}
</script>

<template>
  <Dialog :title="T.title" @ok="emit('close')" @cancel="emit('close')">
    <div class="ps-form new-form">
      <label class="ps-form-label" for="new-name">{{ T.name }}</label>
      <input id="new-name" v-model="name" class="ps-input" type="text" />

      <label class="ps-form-label" for="new-preset">{{ T.preset }}</label>
      <select id="new-preset" v-model="preset" class="ps-select">
        <option value="custom">{{ T.presetCustom }}</option>
        <option v-for="p in PRESETS" :key="presetKey(p)" :value="presetKey(p)">
          {{ T.presetSize(p.w, p.h) }}
        </option>
      </select>

      <label class="ps-form-label" for="new-width">{{ T.width }}</label>
      <span class="ps-form-row">
        <input
          id="new-width"
          v-model.number="width"
          class="ps-input size"
          type="number"
          min="1"
          :max="MAX_SIDE"
          @change="onSizeChange"
        />
        {{ T.pixels }}
      </span>

      <label class="ps-form-label" for="new-height">{{ T.height }}</label>
      <span class="ps-form-row">
        <input
          id="new-height"
          v-model.number="height"
          class="ps-input size"
          type="number"
          min="1"
          :max="MAX_SIDE"
          @change="onSizeChange"
        />
        {{ T.pixels }}
        <span class="range">（{{ T.sizeRange }}）</span>
      </span>

      <label class="ps-form-label" for="new-bg">{{ T.background }}</label>
      <select id="new-bg" v-model="background" class="ps-select">
        <option value="white">{{ T.bgWhite }}</option>
        <option value="transparent">{{ T.bgTransparent }}</option>
        <option value="foreground">{{ T.bgForeground }}</option>
      </select>
    </div>
  </Dialog>
</template>

<style scoped>
.new-form {
  width: 340px;
}

.size {
  width: 80px;
}

.range {
  color: var(--ps-text-muted);
}
</style>
