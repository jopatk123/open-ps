<script setup lang="ts">
import { useUiStore } from '../../app/stores/ui';

const ui = useUiStore();
</script>

<template>
  <div class="toast-region" aria-live="polite">
    <div v-if="ui.toast" :key="ui.toast.id" class="toast" role="status">{{ ui.toast.message }}</div>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  bottom: 48px;
  left: 50%;
  z-index: 300;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  padding: 6px 14px;
  border: 1px solid #767676;
  background: var(--ps-tooltip-bg);
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}
</style>
