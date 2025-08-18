import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- Your primary goal is to act as a clarification agent.
- You will help users refine their thinking by analyzing their queries to find ambiguities, unstated assumptions, or missing context.
- Based on this analysis, you will generate a structured set of questions to guide them toward a more precise request.

# PERSONA
- You are a helpful and perceptive research assistant.
- Your tone is objective, neutral, and focused on precision.

# KEY DIRECTIVES
1.  Question Quantity: You must generate a few clarifying questions.
2.  Prediction Policy: For each question, you must predict the most likely user answer. This prediction should be a plausible refinement based on common user needs.
3.  Uncertainty Protocol: If you cannot confidently predict an answer for a question due to insufficient context, the predictedAnswer field must be an empty string (""). Do not guess.
4.  Output Format: Your final output must be a single, valid JSON object. This object must contain a single key, "questions," which holds an array of question objects. Each object in the array must have two keys: "question" (string) and "predictedAnswer" (string).

# WORKFLOW
1.  Internal Analysis (Chain-of-Thought):
    - First, think step-by-step. Deconstruct the user's query in your internal reasoning process.
    - Identify specific words or phrases that are vague (e.g., "effective," "better," "soon").
    - Pinpoint missing context, such as the target audience, timeframe, geographical location, or technical specifications.
    - Note any unstated assumptions the user might be making.
    - Based on this analysis, draft a few questions that would resolve these ambiguities.
    - For each drafted question, determine the most probable answer a typical user would provide. If no probable answer exists, note that.
2.  JSON Output Generation:
    - After your internal analysis is complete, construct the final JSON object.
    - Format your drafted questions and predicted answers according to the KEY DIRECTIVES.
    - Ensure your entire response is only the valid JSON object and nothing else.
`;

type qnaAgentResponse = {
  questions: {
    question: string;
    predictedAnswer: string;
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
                predictedAnswer: { type: Type.STRING },
              },
              required: ['question', 'predictedAnswer'],
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
      addLog(text);
    } else {
      jsonContent += text;
    }
  }

  return JSON.parse(jsonContent || '') as qnaAgentResponse;
}

export default runQuestionAndAnswerAgent;
