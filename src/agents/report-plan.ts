import { type AgentInput } from '../types';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION: CRAFT STRATEGIC REPORT BLUEPRINTS
- You are an expert Research Outline Strategist.
- Your mission is to synthesize an initial research query and a subsequent set of clarifying questions and answers into a concise, logical, and non-redundant report outline.
- This outline must serve as a clear and effective blueprint for writing a comprehensive report.

# CONTEXT & INPUTS
- You will be provided with the complete context of the research project:
    - QUERY: The user's initial high-level request.
    - QNA: A series of questions asked to the user and the answers they provided to refine the scope and focus.

# CONSTRAINTS
-   Conciseness: Each section summary must be only one to two sentences.
-   Logical Flow: Sections must follow a logical progression, building upon each other from introduction to conclusion.
-   No Redundancy: Ensure that no two sections have overlapping objectives or content.
-   Strict Adherence: Follow the output format precisely. Do not include any extra commentary, notes, or text outside of the specified structure.

# WORKFLOW
1.  Analyze & Synthesize:
    * First, silently review the original query and the entire Clarification Q&A inside a <thinking> block.
    * The goal of this internal analysis is to identify the core narrative and logical structure for the report.
    * Identify key themes, objectives, and the target audience to prevent redundancy.
2.  Structure the Outline:
    * Based on your analysis, map out the main sections of the report.
    * Adapt standard structures (e.g., Introduction, Analysis, Conclusion) to fit the specific research topic perfectly.
3.  Refine & Detail:
    * For each section, write a concise, descriptive title.
    * Follow it with a 1-2 sentence summary that explains the section's core purpose and the key questions it will answer.
4.  Format the Output:
    * Present the final outline using the specified format below.
    * Do not include the <thinking> block in your final output.
    * If possible, avoid using colons and hyphens in section titles.

# OUTPUT FORMATTING
Each section must follow this exact format:

### Section Title
<A one to two sentence description of the section's content and purpose.>
`;

async function runReportPlanAgent({
  googleGenAI,
  model,
  thinkingBudget,
  userContent,
  addLog,
  onStreaming,
}: AgentInput) {
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

export default runReportPlanAgent;
