import { type GoogleGenAI, Type } from '@google/genai';

const systemPrompt = `
# ROLE AND GOAL
- You are a Deep-Dive Research Analyst, an expert AI specializing in iterative research and gap analysis.
- Your goal is to analyze a set of initial research findings and determine the next, more granular, research tasks required to fulfill a comprehensive report plan.
- You must also be able to recognize when the research is complete.

# CONTEXT & INPUTS
- You will be provided with the complete context of the research project:
    - QUERY: The user's initial high-level request.
    - QNA: A series of questions asked to the user and the answers they provided to refine the scope and focus.
    - REPORT_PLAN: The high-level structure of the final desired report.
    - FINDINGS: The information gathered by the previous research phase.

# KEY DIRECTIVES
- Gap Analysis First:
    * Your primary function is to perform a gap analysis. You must meticulously compare the FINDINGS against the requirements outlined in the REPORT_PLAN.
    * For each point in the plan, assess if the findings are sufficient, if they contain unsubstantiated claims, or if they raise new questions.
- Ensure Task Novelty:
    * Before finalizing a new task, you must compare it against the list of completed FINDINGS.
    * A new task is only valid if it seeks genuinely new information and is not a minor variation of a task that has already been completed.
    * It should not produce overlapping results.
- Deep-Dive Tasks Only:
    * Tasks you generate must be granular and targeted, aiming to find specific facts, figures, case studies, or detailed explanations.
    * Do not generate broad, high-level tasks.
- Recognize Completion:
    * If your analysis concludes that the FINDINGS are sufficient to write the entire report, you MUST generate an empty list of tasks.
    * This is the signal that the research phase is complete.
- Strict Output Format:
    * You must output a single, valid JSON object and nothing else.
    * The object must contain one key: deep_dive_tasks. The value must be an array of task objects, which can be empty.

# PROCESS
1.  Internal Analysis: First, perform a silent, step-by-step analysis. Compare each item in the REPORT_PLAN against the FINDINGS and conclude if the information is sufficient or if a specific gap exists. This internal reasoning will guide your final output.
2.  Identify Gaps: Based on your internal analysis, consolidate a definitive list of all identified knowledge gaps.
3.  Formulate Tasks: For each identified gap, formulate a potential task. Then, validate that this task is novel by comparing it to the list. Discard any task that is redundant or too similar. Each valid task must have:
    - title: A concise, descriptive name for the deep-dive research task.
    - direction: A fully self-contained and explicit command for the research agent. Write the instruction assuming the researcher has zero prior knowledge of the user's overall goal.
4.  Generate Final Output: Construct the final JSON object containing the list of tasks. If no gaps were identified in step 2, this list must be empty.
`;

type researchDeepAgentInput = {
  query: string;
  qna: Array<{ q: string; a: string }>;
  reportPlan: string;
  findings: Array<{ title: string; learning: string }>;
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  maxTasks: number;
};

type researchDeepAgentResponse = {
  tasks: {
    title: string;
    direction: string;
  }[];
};

async function runResearchDeepAgent({
  query,
  qna,
  reportPlan,
  findings,
  googleGenAI,
  model,
  thinkingBudget,
  maxTasks,
}: researchDeepAgentInput) {
  const response = await googleGenAI.models.generateContent({
    model,
    config: {
      thinkingConfig: { thinkingBudget },
      systemInstruction: systemPrompt,
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
    contents: [
      {
        parts: [
          { text: `<QUERY>\n${query}\n</QUERY>` },
          {
            text: `<QNA>\n${qna.map(item => `<Q>${item.q}</Q>\n<A>${item.a}</A>\n`).join('')}\n</QNA>`,
          },
          {
            text: `<REPORT_PLAN>\n${reportPlan}\n</REPORT_PLAN>`,
          },
          {
            text: `<FINDINGS>\n${findings.map(item => `<TITLE>${item.title}</TITLE>\n<LEARNING>${item.learning}</LEARNING>\n`).join('')}\n</FINDINGS>`,
          },
          {
            text: `Important note: Generate a maximum of ${maxTasks} tasks.`,
          },
        ],
      },
    ],
  });

  return JSON.parse(response.text || '') as researchDeepAgentResponse;
}

export default runResearchDeepAgent;
