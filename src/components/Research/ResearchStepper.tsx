import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTaskStore } from '../../stores/task';

// Custom styled connector
const CustomConnector = styled(StepConnector)(() => ({
  '&.Mui-active .MuiStepConnector-line': {
    background: 'linear-gradient(95deg, #3b82f6 0%, #10b981 100%)',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    background: 'linear-gradient(95deg, #10b981 0%, #10b981 100%)',
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
      const shouldBeSticky = scrollY > (isMobile ? 50 : 100); // Start sticky earlier on mobile
      const shouldBeCompact = scrollY > (isMobile ? 50 : 100); // Start compact earlier on mobile

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
      const offset = isSticky ? (isMobile ? 80 : 100) : 20; // Adjust offset for mobile sticky header
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
      {isSticky && (
        <div
          className={`transition-all duration-300 ${
            isCompact ? (isMobile ? 'h-12' : 'h-14') : isMobile ? 'h-16' : 'h-20'
          }`}
        />
      )}

      <Box
        className={`border border-gray-200 bg-slate-100 shadow-sm transition-all duration-300 ${
          isSticky
            ? `fixed top-0 right-0 left-0 z-50 mx-auto max-w-full shadow-lg backdrop-blur-sm ${
                isMobile ? 'px-2' : 'px-4'
              }`
            : `mb-8 ${isMobile ? 'mx-2 rounded' : 'rounded-lg'}`
        } ${isCompact && isSticky ? (isMobile ? 'p-1 py-2' : 'p-2 py-3') : isCompact ? (isMobile ? 'p-2' : 'p-3') : isMobile ? 'p-4' : 'p-6'}`}
      >
        {!isCompact && (
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            className={`font-semibold text-gray-800 ${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            Research Progress
          </Typography>
        )}

        <Stepper
          activeStep={currentStep}
          connector={<CustomConnector />}
          alternativeLabel={!isCompact && !isMobile}
          orientation={isCompact || isMobile ? 'horizontal' : 'horizontal'}
          className={isCompact ? 'mb-2' : isMobile ? 'mb-3' : 'mb-4'}
        >
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const IconComponent = step.icon;

            return (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => handleStepClick(step.sectionId)}
                  className={`cursor-pointer ${isMobile ? 'touch-manipulation' : ''}`}
                  StepIconComponent={() => (
                    <div
                      className={`flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                        isCompact || isMobile
                          ? isMobile && isCompact && isSticky
                            ? 'h-5 w-5'
                            : isMobile && isCompact
                              ? 'h-6 w-6'
                              : isCompact && isSticky
                                ? 'h-6 w-6'
                                : 'h-8 w-8'
                          : isMobile
                            ? 'h-10 w-10'
                            : 'h-12 w-12'
                      } ${
                        status === 'completed'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'active'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      <IconComponent
                        className={
                          isCompact || isMobile
                            ? isMobile && isCompact && isSticky
                              ? 'text-xs'
                              : isMobile && isCompact
                                ? 'text-xs'
                                : isCompact && isSticky
                                  ? 'text-xs'
                                  : 'text-sm'
                            : isMobile
                              ? 'text-lg'
                              : 'text-xl'
                        }
                      />
                    </div>
                  )}
                >
                  {!isCompact && !isMobile && (
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
                  {(isCompact || isMobile) && (
                    <Typography
                      variant="caption"
                      className={`font-medium transition-colors hover:text-blue-600 ${
                        isMobile ? 'text-xs' : ''
                      } ${
                        status === 'completed' || status === 'active'
                          ? 'text-gray-800'
                          : 'text-gray-500'
                      }`}
                    >
                      {isMobile && step.label.length > 8
                        ? step.label.substring(0, 6) + '...'
                        : step.label}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {/* Progress bar */}
        <Box
          className={
            isSticky && isCompact ? (isMobile ? 'mt-1' : 'mt-1') : isMobile ? 'mt-2' : 'mt-2'
          }
        >
          <div className="relative">
            <div
              className={`w-full rounded-full bg-gray-200 transition-all duration-300 ${
                isCompact && isSticky
                  ? isMobile
                    ? 'h-4'
                    : 'h-5'
                  : isCompact
                    ? isMobile
                      ? 'h-4'
                      : 'h-5'
                    : isMobile
                      ? 'h-4'
                      : 'h-6'
              }`}
            >
              <div
                className="rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%`,
                  height: '100%',
                }}
              />
            </div>

            {/* Overlay text on progress bar */}
            {(isCompact || isMobile) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Typography
                  variant="caption"
                  className={`font-medium text-white drop-shadow-sm text-shadow-sm ${
                    isSticky && isCompact ? 'text-[10px]' : isMobile ? 'text-xs' : 'text-xs'
                  }`}
                  style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                >
                  Step {currentStep}/{steps.length} •{' '}
                  {Math.min(Math.round((currentStep / (steps.length - 1)) * 100), 100)}%
                  {!isMobile && !isSticky ? ' Complete' : ''}
                </Typography>
              </div>
            )}
          </div>
          {!isCompact && !isMobile && (
            <div className="mt-2 flex justify-between">
              <Typography variant="caption" className="text-gray-500">
                Step {currentStep} of {steps.length}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {Math.min(Math.round((currentStep / (steps.length - 1)) * 100), 100)}% Complete
              </Typography>
            </div>
          )}
        </Box>
      </Box>
    </>
  );
}

export default ResearchStepper;
