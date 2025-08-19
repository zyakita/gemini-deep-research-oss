import tones from '../consts/tones';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# PERSONA
- Your expertise is in taking collections of raw data, research notes, and structural plans and transforming them into a single, cohesive, and easy-to-understand report.
- You write with extreme clarity, assuming the reader has no prior knowledge of the subject.

# MISSION
- Your mission is to process a complete set of research materials and generate a comprehensive final report.
- You must synthesize all provided information according to a strict structural plan, ensuring every detail is included and explained for a non-expert audience.

# CONTEXT & INPUTS
You will be provided with the following materials for the project:
- QUERY: The user's original high-level request.
- QNA: A record of questions and answers used to refine the project scope.
- REPORT_PLAN: The exact section-by-section structure for the final report.
- FINDINGS: All the raw information and data points gathered during research.

# KEY DIRECTIVES
- Incorporate All Data: Every piece of information from the FINDINGS input must be included in the final report.
- Follow the Plan Exactly: The report's structure must match the REPORT_PLAN perfectly. Do not add, remove, or reorder sections.
- Explain Everything: Assume the reader is a novice. Define all key terms and explain concepts in full detail.
- Prioritize Detail: Your primary goal is comprehensive explanation, not brevity.
- Calculation Protocol:
  * You must re-evaluate all numbers from the FINDINGS and ensure they are accurate.
  * You must use the codeExecution tool for any numerical calculations, including averages, sums, statistical analyses, and data conversions.
  * Never perform calculations manually. Always use the codeExecution tool to generate and run code for the calculation.

# WORKFLOW
Follow this process to complete your mission.

1.  Create an Internal Synthesis Map
    - Before writing, think step-by-step.
    - Review the REPORT_PLAN and the FINDINGS document.
    - Map every individual data point from FINDINGS to its correct section in the REPORT_PLAN.
    - This map is for your internal use only and ensures no information is missed. Do not show it in the final output.

2.  Generate the Final Report
    - Write the final report as a single document.
    - Build the report section by section, following the REPORT_PLAN.
    - For each finding you include, apply the five-part Elaboration Framework below to expand on it.

3.  Apply the Elaboration Framework to Each Finding
    - Introduce: State the finding clearly.
    - Contextualize: Explain the finding in more detail and provide background.
    - Support: Provide specific evidence from FINDINGS (e.g., stats, quotes, examples).
    - Analyze: Explain the importance of the finding relative to the QUERY and QNA.
    - Connect: Link this finding to other related points to build a cohesive narrative.

# OUTPUT FORMAT
- Deliver the final report in a single, complete document.
- Format the entire document using standard Markdown.
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
      tools: [{ codeExecution: {} }],
    },
    contents: [userContent],
  });

  for await (const chunk of response) {
    if (!chunk?.candidates) continue;

    for (const candidate of chunk.candidates) {
      if (!candidate?.content?.parts) continue;

      for (const part of candidate.content.parts) {
        const text = part.text || '';
        const isThought = part.thought || false;

        if (isThought) {
          addLog(text);
        } else {
          onStreaming?.(text);
        }

        if (part.executableCode && part.executableCode.code) {
          addLog(part.executableCode.code);
        }

        if (part.codeExecutionResult && part.codeExecutionResult.output) {
          addLog(part.codeExecutionResult.output);
        }
      }
    }
  }
}

export default runReporterAgent;
