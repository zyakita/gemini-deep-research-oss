import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGlobalStore } from '../../stores/global';
import { useTaskStore } from '../../stores/task';
import type { LogType } from '../../types';

// Color scheme for different log types and levels
const getLogColors = (type: LogType, level: string) => {
  const baseColors = {
    info: { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' },
    success: { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
    error: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
    warning: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    process: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
    research: { bg: '#e1f5fe', border: '#03a9f4', text: '#0277bd' },
    agent: { bg: '#f9f9f9', border: '#757575', text: '#424242' },
    system: { bg: '#e8eaf6', border: '#3f51b5', text: '#303f9f' },
  };

  const colors = baseColors[type] || baseColors.info;

  // Adjust colors based on level
  if (level === 'high') {
    // High priority - stronger colors, bold border
    return {
      ...colors,
      bg: colors.bg,
      border: colors.border,
      text: colors.text,
      borderWidth: '2px',
      fontWeight: 600,
    };
  } else if (level === 'low') {
    // Low priority - muted colors, lighter appearance
    return {
      bg: colors.bg.replace(/\d+/g, match => Math.min(parseInt(match) + 50, 255).toString()),
      border: colors.border + '80', // Add transparency
      text: colors.text + '80', // Add transparency
      borderWidth: '1px',
      fontWeight: 400,
    };
  } else {
    // Medium priority - default colors
    return {
      ...colors,
      borderWidth: '1px',
      fontWeight: 500,
    };
  }
};

const getLogIcon = (type: LogType) => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    process: '⚙️',
    research: '🔍',
    agent: '🕵🏻',
    system: '⚡',
  };

  return icons[type] || icons.info;
};

function ProcessLogs() {
  const { logs } = useTaskStore();
  const { openProcessLogs, setOpenProcessLogs } = useGlobalStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setOpenProcessLogs(!openProcessLogs);
  };

  const handleMinimize = () => {
    setOpenProcessLogs(false);
  };

  // Scroll to bottom when component opens
  useEffect(() => {
    if (openProcessLogs && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [openProcessLogs, logs.length]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get summary counts
  const totalLogs = logs.length;
  const errorCount = logs.filter(log => log.type === 'error').length;

  if (!openProcessLogs) {
    // Minimized bar in bottom left corner with status indicators
    return (
      <Paper
        className="fixed bottom-4 left-4 z-50 cursor-pointer rounded-lg bg-blue-700 text-white shadow-md transition-shadow hover:bg-blue-800 hover:shadow-lg print:hidden"
        onClick={handleToggle}
      >
        <Box className="flex items-center gap-2 px-3 py-2">
          <TerminalIcon fontSize="small" />
          <Typography variant="body2" className="font-medium">
            Process Logs ({totalLogs})
          </Typography>
          {errorCount > 0 && (
            <Chip
              label={`${errorCount} errors`}
              size="small"
              color="error"
              variant="outlined"
              className="h-5 border-white/50 text-xs text-white"
            />
          )}
        </Box>
      </Paper>
    );
  }

  // Expanded chat-box size window
  return (
    <Paper className="fixed bottom-4 left-4 z-50 flex h-[600px] w-[500px] flex-col rounded-lg border border-gray-300 bg-white shadow-lg print:hidden">
      {/* Header */}
      <Box className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <Box className="flex items-center gap-2">
          <TerminalIcon fontSize="small" color="primary" />
          <Typography variant="h6" className="font-medium">
            Process Logs ({totalLogs})
          </Typography>
          {errorCount > 0 && <Chip label={errorCount} size="small" color="error" />}
        </Box>
        <IconButton size="small" onClick={handleMinimize} className="text-gray-500">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content - Scrollable Area */}
      <Box
        ref={scrollRef}
        className="max-h-[540px] flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-2"
        onWheel={e => {
          e.stopPropagation();
        }}
      >
        {logs.length === 0 ? (
          <Box className="p-4 text-center">
            <Typography variant="body2" className="font-mono text-gray-600">
              Process logs will appear here...
            </Typography>
            <Typography variant="body2" className="font-mono text-xs text-gray-400">
              Waiting for log entries...
            </Typography>
          </Box>
        ) : (
          <Box className="space-y-2">
            {logs.map(log => {
              const colors = getLogColors(log.type, log.level);
              const icon = getLogIcon(log.type);

              return (
                <Paper
                  key={log.id}
                  elevation={0}
                  className="rounded p-6"
                  style={{
                    backgroundColor: colors.bg,
                    border: `${colors.borderWidth} solid ${colors.border}`,
                    fontWeight: colors.fontWeight,
                  }}
                >
                  <Box className="flex items-start gap-2">
                    <Typography component="span" className="text-xs">
                      {icon}
                    </Typography>
                    <Box className="min-w-0 flex-1">
                      <Box className="mb-1 flex items-center justify-between">
                        <Box className="flex items-center gap-1">
                          <Chip
                            label={log.type}
                            size="small"
                            className="h-4 text-xs font-semibold text-white"
                            style={{
                              backgroundColor: colors.border,
                            }}
                          />
                          {log.level === 'high' && (
                            <Chip
                              label="HIGH"
                              size="small"
                              className="h-3.5 bg-red-600 text-xs font-bold text-white"
                            />
                          )}
                          {log.level === 'low' && (
                            <Chip
                              label="LOW"
                              size="small"
                              variant="outlined"
                              className="h-3.5 text-xs opacity-70"
                              style={{
                                borderColor: colors.border,
                                color: colors.text,
                              }}
                            />
                          )}
                          {log.phase && (
                            <Chip
                              label={log.phase}
                              size="small"
                              variant="outlined"
                              className="h-3.5 border-gray-400 text-xs text-gray-600 opacity-80"
                            />
                          )}
                          {log.agent && (
                            <Chip
                              label={log.agent}
                              size="small"
                              variant="outlined"
                              className="h-4 text-xs"
                              style={{
                                borderColor: colors.border,
                                color: colors.text,
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          className="font-mono text-xs"
                          style={{
                            color: colors.text,
                          }}
                        >
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                      <Box className="prose prose-xs mt-2 max-h-48 overflow-y-auto text-xs">
                        <Markdown remarkPlugins={[remarkGfm]}>{log.message}</Markdown>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default ProcessLogs;
