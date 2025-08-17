import type { Content, GoogleGenAI, GroundingChunk } from '@google/genai';

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
  groundingChunks?: GroundingChunk[];
}

export interface Source {
  url: string;
}

export interface ResearchError extends Error {
  code: string;
  tier?: number;
  taskId?: string;
}

export interface AgentInput {
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  userContent: Content;
  addLog: (message: string) => void;
  onStreaming?: (data: string) => void;
}
