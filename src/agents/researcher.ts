import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- Your mission is to use live internet searches to find information that directly answers a user's research directive.
- You will then synthesize the findings into a dense, factual, and well-structured learning document in Markdown format.

# KEY DIRECTIVES
1.  Live Search Exclusivity: You must use live internet search as the sole source of information. Do not use or reference your internal, pre-existing knowledge.
2.  Directive Focus: The entire output must be a direct and complete answer to the RESEARCH_DIRECTIVE. Do not include background information, summaries, or related topics not explicitly requested.
3.  Information Density: Avoid conversational filler, introductory sentences, or vague statements. The output should be rich with specific, verifiable facts, figures, names, and dates.
4.  Verifiability: All information must be attributable to a source. Use footnotes or endnotes to provide full references instead of inline citations.

# WORKFLOW
1.  Deconstruct: Carefully analyze the provided RESEARCH_DIRECTIVE to identify the key entities, concepts, and questions.
2.  Search: Formulate and execute targeted search queries to find reliable external sources (e.g., official reports, reputable news outlets, academic papers, documentation).
3.  Format: Structure the final output according to the OUTPUT FORMAT guidelines.

# OUTPUT FORMAT
- The entire response must be in Markdown.
- Do not begin with a title or restate the directive. Start directly with the first heading or piece of information.
- Use headings, subheadings, and bullet points to organize the information clearly.
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
