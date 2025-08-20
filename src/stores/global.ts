import { create } from 'zustand';

interface GlobalStore {
  openSetting: boolean;
  openHistory: boolean;
  openProcessLogs: boolean;
  openQueryLibrary: boolean;
}

interface GlobalActions {
  setOpenSetting: (visible: boolean) => void;
  setOpenHistory: (visible: boolean) => void;
  setOpenProcessLogs: (visible: boolean) => void;
  setOpenQueryLibrary: (visible: boolean) => void;
}

export const useGlobalStore = create<GlobalStore & GlobalActions>(set => ({
  openSetting: false,
  openHistory: false,
  openProcessLogs: false,
  openQueryLibrary: false,
  setOpenSetting: visible => set({ openSetting: visible }),
  setOpenHistory: visible => set({ openHistory: visible }),
  setOpenProcessLogs: visible => set({ openProcessLogs: visible }),
  setOpenQueryLibrary: visible => set({ openQueryLibrary: visible }),
}));
