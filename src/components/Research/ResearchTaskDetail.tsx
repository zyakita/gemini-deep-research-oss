import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode, type SyntheticEvent } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResearchTask } from '../../types';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
  taskID: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, taskID, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rt-tabpanel-${taskID}-${index}`}
      aria-labelledby={`rt-tab-${taskID}-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number, taskID: string) {
  return {
    id: `rt-tab-${taskID}-${index}`,
    'aria-controls': `rt-tabpanel-${taskID}-${index}`,
  };
}

function ResearchTasksDetail({ task }: { task: ResearchTask }) {
  const { learning, groundingChunks, webSearchQueries, urlsMetadata } = task;
  // console.log(urlsMetadata);
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab className="text-xs" label="Learning" {...a11yProps(0, task.id)} />
          <Tab
            className="text-xs"
            label={`Search Queries (${webSearchQueries?.length || 0})`}
            {...a11yProps(1, task.id)}
          />
          <Tab
            className="text-xs"
            label={`Grounding Chunks (${groundingChunks?.length || 0})`}
            {...a11yProps(2, task.id)}
          />
          <Tab
            className="text-xs"
            label={`Retrieved URLs (${urlsMetadata?.length || 0})`}
            {...a11yProps(3, task.id)}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0} taskID={task.id}>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
          <div className="prose prose-xs max-w-none text-xs text-gray-700">
            <Markdown remarkPlugins={[remarkGfm]}>{learning}</Markdown>
          </div>
        </div>
      </TabPanel>
      <TabPanel value={value} index={1} taskID={task.id}>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
          <ul className="list-disc pl-6 text-xs">
            {webSearchQueries &&
              webSearchQueries.map((query, index) => <li key={index}>{query}</li>)}
          </ul>
        </div>
      </TabPanel>
      <TabPanel value={value} index={2} taskID={task.id}>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
          <ul className="list-disc pl-6 text-xs">
            {groundingChunks &&
              groundingChunks.map((chunk, index) => (
                <li key={index}>
                  <Typography className="line-clamp-1 text-xs text-gray-700">
                    {chunk.web?.title || ''} -{' '}
                    <a
                      href={chunk.web?.uri}
                      target="_blank"
                      className="text-blue-500 hover:underline"
                    >
                      {chunk.web?.uri}
                    </a>
                  </Typography>
                </li>
              ))}
          </ul>
        </div>
      </TabPanel>
      <TabPanel value={value} index={3} taskID={task.id}>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
          <ul className="list-disc pl-6 text-xs">
            {urlsMetadata &&
              urlsMetadata.map((url, index) => (
                <li key={index}>
                  <Typography className="line-clamp-1 text-xs text-gray-700">
                    <a
                      href={url.retrievedUrl}
                      target="_blank"
                      className="text-blue-500 hover:underline"
                    >
                      {url.retrievedUrl}
                    </a>
                  </Typography>
                </li>
              ))}
          </ul>
        </div>
      </TabPanel>
    </Box>
  );
}

export default ResearchTasksDetail;
