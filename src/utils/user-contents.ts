import { createPartFromUri, createUserContent } from '@google/genai';
import type { TaskActions, TaskStore } from '../stores/task';

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
