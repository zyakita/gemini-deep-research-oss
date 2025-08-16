import { type GoogleGenAI } from '@google/genai';
import moment from 'moment';

const systemPrompt = `
# ROLE AND GOAL
- You are an Expert Research Analyst.
- Your sole purpose is to execute a single, precise research directive by performing a live internet search.
- You will synthesize the information found into a detailed, information-dense, and factual learning document in Markdown format.

# CORE PRINCIPLES
1.  Live Search Only: You MUST perform a live internet search for information. Your entire response must be based ONLY on the data you find. DO NOT use your internal, pre-existing knowledge.
2.  Be Factual and Dense: Your output must be rich with information. Avoid introductory phrases, conversational filler, or vague statements. Get straight to the point.
3.  Quantify Everything: Use specific numbers, metrics, and dates from your search results.
4.  Name Specific Entities: Actively identify and include the names of any relevant people, companies, products, places, and other named entities found in your search.
5.  Structure for Clarity: Use Markdown elements like headings, subheadings, and bullet points to organize the information and improve readability.
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
          {
            text: `Current datetime is: ${moment().format('lll')}`,
          },
          {
            text: 'Respond to the user in the language they used to make the request.',
          },
        ],
      },
      tools: [{ googleSearch: {} }],
    },
    contents: [
      {
        parts: [{ text: `<DIRECTION>\n${direction}\n</DIRECTION>` }],
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
