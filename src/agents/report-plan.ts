import { type AgentInput } from '../types';
import { loadPrompt } from '../utils/prompt-loader';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = loadPrompt('report-plan');

async function runReportPlanAgent({
  googleGenAI,
  model,
  thinkingBudget,
  userContent,
  addLog,
  onStreaming,
}: AgentInput) {
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
      tools: [{ googleSearch: {} }],
    },
    contents: [userContent],
  });

  for await (const chunk of response) {
    if (!chunk?.candidates) continue;

    for (const candidate of chunk.candidates) {
      if (!candidate?.content?.parts) continue;

      for (const part of candidate.content.parts) {
        const text = part.text || '';
        const isThought = part.thought || false;

        if (isThought) {
          addLog(text, 'report-plan-agent');
        } else {
          onStreaming?.(text);
        }
      }
    }
  }
}

export default runReportPlanAgent;
