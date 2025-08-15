// Shared type definitions for the research application

export interface QnA {
  id: string;
  q: string;
  a: string;
}

export interface ResearchTask {
  id: string;
  tier: number;
  title: string;
  direction: string;
  learning: string;
  processing?: boolean;
  groundingChunks?: unknown;
}

export interface Source {
  url: string;
  title: string;
  content: string;
  relevanceScore?: number;
}

export interface ResearchError extends Error {
  code: string;
  tier?: number;
  taskId?: string;
}
