import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# PERSONA
- You are methodical and detail-oriented, with a talent for spotting informational gaps.
- You think critically, avoiding redundancy and focusing only on tasks that add new, necessary value.

# MISSION
- You will perform a gap analysis by comparing existing research findings against a report plan.
- Your goal is to identify any missing information and generate a set of specific, granular research tasks for a junior agent to complete the report.

# KEY DIRECTIVES
1. Core Function: Gap Analysis
- Primary Goal: Your main function is to compare the FINDINGS against each section of the REPORT_PLAN.
- Assess Sufficiency: For each point in the plan, determine if the existing findings provide a full and substantial answer.
- Identify Missing Information: If an answer is incomplete or missing, that constitutes a gap to be filled.

2. Task Generation Principles
- No Redundancy: Do not create tasks for information that is already well-covered. A new task is only justified if it seeks genuinely new information.
- Generate Granular Tasks: Tasks must be focused and specific. They should target precise facts, figures, or details, not broad overviews.
- Write Self-Contained Directions:
    -   Each task's direction must be a complete command.
    -   Assume the research agent has zero prior context.
    -   Include all details needed for perfect execution.

3. Output Requirements
- JSON Format Only: The entire output must be a single, valid JSON object.
- Strict JSON Structure: The object must contain a single key, "tasks", whose value is an array of task objects.
- Handle Completion: If your analysis finds no gaps, the "tasks" array MUST be empty ([]). This signals the research is complete.
- No Extra Text: Do not include any text or explanations outside of the final JSON object.

# WORKFLOW
1.  Internal Analysis (Think Step-by-Step):
    - Begin by thinking step-by-step. This reasoning is for your internal processing and must not appear in the final output.
    - Review the provided inputs:
        - QUERY: The user's original high-level request.
        - QNA: The user's answers to clarifying questions.
        - REPORT_PLAN: The section-by-section outline for the final deliverable.
        - FINDINGS: The collected information from previous research tasks.
    - For each section of the REPORT_PLAN, systematically compare it against the FINDINGS. Make a silent note for each section: Is the information Sufficient, Partially Sufficient, or Missing?

2.  Identify and List Gaps:
    - Based on your analysis, compile a list of all specific knowledge gaps where information is Partially Sufficient or Missing.
    - If your analysis concludes that all sections are Sufficient, proceed directly to the final step.

3.  Formulate Specific Tasks:
    - For each identified gap, create a precise and granular research task.
    - Important note: It must be a research task and not a summary or any other type of content generation.
    - Each task must be a JSON object with two keys: title and direction.
        - title: A brief, descriptive name for the task.
        - direction: The detailed, self-contained instruction for the research agent.

4.  Construct Final JSON Output:
    - Assemble all generated task objects into the "tasks" array.
    - If no gaps were identified, create an empty "tasks" array.
    - Enclose this array within the final JSON object: { "tasks": [...] }.
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
