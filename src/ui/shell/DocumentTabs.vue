<script setup lang="ts">
import { tabTitle, useShellStore } from '../../app/stores/shell';
import { S } from '../../app/strings';
import Icon from '../icons/Icon.vue';

const shell = useShellStore();
</script>

<template>
  <div class="tabs" role="tablist">
    <div
      v-for="tab in shell.tabs"
      :key="tab.id"
      class="tab"
      role="tab"
      :class="{ active: tab.id === shell.activeTabId }"
      :aria-selected="tab.id === shell.activeTabId"
      :title="tabTitle(tab)"
      @pointerdown.left="shell.activateTab(tab.id)"
    >
      <span class="title">{{ tabTitle(tab) }}</span>
      <button
        type="button"
        class="close"
        :title="S.tabs.close"
        :aria-label="S.tabs.close"
        @pointerdown.stop
        @click="shell.closeTab(tab.id)"
      >
        <Icon name="close" :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: var(--ps-tabs-h);
  padding: 0 0 0 1px;
  overflow: hidden;
  background: var(--ps-tabstrip-bg);
  border-bottom: 1px solid var(--ps-border);
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 320px;
  height: calc(var(--ps-tabs-h) - 2px);
  padding: 0 4px 0 10px;
  border: 1px solid var(--ps-border);
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  background: var(--ps-tab-bg);
  color: var(--ps-text-muted);
  cursor: default;
}

.tab.active {
  height: calc(var(--ps-tabs-h) - 1px);
  margin-bottom: -1px;
  color: var(--ps-text);
  background: var(--ps-tab-active-bg);
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  color: var(--ps-text-muted);
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
}

.close:hover {
  color: var(--ps-text);
  border-color: var(--ps-bevel-dark);
  background: var(--ps-chrome-bg-light);
}
</style>
