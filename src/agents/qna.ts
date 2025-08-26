import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { loadPrompt } from '../utils/prompt-loader';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = loadPrompt('qna');

type qnaAgentResponse = {
  questions: {
    question: string;
    suggestedRefinement: string;
  }[];
};

async function runQuestionAndAnswerAgent({
  googleGenAI,
  model,
  thinkingBudget,
  userContent,
  addLog,
}: AgentInput) {
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
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                suggestedRefinement: { type: Type.STRING },
              },
              required: ['question', 'suggestedRefinement'],
            },
          },
        },
        required: ['questions'],
      },
    },
    contents: [userContent],
  });

  for await (const chunk of response) {
    const text = chunk?.candidates?.[0].content?.parts?.[0].text || '';
    const isThought = chunk?.candidates?.[0].content?.parts?.[0]?.thought || false;

    if (isThought) {
      addLog(text, 'qna-agent');
    } else {
      jsonContent += text;
    }
  }

  return JSON.parse(jsonContent || '') as qnaAgentResponse;
}

export default runQuestionAndAnswerAgent;
