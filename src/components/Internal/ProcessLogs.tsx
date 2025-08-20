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
  const successCount = logs.filter(log => log.type === 'success').length;

  if (!openProcessLogs) {
    // Minimized bar in bottom left corner with status indicators
    return (
      <Paper
        className="fixed bottom-4 left-4 z-50 cursor-pointer shadow-md transition-shadow hover:shadow-lg print:hidden"
        onClick={handleToggle}
        sx={{
          borderRadius: 2,
          backgroundColor: '#1976d2',
          color: 'white',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        }}
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
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                height: '20px',
              }}
            />
          )}
          {successCount > 0 && (
            <Chip
              label={`${successCount} completed`}
              size="small"
              color="success"
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                height: '20px',
              }}
            />
          )}
        </Box>
      </Paper>
    );
  }

  // Expanded chat-box size window
  return (
    <Paper
      className="fixed bottom-4 left-4 z-50 shadow-lg print:hidden"
      sx={{
        width: 500,
        height: 600,
        borderRadius: 2,
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        className="flex items-center justify-between border-b border-gray-200 px-4 py-3"
        sx={{
          backgroundColor: '#f5f5f5',
          flexShrink: 0,
        }}
      >
        <Box className="flex items-center gap-2">
          <TerminalIcon fontSize="small" color="primary" />
          <Typography variant="h6" className="font-medium">
            Process Logs ({totalLogs})
          </Typography>
          {errorCount > 0 && <Chip label={errorCount} size="small" color="error" />}
          {successCount > 0 && <Chip label={successCount} size="small" color="success" />}
        </Box>
        <IconButton size="small" onClick={handleMinimize} sx={{ color: 'gray' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content - Scrollable Area */}
      <Box
        ref={scrollRef}
        className="p-2"
        sx={{
          flex: 1,
          backgroundColor: '#fafafa',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(600px - 60px)',
        }}
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
                  sx={{
                    p: 1.5,
                    backgroundColor: colors.bg,
                    border: `${colors.borderWidth} solid ${colors.border}`,
                    borderRadius: 1,
                    fontWeight: colors.fontWeight,
                  }}
                >
                  <Box className="flex items-start gap-2">
                    <Typography component="span" sx={{ fontSize: '0.8rem' }}>
                      {icon}
                    </Typography>
                    <Box className="min-w-0 flex-1">
                      <Box className="mb-1 flex items-center justify-between">
                        <Box className="flex items-center gap-1">
                          <Chip
                            label={log.type}
                            size="small"
                            sx={{
                              backgroundColor: colors.border,
                              color: 'white',
                              fontSize: '0.6rem',
                              height: '16px',
                              fontWeight: 600,
                            }}
                          />
                          {log.level === 'high' && (
                            <Chip
                              label="HIGH"
                              size="small"
                              sx={{
                                backgroundColor: '#ff5722',
                                color: 'white',
                                fontSize: '0.5rem',
                                height: '14px',
                                fontWeight: 700,
                              }}
                            />
                          )}
                          {log.level === 'low' && (
                            <Chip
                              label="LOW"
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: colors.border,
                                color: colors.text,
                                fontSize: '0.5rem',
                                height: '14px',
                                opacity: 0.7,
                              }}
                            />
                          )}
                          {log.phase && (
                            <Chip
                              label={log.phase}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: '#9e9e9e',
                                color: '#616161',
                                fontSize: '0.5rem',
                                height: '14px',
                                opacity: 0.8,
                              }}
                            />
                          )}
                          {log.agent && (
                            <Chip
                              label={log.agent}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: colors.border,
                                color: colors.text,
                                fontSize: '0.6rem',
                                height: '16px',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.text,
                            fontSize: '0.6rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                      <Box
                        className="prose prose-xs max-h-48 overflow-y-auto text-xs"
                        sx={{
                          fontSize:
                            log.level === 'high'
                              ? '0.8rem'
                              : log.level === 'low'
                                ? '0.7rem'
                                : '0.75rem',
                          color: colors.text,
                          fontWeight: colors.fontWeight,
                          opacity: log.level === 'low' ? 0.8 : 1,
                          '& *': { color: 'inherit' },
                          '& h1, & h2, & h3': {
                            fontSize: log.level === 'high' ? '0.85rem' : '0.8rem',
                            marginTop: '0.5rem',
                            marginBottom: '0.25rem',
                            fontWeight: log.level === 'high' ? 700 : 600,
                          },
                          '& p': {
                            margin: '0.25rem 0',
                            lineHeight: 1.4,
                          },
                          '& ul, & ol': {
                            margin: '0.25rem 0',
                            paddingLeft: '1rem',
                          },
                          '& code': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            padding: '0.1rem 0.2rem',
                            borderRadius: '0.2rem',
                            fontSize: log.level === 'high' ? '0.75rem' : '0.7rem',
                          },
                          '& pre': {
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: log.level === 'high' ? '0.75rem' : '0.7rem',
                            overflow: 'auto',
                            margin: '0.25rem 0',
                          },
                        }}
                      >
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
