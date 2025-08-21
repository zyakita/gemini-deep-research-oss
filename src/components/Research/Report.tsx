import ArticleIcon from '@mui/icons-material/Article';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import StopIcon from '@mui/icons-material/Stop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useTaskStore } from '../../stores/task';
import { countWords, formatWordCountResults } from '../../utils/word-count';
import ReportRender from './ReportRender';

function ResearchReport() {
  const { generateFinalReport, cancelFinalReport } = useDeepResearch();
  const {
    id: taskID,
    finalReport,
    isGeneratingFinalReport,
    updateFinalReport,
    isCancelling,
  } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const isCompleted = finalReport && finalReport.length > 0 && !isGeneratingFinalReport;
  const isLoading = isGeneratingFinalReport;

  const handleDownloadMD = () => {
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
    setDownloadMenuAnchor(null);
  };

  const handleDownloadPDF = () => {
    if (!finalReport) return;

    // Create a new window with just the report content for printing
    const printWindow = window.open(`/report/${taskID}`, '_blank');
    if (printWindow) {
      // Wait a bit for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
    setDownloadMenuAnchor(null);
  };

  const handleOpenReportInNewWindow = () => {
    window.open(`/report/${taskID}`, '_blank');

    setDownloadMenuAnchor(null);
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleEdit = () => {
    setEditedReport(finalReport);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateFinalReport(editedReport);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedReport('');
    setIsEditing(false);
  };

  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true);
  };

  const handleRegenerateConfirm = () => {
    setShowRegenerateDialog(false);
    generateFinalReport();
  };

  const handleRegenerateCancel = () => {
    setShowRegenerateDialog(false);
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

          {isCompleted && !isEditing && (
            <div className="flex items-center gap-2">
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                variant="outlined"
                className="ml-2 text-xs"
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRegenerateClick}
                variant="outlined"
                className="text-xs"
                color="warning"
              >
                Re-generate
              </Button>
              <Chip label="Completed" size="small" color="success" variant="outlined" />
            </div>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                variant="contained"
                color="primary"
              >
                Save
              </Button>
              <Button
                size="small"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
                variant="outlined"
                color="secondary"
              >
                Cancel
              </Button>
            </div>
          )}
          {isLoading && (
            <Chip label="Generating..." size="small" color="primary" variant="outlined" />
          )}
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          A comprehensive research report based on all the collected information.
        </Typography>

        <Divider className="mb-4" />

        {!finalReport && !isLoading && (
          <Box className="py-8 text-center">
            <DescriptionIcon className="mb-2 text-5xl text-gray-400" />
            <Typography className="text-gray-500">
              Waiting for final report to be generated...
            </Typography>
          </Box>
        )}

        {isLoading && !finalReport && (
          <>
            <Box className="py-8 text-center">
              <div className="animate-pulse">
                <DescriptionIcon className="mb-2 text-5xl text-blue-500" />
                <Typography className="font-medium text-blue-600">
                  Generating comprehensive report...
                </Typography>
                <Typography className="mt-1 text-sm text-gray-500">
                  This may take a few moments
                </Typography>
              </div>
            </Box>
          </>
        )}

        {isLoading && finalReport && (
          <Box className="py-8 text-center">
            <div className="animate-pulse">
              <DescriptionIcon className="mb-2 text-5xl text-blue-500" />
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
            {isEditing ? (
              <div className="p-6">
                <TextField
                  multiline
                  rows={20}
                  fullWidth
                  value={editedReport}
                  onChange={e => setEditedReport(e.target.value)}
                  variant="outlined"
                  placeholder="Edit your research report..."
                  className="font-mono text-sm"
                  InputProps={{
                    style: {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    },
                  }}
                />
              </div>
            ) : (
              <div className="relative max-h-96 overflow-y-auto p-6">
                <ReportRender finalReport={finalReport} />
              </div>
            )}

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
                  {formatWordCountResults(countWords(finalReport))}
                </Typography>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {isLoading && !finalReport && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-blue-600">
              Report is being generated... Please wait for completion.
            </Typography>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<StopIcon />}
              onClick={() => cancelFinalReport()}
              disabled={isCancelling}
              className="px-4 py-2"
              color="error"
            >
              {isCancelling ? 'Stopping...' : 'Stop Report'}
            </Button>
          </div>
        </CardActions>
      )}

      {isCompleted && !isEditing && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-gray-500">
              Research completed successfully!
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenReportInNewWindow}
                className="px-4 py-2"
              >
                Open in New Window
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadClick}
                className="px-4 py-2"
              >
                Download
              </Button>
              <Menu
                anchorEl={downloadMenuAnchor}
                open={Boolean(downloadMenuAnchor)}
                onClose={handleDownloadMenuClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
              >
                <MenuItem onClick={handleDownloadMD}>
                  <ArticleIcon className="mr-2" fontSize="small" />
                  Download as MD
                </MenuItem>
                <MenuItem onClick={handleDownloadPDF}>
                  <PictureAsPdfIcon className="mr-2" fontSize="small" />
                  Download as PDF
                </MenuItem>
                {/* <MenuItem onClick={handleOpenReportInNewWindow}>
                  <OpenInNewIcon className="mr-2" fontSize="small" />
                  Open in New Window
                </MenuItem> */}
              </Menu>
            </div>
          </div>
        </CardActions>
      )}

      {finalReport && isLoading && !isEditing && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-blue-600">
              Report is being generated... Please wait for completion.
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<StopIcon />}
                onClick={() => cancelFinalReport()}
                disabled={isCancelling}
                className="px-4 py-2"
                color="error"
              >
                {isCancelling ? 'Stopping...' : 'Stop Report'}
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadClick}
                className="px-4 py-2"
                disabled
              >
                Download
              </Button>
            </div>
          </div>
        </CardActions>
      )}

      {/* Regenerate Confirmation Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onClose={handleRegenerateCancel}
        aria-labelledby="regenerate-dialog-title"
        aria-describedby="regenerate-dialog-description"
      >
        <DialogTitle id="regenerate-dialog-title">Re-generate Report?</DialogTitle>
        <DialogContent>
          <DialogContentText id="regenerate-dialog-description">
            This will replace the current report with a newly generated one. Are you sure you want
            to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRegenerateCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleRegenerateConfirm} color="warning">
            Re-generate
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default ResearchReport;
