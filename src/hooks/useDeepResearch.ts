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
import type { ResearchTask } from '../types';
import { buildUserContent } from '../utils/user-contents';

function useDeepResearch() {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();
  const processConcurrent = useConcurrentTaskProcessor();

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
      addLog: taskStore.addLog,
      googleGenAI,
      thinkingBudget: settingStore.thinkingBudget,
    }),
    [googleGenAI, settingStore.thinkingBudget, taskStore.addLog]
  );

  // Generate Q&As
  const generateQnAs = useCallback(async () => {
    if (!settingStore.isApiKeyValid || settingStore.isApiKeyValidating) {
      taskStore.addLog('!!! API key is invalid or still validating');
      return;
    }

    try {
      taskStore.addLog('➜ Starting Q&A generation...');

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
    } catch (error) {
      taskStore.addLog(`!!! Failed to generate Q&As: ${error}`);
      taskStore.setIsGeneratingQnA(false);

      throw error;
    } finally {
      taskStore.addLog('=== Q&A generation completed ===');
      taskStore.setIsGeneratingQnA(false);
    }
  }, [commonAgentParams, taskStore, settingStore]);

  // Generate report plan
  const generateReportPlan = useCallback(async () => {
    // Create streaming handler with proper cleanup
    let streamingHandler: ReturnType<typeof createSmoothStreamingHandler> | null = null;

    try {
      taskStore.addLog('➜ Starting report plan generation...');

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
    } catch (error) {
      taskStore.addLog(`!!! Failed to generate report plan: ${error}`);
      taskStore.setIsGeneratingReportPlan(false);

      throw error;
    } finally {
      streamingHandler?.finish();

      taskStore.addLog('=== Report plan generation completed ===');
      taskStore.setIsGeneratingReportPlan(false);
    }
  }, [commonAgentParams, taskStore, settingStore]);

  // Generate research tasks
  const generateResearchTasks = useCallback(
    async (tier: number) => {
      taskStore.addLog(`➜ Starting research task generation for round ${tier}...`);

      const existingTasks = taskStore.getResearchTasksByTier(tier);
      if (existingTasks.length > 0) return;

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

        const { tasks } =
          tier === 1
            ? await runResearchLeadAgent({
                ...commonAgentParams,
                model: settingStore.coreModel,
                userContent,
              })
            : await runResearchDeepAgent({
                ...commonAgentParams,
                model: settingStore.coreModel,
                userContent,
              });

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
          taskStore.addLog(
            `=== No additional research tasks needed for round ${tier} - agent determined current findings are sufficient ===`
          );
        } else {
          taskStore.addLog(
            `=== ${researchTasks.length} research tasks generated for round ${tier} ===`
          );
        }
      } catch (error) {
        taskStore.addLog(`!!! Failed to generate research tasks for round ${tier}: ${error}`);
        throw error;
      }
    },
    [commonAgentParams, taskStore, settingStore]
  );

  // Run research tasks
  const runResearchTasks = useCallback(
    async (tier: number) => {
      const maxConcurrency = settingStore.parallelSearch || 1;
      const existingTasks = taskStore.getResearchTasksByTier(tier);
      const tasksToRun = existingTasks.filter(t => t.learning === '');

      if (tasksToRun.length === 0) return;

      taskStore.addLog(`➜ Starting research tasks for round ${tier}.`);
      taskStore.addLog(`${maxConcurrency} concurrent tasks allowed.`);

      try {
        await processConcurrent(
          tasksToRun,
          async (task: ResearchTask) => {
            taskStore.addLog(`⌕ researching: ${task.title}`);
            taskStore.updateResearchTask({ ...task, processing: true });

            try {
              const { learning, groundingChunks } = await runResearcherAgent({
                direction: task.direction,
                googleGenAI,
                model: settingStore.taskModel,
                thinkingBudget: settingStore.thinkingBudget,
              });

              taskStore.updateResearchTask({
                ...task,
                processing: false,
                learning,
                groundingChunks,
              });

              // Add sources to the task store if we have resolver
              if (import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) {
                for (const chunk of groundingChunks) {
                  taskStore.addSource(chunk?.web?.uri || '');
                }
              }

              taskStore.addLog(`✓ completed: ${task.title}`);
              return { taskId: task.id, success: true };
            } catch (error) {
              taskStore.updateResearchTask({ ...task, processing: false });
              taskStore.addLog(`!!! Failed to run research task: ${task.title}: ${error}`);
              throw error;
            }
          },
          maxConcurrency
        );
      } catch (error) {
        taskStore.addLog(`!!! Failed to run research tasks for round ${tier}: ${error}`);
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
    ]
  );

  // Start research tasks
  const startResearchTasks = useCallback(async () => {
    try {
      taskStore.resetResearchTasks();
      taskStore.setIsGeneratingResearchTasks(true);

      for (let tier = 1; tier <= settingStore.depth; tier++) {
        await generateResearchTasks(tier);

        // Check if any tasks were actually generated for this tier
        const tierTasks = taskStore.getResearchTasksByTier(tier);
        if (tierTasks.length === 0) {
          taskStore.addLog(
            `➜ Research completion detected at round ${tier} - proceeding to final report`
          );
          taskStore.setResearchCompletedEarly(true);
          taskStore.setMaxTierReached(tier - 1); // Previous tier was the last one with tasks
          break; // Exit early if no tasks were generated (agent determined research is complete)
        }

        taskStore.setMaxTierReached(tier);
        await runResearchTasks(tier);
      }
    } catch (error) {
      taskStore.setIsGeneratingResearchTasks(false);
      throw error;
    } finally {
      taskStore.setIsGeneratingResearchTasks(false);
    }
  }, [taskStore, settingStore.depth, generateResearchTasks, runResearchTasks]);

  // Generate final report
  const generateFinalReport = useCallback(async () => {
    let streamingHandler: ReturnType<typeof createSmoothStreamingHandler> | null = null;

    try {
      taskStore.addLog('➜ Starting final report generation...');

      taskStore.updateFinalReport('');
      taskStore.setIsGeneratingFinalReport(true);

      streamingHandler = createSmoothStreamingHandler(
        streamedText => taskStore.updateFinalReport(streamedText),
        {
          baseCharactersPerSecond: 500,
          maxChunkSize: 300,
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

      await runReporterAgent(
        {
          ...commonAgentParams,
          model: settingStore.coreModel,
          userContent,
          onStreaming: chunk => streamingHandler?.addChunk(chunk),
        },
        {
          tone: settingStore.reportTone,
          minWords: settingStore.minWords,
        }
      );
    } catch (error) {
      console.error('!!! Failed to generate final report:', error);
      throw error;
    } finally {
      streamingHandler?.finish();

      taskStore.addLog('=== Final report generation completed ===');
      taskStore.setIsGeneratingFinalReport(false);
    }
  }, [commonAgentParams, taskStore, settingStore]);

  // Upload file
  const uploadFile = useCallback(
    async (file: globalThis.File) => {
      if (!settingStore.isApiKeyValid) {
        taskStore.addLog('!!! API key is invalid');
        throw new Error('API key is invalid');
      }

      try {
        taskStore.addLog(`➜ Uploading file: ${file.name}...`);

        const uploadedFile = await googleGenAI.files.upload({
          file: file, // File object extends Blob, which is compatible
          config: {
            mimeType: file.type,
            displayName: file.name,
          },
        });

        taskStore.addFile(uploadedFile);
        taskStore.addLog(`✓ File uploaded successfully: ${file.name}`);

        return uploadedFile;
      } catch (error) {
        taskStore.addLog(`!!! Failed to upload file: ${file.name}: ${error}`);
        throw error;
      }
    },
    [googleGenAI, taskStore, settingStore]
  );

  // Delete file
  const deleteFile = useCallback(
    async (fileName: string) => {
      if (!settingStore.isApiKeyValid) {
        taskStore.addLog('!!! API key is invalid');
        throw new Error('API key is invalid');
      }

      try {
        taskStore.addLog(`➜ Deleting file: ${fileName}...`);

        await googleGenAI.files.delete({ name: fileName });
        taskStore.removeFile(fileName);
        taskStore.addLog(`✓ File deleted successfully: ${fileName}`);
      } catch (error) {
        taskStore.addLog(`!!! Failed to delete file: ${fileName}: ${error}`);
        throw error;
      }
    },
    [googleGenAI, taskStore, settingStore]
  );

  // Delete all uploaded files
  const deleteAllFiles = useCallback(async () => {
    if (!settingStore.isApiKeyValid) {
      taskStore.addLog('!!! API key is invalid');
      return;
    }

    const files = taskStore.files;
    if (files.length === 0) {
      return;
    }

    try {
      taskStore.addLog(`➜ Deleting ${files.length} uploaded files...`);

      // Delete files concurrently
      await Promise.allSettled(
        files.map(async file => {
          try {
            if (file.name) {
              await googleGenAI.files.delete({ name: file.name });
              taskStore.addLog(`✓ Deleted file: ${file.displayName || file.name}`);
            }
          } catch (error) {
            taskStore.addLog(
              `!!! Failed to delete file: ${file.displayName || file.name}: ${error}`
            );
          }
        })
      );

      taskStore.clearAllFiles();
      taskStore.addLog('=== All files deleted ===');
    } catch (error) {
      taskStore.addLog(`!!! Failed to delete files: ${error}`);
    }
  }, [googleGenAI, taskStore, settingStore]);

  // Reset tasks and delete all files
  const resetWithFiles = useCallback(async () => {
    try {
      taskStore.setIsResetting(true);
      taskStore.addLog('➜ Starting reset and file deletion...');
      await deleteAllFiles();
      taskStore.reset();
      // taskStore.addLog('=== Reset completed ===');
    } catch (error) {
      console.error('Error during reset:', error);
      taskStore.addLog(`!!! Error during reset: ${error}`);
      // Reset anyway, even if file deletion fails
      taskStore.reset();
    } finally {
      taskStore.setIsResetting(false);
    }
  }, [deleteAllFiles, taskStore]);

  return {
    generateQnAs,
    generateReportPlan,
    generateFinalReport,
    startResearchTasks,
    uploadFile,
    deleteFile,
    deleteAllFiles,
    resetWithFiles,
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
