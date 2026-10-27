<script setup lang="ts">
import { useUiStore } from '../../app/stores/ui';
import ColorPickerDialog from './ColorPickerDialog.vue';
import ExportDialog from './ExportDialog.vue';
import NewDialog from './NewDialog.vue';
import OpenDialog from './OpenDialog.vue';

const ui = useUiStore();
</script>

<template>
  <NewDialog v-if="ui.dialog === 'new'" @close="ui.closeDialog()" />
  <OpenDialog v-else-if="ui.dialog === 'open'" @close="ui.closeDialog()" />
  <ExportDialog v-else-if="ui.dialog === 'export'" @close="ui.closeDialog()" />
  <ColorPickerDialog v-else-if="ui.dialog === 'colorPicker'" @close="ui.closeDialog()" />
</template>
