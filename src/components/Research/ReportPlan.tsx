import AssignmentIcon from '@mui/icons-material/Assignment';
import CancelIcon from '@mui/icons-material/Cancel';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import StopIcon from '@mui/icons-material/Stop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import Markdown from 'react-markdown';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useTaskStore } from '../../stores/task';

function ResearchReportPlan() {
  const {
    reportPlan,
    updateReportPlan,
    isGeneratingResearchTasks,
    isGeneratingReportPlan,
    researchTasks,
    setCurrentStep,
    isCancelling,
  } = useTaskStore();
  const { startResearchTasks, cancelResearchTasks } = useDeepResearch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState('');

  const hasFailedTasks = researchTasks?.some(task => !task.learning && task?.processing === false);
  const isCompleted = researchTasks && researchTasks.length > 0 && !hasFailedTasks;
  const isLoading = isGeneratingResearchTasks;
  const hasPlan = reportPlan && reportPlan.length > 0;

  const handleStartResearchTasks = () => {
    // Update stepper to next step when starting research tasks
    setCurrentStep(3);
    startResearchTasks();
  };

  const handleEditPlan = () => {
    setEditedPlan(reportPlan);
    setIsEditing(true);
  };

  const handleSavePlan = () => {
    updateReportPlan(editedPlan);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedPlan('');
    setIsEditing(false);
  };

  const handleStopResearchTasks = () => {
    cancelResearchTasks();
  };

  return (
    <Card
      id="research-plan"
      elevation={isCompleted ? 1 : hasPlan ? 3 : 1}
      className={`mt-6 transition-all duration-300 ${
        isCompleted ? 'border-l-4 border-l-green-500 bg-green-50' : hasPlan ? '' : 'opacity-60'
      }`}
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                isCompleted
                  ? 'bg-green-500'
                  : hasPlan
                    ? isLoading
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                    : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : '3'}
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              Research Plan
            </Typography>
          </div>
          {isCompleted && (
            <Chip label="Completed" size="small" color="success" variant="outlined" />
          )}
          {hasPlan && !isCompleted && !isEditing && (
            <div className="flex items-center gap-2">
              <Button
                size="small"
                startIcon={<EditDocumentIcon className="" />}
                onClick={handleEditPlan}
                variant="outlined"
                className="text-xs"
              >
                Edit
              </Button>
              <Chip label="Ready to execute" size="small" color="primary" variant="outlined" />
            </div>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSavePlan}
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
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          A structured plan based on your research query and clarifications.
        </Typography>

        <Divider className="mb-4" />

        {!hasPlan && (
          <Box className="py-8 text-center">
            <AssignmentIcon className="mb-2 text-5xl text-gray-400" />
            <Typography className="text-gray-500">
              Waiting for clarification questions to be answered...
            </Typography>
          </Box>
        )}

        {hasPlan && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {isEditing ? (
              <TextField
                multiline
                rows={12}
                fullWidth
                value={editedPlan}
                onChange={e => setEditedPlan(e.target.value)}
                variant="outlined"
                placeholder="Edit your research plan..."
                className="font-mono text-sm"
                InputProps={{
                  style: {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  },
                }}
              />
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700">
                <Markdown>{reportPlan}</Markdown>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {hasPlan && !isEditing && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-gray-500">
              {isCompleted
                ? 'Research tasks have been generated and are being executed.'
                : 'Plan is ready. Click to start the research process.'}
            </Typography>
            <div className="flex gap-2">
              {isLoading && (
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<StopIcon />}
                  onClick={handleStopResearchTasks}
                  disabled={isCancelling}
                  className="px-4 py-2"
                  color="error"
                >
                  {isCancelling ? 'Stopping...' : 'Stop Research'}
                </Button>
              )}
              <Button
                variant="contained"
                size="medium"
                startIcon={<PlayArrowIcon />}
                loading={isLoading}
                disabled={!reportPlan || isCompleted || isGeneratingReportPlan}
                onClick={handleStartResearchTasks}
                className="px-6 py-2"
              >
                {hasFailedTasks ? 'Resume Research' : 'Start Research'}
              </Button>
            </div>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default ResearchReportPlan;
