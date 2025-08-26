// Import all prompt files as raw strings using Vite's ?raw suffix
import qnaPrompt from '../prompts/qna.md?raw';
import reportPlanPrompt from '../prompts/report-plan.md?raw';
import reporterPrompt from '../prompts/reporter.md?raw';
import researchDeepPrompt from '../prompts/research-deep.md?raw';
import researchLeadPrompt from '../prompts/research-lead.md?raw';
import researcherPrompt from '../prompts/researcher.md?raw';

const prompts: Record<string, string> = {
  qna: qnaPrompt,
  'report-plan': reportPlanPrompt,
  reporter: reporterPrompt,
  'research-deep': researchDeepPrompt,
  'research-lead': researchLeadPrompt,
  researcher: researcherPrompt,
};

/**
 * Gets a markdown prompt content as a string
 * @param promptName The name of the prompt file (without .md extension)
 * @returns The content of the markdown file as a string
 */
export function loadPrompt(promptName: string): string {
  const prompt = prompts[promptName];
  if (!prompt) {
    throw new Error(
      `Prompt '${promptName}' not found. Available prompts: ${Object.keys(prompts).join(', ')}`
    );
  }
  return prompt;
}
