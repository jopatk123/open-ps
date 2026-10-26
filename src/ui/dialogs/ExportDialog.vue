<script setup lang="ts">
import { computed, ref } from 'vue';
import { useShellStore } from '../../app/stores/shell';
import { S } from '../../app/strings';
import Dialog from './Dialog.vue';

const emit = defineEmits<{ close: [] }>();
const T = S.dialogs.export;

const FORMATS = [
  { id: 'png', label: 'PNG', ext: '.png', lossy: false },
  { id: 'jpeg', label: 'JPEG', ext: '.jpg', lossy: true },
  { id: 'webp', label: 'WebP', ext: '.webp', lossy: true },
] as const;
type FormatId = (typeof FORMATS)[number]['id'];

const shell = useShellStore();
const fileName = ref(shell.activeTab?.name ?? S.tabs.untitled(1));
const format = ref<FormatId>('png');
const quality = ref(90);
const current = computed(() => FORMATS.find((f) => f.id === format.value) ?? FORMATS[0]);

function clampQuality() {
  const q = Number(quality.value);
  quality.value = Number.isFinite(q) ? Math.max(0, Math.min(100, Math.round(q))) : 90;
}
</script>

<template>
  <Dialog :title="T.title" @ok="emit('close')" @cancel="emit('close')">
    <div class="ps-form export-form">
      <label class="ps-form-label" for="export-name">{{ T.fileName }}</label>
      <span class="ps-form-row">
        <input id="export-name" v-model="fileName" class="ps-input name" type="text" />
        <span class="ext">{{ current.ext }}</span>
      </span>

      <label class="ps-form-label" for="export-format">{{ T.format }}</label>
      <select id="export-format" v-model="format" class="ps-select format">
        <option v-for="f in FORMATS" :key="f.id" :value="f.id">{{ f.label }}</option>
      </select>

      <label class="ps-form-label" for="export-quality">{{ T.quality }}</label>
      <span class="ps-form-row">
        <input
          v-model.number="quality"
          type="range"
          min="0"
          max="100"
          class="slider"
          :aria-label="T.quality"
          :disabled="!current.lossy"
        />
        <input
          id="export-quality"
          v-model.number="quality"
          class="ps-input quality"
          type="number"
          min="0"
          max="100"
          :disabled="!current.lossy"
          @change="clampQuality"
        />
      </span>

      <span class="ps-form-label">{{ T.estimatedSize }}</span>
      <span>{{ T.estimatedUnknown }}</span>
    </div>
    <p class="note">{{ T.note }}</p>
  </Dialog>
</template>

<style scoped>
.export-form {
  width: 340px;
}

.name {
  flex: 1;
  min-width: 0;
}

.ext {
  width: 36px;
  color: var(--ps-text-muted);
}

.format {
  width: 100px;
}

.slider {
  flex: 1;
  margin: 0;
}

.quality {
  width: 52px;
}

.note {
  width: 340px;
  margin: 12px 0 0;
  color: var(--ps-text-muted);
}
</style>
