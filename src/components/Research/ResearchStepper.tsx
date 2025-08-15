import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepIcon from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/task';

// Custom styled connector
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '&.Mui-active .MuiStepConnector-line': {
    background: 'linear-gradient(95deg, #3b82f6 0%, #10b981 100%)',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    background: 'linear-gradient(95deg, #10b981 0%, #10b981 100%)',
  },
}));

// Custom step icon
const CustomStepIcon = styled(StepIcon)(({ theme }) => ({
  '&.Mui-active': {
    color: '#3b82f6',
  },
  '&.Mui-completed': {
    color: '#10b981',
  },
}));

const steps = [
  {
    label: 'Research Query',
    description: 'Define your research question',
    icon: SearchIcon,
    sectionId: 'research-query',
  },
  {
    label: 'Clarification',
    description: 'Answer clarifying questions',
    icon: HelpOutlineIcon,
    sectionId: 'research-qna',
  },
  {
    label: 'Research Plan',
    description: 'Review the research strategy',
    icon: AssignmentIcon,
    sectionId: 'research-plan',
  },
  {
    label: 'Data Collection',
    description: 'Gather information',
    icon: AssignmentTurnedInIcon,
    sectionId: 'research-tasks',
  },
  {
    label: 'Final Report',
    description: 'Generate report',
    icon: DescriptionIcon,
    sectionId: 'research-report',
  },
];

function ResearchStepper() {
  const { query, qna, reportPlan, researchTasks, finalReport, currentStep, setCurrentStep } =
    useTaskStore();

  const [isSticky, setIsSticky] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Handle scroll for sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldBeSticky = scrollY > 100; // Start sticky after 100px scroll
      const shouldBeCompact = scrollY > 100; // Start compact after 200px scroll

      setIsSticky(shouldBeSticky);
      setIsCompact(shouldBeCompact);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-update current step based on progress
  useEffect(() => {
    let newStep = 0;

    if (query.trim()) {
      newStep = 1;
    }
    if (qna.length > 0 && qna.every(q => q.a.trim())) {
      newStep = 2;
    }
    if (reportPlan.trim()) {
      newStep = 3;
    }
    if (researchTasks.length > 0) {
      newStep = 4;
    }
    if (finalReport.trim()) {
      newStep = 5;
    }

    if (newStep !== currentStep) {
      setCurrentStep(newStep);
    }
  }, [query, qna, reportPlan, researchTasks, finalReport, currentStep, setCurrentStep]);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'inactive';
  };

  const handleStepClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = isSticky ? 100 : 20; // Account for sticky header height
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      {/* Spacer to prevent layout shift when component becomes sticky */}
      {isSticky && <div className={`transition-all duration-300 ${isCompact ? 'h-20' : 'h-32'}`} />}

      <Box
        className={`border border-gray-200 bg-white shadow-sm transition-all duration-300 ${
          isSticky
            ? 'fixed top-0 right-0 left-0 z-50 mx-auto max-w-full bg-white/95 shadow-lg backdrop-blur-sm'
            : 'mb-8 rounded-lg'
        } ${isCompact ? 'p-3' : 'p-6'}`}
      >
        {!isCompact && (
          <Typography variant="h6" className="mb-4 font-semibold text-gray-800">
            Research Progress
          </Typography>
        )}

        <Stepper
          activeStep={currentStep}
          connector={<CustomConnector />}
          alternativeLabel={!isCompact}
          orientation={isCompact ? 'horizontal' : 'horizontal'}
          className={isCompact ? 'mb-2' : 'mb-4'}
        >
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const IconComponent = step.icon;

            return (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => handleStepClick(step.sectionId)}
                  className="cursor-pointer"
                  StepIconComponent={props => (
                    <div
                      className={`flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 ${
                        isCompact ? 'h-8 w-8' : 'h-12 w-12'
                      } ${
                        status === 'completed'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'active'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      <IconComponent sx={{ fontSize: isCompact ? 16 : 20 }} />
                    </div>
                  )}
                >
                  {!isCompact && (
                    <>
                      <Typography
                        variant="subtitle2"
                        className={`font-medium transition-colors hover:text-blue-600 ${
                          status === 'completed' || status === 'active'
                            ? 'text-gray-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </Typography>
                      {/* <Typography
                        variant="caption"
                        className={`${
                          status === 'completed' || status === 'active'
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.description}
                      </Typography> */}
                    </>
                  )}
                  {isCompact && (
                    <Typography
                      variant="caption"
                      className={`font-medium transition-colors hover:text-blue-600 ${
                        status === 'completed' || status === 'active'
                          ? 'text-gray-800'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {/* Progress bar */}
        <Box className="mt-2">
          <div
            className={`w-full rounded-full bg-gray-200 transition-all duration-300 ${
              isCompact ? 'h-1' : 'h-2'
            }`}
          >
            <div
              className="rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%`,
                height: isCompact ? '4px' : '8px',
              }}
            />
          </div>
          {!isCompact && (
            <div className="mt-2 flex justify-between">
              <Typography variant="caption" className="text-gray-500">
                Step {currentStep} of {steps.length}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {Math.min(Math.round((currentStep / (steps.length - 1)) * 100), 100)}% Complete
              </Typography>
            </div>
          )}
          {isCompact && (
            <div className="mt-1 text-center">
              <Typography variant="caption" className="text-xs text-gray-500">
                Step {currentStep}/{steps.length} •{' '}
                {Math.min(Math.round((currentStep / (steps.length - 1)) * 100), 100)}%
              </Typography>
            </div>
          )}
        </Box>
      </Box>
    </>
  );
}

export default ResearchStepper;
