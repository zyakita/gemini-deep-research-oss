import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useTaskStore } from '../../stores/task';

function ResearchReport() {
  const { finalReport, isGeneratingFinalReport } = useTaskStore();
  const { startResearchTasks } = useDeepResearch();

  const isCompleted = finalReport && finalReport.length > 0 && !isGeneratingFinalReport;
  const isLoading = isGeneratingFinalReport;

  const handleDownload = () => {
    if (!finalReport) return;

    const blob = new Blob([finalReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!finalReport) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Research Report',
          text: finalReport,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(finalReport);
      // You might want to show a toast notification here
    }
  };

  return (
    <Card
      id="research-report"
      elevation={isCompleted ? 3 : 1}
      className={`mt-6 transition-all duration-300 ${
        isCompleted ? 'border-l-4 border-l-green-500 bg-green-50' : 'opacity-60'
      }`}
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                isCompleted ? 'bg-green-500' : isLoading ? 'bg-blue-500' : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : '5'}
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              Final Report
            </Typography>
          </div>
          {isCompleted && (
            <Chip label="Completed" size="small" color="success" variant="outlined" />
          )}
          {isLoading && (
            <Chip label="Generating..." size="small" color="primary" variant="outlined" />
          )}
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          Comprehensive research report based on all collected information
        </Typography>

        <Divider className="mb-4" />

        {!finalReport && !isLoading && (
          <Box className="py-8 text-center">
            <DescriptionIcon className="mb-2 text-gray-400" sx={{ fontSize: 48 }} />
            <Typography className="text-gray-500">
              Waiting for final report to be generated...
            </Typography>
          </Box>
        )}

        {isLoading && (
          <Box className="py-8 text-center">
            <div className="animate-pulse">
              <DescriptionIcon className="mb-2 text-blue-500" sx={{ fontSize: 48 }} />
              <Typography className="font-medium text-blue-600">
                Generating comprehensive report...
              </Typography>
              <Typography className="mt-1 text-sm text-gray-500">
                This may take a few moments
              </Typography>
            </div>
          </Box>
        )}

        {finalReport && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="max-h-96 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-gray-700">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold text-gray-800">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-6 mb-3 text-xl font-semibold text-gray-800">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-4 mb-2 text-lg font-medium text-gray-800">{children}</h3>
                    ),
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 space-y-2 pl-6">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 space-y-2 pl-6">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-blue-200 bg-blue-50 py-2 pl-4 text-gray-600 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {finalReport}
                </Markdown>
              </div>
            </div>

            {isLoading && (
              <div className="rounded-b-lg border-t border-gray-200 bg-blue-50 px-6 py-3">
                <Typography variant="caption" className="flex items-center text-blue-600">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
                  Report is still being generated...
                </Typography>
              </div>
            )}

            {isCompleted && finalReport.length > 1000 && (
              <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-3">
                <Typography variant="caption" className="text-gray-500">
                  {Math.ceil(finalReport.length / 4)} words •{' '}
                  {Math.ceil(finalReport.split('\n').length / 10)} minute read
                </Typography>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {isCompleted && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-gray-500">
              Research completed successfully!
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                className="px-4 py-2"
              >
                Download
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                className="px-4 py-2"
              >
                Share
              </Button>
            </div>
          </div>
        </CardActions>
      )}

      {finalReport && isLoading && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-blue-600">
              Report is being generated... Please wait for completion.
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                className="px-4 py-2"
                disabled
              >
                Download
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                className="px-4 py-2"
                disabled
              >
                Share
              </Button>
            </div>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default ResearchReport;
