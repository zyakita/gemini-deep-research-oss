import type { LogFunction, LogLevel, LogType } from '../types';

/**
 * Enhanced logging utility functions for better consistency and UX
 */
export const createLogHelper = (addLogFn: LogFunction) => {
  return {
    // Basic log types
    info: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'info', 'medium', { agent, phase }),

    success: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'success', 'medium', { agent, phase }),

    error: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'error', 'high', { agent, phase }),

    warning: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'warning', 'medium', { agent, phase }),

    process: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'process', 'medium', { agent, phase }),

    research: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'research', 'medium', { agent, phase }),

    agent: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'agent', 'low', { agent, phase }),

    system: (message: string, agent?: string, phase?: string) =>
      addLogFn(message, 'system', 'medium', { agent, phase }),

    // Phase-specific helpers
    startPhase: (phase: string) => addLogFn(`🚀 Starting ${phase}`, 'system', 'high', { phase }),

    endPhase: (phase: string, count?: number) => {
      const countText = count ? ` (${count} items)` : '';
      addLogFn(`✨ Completed ${phase}${countText}`, 'system', 'high', { phase, count });
    },

    // Research-specific helpers
    startResearch: (title: string) =>
      addLogFn(`🔍 Starting: ${title}`, 'research', 'medium', { phase: 'research' }),

    completeResearch: (title: string) =>
      addLogFn(`✅ Completed: ${title}`, 'success', 'medium', { phase: 'research' }),

    // Agent thought logging
    thought: (message: string, agent: string) =>
      addLogFn(message, 'agent', 'low', { agent, phase: 'thinking' }),

    // Legacy compatibility - converts old-style logs to new format
    legacy: (message: string) => {
      // Try to infer type from message content
      if (message.startsWith('!!!')) {
        return addLogFn(message.replace('!!! ', ''), 'error', 'high');
      } else if (
        message.startsWith('✓') ||
        message.includes('completed') ||
        message.includes('successfully')
      ) {
        return addLogFn(message, 'success', 'medium');
      } else if (message.startsWith('➜') || message.includes('Starting')) {
        return addLogFn(message.replace('➜ ', ''), 'process', 'medium');
      } else if (message.startsWith('===')) {
        return addLogFn(message.replace(/=== | ===/g, ''), 'system', 'medium');
      } else if (message.startsWith('⌕')) {
        return addLogFn(message.replace('⌕ ', ''), 'research', 'medium');
      } else {
        return addLogFn(message, 'info', 'medium');
      }
    },
  };
};

/**
 * Parse old-style log messages and extract useful information
 */
export const parseOldLogMessage = (
  message: string
): {
  type: LogType;
  level: LogLevel;
  cleanMessage: string;
  agent?: string;
  phase?: string;
} => {
  // Remove common prefixes and determine type
  let cleanMessage = message;
  let type: LogType = 'info';
  let level: LogLevel = 'medium';
  let agent: string | undefined;
  let phase: string | undefined;

  // Error messages
  if (message.startsWith('!!!')) {
    type = 'error';
    level = 'high';
    cleanMessage = message.replace('!!! ', '');
  }
  // Success messages
  else if (
    message.startsWith('✓') ||
    message.includes('completed successfully') ||
    message.includes('✓')
  ) {
    type = 'success';
    cleanMessage = message.replace(/^✓\s*/, '');
  }
  // Process start messages
  else if (message.startsWith('➜')) {
    type = 'process';
    cleanMessage = message.replace('➜ ', '');
  }
  // System messages
  else if (message.startsWith('===') && message.endsWith('===')) {
    type = 'system';
    cleanMessage = message.replace(/^=== |===$/g, '');
  }
  // Research messages
  else if (message.startsWith('⌕')) {
    type = 'research';
    cleanMessage = message.replace('⌕ ', '');
  }

  // Extract agent information from message
  if (cleanMessage.includes('agent')) {
    const agentMatch = cleanMessage.match(/(\w+)-agent/);
    if (agentMatch) {
      agent = agentMatch[1];
    }
  }

  // Extract phase information
  if (cleanMessage.toLowerCase().includes('generation')) {
    phase = 'generation';
  } else if (cleanMessage.toLowerCase().includes('research')) {
    phase = 'research';
  } else if (
    cleanMessage.toLowerCase().includes('upload') ||
    cleanMessage.toLowerCase().includes('file')
  ) {
    phase = 'file-management';
  }

  return {
    type,
    level,
    cleanMessage,
    agent,
    phase,
  };
};
