import { createPartFromUri, createUserContent } from '@google/genai';
import type { TaskActions, TaskStore } from '../stores/task';
import type { ResearchTask } from '../types';

export function buildUserContent({
  task,
  includeQuery,
  includeQnA,
  includePlan,
  includeFindings,
  includeFiles,
  limitCount,
  limitFor,
}: {
  task: TaskStore & TaskActions;
  includeQuery: boolean;
  includeQnA: boolean;
  includePlan: boolean;
  includeFindings: boolean;
  includeFiles?: boolean;
  limitCount?: number;
  limitFor?: string;
}) {
  const userContent = [];

  // Include user query
  if (includeQuery) {
    userContent.push(`<QUERY>\n${task.query}\n</QUERY>`);
    if (includeFiles && task.files.length > 0) {
      task.files.map(file => {
        if (file.uri && file.mimeType) {
          userContent.push(createPartFromUri(file.uri, file.mimeType));
        }
      });
    }
  }

  // Include QnA
  if (includeQnA) {
    userContent.push(
      `<QNA>\n${task.qna.map(item => `<Q>${item.q}</Q>\n<A>${item.a}</A>\n`).join('')}\n</QNA>`
    );
  }

  // Include plan
  if (includePlan) {
    userContent.push(`<REPORT_PLAN>\n${task.reportPlan}\n</REPORT_PLAN>`);
  }

  // Include findings
  if (includeFindings) {
    const findings = task.getAllFinishedResearchTasks();
    if (findings.length > 0) {
      userContent.push(
        `<FINDINGS>\n${findings.map(item => `<TITLE>${item.title}</TITLE>\n<DIRECTION>${item.direction}</DIRECTION>\n<LEARNING>${item.learning}</LEARNING>\n`).join('')}\n</FINDINGS>`
      );
    }
  }

  // Include limit note
  if (limitCount && limitFor) {
    userContent.push(`Important Note: Generate a maximum of ${limitCount} ${limitFor}.`);
  }

  return createUserContent(userContent);
}

export const researchScopeDetails = {
  WEB: {
    emoji: '🌐',
    description:
      'Your search scope is the entire public internet. Focus on news sites, official reports, blogs, and general web content to complete this task.',
  },
  ACADEMIC: {
    emoji: '🎓',
    description:
      'Your search scope is restricted to academic and scholarly sources. Use databases like Google Scholar, JSTOR, arXiv, and PubMed to find research papers, journals, and theses.',
  },
  SOCIAL: {
    emoji: '💬',
    description:
      'Your search scope is limited to social media and public forums. Focus on platforms like Twitter, Reddit, and industry forums to find discussions, opinions, and public sentiment.',
  },
  FILE_UPLOAD: {
    emoji: '📁',
    description:
      'Your scope is strictly limited to the content of the file(s) provided with this task. Do not perform any external web searches or access any outside information.',
  },
};

export function buildUserContentForResearcher({
  researchTask,
  taskStore,
}: {
  researchTask: ResearchTask;
  taskStore: TaskStore & TaskActions;
}) {
  const userContent = [];

  if (researchTask.target === 'FILE_UPLOAD' && taskStore.files.length > 0) {
    taskStore.files.map(file => {
      if (file.uri && file.mimeType) {
        userContent.push(createPartFromUri(file.uri, file.mimeType));
      }
    });
  }

  // Include research task details
  userContent.push(
    `<RESEARCH_DIRECTIVE>\n${researchTask.title}\n${researchTask.direction}\n\n${researchScopeDetails[researchTask.target].description}</RESEARCH_DIRECTIVE>`
  );

  return createUserContent(userContent);
}
