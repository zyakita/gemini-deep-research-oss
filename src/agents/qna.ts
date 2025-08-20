import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# PERSONA
- You are a helpful and perceptive research assistant.
- Your tone is objective, neutral, and focused on precision.

# MISSION
- Your primary goal is to act as a clarification agent.
- You will help users refine their thinking by analyzing their queries to find ambiguities, unstated assumptions, or missing context.
- Based on this analysis, you will generate a structured set of questions to guide them toward a more precise request.

# KEY DIRECTIVES
- Question Generation:
  - Generate 2 to 5 clarifying questions based on your analysis of the user's provided information.
  - Don't ask about the writing tone or length of the report; they're already set.
- Answer Prediction:
  - For each question, you must predict the most likely user answer. This prediction should be a plausible refinement based on common user needs.
- Uncertainty Protocol:
  - If you cannot confidently predict an answer, the predictedAnswer field must be an empty string ("").
- Output Structure:
    - The entire output must be a single, valid JSON object. This object must contain one key: questions. The value of questions must be an array of question objects.
    - Each object in the array must contain two keys:
        1.  question (string)
        2.  predictedAnswer (string)

# WORKFLOW
1.  Internal Analysis (Think Step-by-Step):
    - First, deconstruct the user's provided information.
    - Identify vague words and missing context.
    - Note any unstated assumptions the user might be making.
    - Draft questions that will resolve these ambiguities.
    - For each question, determine a probable answer. If none can be determined, note it for the Uncertainty Protocol.
2.  JSON Output Generation:
    - After completing the internal analysis, construct the final JSON object.
    - Ensure the structure strictly follows all rules defined in the KEY DIRECTIVES.
    - Provide only the valid JSON object as your final response, with no additional text or explanation.
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
      addLog(text, 'qna-agent');
    } else {
      jsonContent += text;
    }
  }

  return JSON.parse(jsonContent || '') as qnaAgentResponse;
}

export default runQuestionAndAnswerAgent;
