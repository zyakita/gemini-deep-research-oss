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
  researchCompletedEarly: boolean; // New field to track early completion
  maxTierReached: number; // Track the highest tier that was actually processed
  finalReport: string;
  isGeneratingFinalReport: boolean;
  finalReportError: string | null;
  sources: string[];
  currentStep: number;
  sourceQueue: string[];
  resolvedUrlQueue: string[];
  isProcessingSourceQueue: boolean;
  logs: string[];
}

export interface TaskActions {
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
  setResearchCompletedEarly: (completed: boolean) => void; // New action
  setMaxTierReached: (tier: number) => void; // New action

  // Final Report actions
  updateFinalReport: (report: string) => void;
  setIsGeneratingFinalReport: (isGenerating: boolean) => void;
  setFinalReportError: (error: string | null) => void;

  // Sources and Navigation actions
  addSource: (vertexUri: string) => void;
  processSourceQueue: () => Promise<void>;
  setCurrentStep: (step: number) => void;

  // Utility actions
  clear: () => void;
  reset: () => void;
  addLog: (log: string) => void;

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
  researchCompletedEarly: false,
  maxTierReached: 0,
  finalReport: '',
  isGeneratingFinalReport: false,
  finalReportError: null,
  sources: [],
  currentStep: 0,
  sourceQueue: [],
  resolvedUrlQueue: [],
  isProcessingSourceQueue: false,
  logs: [],
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
      resetResearchTasks: () =>
        set({ researchTasks: [], researchCompletedEarly: false, maxTierReached: 0 }),
      setIsGeneratingResearchTasks: (isGeneratingResearchTasks: boolean) =>
        set({ isGeneratingResearchTasks }),
      setResearchTasksError: (researchTasksError: string | null) => set({ researchTasksError }),
      setResearchCompletedEarly: (researchCompletedEarly: boolean) =>
        set({ researchCompletedEarly }),
      setMaxTierReached: (maxTierReached: number) => set({ maxTierReached }),

      // Final Report actions
      updateFinalReport: (finalReport: string) => set({ finalReport }),
      setIsGeneratingFinalReport: (isGeneratingFinalReport: boolean) =>
        set({ isGeneratingFinalReport }),
      setFinalReportError: (finalReportError: string | null) => set({ finalReportError }),

      // Sources and Navigation actions
      addSource: (vertexUri: string) => {
        // Add to queue if not already present
        const state = get();
        if (!state.sourceQueue.includes(vertexUri)) {
          set(state => ({ sourceQueue: [...state.sourceQueue, vertexUri] }));
          // Start processing queue if not already processing
          if (!state.isProcessingSourceQueue) {
            get().processSourceQueue();
          }
        }
      },
      processSourceQueue: async () => {
        const state = get();
        if (state.isProcessingSourceQueue) {
          return;
        }

        set({ isProcessingSourceQueue: true });

        const MAX_CONCURRENT = 5;
        const activePromises = new Set<Promise<void>>();

        // Helper to process resolved URLs sequentially for uniqueness
        const processResolvedUrls = () => {
          const currentState = get();
          if (currentState.resolvedUrlQueue.length === 0) {
            return;
          }

          // Process one URL at a time to maintain uniqueness
          const finalUrl = currentState.resolvedUrlQueue[0];

          // Remove from resolved queue
          set(state => ({
            resolvedUrlQueue: state.resolvedUrlQueue.slice(1),
          }));

          // Add to sources if not duplicate
          const currentSources = get().sources;
          if (!currentSources.includes(finalUrl)) {
            set(state => ({ sources: [...state.sources, finalUrl] }));
          }

          // Continue processing if there are more URLs
          if (get().resolvedUrlQueue.length > 0) {
            processResolvedUrls();
          }
        };

        // Helper to start processing a vertex URI
        const processVertexUri = async (vertexUri: string) => {
          try {
            const finalUrl = await getFinalUrlFromVertexAIsearch(vertexUri);
            if (finalUrl) {
              // Add to resolved URL queue
              set(state => ({
                resolvedUrlQueue: [...state.resolvedUrlQueue, finalUrl],
              }));
              // Process resolved URLs
              processResolvedUrls();
            }
          } catch (error) {
            console.error('Error processing vertex URI:', error);
          }
        };

        // Main processing loop
        while (true) {
          const currentState = get();

          // If no more items to process and no active promises, we're done
          if (currentState.sourceQueue.length === 0 && activePromises.size === 0) {
            break;
          }

          // Start new promises up to MAX_CONCURRENT limit
          while (activePromises.size < MAX_CONCURRENT && currentState.sourceQueue.length > 0) {
            const vertexUri = currentState.sourceQueue[0];

            // Remove from source queue
            set(state => ({
              sourceQueue: state.sourceQueue.slice(1),
            }));

            // Start processing this URI
            const promise = processVertexUri(vertexUri).finally(() => {
              activePromises.delete(promise);
            });

            activePromises.add(promise);
          }

          // Wait for at least one promise to complete before continuing
          if (activePromises.size > 0) {
            await Promise.race(activePromises);
          }
        }

        set({ isProcessingSourceQueue: false });
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
          researchCompletedEarly: false,
          maxTierReached: 0,
          finalReport: '',
          sources: [],
          currentStep: 0,
          sourceQueue: [],
          resolvedUrlQueue: [],
          isProcessingSourceQueue: false,
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
      addLog: (log: string) => set(state => ({ logs: [...state.logs, log] })),

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
