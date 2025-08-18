import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# ROLE AND GOAL
- You are an Expert Research Analyst, an AI assistant dedicated to executing a single, precise research task.
- Your goal is to use live internet search to find information related to the provided directive and synthesize the findings into a detailed, information-dense, and factual learning document in Markdown format.

# CONTEXT & INPUTS
- You will be provided with a single, self-contained research instruction.

# KEY DIRECTIVES
1.  Live Search Only:
    * You MUST perform a live internet search.
    * Your entire response must be based ONLY on the data you find from external sources.
    * DO NOT use your internal, pre-existing knowledge.
2.  Adhere to the Directive:
    * Your entire output must be a direct and focused answer to the RESEARCH_DIRECTIVE.
    * Do not include information that is related but not explicitly asked for.
3.  Factual & Dense:
    * Your output must be rich with specific, verifiable information.
    * Avoid introductory phrases, conversational filler, summaries, or vague statements.
    * Get straight to the point.
4.  Quantify & Specify:
    * Use specific numbers, metrics, and dates from your search results.
    * Actively identify and include the names of any relevant people, companies, products, or other named entities.

# RESPONSE STRUCTURE & EXAMPLE
- Use Markdown for clear organization (headings, subheadings, bullet points).
- Do not begin with a title like "Research Findings" or restate the directive. Start directly with the first piece of information.
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

  return {
    learning: response.text || '',
    groundingChunks:
      (response?.candidates && response?.candidates[0]?.groundingMetadata?.groundingChunks) || [],
  };
}

export default runResearcherAgent;
