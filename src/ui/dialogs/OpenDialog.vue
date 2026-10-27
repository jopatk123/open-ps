<script setup lang="ts">
import { ref } from 'vue';
import { useUiStore } from '../../app/stores/ui';
import { S } from '../../app/strings';
import Dialog from './Dialog.vue';

const emit = defineEmits<{ close: [] }>();
const T = S.dialogs.open;
const ui = useUiStore();
const dragOver = ref(false);

// Step 2 不读文件：拖放与"选择文件…"都只提示后续版本提供。
function onDrop() {
  dragOver.value = false;
  ui.comingSoon();
}
</script>

<template>
  <Dialog :title="T.title" @ok="emit('close')" @cancel="emit('close')">
    <div class="open-form">
      <div
        class="drop-zone"
        :class="{ over: dragOver }"
        @dragenter.prevent="dragOver = true"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
      >
        <span>{{ T.dropHint }}</span>
        <button type="button" class="ps-btn" @click="ui.comingSoon()">{{ T.chooseFiles }}</button>
      </div>
      <p class="note">{{ T.formats }}</p>
      <p class="note">{{ T.windowDropHint }}</p>
    </div>
  </Dialog>
</template>

<style scoped>
.open-form {
  width: 360px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 150px;
  border: 1px dashed var(--ps-border);
  background: var(--ps-chrome-bg-light);
  color: var(--ps-text-muted);
}

.drop-zone.over {
  border-color: var(--ps-highlight);
  background: var(--ps-hover);
}

.note {
  margin: 8px 0 0;
  color: var(--ps-text-muted);
}
</style>
