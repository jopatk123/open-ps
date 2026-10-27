<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAppContext } from '../../app/commands/context';
import { buildMenus, type Menu, type MenuItem } from '../../app/commands/menus';
import { COMMANDS, isEnabled } from '../../app/commands/registry';
import { formatShortcut } from '../../app/commands/shortcut';
import type { MenuId } from '../../app/commands/types';
import { useUiStore } from '../../app/stores/ui';
import { IS_MAC } from '../../lib/platform';

const ui = useUiStore();
const { ctx, runCommand } = useAppContext();

const menus: Menu[] = buildMenus(COMMANDS);
const root = ref<HTMLElement | null>(null);
const hot = ref(-1);

const openIndex = computed(() => menus.findIndex((m) => m.id === ui.openMenu));

watch(
  () => ui.openMenu,
  () => (hot.value = -1),
);

const enabled = (item: MenuItem) => isEnabled(item.command, ctx.value);
const shortcutText = (item: MenuItem) => {
  const s = item.command.shortcuts?.[0];
  return s ? formatShortcut(s, IS_MAC) : '';
};

function open(id: MenuId | null) {
  ui.setOpenMenu(id);
}

function onTitleDown(id: MenuId, e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  open(ui.openMenu === id ? null : id);
}

function onTitleEnter(id: MenuId) {
  if (ui.openMenu !== null && ui.openMenu !== id) open(id);
}

function activate(item: MenuItem) {
  if (!enabled(item)) return;
  runCommand(item.command);
  open(null);
}

function moveHot(menu: Menu, dir: 1 | -1) {
  const n = menu.items.length;
  const start = hot.value >= 0 ? hot.value : dir > 0 ? -1 : n;
  for (let step = 1; step <= n; step++) {
    const i = (((start + dir * step) % n) + n) % n;
    const item = menu.items[i];
    if (item && enabled(item)) {
      hot.value = i;
      return;
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  const menu = menus[openIndex.value];
  if (!menu) return;
  switch (e.key) {
    case 'Escape':
      open(null);
      break;
    case 'ArrowDown':
      moveHot(menu, 1);
      break;
    case 'ArrowUp':
      moveHot(menu, -1);
      break;
    case 'ArrowLeft':
    case 'ArrowRight': {
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      const next = menus[(openIndex.value + dir + menus.length) % menus.length];
      if (next) open(next.id);
      break;
    }
    case 'Enter': {
      const item = menu.items[hot.value];
      if (item) activate(item);
      break;
    }
    default:
      return;
  }
  e.preventDefault();
}

function onOutsidePointer(e: PointerEvent) {
  if (ui.openMenu !== null && root.value && !root.value.contains(e.target as Node)) open(null);
}

function onWindowBlur() {
  open(null);
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('pointerdown', onOutsidePointer, true);
  window.addEventListener('blur', onWindowBlur);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('pointerdown', onOutsidePointer, true);
  window.removeEventListener('blur', onWindowBlur);
});
</script>

<template>
  <nav ref="root" class="menubar" role="menubar">
    <div
      v-for="menu in menus"
      :key="menu.id"
      class="menu"
      :class="{ open: ui.openMenu === menu.id }"
    >
      <button
        type="button"
        class="menu-title"
        role="menuitem"
        aria-haspopup="menu"
        :aria-expanded="ui.openMenu === menu.id"
        :data-menu="menu.id"
        @pointerdown="onTitleDown(menu.id, $event)"
        @pointerenter="onTitleEnter(menu.id)"
      >
        {{ menu.title }}
      </button>
      <ul v-if="ui.openMenu === menu.id" class="dropdown" role="menu" :aria-label="menu.title">
        <template v-for="(item, i) in menu.items" :key="item.command.id">
          <li v-if="item.separatorBefore" class="separator" role="separator" />
          <li
            class="item"
            role="menuitem"
            :class="{ disabled: !enabled(item), hot: hot === i }"
            :aria-disabled="!enabled(item)"
            :data-command="item.command.id"
            @pointerenter="hot = enabled(item) ? i : -1"
            @pointerleave="hot = -1"
            @click="activate(item)"
          >
            <span class="label">{{ item.command.label }}</span>
            <span class="shortcut">{{ shortcutText(item) }}</span>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.menubar {
  display: flex;
  align-items: stretch;
  height: var(--ps-menubar-h);
  padding: 0 4px;
  background: var(--ps-chrome-gradient);
  border-bottom: 1px solid var(--ps-bevel-dark);
}

.menu {
  position: relative;
}

.menu-title {
  height: 100%;
  padding: 0 9px;
  border: 1px solid transparent;
  background: transparent;
  cursor: default;
}

.menu-title:hover {
  border-color: var(--ps-bevel-dark);
  background: var(--ps-chrome-bg-light);
}

.open .menu-title {
  border-color: var(--ps-menu-border);
  border-bottom-color: var(--ps-menu-title-open-bg);
  background: var(--ps-menu-title-open-bg);
}

.dropdown {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  z-index: 100;
  min-width: 220px;
  margin: 0;
  padding: 2px;
  list-style: none;
  border: 1px solid var(--ps-menu-border);
  background: var(--ps-menu-bg);
  box-shadow: var(--ps-menu-shadow);
}

.item {
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 12px 0 24px;
  white-space: nowrap;
  cursor: default;
}

.item.hot {
  color: var(--ps-highlight-text);
  background: var(--ps-highlight);
}

.item.disabled {
  color: var(--ps-text-disabled);
}

.label {
  flex: 1;
}

.shortcut {
  margin-left: 32px;
  text-align: right;
}

.separator {
  height: 1px;
  margin: 3px 2px 3px 24px;
  background: var(--ps-separator);
}
</style>
