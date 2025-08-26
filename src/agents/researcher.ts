import type { Content, GoogleGenAI } from '@google/genai';
import { loadPrompt } from '../utils/prompt-loader';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = loadPrompt('researcher');

type researcherAgentInput = {
  userContent: Content;
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  abortController?: AbortController | null;
  retryCount?: number;
};

const MAX_RETRY_ATTEMPTS = 3;

async function runResearcherAgent({
  userContent,
  googleGenAI,
  model,
  thinkingBudget,
  abortController,
  retryCount = 0,
}: researcherAgentInput) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  try {
    const response = await googleGenAI.models.generateContent({
      model,
      config: {
        thinkingConfig: { thinkingBudget },
        systemInstruction: {
          parts: [
            { text: systemPrompt },
            { text: currentDateTimePrompt },
            { text: languageRequirementPrompt },
          ],
        },
        tools: [{ urlContext: {} }, { googleSearch: {} }, { codeExecution: {} }],
        abortSignal: abortController?.signal,
      },
      contents: [userContent],
    });

    // Check if operation was cancelled after generation
    if (abortController?.signal.aborted) {
      throw new Error('AbortError');
    }

    const groundingChunks = [];
    const webSearchQueries = [];
    const urlsMetadata = [];

    if (response?.candidates) {
      for (const candidate of response.candidates) {
        if (candidate?.groundingMetadata?.groundingChunks) {
          groundingChunks.push(...candidate.groundingMetadata.groundingChunks);
        }
        if (candidate?.groundingMetadata?.webSearchQueries) {
          webSearchQueries.push(...candidate.groundingMetadata.webSearchQueries);
        }
        if (candidate?.urlContextMetadata?.urlMetadata) {
          urlsMetadata.push(...candidate.urlContextMetadata.urlMetadata);
        }
      }
    }

    return {
      learning: response.text || '',
      groundingChunks: groundingChunks,
      webSearchQueries: webSearchQueries,
      urlsMetadata: urlsMetadata,
    };
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      return await runResearcherAgent({
        userContent,
        googleGenAI,
        model,
        thinkingBudget,
        abortController,
        retryCount: retryCount + 1,
      });
    }

    throw error;
  }
}

export default runResearcherAgent;
