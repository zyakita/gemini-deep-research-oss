import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import tones from '../../consts/tones';
import { useGlobalStore } from '../../stores/global';
import { useSettingStore } from '../../stores/setting';
import ToneInfoDialog from './ToneInfoDialog';

function SettingDialog() {
  const { openSetting, setOpenSetting } = useGlobalStore();
  const {
    apiKey,
    coreModel,
    taskModel,
    thinkingBudget,
    depth,
    wide,
    parallelSearch,
    reportTone,
    minWords,
    update,
  } = useSettingStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [toneInfoOpen, setToneInfoOpen] = useState(false);

  const handleClose = () => {
    setOpenSetting(false);
  };

  const selectedTone = tones.find(tone => tone.slug === reportTone);

  return (
    <>
      <Dialog open={openSetting} maxWidth="md" fullWidth onClose={handleClose}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div">
            Research Settings
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <DialogContentText sx={{ mb: 3 }}>
            Configure your research parameters and AI models. All settings are saved locally in your
            browser.
          </DialogContentText>

          {/* API Configuration Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
            >
              🔑 API Configuration
            </Typography>

            {/* Api Key */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                API Key *
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Your Google GenAI API key for accessing AI models, get it from
                https://aistudio.google.com/
              </Typography>
              <TextField
                required
                fullWidth
                variant="outlined"
                size="small"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={e => update({ apiKey: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            {/* Models */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Core Model
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={coreModel}
                  onChange={e => update({ coreModel: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Task Model
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={taskModel}
                  onChange={e => update({ taskModel: e.target.value })}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Research Parameters Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
            >
              🔬 Research Parameters
            </Typography>

            {/* Report Tone */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Report Tone
                </Typography>
                <Tooltip title="Click to see all available tones and their descriptions">
                  <IconButton size="small" onClick={() => setToneInfoOpen(true)} sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={reportTone}
                  onChange={e => update({ reportTone: e.target.value })}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={selectedTone?.name || selected}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                >
                  {tones.map(tone => (
                    <MenuItem key={tone.slug} value={tone.slug}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {tone.name}
                        </Typography>
                        {/* <Typography variant="caption" color="text.secondary" className='line-clamp-1 max-w-md'>
                          {tone.describe}
                        </Typography> */}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedTone && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {selectedTone.describe}
                </Typography>
              )}
            </Box>

            {/* Min Words */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                Minimum Words ({minWords.toLocaleString()})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                The expected length of the report
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={minWords}
                  onChange={(e, newValue) => update({ minWords: newValue as number })}
                  min={1000}
                  max={10000}
                  step={500}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value.toLocaleString()} words`}
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      '&[data-index="0"]': {
                        transform: 'translateX(0%)',
                      },
                      '&[data-index="2"]': {
                        transform: 'translateX(-100%)',
                      },
                    },
                  }}
                  marks={[
                    { value: 1000, label: '1K' },
                    { value: 5000, label: '5K' },
                    { value: 10000, label: '10K' },
                  ]}
                />
              </Box>
            </Box>

            {/* Advanced Parameters - Two Column Layout with Proper Label Containment */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, rowGap: 4 }}>
              {/* Thinking Budget */}
              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Thinking Budget ({thinkingBudget.toLocaleString()})
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: 'block' }}
                >
                  This is the maximum number of tokens that the AI can use for internal reasoning
                  before generating the final response.
                </Typography>
                <Slider
                  value={thinkingBudget}
                  onChange={(e, newValue) => update({ thinkingBudget: newValue as number })}
                  min={1024}
                  max={16384}
                  step={1024}
                  valueLabelDisplay="auto"
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      '&[data-index="0"]': {
                        transform: 'translateX(0%)',
                      },
                      '&[data-index="2"]': {
                        transform: 'translateX(-100%)',
                      },
                    },
                  }}
                  marks={[
                    { value: 1024, label: '1K' },
                    { value: 8192, label: '8K' },
                    { value: 16384, label: '16K' },
                  ]}
                />
              </Box>

              {/* Parallel Search */}
              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Parallel Search ({parallelSearch})
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: 'block' }}
                >
                  The number of simultaneous search queries executed in parallel to speed up the
                  gathering of information.
                </Typography>
                <Slider
                  value={parallelSearch}
                  onChange={(e, newValue) => update({ parallelSearch: newValue as number })}
                  min={1}
                  max={5}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      '&[data-index="0"]': {
                        transform: 'translateX(0%)',
                      },
                      '&[data-index="2"]': {
                        transform: 'translateX(-100%)',
                      },
                    },
                  }}
                  marks={[
                    { value: 1, label: 'Sequential' },
                    { value: 3, label: 'Moderate' },
                    { value: 5, label: 'Maximum' },
                  ]}
                />
              </Box>

              {/* Research Depth */}
              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Research Depth ({depth})
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: 'block' }}
                >
                  What is the ideal number of research rounds to ensure a thorough coverage of a
                  query? First, go broad. Then, go deep.
                </Typography>
                <Slider
                  value={depth}
                  onChange={(e, newValue) => update({ depth: newValue as number })}
                  min={2}
                  max={5}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      '&[data-index="0"]': {
                        transform: 'translateX(0%)',
                      },
                      '&[data-index="3"]': {
                        transform: 'translateX(-100%)',
                      },
                    },
                  }}
                  marks={[
                    { value: 2, label: 'Light' },
                    { value: 3, label: 'Medium' },
                    { value: 4, label: 'Deep' },
                    { value: 5, label: 'Extensive' },
                  ]}
                />
              </Box>

              {/* Research Width */}
              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Research Width ({wide})
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: 'block' }}
                >
                  What is the ideal number of distinct sources to consult{' '}
                  <span className="font-semibold">in each round</span> to ensure a broad
                  understanding of a query?
                </Typography>
                <Slider
                  value={wide}
                  onChange={(e, newValue) => update({ wide: newValue as number })}
                  min={3}
                  max={9}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      '&[data-index="0"]': {
                        transform: 'translateX(0%)',
                      },
                      '&[data-index="2"]': {
                        transform: 'translateX(-100%)',
                      },
                    },
                  }}
                  marks={[
                    { value: 3, label: 'Focused' },
                    { value: 6, label: 'Balanced' },
                    { value: 9, label: 'Broad' },
                  ]}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined" size="large">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ToneInfoDialog open={toneInfoOpen} onClose={() => setToneInfoOpen(false)} />
    </>
  );
}

export default SettingDialog;
