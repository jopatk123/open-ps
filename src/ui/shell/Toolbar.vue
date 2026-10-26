<script setup lang="ts">
import { useShellStore } from '../../app/stores/shell';
import { useUiStore } from '../../app/stores/ui';
import { S } from '../../app/strings';
import { TOOLS, toolTooltip } from '../../app/toolDefs';
import Icon from '../icons/Icon.vue';

const shell = useShellStore();
const ui = useUiStore();
</script>

<template>
  <aside class="toolbar" :aria-label="S.toolbarLabel">
    <div class="grip" aria-hidden="true"><span /><span /></div>
    <div class="tools" role="toolbar" :aria-label="S.toolbarLabel" aria-orientation="vertical">
      <button
        v-for="t in TOOLS"
        :key="t.id"
        type="button"
        class="tool"
        :class="{ active: shell.activeToolId === t.id }"
        :title="toolTooltip(t)"
        :aria-label="toolTooltip(t)"
        :aria-pressed="shell.activeToolId === t.id"
        :data-tool="t.id"
        @click="shell.setTool(t.id)"
      >
        <Icon :name="t.id" />
      </button>
    </div>
    <div class="color-sep" />
    <button
      type="button"
      class="fg-swatch"
      :title="S.foregroundColorTooltip"
      :aria-label="S.foregroundColor"
      :style="{ backgroundColor: shell.foregroundColor }"
      @click="ui.openDialog('colorPicker')"
    />
  </aside>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--ps-toolbar-w);
  background: var(--ps-chrome-bg);
  border-right: 1px solid var(--ps-bevel-dark);
}

.grip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: var(--ps-panel-header-h);
  background: var(--ps-panel-header-bg);
}

.grip span {
  width: 3px;
  height: 3px;
  border-top: 1px solid #c8c8c8;
  border-right: 1px solid #c8c8c8;
  transform: rotate(45deg);
}

.tools {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 6px;
}

.tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 26px;
  padding: 0;
  color: #262626;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  cursor: default;
}

.tool:hover {
  border-color: var(--ps-bevel-dark);
  background: var(--ps-tool-hover-bg);
}

.tool.active {
  border-color: var(--ps-tool-active-border);
  background: var(--ps-tool-active-bg);
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.25);
}

.tool:focus-visible {
  outline: 1px solid var(--ps-focus-ring);
}

.color-sep {
  width: 26px;
  height: 1px;
  margin: 8px 0 7px;
  background: var(--ps-separator);
  box-shadow: 0 1px 0 var(--ps-bevel-light);
}

.fg-swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #fff;
  outline: 1px solid #555;
  cursor: default;
}

.fg-swatch:focus-visible {
  outline: 2px solid var(--ps-focus-ring);
}
</style>
