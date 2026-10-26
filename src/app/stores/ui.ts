import { defineStore } from 'pinia';
import type { DialogId, MenuId } from '../commands/types';
import { S } from '../strings';

const TOAST_MS = 2400;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastSeq = 0;

/** 界面状态：打开的菜单、模态对话框、提示条。 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    openMenu: null as MenuId | null,
    dialog: null as DialogId | null,
    toast: null as { id: number; message: string } | null,
  }),

  getters: {
    isModalOpen: (state) => state.dialog !== null,
  },

  actions: {
    setOpenMenu(id: MenuId | null) {
      this.openMenu = id;
    },
    openDialog(id: DialogId) {
      this.openMenu = null;
      this.dialog = id;
    },
    closeDialog() {
      this.dialog = null;
    },
    showToast(message: string) {
      this.toast = { id: ++toastSeq, message };
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        this.toast = null;
      }, TOAST_MS);
    },
    comingSoon() {
      this.showToast(S.comingSoon);
    },
  },
});
