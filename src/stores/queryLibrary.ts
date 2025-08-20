import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueryTemplate {
  id: string;
  title: string;
  content: string;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QueryLibraryStore {
  templates: QueryTemplate[];
  showBuiltInTemplates: boolean;
  searchTerm: string;
  isLoading: boolean;
}

interface QueryLibraryActions {
  addTemplate: (title: string, content: string) => void;
  updateTemplate: (id: string, title: string, content: string) => void;
  deleteTemplate: (id: string) => void;
  setShowBuiltInTemplates: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  initializeBuiltInTemplates: (builtInTemplates: QueryTemplate[]) => void;
}

export const useQueryLibraryStore = create<QueryLibraryStore & QueryLibraryActions>()(
  persist(
    set => ({
      templates: [],
      showBuiltInTemplates: true,
      searchTerm: '',
      isLoading: false,

      addTemplate: (title: string, content: string) => {
        const newTemplate: QueryTemplate = {
          id: crypto.randomUUID(),
          title,
          content,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id: string, title: string, content: string) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === id && !template.isBuiltIn
              ? { ...template, title, content, updatedAt: new Date().toISOString() }
              : template
          ),
        }));
      },

      deleteTemplate: (id: string) => {
        set(state => ({
          templates: state.templates.filter(
            template => !(template.id === id && !template.isBuiltIn)
          ),
        }));
      },

      setShowBuiltInTemplates: (show: boolean) => {
        set({ showBuiltInTemplates: show });
      },

      setSearchTerm: (term: string) => {
        set({ searchTerm: term });
      },

      initializeBuiltInTemplates: (builtInTemplates: QueryTemplate[]) => {
        set(state => {
          // Remove old built-in templates and add new ones
          const userTemplates = state.templates.filter(t => !t.isBuiltIn);
          return {
            templates: [...builtInTemplates, ...userTemplates],
          };
        });
      },
    }),
    {
      name: 'query-library-store',
      // Only persist user templates and settings
      partialize: state => ({
        templates: state.templates.filter(t => !t.isBuiltIn),
        showBuiltInTemplates: state.showBuiltInTemplates,
      }),
    }
  )
);
