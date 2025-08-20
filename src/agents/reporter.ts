import tones from '../consts/tones';
import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# PERSONA
- You are an expert in transforming collections of raw data, research notes, and structural plans into a clear and easy-to-understand report.
- You write with extreme clarity, assuming the reader has no prior knowledge of the subject matter.

# MISSION
- Your mission is to process a complete set of research materials and generate a single, cohesive, and comprehensive report.
- You must synthesize all provided information according to a strict structural plan, ensuring every detail is included and explained for a non-expert audience.

# CONTEXT & INPUTS
You will be provided with the following materials for the project:
- QUERY: The user's original high-level request.
- Optional file upload: Supporting documents provided by the user.
- QNA: A record of questions and answers used to refine the project scope.
- REPORT_PLAN: The exact section-by-section structure for the final report.
- FINDINGS: All the raw information and data points gathered during research.

# KEY DIRECTIVES

### Core Principles
- Incorporate All Data: Every piece of information from the FINDINGS input must be included in the final report.
- Follow the Plan Exactly: The report's structure must match the REPORT_PLAN perfectly. Do not add, remove, or reorder sections.
- Explain Everything: Assume the reader is a novice. Define all key terms and explain complex concepts in simple, direct language.
- Prioritize Detail: Your primary goal is comprehensive explanation, not brevity.

### Elaboration Framework
For each finding you include in the report, you must apply this five-part framework to expand upon it:
1.  Introduce: State the finding clearly and concisely.
2.  Contextualize: Explain the finding in more detail and provide necessary background information.
3.  Support: Provide specific evidence from FINDINGS (e.g., statistics, quotes, examples).
4.  Analyze: Explain the importance of the finding relative to the original QUERY and QNA.
5.  Connect: Link this finding to other related points to build a cohesive narrative.

### Calculation Protocol
- You must re-evaluate all numbers from the FINDINGS to ensure they are accurate.
- You must use the codeExecution tool for any numerical calculations, including averages, sums, statistical analyses, and data conversions.
- Never perform calculations manually. Always use the codeExecution tool to generate and run code for the calculation.

### Data Visualization Protocol
- You must actively identify opportunities to visualize data.
- Trigger: When you encounter numerical data in the FINDINGS that illustrates a key trend, comparison, or distribution, you must generate a visualization.
- Action: Use the codeExecution tool to generate a Matplotlib graph to represent the data.
- Presentation: Before presenting the chart, introduce it with a brief explanation of what it shows and why it is relevant to the report.

# WORKFLOW
Follow this process to complete your mission.

1.  Internal Planning & Data Mapping
    - Before writing, think step-by-step to construct an internal plan. This plan is for your use only and should not be in the final output.
    - Review the REPORT_PLAN and the FINDINGS document.
    - Map every individual data point from FINDINGS to its correct section in the REPORT_PLAN.
    - During this mapping, identify all datasets that meet the criteria for visualization as defined in the Data Visualization Protocol. Plan where you will insert these charts.

2.  Generate the Final Report
    - Note the expected tone and length of the report.
    - Write the final report as a single document.
    - Build the report section by section, following the REPORT_PLAN.
    - For each finding you include, apply the Elaboration Framework to expand on it.
    - Strictly adhere to the Calculation Protocol and Data Visualization Protocol when handling any numerical data.
    - Strictly adhere to the OUTPUT FORMAT guidelines when delivering the final report.

# OUTPUT FORMAT
- Deliver the final report as a single, complete document that respects the required tone and length.
- Do not include any thoughts, commentary, or internal notes in the final output.
- Use LaTeX syntax for any mathematical expressions, for example "The lift coefficient ($C_L$) is a dimensionless coefficient."
- Format the entire document using standard Markdown.

Note:
  - Matplotlib graphs will automatically be inserted in the right place after you use the codeExecution tool.
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
        ],
      },
      tools: [{ codeExecution: {} }],
    },
    contents: [
      {
        role: userContent.role,
        parts: [
          ...(userContent.parts || []),
          {
            text: `Important Note: The required writing tone is ${selectedTone.name} (${selectedTone.describe}) with a minimum of ${minWords} words.`,
          },
        ],
      },
    ],
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

        if (part.inlineData && part.inlineData.data) {
          // currently only support images
          // check the mime type, return img tag with content base64
          const mimeType = part.inlineData.mimeType || '';
          const displayName = part.inlineData.displayName || 'Inline Data';

          if (mimeType.startsWith('image/')) {
            onStreaming?.(`![${displayName}](data:${mimeType};base64,${part.inlineData.data})`);
          }
        }

        if (part.executableCode && part.executableCode.code) {
          addLog(
            '#### The agent executed the following code to perform a calculation or generate a visualization:'
          );

          if (!part.executableCode.code.startsWith('```')) {
            addLog(`\`\`\` \n${part.executableCode.code}\n\`\`\``);
          }
        }

        if (part.codeExecutionResult && part.codeExecutionResult.output) {
          addLog('#### Result of the executed code:');

          if (!part.codeExecutionResult.output.startsWith('```')) {
            addLog(`\`\`\` \n${part.codeExecutionResult.output}\n\`\`\``);
          }
        }
      }
    }
  }
}

export default runReporterAgent;
