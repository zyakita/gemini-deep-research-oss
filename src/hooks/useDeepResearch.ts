import { GoogleGenAI } from '@google/genai';
import { useCallback, useMemo } from 'react';
import runQuestionAndAnswerAgent from '../agents/qna';
import runReportPlanAgent from '../agents/report-plan';
import runReporterAgent from '../agents/reporter';
import runResearchDeepAgent from '../agents/research-deep';
import runResearchLeadAgent from '../agents/research-lead';
import runResearcherAgent from '../agents/researcher';
import { useSettingStore } from '../stores/setting';
import { useTaskStore } from '../stores/task';
import type { LogFunction, ResearchTask } from '../types';
import { buildUserContent } from '../utils/user-contents';

// Logging helper functions for better consistency
const createLogHelper = (addLog: LogFunction) => ({
  info: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'info', 'medium', { agent, phase }),
  success: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'success', 'medium', { agent, phase }),
  error: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'error', 'high', { agent, phase }),
  warning: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'warning', 'medium', { agent, phase }),
  process: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'process', 'medium', { agent, phase }),
  research: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'research', 'medium', { agent, phase }),
  agent: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'agent', 'low', { agent, phase }),
  system: (message: string, agent?: string, phase?: string) =>
    addLog(message, 'system', 'medium', { agent, phase }),

  // Phase-specific helpers
  startPhase: (phase: string) => addLog(`Starting ${phase}`, 'system', 'high', { phase }),
  endPhase: (phase: string, count?: number) => {
    const countText = count ? ` (${count} items)` : '';
    addLog(`Completed ${phase}${countText}`, 'system', 'high', { phase, count });
  },

  // Research-specific helpers
  startResearch: (title: string) =>
    addLog(`Starting: ${title}`, 'research', 'medium', { phase: 'research' }),
  completeResearch: (title: string) =>
    addLog(`Completed: ${title}`, 'success', 'medium', { phase: 'research' }),

  // Agent thought logging
  thought: (message: string, agent: string) =>
    addLog(message, 'agent', 'low', { agent, phase: 'thinking' }),
});

function useDeepResearch() {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();
  const processConcurrent = useConcurrentTaskProcessor();

  // Create logging helpers
  const log = useMemo(() => createLogHelper(taskStore.addLog), [taskStore.addLog]);

  // Memoize GoogleGenAI instance
  const googleGenAI = useMemo(
    () =>
      new GoogleGenAI({
        apiKey: settingStore.apiKey,
      }),
    [settingStore.apiKey]
  );

  // Memoize common agent parameters
  const commonAgentParams = useMemo(
    () => ({
      addLog: (message: string, agent?: string) => log.agent(message, agent),
      googleGenAI,
      thinkingBudget: settingStore.thinkingBudget,
    }),
    [googleGenAI, settingStore.thinkingBudget, log]
  );

  // Generate Q&As
  const generateQnAs = useCallback(async () => {
    if (!settingStore.isApiKeyValid || settingStore.isApiKeyValidating) {
      log.error('API key is invalid or still validating', 'system', 'validation');
      return;
    }

    try {
      log.startPhase('Q&A Generation');

      const userContent = buildUserContent({
        task: taskStore,
        includeQuery: true,
        includeQnA: false,
        includePlan: false,
        includeFindings: false,
        includeFiles: true,
      });

      taskStore.setIsGeneratingQnA(true);

      const { questions } = await runQuestionAndAnswerAgent({
        ...commonAgentParams,
        model: settingStore.coreModel,
        userContent,
      });

      // Process questions in parallel
      const qnaPromises = questions.map(async q => {
        const hashedQuestion = await hashStringSHA256(q.question);
        return { id: hashedQuestion, q: q.question, a: q.predictedAnswer };
      });

      const qnas = await Promise.all(qnaPromises);
      qnas.forEach(qna => taskStore.addQnA(qna));

      log.endPhase('Q&A Generation', qnas.length);
    } catch (error) {
      log.error(`Failed to generate Q&As: ${error}`, 'qna-agent', 'generation');
      taskStore.setIsGeneratingQnA(false);
      throw error;
    } finally {
      taskStore.setIsGeneratingQnA(false);
    }
  }, [commonAgentParams, taskStore, settingStore, log]);

  // Generate report plan
  const generateReportPlan = useCallback(async () => {
    // Create streaming handler with proper cleanup
    let streamingHandler: ReturnType<typeof createSmoothStreamingHandler> | null = null;

    try {
      log.startPhase('Report Plan Generation');

      const userContent = buildUserContent({
        task: taskStore,
        includeQuery: true,
        includeQnA: true,
        includePlan: false,
        includeFindings: false,
        includeFiles: true,
      });

      taskStore.updateReportPlan('');
      taskStore.setIsGeneratingReportPlan(true);

      streamingHandler = createSmoothStreamingHandler(
        streamedText => taskStore.updateReportPlan(streamedText),
        {
          baseCharactersPerSecond: 400,
          maxChunkSize: 200,
          adaptiveSpeed: true,
          debounceMs: 16,
        }
      );

      streamingHandler.reset();

      await runReportPlanAgent({
        ...commonAgentParams,
        model: settingStore.coreModel,
        userContent,
        onStreaming: chunk => streamingHandler?.addChunk(chunk),
      });

      log.endPhase('Report Plan Generation');
    } catch (error) {
      log.error(`Failed to generate report plan: ${error}`, 'report-plan-agent', 'generation');
      taskStore.setIsGeneratingReportPlan(false);
      throw error;
    } finally {
      streamingHandler?.finish();
      taskStore.setIsGeneratingReportPlan(false);
    }
  }, [commonAgentParams, taskStore, settingStore, log]);

  // Generate research tasks
  const generateResearchTasks = useCallback(
    async (tier: number, abortController?: AbortController | null) => {
      log.process(
        `Starting research task generation for round ${tier}`,
        'system',
        'task-generation'
      );

      const existingTasks = taskStore.getResearchTasksByTier(tier);
      if (existingTasks.length > 0) return;

      // Check if operation was cancelled before starting
      if (abortController?.signal.aborted) {
        throw new Error('AbortError');
      }

      try {
        const userContent = buildUserContent({
          task: taskStore,
          includeQuery: true,
          includeQnA: true,
          includePlan: true,
          includeFindings: true,
          includeFiles: true,
          limitCount: settingStore.wide,
          limitFor: 'tasks',
        });

        const agentName = tier === 1 ? 'research-lead-agent' : 'research-deep-agent';
        const { tasks } =
          tier === 1
            ? await runResearchLeadAgent(
                {
                  ...commonAgentParams,
                  model: settingStore.coreModel,
                  userContent,
                },
                abortController
              )
            : await runResearchDeepAgent(
                {
                  ...commonAgentParams,
                  model: settingStore.coreModel,
                  userContent,
                },
                abortController
              );

        // Check if operation was cancelled after agent call
        if (abortController?.signal.aborted) {
          throw new Error('AbortError');
        }

        // Process tasks in parallel
        const taskPromises = tasks.map(async task => {
          const hashedTask = await hashStringSHA256(task.title + task.direction);
          return {
            id: hashedTask,
            tier,
            title: task.title,
            direction: task.direction,
            learning: '',
          };
        });

        const researchTasks = await Promise.all(taskPromises);
        researchTasks.forEach(task => taskStore.addResearchTask(task));

        if (researchTasks.length === 0) {
          log.info(
            `No additional research tasks needed for round ${tier} - sufficient findings available`,
            agentName,
            'task-generation'
          );
        } else {
          log.success(
            `Generated ${researchTasks.length} research tasks for round ${tier}`,
            agentName,
            'task-generation'
          );
          // Log each task title for better visibility
          researchTasks.forEach(task =>
            log.info(`Task: ${task.title}`, agentName, 'task-generation')
          );
        }
      } catch (error) {
        log.error(
          `Failed to generate research tasks for round ${tier}: ${error}`,
          'system',
          'task-generation'
        );
        throw error;
      }
    },
    [commonAgentParams, taskStore, settingStore, log]
  );

  // Run research tasks
  const runResearchTasks = useCallback(
    async (tier: number, abortController?: AbortController | null) => {
      const maxConcurrency = settingStore.parallelSearch || 1;
      const existingTasks = taskStore.getResearchTasksByTier(tier);
      const tasksToRun = existingTasks.filter(t => t.learning === '');

      if (tasksToRun.length === 0) return;

      // Check if operation was cancelled before starting
      if (abortController?.signal.aborted) {
        throw new Error('AbortError');
      }

      log.process(
        `Executing ${tasksToRun.length} research tasks for round ${tier}`,
        'system',
        'research-execution'
      );
      log.info(`Parallel execution: ${maxConcurrency} tasks`, 'system', 'research-execution');

      try {
        await processConcurrent(
          tasksToRun,
          async (task: ResearchTask) => {
            // Check if operation was cancelled before starting each task
            if (abortController?.signal.aborted) {
              log.warning(
                `Research task cancelled: ${task.title}`,
                'researcher-agent',
                'research-execution'
              );
              throw new Error('AbortError');
            }

            log.startResearch(task.title);
            taskStore.updateResearchTask({ ...task, processing: true });

            try {
              const { learning, groundingChunks, webSearchQueries } = await runResearcherAgent({
                direction: task.direction,
                googleGenAI,
                model: settingStore.taskModel,
                thinkingBudget: settingStore.thinkingBudget,
                abortController,
              });

              // Check if cancelled after research completes
              if (abortController?.signal.aborted) {
                log.warning(
                  `Research task cancelled after completion: ${task.title}`,
                  'researcher-agent',
                  'research-execution'
                );
                taskStore.updateResearchTask({ ...task, processing: false });
                throw new Error('AbortError');
              }

              taskStore.updateResearchTask({
                ...task,
                processing: false,
                learning,
                groundingChunks,
                webSearchQueries,
              });

              // Add sources to the task store if we have resolver
              if (import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) {
                for (const chunk of groundingChunks) {
                  taskStore.addSource(chunk?.web?.uri || '');
                }
              }

              log.completeResearch(task.title);
              return { taskId: task.id, success: true };
            } catch (error) {
              taskStore.updateResearchTask({ ...task, processing: false });

              // Don't log errors for cancelled operations
              if (error instanceof Error && error.message === 'AbortError') {
                throw error;
              }

              log.error(
                `Failed research task: ${task.title}: ${error}`,
                'researcher-agent',
                'research-execution'
              );
              throw error;
            }
          },
          maxConcurrency
        );

        log.success(
          `Completed all ${tasksToRun.length} research tasks for round ${tier}`,
          'system',
          'research-execution'
        );
      } catch (error) {
        // Check if this was a cancellation
        if (
          error instanceof Error &&
          (error.message === 'AbortError' || error.name === 'AbortError')
        ) {
          log.warning(
            `Research tasks for round ${tier} were cancelled`,
            'system',
            'research-execution'
          );
          return;
        }

        log.error(
          `Failed to run research tasks for round ${tier}: ${error}`,
          'system',
          'research-execution'
        );
        throw error;
      }
    },
    [
      taskStore,
      settingStore.parallelSearch,
      settingStore.taskModel,
      settingStore.thinkingBudget,
      googleGenAI,
      processConcurrent,
      log,
    ]
  );

  // Start research tasks
  const startResearchTasks = useCallback(async () => {
    // Create abort controller for this research session
    const abortController = new AbortController();
    taskStore.setResearchTasksAbortController(abortController);

    try {
      // taskStore.resetResearchTasks();
      taskStore.setIsGeneratingResearchTasks(true);

      log.startPhase('Research Task Execution');
      log.info(`Research depth: ${settingStore.depth} rounds`, 'system', 'research-planning');

      for (let tier = 1; tier <= settingStore.depth; tier++) {
        // Check if operation was cancelled
        if (abortController.signal.aborted) {
          log.warning('Research task execution was cancelled', 'system', 'research-planning');
          return;
        }

        log.process(
          `Processing round ${tier} of ${settingStore.depth}`,
          'system',
          'research-planning'
        );

        await generateResearchTasks(tier, abortController);

        // Check if operation was cancelled after generating tasks
        if (abortController.signal.aborted) {
          log.warning('Research task execution was cancelled', 'system', 'research-planning');
          return;
        }

        // Check if any tasks were actually generated for this round
        const tierTasks = taskStore.getResearchTasksByTier(tier);
        if (tierTasks.length === 0) {
          log.success(
            `Research completion detected at round ${tier} - proceeding to final report`,
            'system',
            'research-planning'
          );
          taskStore.setResearchCompletedEarly(true);
          taskStore.setMaxTierReached(tier - 1); // Previous tier was the last one with tasks
          break; // Exit early if no tasks were generated (agent determined research is complete)
        }

        taskStore.setMaxTierReached(tier);
        await runResearchTasks(tier, abortController);

        // Check if operation was cancelled after running tasks
        if (abortController.signal.aborted) {
          log.warning('Research task execution was cancelled', 'system', 'research-planning');
          return;
        }
      }

      log.endPhase('Research Task Execution');
    } catch (error) {
      // Check if this is an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        log.warning('Research task execution was cancelled by user', 'system', 'research-planning');
        return;
      }

      log.error(`Failed research task execution: ${error}`, 'system', 'research-planning');
      taskStore.setIsGeneratingResearchTasks(false);
      throw error;
    } finally {
      taskStore.setIsGeneratingResearchTasks(false);
      taskStore.setResearchTasksAbortController(null);
    }
  }, [taskStore, settingStore.depth, generateResearchTasks, runResearchTasks, log]);

  // Generate final report
  const generateFinalReport = useCallback(async () => {
    // Create abort controller for this report generation
    const abortController = new AbortController();
    taskStore.setFinalReportAbortController(abortController);

    let streamingHandler: ReturnType<typeof createSmoothStreamingHandler> | null = null;

    try {
      log.startPhase('Final Report Generation');

      taskStore.updateFinalReport('');
      taskStore.setIsGeneratingFinalReport(true);

      streamingHandler = createSmoothStreamingHandler(
        streamedText => taskStore.updateFinalReport(streamedText),
        {
          baseCharactersPerSecond: 1000,
          maxChunkSize: 600,
          adaptiveSpeed: true,
          debounceMs: 16,
        }
      );

      streamingHandler.reset();

      const userContent = buildUserContent({
        task: taskStore,
        includeQuery: true,
        includeQnA: true,
        includePlan: true,
        includeFindings: true,
        includeFiles: true,
      });

      // Check if operation was cancelled before starting
      if (abortController.signal.aborted) {
        log.warning('Final report generation was cancelled', 'reporter-agent', 'generation');
        return;
      }

      await runReporterAgent(
        {
          ...commonAgentParams,
          model: settingStore.coreModel,
          userContent,
          onStreaming: chunk => {
            // Check if cancelled during streaming
            if (abortController.signal.aborted) {
              return;
            }
            streamingHandler?.addChunk(chunk);
          },
        },
        {
          tone: settingStore.reportTone,
          minWords: settingStore.minWords,
        },
        abortController
      );

      // Final check if operation was cancelled
      if (abortController.signal.aborted) {
        log.warning('Final report generation was cancelled', 'reporter-agent', 'generation');
        return;
      }

      log.endPhase('Final Report Generation');
    } catch (error) {
      // Check if this is an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        log.warning(
          'Final report generation was cancelled by user',
          'reporter-agent',
          'generation'
        );
        return;
      }

      log.error(`Failed to generate final report: ${error}`, 'reporter-agent', 'generation');
      throw error;
    } finally {
      streamingHandler?.finish();
      taskStore.setIsGeneratingFinalReport(false);
      taskStore.setFinalReportAbortController(null);
    }
  }, [commonAgentParams, taskStore, settingStore, log]);

  // Upload file
  const uploadFile = useCallback(
    async (file: globalThis.File) => {
      if (!settingStore.isApiKeyValid) {
        log.error('API key is invalid', 'system', 'file-upload');
        throw new Error('API key is invalid');
      }

      try {
        log.process(`Uploading file: ${file.name}`, 'system', 'file-upload');

        const uploadedFile = await googleGenAI.files.upload({
          file: file, // File object extends Blob, which is compatible
          config: {
            mimeType: file.type,
            displayName: file.name,
          },
        });

        taskStore.addFile(uploadedFile);
        log.success(`File uploaded: ${file.name}`, 'system', 'file-upload');

        return uploadedFile;
      } catch (error) {
        log.error(`Failed to upload file ${file.name}: ${error}`, 'system', 'file-upload');
        throw error;
      }
    },
    [googleGenAI, taskStore, settingStore, log]
  );

  // Delete file
  const deleteFile = useCallback(
    async (fileName: string) => {
      if (!settingStore.isApiKeyValid) {
        log.error('API key is invalid', 'system', 'file-management');
        throw new Error('API key is invalid');
      }

      try {
        log.process(`Deleting file: ${fileName}`, 'system', 'file-management');

        await googleGenAI.files.delete({ name: fileName });
        taskStore.removeFile(fileName);
        log.success(`File deleted: ${fileName}`, 'system', 'file-management');
      } catch (error) {
        log.error(`Failed to delete file ${fileName}: ${error}`, 'system', 'file-management');
        throw error;
      }
    },
    [googleGenAI, taskStore, settingStore, log]
  );

  // Delete all uploaded files
  const deleteAllFiles = useCallback(async () => {
    if (!settingStore.isApiKeyValid) {
      log.error('API key is invalid', 'system', 'file-management');
      return;
    }

    const files = taskStore.files;
    if (files.length === 0) {
      return;
    }

    try {
      log.process(`Deleting ${files.length} uploaded files`, 'system', 'file-management');

      // Delete files concurrently
      await Promise.allSettled(
        files.map(async file => {
          try {
            if (file.name) {
              await googleGenAI.files.delete({ name: file.name });
              log.success(`Deleted: ${file.displayName || file.name}`, 'system', 'file-management');
            }
          } catch (error) {
            log.error(
              `Failed to delete ${file.displayName || file.name}: ${error}`,
              'system',
              'file-management'
            );
          }
        })
      );

      taskStore.clearAllFiles();
      log.success('All files deleted', 'system', 'file-management');
    } catch (error) {
      log.error(`Failed to delete files: ${error}`, 'system', 'file-management');
    }
  }, [googleGenAI, taskStore, settingStore, log]);

  // Reset tasks and delete all files
  const resetWithFiles = useCallback(async () => {
    try {
      taskStore.setIsResetting(true);
      log.system('Starting system reset', 'system', 'reset');

      await deleteAllFiles();
      taskStore.reset();

      // log.system('Reset completed', 'system', 'reset');
    } catch (error) {
      log.error(`Error during reset: ${error}`, 'system', 'reset');
      // Reset anyway, even if file deletion fails
      taskStore.reset();
    } finally {
      taskStore.setIsResetting(false);
    }
  }, [deleteAllFiles, taskStore, log]);

  return {
    generateQnAs,
    generateReportPlan,
    generateFinalReport,
    startResearchTasks,
    uploadFile,
    deleteFile,
    deleteAllFiles,
    resetWithFiles,
    // Cancellation methods
    cancelResearchTasks: taskStore.cancelResearchTasks,
    cancelFinalReport: taskStore.cancelFinalReport,
  };
}

// Custom hook for concurrent task processing
function useConcurrentTaskProcessor() {
  return useCallback(
    async <T, R>(
      items: T[],
      processor: (item: T) => Promise<R>,
      maxConcurrency: number = 3
    ): Promise<R[]> => {
      const results: R[] = [];
      const errors: Error[] = [];
      let currentIndex = 0;
      const activeTasks = new Set<Promise<void>>();

      const processItem = async (item: T, index: number) => {
        try {
          const result = await processor(item);
          results[index] = result;
        } catch (error) {
          errors.push(error as Error);
          throw error;
        }
      };

      // Start initial batch
      while (currentIndex < items.length && activeTasks.size < maxConcurrency) {
        const index = currentIndex++;
        const taskPromise = processItem(items[index], index).finally(() => {
          activeTasks.delete(taskPromise);
        });
        activeTasks.add(taskPromise);
      }

      // Continue processing as tasks complete
      while (activeTasks.size > 0) {
        await Promise.race(activeTasks);

        while (currentIndex < items.length && activeTasks.size < maxConcurrency) {
          const index = currentIndex++;
          const taskPromise = processItem(items[index], index).finally(() => {
            activeTasks.delete(taskPromise);
          });
          activeTasks.add(taskPromise);
        }
      }

      if (errors.length > 0) {
        const errorMessage = `Multiple tasks failed: ${errors.map(e => e.message).join('; ')}`;
        const aggregateError = new Error(errorMessage) as Error & { errors: Error[] };
        aggregateError.errors = errors;
        throw aggregateError;
      }

      return results;
    },
    []
  );
}

async function hashStringSHA256(inputString: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Failed to hash string:', error);
    throw new Error('Failed to generate hash');
  }
}

function createSmoothStreamingHandler(
  onUpdate: (text: string) => void,
  options: {
    baseCharactersPerSecond?: number;
    maxChunkSize?: number;
    adaptiveSpeed?: boolean;
    debounceMs?: number;
    maxBufferSize?: number;
  } = {}
) {
  const {
    baseCharactersPerSecond = 300,
    maxChunkSize = 500,
    adaptiveSpeed = true,
    debounceMs = 16,
    maxBufferSize = 50000, // Prevent excessive memory usage
  } = options;

  let buffer = '';
  let displayedText = ''; // Cache the displayed text instead of joining arrays
  let isStreaming = false;
  let streamingInterval: number | null = null;
  let debounceTimeout: number | null = null;
  let lastUpdateTime = 0;

  const scheduleUpdate = (text: string) => {
    const now = Date.now();
    if (now - lastUpdateTime < debounceMs) {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        onUpdate(text);
        lastUpdateTime = Date.now();
        debounceTimeout = null;
      }, debounceMs);
    } else {
      onUpdate(text);
      lastUpdateTime = now;
    }
  };

  const cleanup = () => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      streamingInterval = null;
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    isStreaming = false;
  };

  // Cleanup function that can be called externally
  const forceCleanup = () => {
    cleanup();
    if (buffer.length > 0) {
      displayedText += buffer;
      buffer = '';
      onUpdate(displayedText);
    }
  };

  const startStreaming = () => {
    if (isStreaming || streamingInterval) return;

    isStreaming = true;
    const intervalMs = Math.max(debounceMs, 20);

    streamingInterval = setInterval(() => {
      if (buffer.length === 0) return;

      const chunkSize = adaptiveSpeed
        ? Math.min(
            maxChunkSize,
            Math.max(
              1,
              Math.floor((baseCharactersPerSecond * intervalMs) / 1000) *
                Math.min(buffer.length / 1000 + 1, 3)
            )
          )
        : Math.min(
            maxChunkSize,
            Math.max(1, Math.floor((baseCharactersPerSecond * intervalMs) / 1000))
          );

      // Word boundary optimization
      let endIndex = Math.min(chunkSize, buffer.length);
      if (endIndex < buffer.length && endIndex > 1) {
        const breakChars = [' ', '\n', '.', ',', ';'];
        for (let i = endIndex; i >= Math.max(1, endIndex - 20); i--) {
          if (breakChars.includes(buffer[i])) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const nextChunk = buffer.slice(0, endIndex);
      buffer = buffer.slice(endIndex);
      displayedText += nextChunk;

      scheduleUpdate(displayedText);
    }, intervalMs);
  };

  const addChunk = (chunk: string) => {
    // Prevent buffer overflow
    if (buffer.length + chunk.length > maxBufferSize) {
      console.warn('Buffer size limit reached, flushing buffer');
      displayedText += buffer;
      buffer = chunk;
      scheduleUpdate(displayedText);
      return;
    }

    buffer += chunk;

    if (!isStreaming && (chunk.length < 50 || buffer.length < 100)) {
      displayedText += chunk;
      buffer = buffer.slice(chunk.length);
      scheduleUpdate(displayedText);
      return;
    }

    if (!isStreaming) {
      startStreaming();
    }
  };

  const reset = () => {
    cleanup();
    buffer = '';
    displayedText = '';
  };

  const finish = () => {
    cleanup();
    if (buffer.length > 0) {
      displayedText += buffer;
      buffer = '';
      scheduleUpdate(displayedText);
    }
  };

  return {
    addChunk,
    reset,
    finish,
    cleanup: forceCleanup,
    getDisplayedText: () => displayedText,
    isBufferEmpty: () => buffer.length === 0,
  };
}

export default useDeepResearch;
