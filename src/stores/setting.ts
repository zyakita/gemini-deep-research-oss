import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingStore {
  apiKey: string;
  coreModel: string;
  taskModel: string;
  thinkingBudget: number;
  depth: number;
  wide: number;
  parallelSearch: number;
  reportTone: string;
  minWords: number;
}

interface SettingActions {
  update: (values: Partial<SettingStore>) => void;
  reset: () => void;
  validateSettings: () => boolean;
}

export const defaultValues: SettingStore = {
  apiKey: '',
  coreModel: 'gemini-2.5-pro',
  taskModel: 'gemini-2.5-flash',
  thinkingBudget: 2048,
  depth: 3,
  wide: 7,
  parallelSearch: 3,
  reportTone: 'journalist-tone',
  minWords: 6000,
};

export const useSettingStore = create(
  persist<SettingStore & SettingActions>(
    (set, get) => ({
      ...defaultValues,
      update: values => set(values),
      reset: () => set(defaultValues),
      validateSettings: () => {
        const state = get();
        return !!(
          state.apiKey.trim() &&
          state.thinkingBudget > 0 &&
          state.depth > 0 &&
          state.wide > 0 &&
          state.parallelSearch > 0 &&
          state.minWords > 0
        );
      },
    }),
    { name: 'setting' }
  )
);
