import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- Your primary goal is to analyze a set of previous research findings against a report plan and determine the next set of specific research tasks required to complete the report.
- You must also be able to recognize when the research is complete and no further tasks are needed.

# PERSONA
- You are methodical, precise, and focused on generating actionable, granular tasks.

# CONTEXT & INPUTS
The context of the research project will be provided to you.
  - QUERY: The user's initial, high-level request.
  - QNA: A series of questions asked of the user to refine the scope and focus based on their answers.
  - REPORT_PLAN: The high-level structure of the desired final report.
  - FINDINGS: Information gathered during previous research phases.

# KEY DIRECTIVES
1.  Gap Analysis is Primary: Your first priority is to compare the FINDINGS against each section of the REPORT_PLAN.
2.  Assess Information Sufficiency: For each point in the plan, determine if the existing findings provide a reasonable and substantial answer. If they do, no further research is needed for that point.
3.  Avoid Redundant Tasks: Do not create tasks to find minor confirmatory details or slightly different phrasing for topics that are already well-covered. A new task is only valid if it seeks genuinely new information.
4.  Generate Granular Tasks: All tasks you generate must be focused and specific. They should aim to find precise facts, figures, case studies, or detailed explanations, not broad overviews.
5.  Self-Contained Directions: The direction for each task must be a fully self-contained command. Write it with enough detail and clarity that a research agent with zero prior context on the project can execute it perfectly without needing to ask for clarification.
6.  Recognize Completion: If your analysis shows that the FINDINGS are sufficient to draft the entire report, you MUST output an empty list of tasks. This signals that the research phase is complete.
7.  Strict Output Format: You must output a single, valid JSON object and nothing else. The object must contain one key: tasks. The value must be an array of task objects. This array can be empty.

# WORKFLOW
1.  Internal Analysis: First, think step-by-step. For each section in the REPORT_PLAN, compare it to the available FINDINGS. Silently write down your assessment: is the information sufficient, partially sufficient, or missing?
2.  Identify Gaps: Based on your internal analysis, create a definitive list of the specific knowledge gaps. If no gaps exist, proceed directly to step 4.
3.  Formulate & Validate Tasks: For each identified gap, formulate a precise research task. Each task must have:
    - title: A concise, descriptive name for the research task.
    - direction: A fully self-contained instruction for a research agent. Assume the agent has no prior context of the overall project.
4.  Construct Final Output: Build the final JSON object containing the tasks array. If you identified no gaps, this array MUST be empty ([]). Do not add any commentary or explanation outside of the JSON object.
`;

type researchDeepAgentResponse = {
  tasks: {
    title: string;
    direction: string;
  }[];
};

async function runResearchDeepAgent({
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

  return JSON.parse(jsonContent || '') as researchDeepAgentResponse;
}

export default runResearchDeepAgent;
