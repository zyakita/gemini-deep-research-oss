import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import SettingDialog from './components/Dialog/SettingDialog';
import Header from './components/Internal/Header';
import ResearchQnA from './components/Research/QnA';
import ResearchQuery from './components/Research/Query';
import ResearchReport from './components/Research/Report';
import ResearchReportPlan from './components/Research/ReportPlan';
import ResearchStepper from './components/Research/ResearchStepper';
import ResearchTasks from './components/Research/Tasks';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-screen-lg px-4 max-lg:max-w-screen-md">
        <Header />

        {/* Research Workflow Introduction */}
        <Box className="mt-6 mb-8">
          <Typography variant="h4" className="mb-2 font-bold text-gray-800">
            Deep Research Assistant
          </Typography>
          <Typography variant="body1" className="leading-relaxed text-gray-600">
            Follow this structured research process to get comprehensive insights on any topic. Each
            step builds upon the previous one to ensure thorough and accurate research.
          </Typography>
        </Box>

        {/* Research Progress Stepper */}
        <ResearchStepper />

        {/* Research Components */}
        <div className="space-y-6 pb-12">
          <ResearchQuery />
          <ResearchQnA />
          <ResearchReportPlan />
          <ResearchTasks />
          <ResearchReport />
        </div>

        {/* Dialogs */}
        <SettingDialog />
      </div>
    </div>
  );
}

export default App;
