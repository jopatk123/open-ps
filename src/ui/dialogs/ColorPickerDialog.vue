<script setup lang="ts">
import { computed, ref } from 'vue';
import { useShellStore } from '../../app/stores/shell';
import { S } from '../../app/strings';
import { hexToRgb, hueToHex, normalizeHex, rgbToHsb } from '../../lib/color';
import Dialog from './Dialog.vue';

const emit = defineEmits<{ close: [] }>();
const T = S.dialogs.colorPicker;

// Step 2：拾色器只有静态外观，只能通过 # 十六进制输入修改颜色。
const shell = useShellStore();
const currentColor = shell.foregroundColor;
const hexText = ref(currentColor.slice(1));
const parsed = computed(() => normalizeHex(hexText.value));
const newColor = computed(() => parsed.value ?? currentColor);
const rgb = computed(() => hexToRgb(newColor.value));
const hsb = computed(() => rgbToHsb(rgb.value));

const fieldBg = computed(
  () =>
    `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueToHex(hsb.value.h)}`,
);

function onOk() {
  if (!parsed.value) return;
  shell.setForeground(parsed.value);
  emit('close');
}
</script>

<template>
  <Dialog :title="T.title" :ok-disabled="!parsed" @ok="onOk" @cancel="emit('close')">
    <div class="picker">
      <div class="field" :style="{ background: fieldBg }" aria-hidden="true">
        <span class="field-marker" :style="{ left: `${hsb.s}%`, top: `${100 - hsb.b}%` }" />
      </div>
      <div class="hue" aria-hidden="true">
        <span class="hue-marker" :style="{ bottom: `${(hsb.h / 360) * 100}%` }" />
      </div>
      <div class="side">
        <div class="swatches">
          <span class="swatch-label">{{ T.newColor }}</span>
          <span class="swatch" :style="{ backgroundColor: newColor }" />
          <span class="swatch" :style="{ backgroundColor: currentColor }" />
          <span class="swatch-label">{{ T.currentColor }}</span>
        </div>
        <div class="values">
          <span>{{ T.hue }}</span
          ><input class="ps-input" :value="hsb.h" readonly /><span>{{ T.degree }}</span>
          <span>{{ T.saturation }}</span
          ><input class="ps-input" :value="hsb.s" readonly /><span>%</span>
          <span>{{ T.brightness }}</span
          ><input class="ps-input" :value="hsb.b" readonly /><span>%</span>
          <span class="gap" />
          <span>{{ T.red }}</span
          ><input class="ps-input" :value="rgb.r" readonly /><span /> <span>{{ T.green }}</span
          ><input class="ps-input" :value="rgb.g" readonly /><span /> <span>{{ T.blue }}</span
          ><input class="ps-input" :value="rgb.b" readonly /><span />
        </div>
        <label class="hex">
          <span>{{ T.hex }}</span>
          <input v-model="hexText" class="ps-input" type="text" maxlength="7" spellcheck="false" />
        </label>
        <p v-if="!parsed" class="error">{{ T.invalidHex }}</p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.picker {
  display: flex;
  gap: 12px;
}

.field {
  position: relative;
  width: 256px;
  height: 256px;
  border: 1px solid var(--ps-border-strong);
}

.field-marker {
  position: absolute;
  width: 11px;
  height: 11px;
  margin: -6px 0 0 -6px;
  border: 1px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #000;
}

.hue {
  position: relative;
  width: 20px;
  height: 256px;
  border: 1px solid var(--ps-border-strong);
  background: linear-gradient(to top, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}

.hue-marker {
  position: absolute;
  right: -6px;
  left: -6px;
  height: 0;
  border-top: 1px solid #000;
  border-bottom: 1px solid #fff;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 150px;
}

.swatches {
  display: grid;
  grid-template-columns: 60px;
  justify-items: center;
}

.swatch {
  width: 60px;
  height: 30px;
  border: 1px solid var(--ps-border-strong);
}

.swatch + .swatch {
  border-top: none;
}

.values {
  display: grid;
  grid-template-columns: 18px 48px auto;
  gap: 4px;
  align-items: center;
}

.values .gap {
  grid-column: 1 / -1;
  height: 2px;
}

.values .ps-input {
  width: 48px;
  color: var(--ps-text-muted);
}

.hex {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hex .ps-input {
  width: 72px;
}

.error {
  margin: 0;
  color: #b00;
}
</style>
