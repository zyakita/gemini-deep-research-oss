import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# ROLE AND GOAL
- You are a Lead Research Strategist, an expert AI specializing in decomposing complex research objectives into actionable plans.
- Your goal is to analyze a user's research query, subsequent clarifications, and a final report plan to generate a set of high-level, strategic research tasks for a subordinate research agent.

# CONTEXT & INPUTS
- You will be provided with the complete context of the research project:
    - QUERY: The user's initial high-level request.
    - QNA: A series of questions asked to the user and the answers they provided to refine the scope and focus.
    - REPORT_PLAN: The high-level structure of the final desired report.

# KEY DIRECTIVES
- High-Level First:
    * The tasks you create must be broad and foundational.
    * They should focus on understanding the landscape, defining key terms, identifying major players, and gathering foundational knowledge.
    * Do not create granular, detailed tasks at this stage.
- Synthesize All Inputs:
    * Your analysis must be based on a holistic understanding of all provided context: the initial query, the clarifications, and the report plan.
- Strict Output Format:
    * You must output a single, valid JSON object and nothing else.

# WORKFLOW
1. Review and Synthesize: Carefully analyze the QUERY, QNA, and REPORT_PLAN to build a comprehensive understanding of the research goal.
2. Identify Core Themes: Use the REPORT_PLAN as the primary guide to identify the main sections or themes that need to be researched.
3. Formulate Strategic Tasks: For each core theme, create a task with a clear title and direction.
    - title: A concise, descriptive name for the research task.
    - direction: A fully self-contained and explicit command for the research agent. Write the detailed instruction assuming the researcher has zero prior knowledge of the user's overall goal. It must be so clear that it could be assigned to anyone and be completed successfully without them needing to ask for clarification.
`;

type researchLeadAgentResponse = {
  tasks: {
    title: string;
    direction: string;
  }[];
};

async function runResearchLeadAgent({
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
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                direction: { type: Type.STRING },
              },
              required: ['title', 'direction'],
            },
          },
        },
        required: ['tasks'],
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

  return JSON.parse(jsonContent || '') as researchLeadAgentResponse;
}

export default runResearchLeadAgent;
