<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useShellStore } from '../../app/stores/shell';

const PADDING = 40;

const shell = useShellStore();
const host = ref<HTMLElement | null>(null);
const hostSize = ref({ w: 0, h: 0 });

// Step 2 不做缩放平移：只把代表画布的白色矩形按比例放进可视区域并居中。
const rect = computed(() => {
  const tab = shell.activeTab;
  if (!tab) return null;
  const availW = Math.max(1, hostSize.value.w - PADDING * 2);
  const availH = Math.max(1, hostSize.value.h - PADDING * 2);
  const scale = Math.min(1, availW / tab.width, availH / tab.height);
  return { width: Math.round(tab.width * scale), height: Math.round(tab.height * scale) };
});

let observer: ResizeObserver | undefined;

onMounted(() => {
  const el = host.value;
  if (!el) return;
  const measure = () => (hostSize.value = { w: el.clientWidth, h: el.clientHeight });
  measure();
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(el);
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section
    ref="host"
    class="canvas-host"
    @contextmenu.prevent
    @dragstart.prevent
    @dragover.prevent
    @drop.prevent
  >
    <div
      v-if="rect"
      class="canvas"
      :style="{ width: `${rect.width}px`, height: `${rect.height}px` }"
    />
  </section>
</template>

<style scoped>
.canvas-host {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  background: var(--ps-pasteboard);
}

.canvas {
  flex: none;
  background: var(--ps-canvas-bg);
  box-shadow: var(--ps-canvas-shadow);
}
</style>
