import { useEffect } from 'react';
import { useParams } from 'react-router';
import ReportRender from './components/Research/ReportRender';
import { useTaskStore } from './stores/task';

function ReportPage() {
  const task = useTaskStore();
  const { id } = useParams<{ id: string }>();

  // try to set document.title
  // to the very first line of the report, remove all markdown from it
  useEffect(() => {
    if (task.finalReport) {
      const firstLine = task.finalReport.split('\n')[0];
      const cleanTitle = firstLine.replace(/[#*`_]/g, '').trim();
      document.title = cleanTitle;
    }
  }, [task.finalReport]);

  if (!task) return null;
  if (task.id !== id) return null;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-12 max-lg:max-w-screen-md">
      <ReportRender finalReport={task.finalReport} />
    </div>
  );
}

export default ReportPage;
