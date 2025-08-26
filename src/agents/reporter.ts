import tones from '../consts/tones';
import { type AgentInput } from '../types';
import { loadPrompt } from '../utils/prompt-loader';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = loadPrompt('reporter');

async function runReporterAgent(
  { googleGenAI, model, thinkingBudget, userContent, addLog, onStreaming }: AgentInput,
  { tone }: { tone: string },
  abortController?: AbortController
) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  // Find the selected tone from the tones list, fallback to 'journalist-tone'
  const selectedTone = tones.find(t => t.slug === tone) || tones[0];

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
      tools: [{ codeExecution: {} }],
      abortSignal: abortController?.signal,
    },
    contents: [
      {
        role: userContent.role,
        parts: [
          ...(userContent.parts || []),
          {
            text: `Important Note: The required writing style is ${selectedTone.name} (${selectedTone.describe}).`,
          },
        ],
      },
    ],
  });

  for await (const chunk of response) {
    // Check if operation was cancelled during streaming
    if (abortController?.signal.aborted) {
      throw new Error('AbortError');
    }

    if (!chunk?.candidates) continue;

    for (const candidate of chunk.candidates) {
      if (!candidate?.content?.parts) continue;

      for (const part of candidate.content.parts) {
        const text = part.text || '';
        const isThought = part.thought || false;

        if (isThought) {
          addLog(text, 'reporter-agent');
        } else {
          onStreaming?.(text);
        }

        if (part.inlineData && part.inlineData.data) {
          // currently only support images
          // check the mime type, return img tag with content base64
          const mimeType = part.inlineData.mimeType || '';
          const displayName = part.inlineData.displayName || 'Inline Data';

          if (mimeType.startsWith('image/')) {
            onStreaming?.('\n');
            onStreaming?.(`![${displayName}](data:${mimeType};base64,${part.inlineData.data})`);
            onStreaming?.('\n');
          }
        }

        if (part.executableCode && part.executableCode.code) {
          addLog(
            'The agent will run the following code to perform calculations or visualizations.',
            'reporter-agent'
          );

          if (!part.executableCode.code.startsWith('```')) {
            addLog(`\`\`\`\n${part.executableCode.code}\n\`\`\``, 'reporter-agent');
          }
        }

        if (part.codeExecutionResult && part.codeExecutionResult.output) {
          if (!part.codeExecutionResult.output.startsWith('```')) {
            addLog(`\`\`\`\n${part.codeExecutionResult.output}\n\`\`\``, 'reporter-agent');
          }
        }
      }
    }
  }
}

export default runReporterAgent;
