<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useShellStore } from '../../app/stores/shell';
import { S } from '../../app/strings';

const shell = useShellStore();
const tab = computed(() => shell.activeTab);

// Step 2：缩放输入框可编辑但不生效，失焦或回车后恢复为当前缩放。
const zoomText = ref('');
const reset = () => (zoomText.value = `${tab.value?.zoom ?? 100}%`);
watch(() => tab.value?.zoom, reset, { immediate: true });

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing) return;
  if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
}
</script>

<template>
  <footer v-if="tab" class="status-bar">
    <input
      v-model="zoomText"
      class="zoom"
      type="text"
      :aria-label="S.status.zoom"
      @keydown="onKeydown"
      @blur="reset"
    />
    <span class="divider" />
    <span class="info">{{ S.status.dimensions(tab.width, tab.height) }}</span>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  height: var(--ps-statusbar-h);
  padding: 0 4px;
  background: var(--ps-chrome-bg);
  border-top: 1px solid var(--ps-border);
}

.zoom {
  width: 52px;
  height: 16px;
  padding: 0 3px;
  border: 1px solid transparent;
  background: transparent;
}

.zoom:hover,
.zoom:focus {
  border-color: var(--ps-input-border);
  background: var(--ps-input-bg);
  outline: none;
}

.divider {
  width: 1px;
  height: 14px;
  margin: 0 8px 0 4px;
  background: var(--ps-separator);
  box-shadow: 1px 0 0 var(--ps-bevel-light);
}
</style>
