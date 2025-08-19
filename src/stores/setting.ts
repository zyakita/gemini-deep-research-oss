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
        const trimmedKey = apiKey.trim();

        if (!trimmedKey) {
          set({
            isApiKeyValid: false,
            modelList: defaultValues.modelList,
            isApiKeyValidating: false,
          });
          return;
        }

        // Don't set validating state here - let the component handle it
        // This prevents race conditions with rapid state updates

        try {
          const genAI = new GoogleGenAI({ apiKey: trimmedKey });
          const listModels = await genAI.models.list();

          const models = listModels.page;
          const modelNames = models.map(model => {
            if (model?.name) {
              return model?.name.replace('models/', '');
            } else {
              return '';
            }
          });

          // Sort by model name, remove empty strings
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
          if (!filteredModelNames.includes(currentState.coreModel)) {
            updates.coreModel = filteredModelNames[0] || defaultValues.coreModel;
          }
          if (!filteredModelNames.includes(currentState.taskModel)) {
            updates.taskModel = filteredModelNames[0] || defaultValues.taskModel;
          }

          set(updates);
        } catch (error) {
          console.error('API key validation failed:', error);
          set({
            modelList: defaultValues.modelList,
            isApiKeyValid: false,
            isApiKeyValidating: false,
          });
        }
      },
    }),
    { name: 'setting' }
  )
);
