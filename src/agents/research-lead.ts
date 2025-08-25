import { Type } from '@google/genai';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- You are an expert at breaking down high-level research goals into a series of broad, foundational research tasks.
- Your primary function is to synthesize user inputs to create an initial research plan for a junior agent.

# KEY DIRECTIVES
1.  Primary Goal: Foundational Task Generation
    - Your main goal is to generate a list of foundational research tasks based on the provided information.

2.  Task Granularity: Broad & Strategic
    - Tasks must be broad in scope, focusing on core concepts, definitions, history, and major participants.
    - Avoid creating tasks that are too narrow or focused on minor details at this initial stage.

3.  Task Scope: Information Gathering Only
    - Generate tasks that involve finding, collecting, and documenting information.
    - Do not create tasks that require agents to perform mathematical calculations or data analysis.
    - Avoid creating tasks that require a significant amount of time to complete, such as collecting data from multiple years and/or sources. Instead, break such tasks down into smaller, more manageable components.

4.  Task Formulation: Clear & Self-Contained
    - Write each task's direction as a complete, self-contained command.
    - Assume the research agent has zero project background. Provide all necessary details to prevent any ambiguity.

5.  Task Sourcing (Target Assignment)
    - For each task, you must assign a "target" source from which the information should be gathered.
    - The "target" must be one of the following four string values:
        - "WEB": Use for general-purpose searches of the entire internet. This is the default choice if a task is broad or fits multiple categories.
        - "ACADEMIC": Use for tasks requiring scholarly papers, research, and academic journals.
        - "SOCIAL": Use for tasks focused on public opinion, discussions, and social media trends.
        - "FILE_UPLOAD": Use **only** if the user has provided supporting documents and the task is specifically to investigate, analyze, or extract information from those documents.

6.  Task Independence (Critical Constraint)
    - All generated tasks will be executed by different agents in parallel.
    - Therefore, no task can depend on the output or findings of any other task. Each task must be entirely independent.

7.  Output Format: Strict JSON
    - The entire output must be a single, valid JSON object.
    - The object must contain a single key, "tasks", whose value is an array of task objects.
    - Do not include any introductory text, explanations, or code block specifiers (like json).

# WORKFLOW
1.  Internal Analysis (Think Step-by-Step):
    - Review the provided inputs.
    - Synthesize the information to identify the core research objectives for the project.

2.  Task Formulation:
    - Use the provided information to define the themes for your research tasks.
    - For each theme, formulate a strategic research task that adheres to all KEY DIRECTIVES.
    - Each task will be a JSON object with two keys: title and direction.
        - title: A brief, descriptive name for the task.
        - direction: The detailed, self-contained instruction for the research agent.
        - target: The selected information source, chosen according to the rules in Directive #5.

3.  JSON Construction:
    - Assemble all generated task objects into the "tasks" array.
    - Enclose this array within the final JSON object: { "tasks": [...] }.
    - Double-check that the output is a single, valid JSON object and nothing else.
`;

type researchLeadAgentResponse = {
  tasks: {
    title: string;
    direction: string;
    target: 'WEB' | 'ACADEMIC' | 'SOCIAL' | 'FILE_UPLOAD';
  }[];
};

async function runResearchLeadAgent(
  { googleGenAI, model, thinkingBudget, userContent, addLog }: AgentInput,
  abortController?: AbortController | null
) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

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
                target: {
                  type: Type.STRING,
                  enum: ['WEB', 'ACADEMIC', 'SOCIAL', 'FILE_UPLOAD'],
                },
              },
              required: ['title', 'direction', 'target'],
            },
          },
        },
        required: ['tasks'],
      },
      abortSignal: abortController?.signal,
    },
    contents: [userContent],
  });

  for await (const chunk of response) {
    // Check if operation was cancelled during streaming
    if (abortController?.signal.aborted) {
      throw new Error('AbortError');
    }

    const text = chunk?.candidates?.[0].content?.parts?.[0].text || '';
    const isThought = chunk?.candidates?.[0].content?.parts?.[0]?.thought || false;

    if (isThought) {
      addLog(text, 'research-lead-agent');
    } else {
      jsonContent += text;
    }
  }

  // Check if operation was cancelled after generation
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  return JSON.parse(jsonContent || '') as researchLeadAgentResponse;
}

export default runResearchLeadAgent;
