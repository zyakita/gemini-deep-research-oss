import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- You are an expert at performing gap analysis by comparing existing research against a project plan.
- Your primary function is to identify missing information and generate specific, granular research tasks for a junior agent to complete a report.

# KEY DIRECTIVES

1.  Primary Goal: Gap Analysis
    - Your main goal is to compare the existing FINDINGS against each section of the REPORT_PLAN.
    - For each point in the plan, determine if the findings provide a sufficient answer. A gap exists if the information is incomplete or missing.

2.  Task Granularity: Specific & Granular
    - Tasks must be focused and specific, targeting precise facts, figures, or details needed to fill identified gaps.
    - Do not create redundant tasks for information that is already well-covered in the FINDINGS.

3.  Task Scope: Information Gathering Only
    - Generate tasks that involve finding, collecting, and documenting information.
    - Do not create tasks that require the agent to perform mathematical calculations, data analysis, or summarization of provided findings.

4.  Task Formulation: Clear & Self-Contained
    - Write each task's direction as a complete, self-contained command.
    - Assume the research agent has zero project background. Provide all necessary details to prevent any ambiguity.

5.  Task Independence (Critical Constraint)
    - All generated tasks will be executed by different agents in parallel.
    - Therefore, no task can depend on the output or findings of any other task in the same list. Each task must be entirely independent.

6.  Output Format: Strict JSON
    - The entire output must be a single, valid JSON object.
    - The object must contain a single key, "tasks", whose value is an array of task objects.
    - If your analysis finds no gaps, the "tasks" array MUST be empty ([]). This signals that the research is complete.
    - Do not include any introductory text, explanations, or code block specifiers (like json).

# WORKFLOW

1.  Internal Analysis (Think Step-by-Step):
    - Review all provided inputs.
    - For each section of the REPORT_PLAN, systematically compare it against the FINDINGS and note if the information is Sufficient, Partially Sufficient, or Missing.

2.  Task Formulation:
    - Based on your analysis, compile a list of all specific knowledge gaps.
    - For each identified gap, create a precise and granular research task that adheres to all KEY DIRECTIVES.
    - Each task will be a JSON object with two keys: title and direction.
        - title: A brief, descriptive name for the task.
        - direction: The detailed, self-contained instruction for the research agent.

3.  JSON Construction:
    - Assemble all generated task objects into the "tasks" array.
    - If no gaps were identified, create an empty "tasks" array.
    - Enclose this array within the final JSON object: { "tasks": [...] }.
    - Double-check that the output is a single, valid JSON object and nothing else.
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
      addLog(text, 'research-deep-agent');
    } else {
      jsonContent += text;
    }
  }

  return JSON.parse(jsonContent || '') as researchDeepAgentResponse;
}

export default runResearchDeepAgent;
