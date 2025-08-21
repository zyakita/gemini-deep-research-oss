import type { File } from '@google/genai';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, LogLevel, LogMetadata, LogType, QnA, ResearchTask } from '../types';
import { getFinalUrlFromVertexAIsearch } from '../utils/vertexaisearch';

export type { LogEntry, LogLevel, LogMetadata, LogType } from '../types';

export interface TaskStore {
  // Core properties
  id: string;
  query: string;
  currentStep: number;
  logs: LogEntry[];

  // File management
  files: File[];

  // QnA section
  qna: QnA[];
  isGeneratingQnA: boolean;
  qnaError: string | null;

  // Report Plan section
  reportPlan: string;
  reportPlanFeedback: string;
  isGeneratingReportPlan: boolean;
  reportPlanError: string | null;

  // Research Tasks section
  researchTasks: ResearchTask[];
  researchCompletedEarly: boolean;
  maxTierReached: number;
  isGeneratingResearchTasks: boolean;
  researchTasksError: string | null;

  // Final Report section
  finalReport: string;
  isGeneratingFinalReport: boolean;
  finalReportError: string | null;

  // Sources and processing
  sources: string[];
  sourceQueue: string[];
  resolvedUrlQueue: string[];
  isProcessingSourceQueue: boolean;

  // Global states
  isResetting: boolean;

  // Cancellation states
  researchTasksAbortController: AbortController | null;
  finalReportAbortController: AbortController | null;
  isCancelling: boolean;
}

export interface TaskActions {
  // Core actions
  setId: (id: string) => void;
  setQuery: (query: string) => void;
  setCurrentStep: (step: number) => void;
  addLog: (log: string, type?: LogType, level?: LogLevel, metadata?: LogMetadata) => void;
  clearLogs: () => void;

  // File management actions
  addFile: (file: File) => void;
  removeFile: (fileName: string) => void;
  clearAllFiles: () => void;

  // QnA actions
  addQnA: (qna: QnA) => void;
  updateQnA: (qna: QnA) => void;
  setIsGeneratingQnA: (isGenerating: boolean) => void;
  setQnAError: (error: string | null) => void;

  // Report Plan actions
  updateReportPlan: (plan: string) => void;
  updateReportPlanFeedback: (feedback: string) => void;
  setIsGeneratingReportPlan: (isGenerating: boolean) => void;
  setReportPlanError: (error: string | null) => void;

  // Research Tasks actions
  addResearchTask: (task: ResearchTask) => void;
  updateResearchTask: (task: ResearchTask) => void;
  getAllResearchTasks: () => ResearchTask[];
  getAllFinishedResearchTasks: () => ResearchTask[];
  getResearchTasksByTier: (tier: number) => ResearchTask[];
  resetResearchTasks: () => void;
  setResearchCompletedEarly: (completed: boolean) => void; // New action
  setMaxTierReached: (tier: number) => void; // New action
  setIsGeneratingResearchTasks: (isGenerating: boolean) => void;
  setResearchTasksError: (error: string | null) => void;

  // Final Report actions
  updateFinalReport: (report: string) => void;
  setIsGeneratingFinalReport: (isGenerating: boolean) => void;
  setFinalReportError: (error: string | null) => void;

  // Sources and processing actions
  addSource: (vertexUri: string) => void;
  processSourceQueue: () => Promise<void>;

  // Global state actions
  setIsResetting: (isResetting: boolean) => void;

  // Cancellation actions
  setResearchTasksAbortController: (controller: AbortController | null) => void;
  setFinalReportAbortController: (controller: AbortController | null) => void;
  setIsCancelling: (isCancelling: boolean) => void;
  cancelResearchTasks: () => void;
  cancelFinalReport: () => void;

  // Utility actions
  clear: () => void;
  reset: () => void;

  // Computed getters
  hasErrors: () => boolean;
  isAnyGenerating: () => boolean;
}

const defaultValues: TaskStore = {
  // Core values
  id: '',
  query: '',
  currentStep: 0,
  logs: [],

  // File management
  files: [],

  // QnA section
  qna: [],
  isGeneratingQnA: false,
  qnaError: null,

  // Report Plan section
  reportPlan: '',
  reportPlanFeedback: '',
  isGeneratingReportPlan: false,
  reportPlanError: null,

  // Research Tasks section
  researchTasks: [],
  researchCompletedEarly: false,
  maxTierReached: 0,
  isGeneratingResearchTasks: false,
  researchTasksError: null,

  // Final Report section
  finalReport: '',
  isGeneratingFinalReport: false,
  finalReportError: null,

  // Sources and processing
  sources: [],
  sourceQueue: [],
  resolvedUrlQueue: [],
  isProcessingSourceQueue: false,

  // Global states
  isResetting: false,

  // Cancellation states
  researchTasksAbortController: null,
  finalReportAbortController: null,
  isCancelling: false,
};

export const useTaskStore = create(
  persist<TaskStore & TaskActions>(
    (set, get) => ({
      ...defaultValues,

      // Core actions
      setId: (id: string) => set({ id }),
      setQuery: (query: string) => set({ query }),
      setCurrentStep: (currentStep: number) => set({ currentStep }),
      addLog: (
        message: string,
        type: LogType = 'info',
        level: LogLevel = 'medium',
        metadata?: LogMetadata
      ) => {
        const logEntry: LogEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type,
          level,
          message: message.trim(),
          agent: metadata?.agent,
          phase: metadata?.phase,
          metadata,
        };
        set(state => ({ logs: [...state.logs, logEntry] }));
      },
      clearLogs: () => set({ logs: [] }),

      // File management actions
      addFile: (file: File) => set(state => ({ files: [...state.files, file] })),
      removeFile: (fileName: string) =>
        set(state => ({ files: state.files.filter(file => file.name !== fileName) })),
      clearAllFiles: () => set({ files: [] }),

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
      updateReportPlanFeedback: (reportPlanFeedback: string) => set({ reportPlanFeedback }),
      setIsGeneratingReportPlan: (isGeneratingReportPlan: boolean) =>
        set({ isGeneratingReportPlan }),
      setReportPlanError: (reportPlanError: string | null) => set({ reportPlanError }),

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
      setResearchCompletedEarly: (researchCompletedEarly: boolean) =>
        set({ researchCompletedEarly }),
      setMaxTierReached: (maxTierReached: number) => set({ maxTierReached }),
      setIsGeneratingResearchTasks: (isGeneratingResearchTasks: boolean) =>
        set({ isGeneratingResearchTasks }),
      setResearchTasksError: (researchTasksError: string | null) => set({ researchTasksError }),

      // Final Report actions
      updateFinalReport: (finalReport: string) => set({ finalReport }),
      setIsGeneratingFinalReport: (isGeneratingFinalReport: boolean) =>
        set({ isGeneratingFinalReport }),
      setFinalReportError: (finalReportError: string | null) => set({ finalReportError }),

      // Sources and processing actions
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

      // Global state actions
      setIsResetting: (isResetting: boolean) => set({ isResetting }),

      // Cancellation actions
      setResearchTasksAbortController: (controller: AbortController | null) =>
        set({ researchTasksAbortController: controller }),
      setFinalReportAbortController: (controller: AbortController | null) =>
        set({ finalReportAbortController: controller }),
      setIsCancelling: (isCancelling: boolean) => set({ isCancelling }),
      cancelResearchTasks: () => {
        const state = get();
        if (state.researchTasksAbortController) {
          set({ isCancelling: true });
          state.researchTasksAbortController.abort();
          set({
            researchTasksAbortController: null,
            isGeneratingResearchTasks: false,
            isCancelling: false,
            // researchTasks: [],
            // sources: [],
          });
        }
      },
      cancelFinalReport: () => {
        const state = get();
        if (state.finalReportAbortController) {
          set({ isCancelling: true });
          state.finalReportAbortController.abort();
          set({
            finalReportAbortController: null,
            isGeneratingFinalReport: false,
            isCancelling: false,
          });
        }
      },

      // Utility actions
      clear: () =>
        set({
          query: '',
          files: [],
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
          // Clear cancellation states
          researchTasksAbortController: null,
          finalReportAbortController: null,
          isCancelling: false,
        }),
      reset: () => set(defaultValues),

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
          state.isGeneratingFinalReport ||
          state.isResetting
        );
      },
    }),
    {
      name: 'research',
    }
  )
);
