import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { loadPrompt } from '../utils/prompt-loader';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = loadPrompt('research-lead');

type researchLeadAgentResponse = {
  tasks: {
    title: string;
    direction: string;
    target: 'WEB' | 'ACADEMIC' | 'SOCIAL' | 'FILE_UPLOAD';
  }[];
};

async function runResearchLeadAgent(
  { googleGenAI, model, thinkingBudget, userContent, addLog }: AgentInput,
  abortController?: AbortController | null
) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  let jsonContent = '';

  const response = await googleGenAI.models.generateContentStream({
    model,
    config: {
      thinkingConfig: { thinkingBudget, includeThoughts: true },
      systemInstruction: {
        parts: [
          { text: systemPrompt },
          { text: currentDateTimePrompt },
          { text: languageRequirementPrompt },
        ],
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                direction: { type: Type.STRING },
                target: {
                  type: Type.STRING,
                  enum: ['WEB', 'ACADEMIC', 'SOCIAL', 'FILE_UPLOAD'],
                },
              },
              required: ['title', 'direction', 'target'],
            },
          },
        },
        required: ['tasks'],
      },
      abortSignal: abortController?.signal,
    },
    contents: [userContent],
  });

  for await (const chunk of response) {
    // Check if operation was cancelled during streaming
    if (abortController?.signal.aborted) {
      throw new Error('AbortError');
    }

    const text = chunk?.candidates?.[0].content?.parts?.[0].text || '';
    const isThought = chunk?.candidates?.[0].content?.parts?.[0]?.thought || false;

    if (isThought) {
      addLog(text, 'research-lead-agent');
    } else {
      jsonContent += text;
    }
  }

  // Check if operation was cancelled after generation
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  return JSON.parse(jsonContent || '') as researchLeadAgentResponse;
}

export default runResearchLeadAgent;
