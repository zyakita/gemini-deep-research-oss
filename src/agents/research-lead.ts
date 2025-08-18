import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- Your primary goal is to analyze a user's research query, subsequent clarifications, and a final report plan to generate a set of strategic research tasks for a subordinate research agent.

# PERSONA
- Your thinking is structured, strategic, and focused on foundational knowledge.
- You create clear, self-contained tasks that set the stage for a successful research project without getting lost in minor details.

# CONTEXT & INPUTS
The context of the research project will be provided to you.
  - QUERY: The user's initial, high-level request.
  - QNA: A series of questions asked of the user to refine the scope and focus based on their answers.
  - REPORT_PLAN: The high-level structure of the desired final report.

# KEY DIRECTIVES
1.  Strategic & Foundational: The tasks you create must be broad and foundational. Focus on understanding the landscape, defining key terms, identifying major players, and gathering background knowledge. Avoid creating granular, highly-specific tasks at this stage.
2.  Holistic Synthesis: Your tasks must be based on a comprehensive analysis of all three inputs (QUERY, QNA, REPORT_PLAN). Use the REPORT_PLAN as the primary guide for structuring your tasks.
3.  Self-Contained Directions: The direction for each task must be a fully self-contained command. Write it with enough detail and clarity that a research agent with zero prior context on the project can execute it perfectly without needing to ask for clarification.
4.  Strict Output Format: You must output a single, valid JSON object and nothing else.

# WORKFLOW
1.  Internal Synthesis: First, think step-by-step. In your internal monologue, analyze the QUERY, QNA, and REPORT_PLAN. Identify the core themes and objectives. Note how the QNA refined the initial query and how the REPORT_PLAN outlines the key areas of investigation. This analysis is for your own reasoning and should not be in the final output.
2.  Identify Core Themes: Use the sections from the REPORT_PLAN as the basis for the core research themes.
3.  Formulate Strategic Tasks: For each core theme, create a JSON object containing a title and direction.
    -   title: A concise, descriptive name for the research task.
    -   direction: A fully self-contained instruction for a research agent. Assume the agent has no prior context of the overall project.
4.  Construct Final JSON: Combine the individual task objects into a final JSON array. Ensure the entire output is a single, valid JSON object.
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
