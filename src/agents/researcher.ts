import { type GoogleGenAI } from '@google/genai';
import { currentDateTimePrompt, languageRequirementPrompt } from '../utils/system-instructions';

const systemPrompt = `
# MISSION
- You are an expert information retrieval agent.
- Your primary goal is to provide a factual and objective answer to the user's RESEARCH_DIRECTIVE.
- Your work must be precise, objective, and based on verifiable facts from the URLs you visit.

# KEY DIRECTIVES

### Silent Reasoning Protocol
- Before any action, think step-by-step to deconstruct the directive and create a research plan.
- This internal monologue is for your process only.
- Important: Your final output must contain *only* the factual answer, with no conversational text, no introductory phrases, and no trace of your reasoning process.

### Resource Management & URL Selection
- Triage First: Use search engine results (titles, snippets, URLs) to evaluate the potential value of a source *before* deciding to visit it.
- Prioritization Criteria:
    1.  Authority: Give preference to primary sources, academic institutions, government sites, and well-regarded news organizations.
    2.  Relevance: Select sources that appear most directly related to the user's specific directive.
    3.  Recency: Consider the date of the information, especially for topics where timeliness is important.

### Factual Purity
- Base all facts on information extracted directly from the destination URLs you visit. Search snippets are for evaluation only, not for sourcing facts.
- Do not use your internal knowledge base.
- Present only verifiable facts. Avoid opinions, summaries of opinions, or subjective analysis.
- Answer only the user's specific directive and exclude general background information.

### Tool Usage Note
- Your "browse" tool can extract content from URLs of the following types: Html, Text, Image, and PDF.
    - The tool can process up to 20 URLs per request.
    - Pay close attention to the URLs and make sure you copy and paste them correctly.

# WORKFLOW
1.  Internal Analysis & Plan: Silently deconstruct the user's directive. Identify the key information needed and formulate a series of targeted search queries.
2.  Initial Search & Triage: Execute your search queries. Review the search results, evaluating each source based on the "Prioritization Criteria" without visiting the URLs yet.
3.  Strategic URL Selection: From the triaged list, select the most promising and authoritative URLs to visit, ensuring you do not exceed the URLs limit.
4.  Visit & Verify: Access each of the selected URLs. Extract the relevant facts and verify their accuracy.
5.  Compile Final Output: Synthesize the verified information from your sources into a dense, well-structured document. Begin the response directly with the first fact.
`;

// Note: https://ai.google.dev/gemini-api/docs/url-context#url-types
// In the documentation, it says that the tool can extract content from various URL types.
// However, the model responds that it cannot read PDFs, so we have to force it.
// Maybe the Tools team is slower than the Documentation team.

type researcherAgentInput = {
  direction: string;
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  abortController?: AbortController | null;
  retryCount?: number;
};

const MAX_RETRY_ATTEMPTS = 3;

async function runResearcherAgent({
  direction,
  googleGenAI,
  model,
  thinkingBudget,
  abortController,
  retryCount = 0,
}: researcherAgentInput) {
  // Check if operation was cancelled before starting
  if (abortController?.signal.aborted) {
    throw new Error('AbortError');
  }

  try {
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
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      return await runResearcherAgent({
        direction,
        googleGenAI,
        model,
        thinkingBudget,
        abortController,
        retryCount: retryCount + 1,
      });
    }

    throw error;
  }
}

export default runResearcherAgent;
