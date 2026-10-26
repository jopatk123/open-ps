<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useAppContext } from './commands/context';
import { COMMANDS } from './commands/registry';
import { createKeyDownHandler } from './keyboard';
import { useShellStore } from './stores/shell';
import { useUiStore } from './stores/ui';
import { IS_MAC } from '../lib/platform';
import CanvasHost from '../ui/canvas/CanvasHost.vue';
import DialogHost from '../ui/dialogs/DialogHost.vue';
import DocumentTabs from '../ui/shell/DocumentTabs.vue';
import MenuBar from '../ui/shell/MenuBar.vue';
import OptionsBar from '../ui/shell/OptionsBar.vue';
import PanelDock from '../ui/shell/PanelDock.vue';
import StatusBar from '../ui/shell/StatusBar.vue';
import Toast from '../ui/shell/Toast.vue';
import Toolbar from '../ui/shell/Toolbar.vue';

const shell = useShellStore();
const ui = useUiStore();
const { ctx, runCommand } = useAppContext();

const onKeydown = createKeyDownHandler({
  commands: COMMANDS,
  isMac: IS_MAC,
  getContext: () => ctx.value,
  isBlocked: () => ui.isModalOpen || ui.openMenu !== null,
  runCommand,
  setTool: (id) => shell.setTool(id),
  resetForeground: () => shell.resetForeground(),
});

// 防止把文件拖进窗口时浏览器跳转打开它（全窗口拖放打开在 Step 5 实现）。
const preventDrop = (e: DragEvent) => e.preventDefault();

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('dragover', preventDrop);
  window.addEventListener('drop', preventDrop);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('dragover', preventDrop);
  window.removeEventListener('drop', preventDrop);
});
</script>

<template>
  <div class="app-shell">
    <MenuBar class="area-menu" />
    <OptionsBar class="area-options" />
    <Toolbar class="area-tools" />
    <main class="area-doc">
      <DocumentTabs />
      <CanvasHost />
      <StatusBar />
    </main>
    <PanelDock class="area-dock" />
    <DialogHost />
    <Toast />
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-areas:
    'menu menu menu'
    'options options options'
    'tools doc dock';
  grid-template-rows: var(--ps-menubar-h) var(--ps-optionsbar-h) minmax(0, 1fr);
  grid-template-columns: var(--ps-toolbar-w) minmax(0, 1fr) var(--ps-dock-w);
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.area-menu {
  grid-area: menu;
  z-index: 10;
}

.area-options {
  grid-area: options;
}

.area-tools {
  grid-area: tools;
}

.area-doc {
  display: flex;
  flex-direction: column;
  grid-area: doc;
  min-width: 0;
  min-height: 0;
  background: var(--ps-pasteboard);
}

.area-dock {
  grid-area: dock;
}
</style>
