import AutorenewIcon from '@mui/icons-material/Autorenew';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useGlobalStore } from '../../stores/global';
import { useTaskStore } from '../../stores/task';

function Header() {
  const { setOpenSetting } = useGlobalStore();
  const { reset } = useTaskStore();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the current research?')) {
      reset();
    }
  };

  return (
    <header className="flex items-center justify-between py-6 max-sm:py-4 print:hidden">
      <a href="https://github.com/zyakita/gemini-deep-research-oss" target="_blank">
        <GitHubIcon className="text-gray-600 hover:text-gray-800" />
      </a>

      {/* <Typography className="font-medium">Gemini Deep Research</Typography> */}
      <ButtonGroup disableElevation size="small" variant="outlined">
        <Button size="small" color="warning" startIcon={<AutorenewIcon />} onClick={handleReset}>
          Reset
        </Button>
        {/* <Button size="small" startIcon={<HistoryIcon />} onClick={() => setOpenHistory(true)}>
          History
        </Button> */}
        <Button
          size="small"
          color="info"
          startIcon={<SettingsIcon />}
          onClick={() => setOpenSetting(true)}
        >
          Setting
        </Button>
      </ButtonGroup>
    </header>
  );
}

export default Header;
