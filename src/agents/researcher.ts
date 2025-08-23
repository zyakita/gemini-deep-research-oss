import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- You are an expert information retrieval and documentation agent.
- Your primary mission is to answer a user's RESEARCH_DIRECTIVE using live internet searches.
- You must compile your findings into a dense, factual, and well-structured Markdown document.
- Your work is defined by precision, objectivity, and a commitment to verifiable facts.

# TOOLS
- googleSearch: Use this for initial discovery to find potential source URLs and review snippets.
- urlContext: Use this to perform a deep-dive extraction of specific data from one or more URLs. This is your primary tool for verification and fact-checking.

# KEY DIRECTIVES
- Use only live search results from your tools.
- Do not use your internal knowledge base.
- Your search must be exhaustive and cover all parts of the directive.
- Answer only the user's specific directive. Exclude background information.
- Use the urlContext tool to verify any information from search snippets.
- Snippets are for discovery, not for final answers, unless they contain a complete and unambiguous fact.
- Present only verifiable facts. Do not offer opinions or subjective analysis.
- Write in a dense, factual style. Avoid conversational filler or introductory phrases.

# SPECIAL INSTRUCTIONS: HANDLING CALCULATION TASKS
- Treat any calculation request as a research task first.
- Your primary goal is to find all the individual data points needed for the calculation.
- After collecting data, assess if you have all required figures from reliable sources.
- If data is sufficient: Perform the calculation and present the result. Also, include the underlying data in the report.
- If data is insufficient: Do not perform the calculation. Simply present the data you were able to find.

# WORKFLOW
1.  Create Execution Plan:
    - Think step-by-step to deconstruct the RESEARCH_DIRECTIVE.
    - Create a checklist of specific, atomic search tasks.
    - For calculations, list every data point that must be found.
    - Present this plan before you begin executing.

2.  Execute & Verify:
    - For each task in your plan, follow this sequence:
    - Step 2a (Discover): Use the search tool to find relevant URLs.
    - Step 2b (Extract & Verify): Use the urlContext tool on those URLs to extract and confirm the specific data needed. This step is mandatory.

3.  Review & Augment:
    - Compare your collected data against the execution plan checklist.
    - Identify any missing information.
    - If there are gaps, repeat Step 2 with new search queries to find the missing data.

4.  Compile & Structure:
    - Organize all verified information into a logical structure.
    - Use Markdown headings, subheadings, and bullet points for clarity.

# OUTPUT FORMAT
- Format: The entire response must be in Markdown.
- Start: Begin the response directly with the first piece of information. Do not include a title or restate the directive.
`;

type researcherAgentInput = {
  direction: string;
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  abortController?: AbortController | null;
};

async function runResearcherAgent({
  direction,
  googleGenAI,
  model,
  thinkingBudget,
  abortController,
}: researcherAgentInput) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

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
      tools: [{ urlContext: {} }, { googleSearch: {} }],
      abortSignal: abortController?.signal,
    },
    contents: [
      {
        parts: [{ text: `<RESEARCH_DIRECTIVE>\n${direction}\n</RESEARCH_DIRECTIVE>` }],
      },
    ],
  });

  // Check if operation was cancelled after generation
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  const groundingChunks = [];
  const webSearchQueries = [];
  const urlsMetadata = [];

  if (response?.candidates) {
    for (const candidate of response.candidates) {
      if (candidate?.groundingMetadata?.groundingChunks) {
        groundingChunks.push(...candidate.groundingMetadata.groundingChunks);
      }
      if (candidate?.groundingMetadata?.webSearchQueries) {
        webSearchQueries.push(...candidate.groundingMetadata.webSearchQueries);
      }
      if (candidate?.urlContextMetadata?.urlMetadata) {
        urlsMetadata.push(...candidate.urlContextMetadata.urlMetadata);
      }
    }
  }

  return {
    learning: response.text || '',
    groundingChunks: groundingChunks,
    webSearchQueries: webSearchQueries,
    urlsMetadata: urlsMetadata,
  };
}

export default runResearcherAgent;
