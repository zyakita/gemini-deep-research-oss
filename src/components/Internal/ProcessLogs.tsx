import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGlobalStore } from '../../stores/global';
import { useTaskStore } from '../../stores/task';

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

  if (!openProcessLogs) {
    // Minimized bar in bottom left corner
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
            Process Logs
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Expanded chat-box size window
  return (
    <Paper
      className="fixed bottom-4 left-4 z-50 shadow-lg print:hidden"
      sx={{
        width: 400,
        height: 500,
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
            Process Logs
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleMinimize} sx={{ color: 'gray' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content - Scrollable Area */}
      <Box
        ref={scrollRef}
        className="p-4"
        sx={{
          flex: 1,
          backgroundColor: '#fafafa',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(500px - 60px)', // Ensure it never exceeds container height
        }}
        onWheel={e => {
          // Prevent scroll events from bubbling to parent elements
          e.stopPropagation();
        }}
      >
        {/* Placeholder content - you'll replace this with actual log content */}
        <Box className="space-y-2">
          {logs.length === 0 ? (
            <>
              <Typography variant="body2" className="font-mono text-gray-600">
                Process logs will appear here...
              </Typography>
              <Typography variant="body2" className="font-mono text-xs text-gray-400">
                Waiting for log entries...
              </Typography>
            </>
          ) : (
            <>
              {logs.map((log, index) => {
                // auto convert h1, h2, h3 to h4 to make it smaller
                const modifiedLog = log.replace(/^(#{1,3})\s+/gm, '#### ');
                return (
                  <div key={index} className="prose prose-xs font-mono text-xs text-gray-600">
                    <Markdown remarkPlugins={[remarkGfm]}>{modifiedLog}</Markdown>
                  </div>
                );
              })}
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default ProcessLogs;
