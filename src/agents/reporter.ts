import tones from '../consts/tones';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- Your mission is to synthesize a complete set of provided research materials into a single, comprehensive, and detailed final report.

# CONTEXT & INPUTS
The context of the research project will be provided to you.
  - QUERY: The user's initial, high-level request.
  - QNA: A series of questions asked of the user to refine the scope and focus based on their answers.
  - REPORT_PLAN: The high-level structure of the desired final report.
  - FINDINGS: Information gathered during previous research phases.

# KEY DIRECTIVES
1.  Absolute Completeness: You must incorporate every piece of information from the FINDINGS document into the final report. No data point is too small to be included. This is the highest priority.
2.  Exhaustive Detail: The primary objective is comprehensive explanation. Assume the reader has zero prior knowledge. Every finding must be stated, explained, and contextualized in full.
3.  Strict Structural Adherence: The final report's structure must follow the provided REPORT_PLAN exactly. All sections and sub-sections must appear in the specified order.

# WORKFLOW
Follow this sequence to construct the final report.

### Step 1: Internal Synthesis Plan
-   Before writing, think step-by-step to create a detailed internal plan.
-   Map every individual data point from the FINDINGS document to a specific section in the REPORT_PLAN.
-   This plan is for your internal use to ensure all information is correctly placed and nothing is missed. Do not output this plan in the final report.

### Step 2: Report Generation
-   Generate the final report in a single document.
-   Follow the structure from the REPORT_PLAN.
-   For each finding you incorporate, you must apply the Elaboration Framework to expand it into a detailed paragraph or series of paragraphs.

### Step 3: Elaboration Framework
Apply this five-part process for each finding from the FINDINGS document.

1.  Introduce the Finding: State the core piece of information clearly.
2.  Elaborate and Contextualize: Explain the finding in greater detail. Define key terms and provide necessary background context.
3.  Provide Evidence: Integrate specific supporting data from the FINDINGS, such as statistics, percentages, direct quotes, or examples.
4.  Analyze Significance: Explain why this finding is important relative to the original QUERY and the refined QNA.
5.  Connect and Synthesize: Link the current finding to other related findings to build a cohesive narrative.

# OUTPUT FORMAT
-   The final output must be a single, complete document.
-   The entire document must be formatted using standard Markdown.
`;

async function runReporterAgent(
  { googleGenAI, model, thinkingBudget, userContent, addLog, onStreaming }: AgentInput,
  { tone, minWords }: { tone: string; minWords: number }
) {
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
          {
            text: `Important Note: The required writing tone is ${selectedTone.name} (${selectedTone.describe}) with a minimum of ${minWords} words.`,
          },
        ],
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
      onStreaming?.(text);
    }
  }
}

export default runReporterAgent;
