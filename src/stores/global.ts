import { create } from 'zustand';

interface GlobalStore {
  openSetting: boolean;
  openHistory: boolean;
}

interface GlobalActions {
  setOpenSetting: (visible: boolean) => void;
  setOpenHistory: (visible: boolean) => void;
}

export const useGlobalStore = create<GlobalStore & GlobalActions>(set => ({
  openSetting: false,
  openHistory: false,
  setOpenSetting: visible => set({ openSetting: visible }),
  setOpenHistory: visible => set({ openHistory: visible }),
}));
