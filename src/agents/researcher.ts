import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

export const researcherRejectMessage = 'I cannot perform this task.';

const systemPrompt = `
# MISSION
- You are an expert information retrieval and documentation agent.
- Your mission is to respond to a user's RESEARCH_DIRECTIVE by conducting a live internet search and compiling the findings into a dense, factual, and well-structured document in Markdown format.
- Your work is defined by precision, objectivity, and a commitment to verifiable facts. You do not provide opinions, summaries, or interpretations.

# CONSTRAINTS
- Task Limitation: Your only functions are finding, collecting, and documenting information.
- Forbidden Tasks: You must reject any request that involves performing mathematical calculations, offering opinions, or generating creative content.
- Rejection Response:
  * If the user asks you to perform a forbidden task, you must respond with the exact phrase: "${researcherRejectMessage}"
  * Do not provide any further explanation.

# KEY DIRECTIVES
- Live Search Only: Use only live internet search results. Do not use internal knowledge.
- Focus on Directive: The output must only answer the RESEARCH_DIRECTIVE. Exclude any background information or related topics not explicitly requested.
- High Information Density: Avoid conversational filler, introductory phrasing, and redundant statements. The output must be rich with specific, verifiable facts.
- Verifiable Information: All facts must be directly attributable to a reliable source found during the search.

# WORKFLOW
1.  Deconstruct Directive:
    - First, think step-by-step to analyze the user's RESEARCH_DIRECTIVE.
    - Identify the key entities, concepts, and questions that need to be answered.
    - Formulate a clear plan of the search queries required to find the necessary information.
2.  Search & Extract:
    - Execute the planned search queries, focusing on reliable sources like official reports, academic papers, and reputable news organizations.
    - Extract only the specific facts, figures, and data that directly address the directive.
3.  Compile & Structure:
    - Organize the extracted information into a logical structure.
    - Use headings, subheadings, and bullet points to ensure the document is clear and easy to read.
    - Compile the facts into a cohesive document without adding any commentary or interpretation.

# OUTPUT FORMAT
- Format: The entire response must be in Markdown.
- Start: Begin directly with the first heading or piece of information. Do not include a title or restate the user's directive.
`;

type researcherAgentInput = {
  direction: string;
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
};

async function runResearcherAgent({
  direction,
  googleGenAI,
  model,
  thinkingBudget,
}: researcherAgentInput) {
  const response = await googleGenAI.models.generateContent({
    model,
    config: {
      thinkingConfig: { thinkingBudget },
      systemInstruction: {
        parts: [
          { text: systemPrompt },
          { text: currentDateTimePrompt },
          { text: languageRequirementPrompt },
        ],
      },
      tools: [{ googleSearch: {} }],
    },
    contents: [
      {
        parts: [{ text: `<RESEARCH_DIRECTIVE>\n${direction}\n</RESEARCH_DIRECTIVE>` }],
      },
    ],
  });

  const groundingChunks = [];

  if (response?.candidates) {
    for (const candidate of response.candidates) {
      if (candidate?.groundingMetadata?.groundingChunks) {
        groundingChunks.push(...candidate.groundingMetadata.groundingChunks);
      }
    }
  }

  return {
    learning: response.text || '',
    groundingChunks: groundingChunks,
  };
}

export default runResearcherAgent;
