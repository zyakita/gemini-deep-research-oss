import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Typography from '@mui/material/Typography';
import { v4 as uuidv4 } from 'uuid';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useGlobalStore } from '../../stores/global';
import { useSettingStore } from '../../stores/setting';
import { useTaskStore } from '../../stores/task';

function ResearchQuery() {
  const { id, query, setId, setQuery, isGeneratingQnA, qna, setCurrentStep } = useTaskStore();
  const { generateQnAs } = useDeepResearch();
  const { setOpenSetting } = useGlobalStore();
  const { isApiKeyValid } = useSettingStore();

  const handleSubmit = () => {
    if (!query.trim()) {
      alert('Please enter a query.');
      return;
    }

    if (!isApiKeyValid) {
      setOpenSetting(true);
      return;
    }

    // set new id if not set before
    if (!id) {
      const newId = uuidv4();
      setId(newId);
    }

    // set trimmed query
    setQuery(query.trim());

    // Update stepper to next step
    setCurrentStep(1);

    // start generating QnAs
    generateQnAs();
  };

  const isCompleted = qna.length > 0;
  const isLoading = isGeneratingQnA;

  return (
    <Card
      id="research-query"
      elevation={isCompleted ? 1 : 3}
      className={`transition-all duration-300 ${isCompleted ? 'border-l-4 border-l-green-500 bg-green-50' : ''}`}
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                isCompleted ? 'bg-green-500' : isLoading ? 'bg-blue-500' : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : '1'}
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              Research Query
            </Typography>
          </div>
          {isCompleted && (
            <Chip label="Completed" size="small" color="success" variant="outlined" />
          )}
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          Start the in-depth research process now by entering your research question.
        </Typography>

        <Divider className="mb-4" />

        <TextareaAutosize
          minRows={4}
          maxRows={8}
          className={`w-full resize-none rounded-lg border-2 p-4 text-base transition-colors focus:outline-none disabled:bg-gray-50 ${
            isCompleted
              ? 'border-green-200 bg-green-50/50'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
          }`}
          placeholder="What would you like to research? Be as specific as possible for better results..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={isGeneratingQnA || qna.length > 0}
        />

        {query && !isCompleted && (
          <Typography variant="caption" className="mt-2 block text-gray-500">
            {query.length} characters • Press the button below to start research
          </Typography>
        )}
      </CardContent>

      <CardActions className="px-6 pb-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1" />
          <Button
            variant="contained"
            size="medium"
            startIcon={<SearchIcon />}
            loading={isGeneratingQnA}
            disabled={!query.trim() || qna.length > 0}
            onClick={handleSubmit}
            className="px-6 py-2"
          >
            {isLoading ? 'Analyzing...' : 'Start Research'}
          </Button>
        </div>
      </CardActions>
    </Card>
  );
}

export default ResearchQuery;
