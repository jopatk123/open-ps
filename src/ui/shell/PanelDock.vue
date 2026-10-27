<script setup lang="ts">
import LayersPanel from '../panels/LayersPanel.vue';
</script>

<template>
  <aside class="panel-dock">
    <div class="dock-header" aria-hidden="true"><span /><span /></div>
    <LayersPanel />
  </aside>
</template>

<style scoped>
.panel-dock {
  display: flex;
  flex-direction: column;
  width: var(--ps-dock-w);
  min-height: 0;
  background: var(--ps-panel-bg);
  border-left: 1px solid var(--ps-border);
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  height: var(--ps-panel-header-h);
  padding-right: 6px;
  background: var(--ps-panel-header-bg);
}

.dock-header span {
  width: 3px;
  height: 3px;
  border-top: 1px solid #c8c8c8;
  border-right: 1px solid #c8c8c8;
  transform: rotate(45deg);
}
</style>
