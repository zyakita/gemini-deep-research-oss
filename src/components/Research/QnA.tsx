import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useTaskStore } from '../../stores/task';

function ResearchQnA() {
  const { qna, updateQnA, reportPlan, isGeneratingReportPlan, setCurrentStep } = useTaskStore();
  const { generateReportPlan } = useDeepResearch();

  const isCompleted = reportPlan.length > 0 && !isGeneratingReportPlan;
  const isLoading = isGeneratingReportPlan;
  const hasQuestions = qna.length > 0;
  const allAnswered = qna.every(item => item.a.trim().length > 0);

  const handleGenerateReportPlan = () => {
    // Update stepper to next step when starting plan generation
    setCurrentStep(2);
    generateReportPlan();
  };

  return (
    <Card
      id="research-qna"
      elevation={isCompleted ? 1 : hasQuestions ? 3 : 1}
      className={`mt-6 transition-all duration-300 ${
        isCompleted ? 'border-l-4 border-l-green-500 bg-green-50' : hasQuestions ? '' : 'opacity-60'
      }`}
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                isCompleted
                  ? 'bg-green-500'
                  : hasQuestions
                    ? isLoading
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                    : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : '2'}
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              Clarification
            </Typography>
          </div>
          {isCompleted && (
            <Chip label="Completed" size="small" color="success" variant="outlined" />
          )}
          {hasQuestions && !isCompleted && (
            <Chip
              label={`${qna.filter(q => q.a.trim()).length}/${qna.length} answered`}
              size="small"
              color={allAnswered ? 'success' : 'default'}
              variant="outlined"
            />
          )}
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          To help create a more targeted research plan, please review the answers to these
          questions. If you are unsure, just answer with "I don't know" or "I'm not sure."
        </Typography>

        <Divider className="mb-4" />

        {!hasQuestions && (
          <Box className="py-8 text-center">
            <HelpOutlineIcon className="mb-2 text-gray-400" sx={{ fontSize: 48 }} />
            <Typography className="text-gray-500">
              Waiting for query to be analyzed and questions to be generated...
            </Typography>
          </Box>
        )}

        {hasQuestions && (
          <div className="space-y-6">
            {qna.map((item, index) => (
              <Box key={item.id} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    Q{index + 1}
                  </div>
                  <Typography className="flex-1 font-medium text-gray-800">{item.q}</Typography>
                </div>
                <TextField
                  variant="outlined"
                  size="medium"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Your answer will help refine the research focus..."
                  value={item.a}
                  onChange={e => updateQnA({ id: item.id, q: item.q, a: e.target.value })}
                  className={`${item.a.trim() ? 'bg-white' : ''}`}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: item.a.trim() ? 'white' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'white',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                      },
                    },
                  }}
                />
              </Box>
            ))}
          </div>
        )}
      </CardContent>

      {hasQuestions && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-gray-500">
              {allAnswered
                ? 'All questions answered! Ready to create research plan.'
                : 'Answer all questions to proceed to the next step.'}
            </Typography>
            <Button
              variant="contained"
              size="medium"
              startIcon={<PlayArrowIcon />}
              loading={isGeneratingReportPlan}
              disabled={!allAnswered || isCompleted}
              onClick={handleGenerateReportPlan}
              className="px-6 py-2"
            >
              {isLoading ? 'Creating Plan...' : 'Create Research Plan'}
            </Button>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default ResearchQnA;
