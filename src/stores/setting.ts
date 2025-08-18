import { GoogleGenAI } from '@google/genai';
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
  modelList: string[];
  isApiKeyValid: boolean;
  isApiKeyValidating: boolean;
}

interface SettingActions {
  update: (values: Partial<SettingStore>) => void;
  reset: () => void;
  validateSettings: () => boolean;
  validateApiKey: (apiKey: string) => Promise<void>;
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
  modelList: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  isApiKeyValid: false,
  isApiKeyValidating: false,
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
      validateApiKey: async (apiKey: string) => {
        if (!apiKey.trim()) {
          set({ isApiKeyValid: false, modelList: [], isApiKeyValidating: false });
          return;
        }

        set({ isApiKeyValidating: true });

        try {
          const genAI = new GoogleGenAI({ apiKey: apiKey });
          const listModels = await genAI.models.list();

          const models = listModels.page;
          const modelNames = models.map(model => {
            if (model?.name) {
              return model?.name.replace('models/', '');
            } else {
              return '';
            }
          });

          // short by model name, remove empty strings
          const filteredModelNames = modelNames.filter(name => name !== '');
          filteredModelNames.sort();

          // Get current state to check if selected models are still valid
          const currentState = get();
          const updates: Partial<SettingStore> = {
            modelList: filteredModelNames,
            isApiKeyValid: true,
            isApiKeyValidating: false,
          };

          // Reset model selections if they're not in the new list
          if (!modelNames.includes(currentState.coreModel)) {
            updates.coreModel = modelNames[0] || '';
          }
          if (!modelNames.includes(currentState.taskModel)) {
            updates.taskModel = modelNames[0] || '';
          }

          set(updates);
        } catch (error) {
          console.error('API key validation failed:', error);
          set({
            modelList: [],
            isApiKeyValid: false,
            isApiKeyValidating: false,
          });
        }
      },
    }),
    { name: 'setting' }
  )
);
