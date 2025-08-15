import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useSettingStore } from '../../stores/setting';
import { useTaskStore } from '../../stores/task';

function ResearchTasks() {
  const {
    researchTasks,
    isGeneratingFinalReport,
    isGeneratingResearchTasks,
    finalReport,
    setCurrentStep,
  } = useTaskStore();
  const { depth, wide } = useSettingStore();
  const { generateFinalReport } = useDeepResearch();

  const isCompleted = finalReport && finalReport.length > 0;
  const isLoading = isGeneratingFinalReport;
  const isGeneratingTasks = isGeneratingResearchTasks;
  const hasTasks = researchTasks && researchTasks.length > 0;

  // Calculate expected total tasks based on depth and wide settings
  const expectedTotalTasks = depth * wide;

  const completedTasks = researchTasks?.filter(task => task.learning) || [];

  // Group tasks by tier (depth level)
  // eslint-disable-next-line
  const tasksByTier = new Map<number, any>();
  researchTasks?.forEach(task => {
    const tier = task.tier || 1;
    if (!tasksByTier.has(tier)) {
      tasksByTier.set(tier, []);
    }
    tasksByTier.get(tier)!.push(task);
  });

  const currentTier = Math.max(...Array.from(tasksByTier.keys()), 0);
  const hasMoreTiers = currentTier < depth;

  // Calculate progress percentage
  let progressPercentage = 0;
  if (hasTasks) {
    // Progress based on completed tasks vs expected total
    progressPercentage = Math.min((completedTasks.length / expectedTotalTasks) * 100, 100);
  }

  // All tasks completed when we have expected number of completed tasks or final report exists
  const allTasksCompleted =
    completedTasks.length >= expectedTotalTasks ||
    (hasTasks && completedTasks.length === researchTasks.length && !hasMoreTiers);

  const handleGenerateFinalReport = () => {
    // Update stepper to final step when starting report generation
    setCurrentStep(4);
    generateFinalReport();
  };

  return (
    <Card
      id="research-tasks"
      elevation={isCompleted ? 1 : hasTasks ? 3 : 1}
      className={`mt-6 transition-all duration-300 ${
        isCompleted ? 'border-l-4 border-l-green-500 bg-green-50' : hasTasks ? '' : 'opacity-60'
      }`}
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                isCompleted
                  ? 'bg-green-500'
                  : hasTasks
                    ? allTasksCompleted
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                    : 'bg-gray-400'
              }`}
            >
              {isCompleted ? '✓' : '4'}
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              Data Collection
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {hasTasks && !isCompleted && (
              <>
                <Chip
                  label={`Tier ${currentTier}/${depth}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${completedTasks.length}/${expectedTotalTasks} total completed`}
                  size="small"
                  color={allTasksCompleted ? 'success' : 'default'}
                  variant="outlined"
                />
              </>
            )}
            {isCompleted && (
              <Chip label="Completed" size="small" color="success" variant="outlined" />
            )}
          </div>
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          Gathering information from various sources in {depth} tiers, up to {wide} tasks per tier
        </Typography>

        <Divider className="mb-4" />

        {hasTasks && (
          <Box className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <Typography variant="caption" className="text-gray-600">
                Overall Progress ({completedTasks.length} of {expectedTotalTasks} expected tasks)
              </Typography>
              <Typography variant="caption" className="text-gray-600">
                {Math.round(progressPercentage)}%
              </Typography>
            </div>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              className="h-2 rounded-full"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: allTasksCompleted ? '#10b981' : '#3b82f6',
                  borderRadius: '999px',
                },
              }}
            />
            {tasksByTier.size > 1 && (
              <Box className="mt-3">
                <Typography variant="caption" className="mb-2 block text-gray-600">
                  Progress by Tier:
                </Typography>
                <div className="space-y-1">
                  {Array.from(tasksByTier.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([tier, tasks]) => {
                      const tierCompleted = tasks.filter(t => t.learning).length;
                      const tierProgress = (tierCompleted / tasks.length) * 100;
                      return (
                        <div key={tier} className="flex items-center gap-2 text-xs">
                          <span className="w-12 text-gray-500">Tier {tier}:</span>
                          <div className="h-1 flex-1 rounded-full bg-gray-200">
                            <div
                              className="h-1 rounded-full bg-blue-400 transition-all duration-300"
                              style={{ width: `${tierProgress}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-gray-500">
                            {tierCompleted}/{tasks.length}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </Box>
            )}
          </Box>
        )}

        {!hasTasks && !isGeneratingTasks && (
          <Box className="py-8 text-center">
            <AssignmentTurnedInIcon className="mb-2 text-gray-400" sx={{ fontSize: 48 }} />
            <Typography className="text-gray-500">
              Waiting for research tasks to be generated...
            </Typography>
          </Box>
        )}

        {!hasTasks && isGeneratingTasks && (
          <div className="space-y-4">
            {/* Show skeleton for all expected tiers when research is starting */}
            {Array.from({ length: depth }, (_, tierIndex) => (
              <div key={`loading-tier-${tierIndex + 1}`} className="space-y-2">
                <div className="sticky top-0 rounded-lg border bg-gray-50 px-3 py-2">
                  <div className="h-5 w-64 animate-pulse rounded bg-gray-300"></div>
                </div>

                {/* Skeleton tasks for this tier */}
                {Array.from({ length: wide }, (_, taskIndex) => (
                  <div
                    key={`loading-task-${tierIndex + 1}-${taskIndex}`}
                    className="rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="animate-pulse px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                        <div className="flex-1">
                          <div className="mb-2 h-4 w-3/4 rounded bg-gray-300"></div>
                          <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                        </div>
                        <div className="h-6 w-16 rounded-full bg-gray-300"></div>
                      </div>
                    </div>
                  </div>
                ))}

                {tierIndex === 0 ? (
                  <Typography
                    variant="caption"
                    className="block py-2 text-center font-medium text-blue-500"
                  >
                    Generating Tier 1 tasks...
                  </Typography>
                ) : (
                  <Typography variant="caption" className="block py-2 text-center text-gray-400">
                    Tier {tierIndex + 1} tasks will be generated after tier {tierIndex} completes
                  </Typography>
                )}
              </div>
            ))}
          </div>
        )}

        {hasTasks && (
          <div className="space-y-4">
            {/* Render existing tasks grouped by tier */}
            {Array.from(tasksByTier.entries())
              .sort(([a], [b]) => a - b)
              .map(([tier, tierTasks]) => (
                <div key={tier} className="space-y-2">
                  <Typography
                    variant="subtitle2"
                    className="sticky top-0 rounded-lg border bg-gray-50 px-3 py-2 font-semibold text-gray-700"
                  >
                    Tier {tier} Research Tasks ({tierTasks.filter(t => t.learning).length}/
                    {tierTasks.length} completed)
                  </Typography>
                  {tierTasks.map((task, index) => {
                    const isTaskCompleted = task.learning;
                    const isTaskProcessing = task.processing && !task.learning;
                    const isTaskPending = !task.processing && !task.learning;

                    return (
                      <Accordion
                        key={task.id}
                        slotProps={{ transition: { unmountOnExit: true } }}
                        className={`${
                          isTaskCompleted
                            ? 'bg-green-50'
                            : isTaskProcessing
                              ? 'bg-blue-50'
                              : 'bg-gray-50'
                        } border border-gray-200`}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} className="px-4 py-2">
                          <Stack direction="row" alignItems="center" spacing={2} className="w-full">
                            <div className="flex flex-1 items-center gap-3">
                              {isTaskPending && (
                                <AccessTimeIcon className="text-gray-500" sx={{ fontSize: 20 }} />
                              )}
                              {isTaskProcessing && (
                                <AutorenewIcon
                                  className="animate-spin text-blue-500"
                                  sx={{ fontSize: 20 }}
                                />
                              )}
                              {isTaskCompleted && (
                                <DoneAllIcon className="text-green-500" sx={{ fontSize: 20 }} />
                              )}
                              <Typography className="font-medium text-gray-800">
                                Task {index + 1}: {task.title}
                              </Typography>
                            </div>
                            <Chip
                              label={
                                isTaskCompleted
                                  ? 'Completed'
                                  : isTaskProcessing
                                    ? 'In Progress'
                                    : 'Pending'
                              }
                              size="small"
                              color={
                                isTaskCompleted
                                  ? 'success'
                                  : isTaskProcessing
                                    ? 'primary'
                                    : 'default'
                              }
                              variant="outlined"
                            />
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails className="px-4 pb-4">
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <InfoIcon className="text-blue-500" sx={{ fontSize: 16 }} />
                                <Typography
                                  variant="subtitle2"
                                  className="font-semibold text-gray-800"
                                >
                                  Direction
                                </Typography>
                              </div>
                              <Typography
                                variant="body2"
                                className="rounded-lg bg-blue-50 p-3 text-gray-600"
                              >
                                {task.direction}
                              </Typography>
                            </div>

                            {task.learning && (
                              <div>
                                <div className="mb-2 flex items-center gap-2">
                                  <DoneAllIcon className="text-green-500" sx={{ fontSize: 16 }} />
                                  <Typography
                                    variant="subtitle2"
                                    className="font-semibold text-gray-800"
                                  >
                                    Research Results
                                  </Typography>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-4">
                                  <div className="prose prose-sm max-w-none text-gray-700">
                                    <Markdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        h1: ({ children }) => (
                                          <h1 className="mb-2 text-lg font-bold text-gray-800">
                                            {children}
                                          </h1>
                                        ),
                                        h2: ({ children }) => (
                                          <h2 className="mb-2 text-base font-semibold text-gray-800">
                                            {children}
                                          </h2>
                                        ),
                                        h3: ({ children }) => (
                                          <h3 className="mb-1 text-sm font-medium text-gray-800">
                                            {children}
                                          </h3>
                                        ),
                                        p: ({ children }) => (
                                          <p className="mb-2 leading-relaxed">{children}</p>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="mb-2 space-y-1 pl-4">{children}</ul>
                                        ),
                                        ol: ({ children }) => (
                                          <ol className="mb-2 space-y-1 pl-4">{children}</ol>
                                        ),
                                        li: ({ children }) => (
                                          <li className="text-gray-700">{children}</li>
                                        ),
                                      }}
                                    >
                                      {task.learning}
                                    </Markdown>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </div>
              ))}

            {/* Render skeleton loaders for tiers that haven't been generated yet */}
            {(isGeneratingTasks || tasksByTier.size < depth) &&
              Array.from({ length: depth - tasksByTier.size }, (_, index) => {
                const skeletonTier = tasksByTier.size + index + 1;
                const isNextTier = skeletonTier === tasksByTier.size + 1;
                const shouldShowAsGenerating = isGeneratingTasks && isNextTier;

                return (
                  <div key={`skeleton-tier-${skeletonTier}`} className="space-y-2">
                    <div className="sticky top-0 rounded-lg border bg-gray-50 px-3 py-2">
                      <div
                        className={`h-5 w-64 rounded ${shouldShowAsGenerating ? 'animate-pulse bg-blue-300' : 'bg-gray-300'}`}
                      ></div>
                    </div>

                    {/* Skeleton tasks for this tier */}
                    {Array.from({ length: wide }, (_, taskIndex) => (
                      <div
                        key={`skeleton-task-${skeletonTier}-${taskIndex}`}
                        className={`rounded-lg border border-gray-200 ${shouldShowAsGenerating ? 'bg-blue-50' : 'bg-gray-50'}`}
                      >
                        <div className="animate-pulse px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-full ${shouldShowAsGenerating ? 'bg-blue-300' : 'bg-gray-300'}`}
                            ></div>
                            <div className="flex-1">
                              <div
                                className={`mb-2 h-4 w-3/4 rounded ${shouldShowAsGenerating ? 'bg-blue-300' : 'bg-gray-300'}`}
                              ></div>
                              <div
                                className={`h-3 w-1/2 rounded ${shouldShowAsGenerating ? 'bg-blue-200' : 'bg-gray-200'}`}
                              ></div>
                            </div>
                            <div
                              className={`h-6 w-16 rounded-full ${shouldShowAsGenerating ? 'bg-blue-300' : 'bg-gray-300'}`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {shouldShowAsGenerating ? (
                      <Typography
                        variant="caption"
                        className="block py-2 text-center font-medium text-blue-500"
                      >
                        Generating Tier {skeletonTier} tasks...
                      </Typography>
                    ) : (
                      <Typography
                        variant="caption"
                        className="block py-2 text-center text-gray-400"
                      >
                        Tier {skeletonTier} tasks will be generated after tier {skeletonTier - 1}{' '}
                        completes
                      </Typography>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>

      {hasTasks && (
        <CardActions className="px-6 pb-4">
          <div className="flex w-full items-center justify-between">
            <Typography variant="caption" className="text-gray-500">
              {isCompleted
                ? 'All tasks completed! Final report has been generated.'
                : allTasksCompleted
                  ? 'All expected tasks completed. Ready to generate final report.'
                  : `${completedTasks.length} of ${expectedTotalTasks} expected tasks completed (${researchTasks.length} total tasks)`}
            </Typography>
            <Button
              variant="contained"
              size="medium"
              startIcon={<AssignmentTurnedInIcon />}
              loading={isLoading}
              disabled={!allTasksCompleted || isCompleted}
              onClick={handleGenerateFinalReport}
              className="px-6 py-2"
            >
              {isLoading ? 'Writing Report...' : 'Write Report'}
            </Button>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default ResearchTasks;
