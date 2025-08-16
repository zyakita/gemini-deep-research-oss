import { pick } from 'radash';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QnA, ResearchTask } from '../types';
import { getFinalUrlFromVertexAIsearch } from '../utils/vertexaisearch';

export interface TaskStore {
  id: string;
  query: string;
  qna: QnA[];
  isGeneratingQnA: boolean;
  qnaError: string | null;
  reportPlan: string;
  isGeneratingReportPlan: boolean;
  reportPlanError: string | null;
  reportPlanFeedback: string;
  researchTasks: ResearchTask[];
  isGeneratingResearchTasks: boolean;
  researchTasksError: string | null;
  finalReport: string;
  isGeneratingFinalReport: boolean;
  finalReportError: string | null;
  sources: string[];
  currentStep: number;
}

interface TaskActions {
  // ID and Query actions
  setId: (id: string) => void;
  setQuery: (query: string) => void;

  // QnA actions
  addQnA: (qna: QnA) => void;
  updateQnA: (qna: QnA) => void;
  setIsGeneratingQnA: (isGenerating: boolean) => void;
  setQnAError: (error: string | null) => void;

  // Report Plan actions
  updateReportPlan: (plan: string) => void;
  setIsGeneratingReportPlan: (isGenerating: boolean) => void;
  setReportPlanError: (error: string | null) => void;
  updateReportPlanFeedback: (feedback: string) => void;

  // Research Tasks actions
  addResearchTask: (task: ResearchTask) => void;
  updateResearchTask: (task: ResearchTask) => void;
  getAllResearchTasks: () => ResearchTask[];
  getAllFinishedResearchTasks: () => ResearchTask[];
  getResearchTasksByTier: (tier: number) => ResearchTask[];
  resetResearchTasks: () => void;
  setIsGeneratingResearchTasks: (isGenerating: boolean) => void;
  setResearchTasksError: (error: string | null) => void;

  // Final Report actions
  updateFinalReport: (report: string) => void;
  setIsGeneratingFinalReport: (isGenerating: boolean) => void;
  setFinalReportError: (error: string | null) => void;

  // Sources and Navigation actions
  addSource: (vertexUri: string) => void;
  setCurrentStep: (step: number) => void;

  // Utility actions
  clear: () => void;
  reset: () => void;
  backup: () => TaskStore;
  restore: (taskStore: TaskStore) => void;

  // Computed getters
  hasErrors: () => boolean;
  isAnyGenerating: () => boolean;
}

const defaultValues: TaskStore = {
  id: '',
  query: '',
  qna: [],
  isGeneratingQnA: false,
  qnaError: null,
  reportPlan: '',
  isGeneratingReportPlan: false,
  reportPlanError: null,
  reportPlanFeedback: '',
  researchTasks: [],
  isGeneratingResearchTasks: false,
  researchTasksError: null,
  finalReport: '',
  isGeneratingFinalReport: false,
  finalReportError: null,
  sources: [],
  currentStep: 0,
};

export const useTaskStore = create(
  persist<TaskStore & TaskActions>(
    (set, get) => ({
      ...defaultValues,

      // ID and Query actions
      setId: (id: string) => set({ id }),
      setQuery: (query: string) => set({ query }),

      // QnA actions
      addQnA: (qna: QnA) => set(state => ({ qna: [...state.qna, qna] })),
      updateQnA: (qna: QnA) =>
        set(state => ({
          qna: state.qna.map(item => (item.id === qna.id ? qna : item)),
        })),
      setIsGeneratingQnA: (isGeneratingQnA: boolean) => set({ isGeneratingQnA }),
      setQnAError: (qnaError: string | null) => set({ qnaError }),

      // Report Plan actions
      updateReportPlan: (reportPlan: string) => set({ reportPlan }),
      setIsGeneratingReportPlan: (isGeneratingReportPlan: boolean) =>
        set({ isGeneratingReportPlan }),
      setReportPlanError: (reportPlanError: string | null) => set({ reportPlanError }),
      updateReportPlanFeedback: (reportPlanFeedback: string) => set({ reportPlanFeedback }),

      // Research Tasks actions
      addResearchTask: (task: ResearchTask) =>
        set(state => ({ researchTasks: [...state.researchTasks, task] })),
      updateResearchTask: (task: ResearchTask) =>
        set(state => ({
          researchTasks: state.researchTasks.map(item => (item.id === task.id ? task : item)),
        })),
      getAllResearchTasks: () => get().researchTasks,
      getAllFinishedResearchTasks: () => {
        const tasks = get().researchTasks;
        return tasks.filter(task => task.learning.trim() !== '');
      },
      getResearchTasksByTier: (tier: number) => {
        const tasks = get().researchTasks;
        return tasks.filter(task => task.tier === tier);
      },
      resetResearchTasks: () => set({ researchTasks: [] }),
      setIsGeneratingResearchTasks: (isGeneratingResearchTasks: boolean) =>
        set({ isGeneratingResearchTasks }),
      setResearchTasksError: (researchTasksError: string | null) => set({ researchTasksError }),

      // Final Report actions
      updateFinalReport: (finalReport: string) => set({ finalReport }),
      setIsGeneratingFinalReport: (isGeneratingFinalReport: boolean) =>
        set({ isGeneratingFinalReport }),
      setFinalReportError: (finalReportError: string | null) => set({ finalReportError }),

      // Sources and Navigation actions
      addSource: async (vertexUri: string) => {
        // get the final URL from the Vertex AI search
        const finalUrl = await getFinalUrlFromVertexAIsearch(vertexUri);
        // add to sources if not existing
        if (finalUrl) {
          if (!get().sources.includes(finalUrl)) {
            set(state => ({ sources: [...state.sources, finalUrl] }));
          }
        }
      },
      setCurrentStep: (currentStep: number) => set({ currentStep }),

      // Utility actions
      clear: () =>
        set({
          query: '',
          qna: [],
          reportPlan: '',
          reportPlanFeedback: '',
          researchTasks: [],
          finalReport: '',
          sources: [],
          currentStep: 0,
          // Clear all error states
          qnaError: null,
          reportPlanError: null,
          researchTasksError: null,
          finalReportError: null,
          // Reset all generating states
          isGeneratingQnA: false,
          isGeneratingReportPlan: false,
          isGeneratingResearchTasks: false,
          isGeneratingFinalReport: false,
        }),
      reset: () => set(defaultValues),
      backup: (): TaskStore => {
        return pick(get(), Object.keys(defaultValues) as (keyof TaskStore)[]) as TaskStore;
      },
      restore: (taskStore: TaskStore) => set(taskStore),

      // Computed getters
      hasErrors: () => {
        const state = get();
        return !!(
          state.qnaError ||
          state.reportPlanError ||
          state.researchTasksError ||
          state.finalReportError
        );
      },
      isAnyGenerating: () => {
        const state = get();
        return (
          state.isGeneratingQnA ||
          state.isGeneratingReportPlan ||
          state.isGeneratingResearchTasks ||
          state.isGeneratingFinalReport
        );
      },
    }),
    {
      name: 'research',
    }
  )
);
