import type { Content, GoogleGenAI, GroundingChunk, UrlMetadata } from '@google/genai';

export type LogType =
  | 'info'
  | 'success'
  | 'error'
  | 'warning'
  | 'process'
  | 'research'
  | 'agent'
  | 'system';
export type LogLevel = 'low' | 'medium' | 'high';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  level: LogLevel;
  message: string;
  agent?: string;
  phase?: string;
  metadata?: LogMetadata;
}

export interface LogMetadata {
  agent?: string;
  phase?: string;
  taskId?: string;
  tier?: number;
  count?: number;
  duration?: number;
  [key: string]: unknown;
}

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
  webSearchQueries?: string[];
  urlsMetadata?: UrlMetadata[];
}

export interface Source {
  url: string;
}

export interface ResearchError extends Error {
  code: string;
  tier?: number;
  taskId?: string;
}

export interface LogFunction {
  (message: string, type?: LogType, level?: LogLevel, metadata?: LogMetadata): void;
}

export interface AgentInput {
  googleGenAI: GoogleGenAI;
  model: string;
  thinkingBudget: number;
  userContent: Content;
  addLog: (message: string, agent?: string) => void;
  onStreaming?: (data: string) => void;
}
