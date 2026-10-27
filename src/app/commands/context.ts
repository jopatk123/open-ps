import { computed } from 'vue';
import { useShellStore } from '../stores/shell';
import { useUiStore } from '../stores/ui';
import { isEnabled } from './registry';
import type { AppCommand, AppContext } from './types';

/** 由 store 组装命令上下文（响应式），供菜单与键盘分发共用。 */
export function useAppContext() {
  const shell = useShellStore();
  const ui = useUiStore();

  const ctx = computed<AppContext>(() => {
    const tab = shell.activeTab;
    const index = shell.activeLayerIndex;
    const active = tab?.layers[index];
    const below = index > 0 ? tab?.layers[index - 1] : undefined;
    return {
      hasDocument: !!tab,
      hasSelection: false,
      canUndo: false,
      canRedo: false,
      layerCount: tab?.layers.length ?? 0,
      activeLayerIndex: index,
      activeLayerIsText: !!active?.isText,
      activeLayerVisible: !!active?.visible,
      layerBelowVisible: !!below?.visible,
      openDialog: (id) => ui.openDialog(id),
      comingSoon: () => ui.comingSoon(),
    };
  });

  function runCommand(c: AppCommand): boolean {
    if (!isEnabled(c, ctx.value)) return false;
    ui.setOpenMenu(null);
    void c.run(ctx.value);
    return true;
  }

  return { ctx, runCommand };
}
