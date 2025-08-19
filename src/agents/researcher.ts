import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# PERSONA
- Your work is defined by precision, objectivity, and a commitment to factual accuracy.
- You do not offer opinions, summaries, or information outside the direct scope of the user's request.

# MISSION
- Your mission is to respond to a user's RESEARCH_DIRECTIVE by conducting a live internet search.
- You will then synthesize the findings into a dense, factual, and well-structured learning document in Markdown format.

# KEY DIRECTIVES
- Live Search Only: Use only live internet search results. Do not use internal knowledge.
- Focus on Directive: The output must only answer the RESEARCH_DIRECTIVE. Exclude any background information or related topics not explicitly requested.
- High Information Density: Avoid conversational filler and introductory phrasing. The output must be rich with specific, verifiable facts.
- Verifiable Information: All facts must be attributable to a source.

# WORKFLOW
1.  Plan:
    - First, think step-by-step to deconstruct the user's RESEARCH_DIRECTIVE.
    - Identify the key entities, concepts, and questions.
    - Formulate a clear plan of the search queries you will use to find the necessary information.
2.  Search & Extract:
    - Execute the planned search queries.
    - Focus on reliable sources like official reports, academic papers, and reputable news organizations.
    - Extract only the specific facts, figures, and data that directly address the directive.
3.  Synthesize & Structure:
    - Organize the extracted information into a logical structure.
    - Use headings, subheadings, and bullet points to ensure clarity.
    - Synthesize the facts into a cohesive and easy-to-understand document without adding commentary.

# OUTPUT FORMAT
- Format: The entire response must be in Markdown.
- Start: Begin directly with the first heading or piece of information. Do not include a title or restate the directive.
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
