<script setup lang="ts">
import { computed } from 'vue';
import { useShellStore, type SelectionMode, type TextAlign } from '../../app/stores/shell';
import { useUiStore } from '../../app/stores/ui';
import { S } from '../../app/strings';
import { TOOLS } from '../../app/toolDefs';
import NumberField from '../controls/NumberField.vue';
import Icon from '../icons/Icon.vue';
import type { IconName } from '../icons/names';

const shell = useShellStore();
const ui = useUiStore();
const o = computed(() => shell.toolOptions);
const tool = computed(() => TOOLS.find((t) => t.id === shell.activeToolId) ?? TOOLS[0]!);

const selectionModes: Array<{ id: SelectionMode; icon: IconName; label: string }> = [
  { id: 'new', icon: 'selNew', label: S.options.selectionModes.new },
  { id: 'add', icon: 'selAdd', label: S.options.selectionModes.add },
  { id: 'subtract', icon: 'selSubtract', label: S.options.selectionModes.subtract },
  { id: 'intersect', icon: 'selIntersect', label: S.options.selectionModes.intersect },
];

const aligns: Array<{ id: TextAlign; icon: IconName; label: string }> = [
  { id: 'left', icon: 'alignLeft', label: S.options.alignLeft },
  { id: 'center', icon: 'alignCenter', label: S.options.alignCenter },
  { id: 'right', icon: 'alignRight', label: S.options.alignRight },
];
</script>

<template>
  <div class="options-bar" :data-tool="tool.id">
    <button type="button" class="preset" :title="S.options.toolPreset" tabindex="-1">
      <Icon :name="tool.id" />
      <Icon name="chevronDown" :size="10" />
    </button>
    <span class="ps-sep-v" />

    <!-- 选择工具 M -->
    <template v-if="tool.id === 'marquee'">
      <span class="group" role="radiogroup">
        <button
          v-for="m in selectionModes"
          :key="m.id"
          type="button"
          class="ps-icon-btn"
          :title="m.label"
          :aria-label="m.label"
          :aria-pressed="o.marquee.mode === m.id"
          @click="o.marquee.mode = m.id"
        >
          <Icon :name="m.icon" :size="18" />
        </button>
      </span>
    </template>

    <!-- 魔棒工具 W -->
    <template v-else-if="tool.id === 'magicWand'">
      <span class="group" role="radiogroup">
        <button
          v-for="m in selectionModes"
          :key="m.id"
          type="button"
          class="ps-icon-btn"
          :title="m.label"
          :aria-label="m.label"
          :aria-pressed="o.magicWand.mode === m.id"
          @click="o.magicWand.mode = m.id"
        >
          <Icon :name="m.icon" :size="18" />
        </button>
      </span>
      <span class="ps-sep-v" />
      <NumberField
        v-model="o.magicWand.tolerance"
        :label="S.options.tolerance"
        :min="0"
        :max="255"
        :width="40"
      />
      <label class="ps-check"
        ><input v-model="o.magicWand.contiguous" type="checkbox" />{{ S.options.contiguous }}</label
      >
    </template>

    <!-- 裁剪工具 C：提交/取消只在裁剪进行中可用 -->
    <template v-else-if="tool.id === 'crop'">
      <span class="spacer" />
      <button
        type="button"
        class="ps-icon-btn"
        disabled
        :title="S.options.cancel"
        :aria-label="S.options.cancel"
      >
        <Icon name="cancel" :size="18" />
      </button>
      <button
        type="button"
        class="ps-icon-btn"
        disabled
        :title="S.options.commit"
        :aria-label="S.options.commit"
      >
        <Icon name="commit" :size="18" />
      </button>
    </template>

    <!-- 画笔工具 B -->
    <template v-else-if="tool.id === 'brush'">
      <NumberField
        v-model="o.brush.size"
        :label="S.options.size"
        :min="1"
        :max="1000"
        suffix=" px"
        :width="58"
      />
      <NumberField
        v-model="o.brush.hardness"
        :label="S.options.hardness"
        :min="0"
        :max="100"
        suffix="%"
        slider
      />
      <NumberField
        v-model="o.brush.opacity"
        :label="S.options.opacity"
        :min="1"
        :max="100"
        suffix="%"
        slider
      />
    </template>

    <!-- 吸管工具 I -->
    <template v-else-if="tool.id === 'eyedropper'">
      <label class="field">
        {{ S.options.sampleSize }}
        <select v-model="o.eyedropper.sampleSize" class="ps-select">
          <option value="point">{{ S.options.samplePoint }}</option>
          <option value="average3">{{ S.options.sampleAverage3 }}</option>
        </select>
      </label>
      <label class="field">
        {{ S.options.sample }}
        <select v-model="o.eyedropper.sample" class="ps-select">
          <option value="all">{{ S.options.sampleAllLayers }}</option>
          <option value="current">{{ S.options.sampleCurrentLayer }}</option>
        </select>
      </label>
    </template>

    <!-- 钢笔工具 P -->
    <template v-else-if="tool.id === 'pen'">
      <span class="hint">{{ S.options.penHint }}</span>
      <button type="button" class="ps-btn" disabled>{{ S.options.makeSelection }}</button>
    </template>

    <!-- 仿制工具 S -->
    <template v-else-if="tool.id === 'clone'">
      <NumberField
        v-model="o.clone.size"
        :label="S.options.size"
        :min="1"
        :max="1000"
        suffix=" px"
        :width="58"
      />
      <NumberField
        v-model="o.clone.hardness"
        :label="S.options.hardness"
        :min="0"
        :max="100"
        suffix="%"
        slider
      />
      <NumberField
        v-model="o.clone.opacity"
        :label="S.options.opacity"
        :min="1"
        :max="100"
        suffix="%"
        slider
      />
      <label class="ps-check"
        ><input v-model="o.clone.aligned" type="checkbox" />{{ S.options.aligned }}</label
      >
    </template>

    <!-- 填充工具 G -->
    <template v-else-if="tool.id === 'fill'">
      <NumberField
        v-model="o.fill.opacity"
        :label="S.options.opacity"
        :min="1"
        :max="100"
        suffix="%"
        slider
      />
      <NumberField
        v-model="o.fill.tolerance"
        :label="S.options.tolerance"
        :min="0"
        :max="255"
        :width="40"
      />
      <label class="ps-check"
        ><input v-model="o.fill.contiguous" type="checkbox" />{{ S.options.contiguous }}</label
      >
    </template>

    <!-- 文字工具 T -->
    <template v-else-if="tool.id === 'text'">
      <select
        v-model="o.text.fontFamily"
        class="ps-select font"
        :aria-label="S.options.fontFamily"
        :title="S.options.fontFamily"
      >
        <option v-for="f in S.fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>
      <NumberField
        v-model="o.text.fontSize"
        :label="S.options.fontSize"
        :min="1"
        :max="1000"
        suffix=" px"
        :width="58"
      />
      <span class="ps-sep-v" />
      <span class="group" role="radiogroup">
        <button
          v-for="a in aligns"
          :key="a.id"
          type="button"
          class="ps-icon-btn"
          :title="a.label"
          :aria-label="a.label"
          :aria-pressed="o.text.align === a.id"
          @click="o.text.align = a.id"
        >
          <Icon :name="a.icon" :size="18" />
        </button>
      </span>
      <span class="ps-sep-v" />
      <button
        type="button"
        class="text-color"
        :title="S.options.textColor"
        :aria-label="S.options.textColor"
        :style="{ backgroundColor: shell.foregroundColor }"
        @click="ui.openDialog('colorPicker')"
      />
      <span class="spacer" />
      <button
        type="button"
        class="ps-icon-btn"
        disabled
        :title="S.options.cancel"
        :aria-label="S.options.cancel"
      >
        <Icon name="cancel" :size="18" />
      </button>
      <button
        type="button"
        class="ps-icon-btn"
        disabled
        :title="S.options.commit"
        :aria-label="S.options.commit"
      >
        <Icon name="commit" :size="18" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.options-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--ps-optionsbar-h);
  padding: 0 8px 0 4px;
  background: var(--ps-chrome-gradient);
  border-top: 1px solid var(--ps-bevel-light);
  border-bottom: 1px solid var(--ps-bevel-dark);
  white-space: nowrap;
}

.preset {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  height: 26px;
  padding: 0 2px 0 3px;
  border: 1px solid var(--ps-border);
  border-radius: 2px;
  background: var(--ps-button-gradient);
  cursor: default;
}

.preset + .ps-sep-v {
  margin: 4px 0;
}

.group {
  display: inline-flex;
  gap: 1px;
}

.field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.font {
  width: 120px;
}

.hint {
  color: var(--ps-text-muted);
}

.text-color {
  width: 34px;
  height: 18px;
  padding: 0;
  border: 1px solid #fff;
  outline: 1px solid #555;
  cursor: default;
}

.spacer {
  flex: 1;
}
</style>
