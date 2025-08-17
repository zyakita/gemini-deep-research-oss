import AssignmentIcon from '@mui/icons-material/Assignment';
import CancelIcon from '@mui/icons-material/Cancel';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
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
  const { reportPlan, updateReportPlan, isGeneratingResearchTasks, researchTasks, setCurrentStep } =
    useTaskStore();
  const { startResearchTasks } = useDeepResearch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState('');

  const isCompleted = researchTasks && researchTasks.length > 0;
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
            <AssignmentIcon className="mb-2 text-gray-400" sx={{ fontSize: 48 }} />
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
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-3 text-xl font-bold text-gray-800">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-2 text-lg font-semibold text-gray-800">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 text-base font-medium text-gray-800">{children}</h3>
                    ),
                    p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 space-y-1 pl-6">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 space-y-1 pl-6">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                  }}
                >
                  {reportPlan}
                </Markdown>
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
            <Button
              variant="contained"
              size="medium"
              startIcon={<PlayArrowIcon />}
              loading={isGeneratingResearchTasks}
              // disabled={!reportPlan || isCompleted}
              onClick={handleStartResearchTasks}
              className="px-6 py-2"
            >
              {isLoading ? 'Creating Tasks...' : 'Start Research'}
            </Button>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default ResearchReportPlan;
