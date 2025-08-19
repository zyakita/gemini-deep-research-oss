import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import tones from '../../consts/tones';
import { useGlobalStore } from '../../stores/global';
import { useSettingStore } from '../../stores/setting';
import ModelSelect from './ModelSelect';
import SliderSetting from './SliderSetting';
import ToneInfoDialog from './ToneInfoDialog';

const SettingDialog = memo(function SettingDialog() {
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
    modelList,
    isApiKeyValid,
    isApiKeyValidating,
    update,
    validateApiKey,
  } = useSettingStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [toneInfoOpen, setToneInfoOpen] = useState(false);

  // Use refs to track validation state and prevent race conditions
  const validationTimeoutRef = useRef<number | null>(null);
  const lastValidatedKeyRef = useRef<string>('');
  const validationSequenceRef = useRef<number>(0);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoize expensive computations
  const selectedTone = useMemo(() => tones.find(tone => tone.slug === reportTone), [reportTone]);
  const modelsDisabled = useMemo(
    () => !apiKey.trim() || !isApiKeyValid || isApiKeyValidating,
    [apiKey, isApiKeyValid, isApiKeyValidating]
  );

  // Improved API key validation with race condition prevention
  useEffect(() => {
    // Clear any existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const trimmedKey = apiKey.trim();

    // If the key is empty, immediately set as invalid
    if (!trimmedKey) {
      lastValidatedKeyRef.current = '';
      update({ isApiKeyValid: false, isApiKeyValidating: false });
      return;
    }

    // If this is the same key we just validated, skip validation
    if (trimmedKey === lastValidatedKeyRef.current && isApiKeyValid) {
      return;
    }

    // Increment sequence number for this validation attempt
    const currentSequence = ++validationSequenceRef.current;

    // Set validating state immediately for non-empty keys
    update({ isApiKeyValidating: true });

    // Debounced validation
    validationTimeoutRef.current = setTimeout(async () => {
      // Only proceed if this is still the latest validation request
      if (currentSequence === validationSequenceRef.current) {
        try {
          await validateApiKey(trimmedKey);
          lastValidatedKeyRef.current = trimmedKey;
        } catch (error) {
          console.error('API key validation error:', error);
        }
      }
    }, 800); // Increased debounce time to 800ms for better UX

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [apiKey, validateApiKey, update, isApiKeyValid]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setOpenSetting(false);
    setShowApiKey(false);
  }, [setOpenSetting]);

  const handleApiKeyToggle = useCallback(() => {
    setShowApiKey(prev => !prev);
  }, []);

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      update({ apiKey: e.target.value });
    },
    [update]
  );

  const handleCoreModelChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      update({ coreModel: e.target.value });
    },
    [update]
  );

  const handleTaskModelChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      update({ taskModel: e.target.value });
    },
    [update]
  );

  const handleToneChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      update({ reportTone: e.target.value });
    },
    [update]
  );

  const handleMinWordsChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      update({ minWords: newValue as number });
    },
    [update]
  );

  const handleThinkingBudgetChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      update({ thinkingBudget: newValue as number });
    },
    [update]
  );

  const handleParallelSearchChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      update({ parallelSearch: newValue as number });
    },
    [update]
  );

  const handleDepthChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      update({ depth: newValue as number });
    },
    [update]
  );

  const handleWideChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      update({ wide: newValue as number });
    },
    [update]
  );

  const handleToneInfoOpen = useCallback(() => {
    setToneInfoOpen(true);
  }, []);

  const handleToneInfoClose = useCallback(() => {
    setToneInfoOpen(false);
  }, []);

  return (
    <>
      <Dialog
        open={openSetting}
        maxWidth="md"
        fullWidth
        onClose={handleClose}
        fullScreen={fullScreen}
        scroll="paper"
      >
        <DialogTitle sx={{ pb: { xs: 0.5, sm: 1 }, pr: { xs: 2, sm: 3 }, pl: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" component="div">
            Research Settings
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }} dividers>
          <DialogContentText sx={{ mb: { xs: 2, sm: 3 } }}>
            Configure your research parameters and AI models. All settings are saved locally in your
            browser.
          </DialogContentText>

          {/* API Configuration Section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center' }}
            >
              🔑 API Configuration
            </Typography>

            {/* Api Key */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                API Key *{isApiKeyValidating && <CircularProgress size={16} sx={{ ml: 1 }} />}
                {apiKey.trim() && !isApiKeyValidating && (
                  <Chip
                    label={isApiKeyValid ? 'Valid' : 'Invalid'}
                    color={isApiKeyValid ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'block' } }}
              >
                Your Google GenAI API key for accessing AI models, get it from
                https://aistudio.google.com/
              </Typography>
              <TextField
                required
                fullWidth
                variant="outlined"
                size="small"
                margin="dense"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your API key"
                autoComplete="off"
                value={apiKey}
                onChange={handleApiKeyChange}
                error={apiKey.trim() !== '' && !isApiKeyValid && !isApiKeyValidating}
                helperText={
                  apiKey.trim() !== '' && !isApiKeyValid && !isApiKeyValidating
                    ? 'Invalid API key'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={handleApiKeyToggle}>
                      {showApiKey ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            {/* Models */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <ModelSelect
                  label="Core Model"
                  value={coreModel}
                  onChange={handleCoreModelChange}
                  modelList={modelList}
                  disabled={!isApiKeyValid}
                  modelsDisabled={modelsDisabled}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <ModelSelect
                  label="Task Model"
                  value={taskModel}
                  onChange={handleTaskModelChange}
                  modelList={modelList}
                  disabled={!isApiKeyValid}
                  modelsDisabled={modelsDisabled}
                />
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'block' } }}
            >
              Model selection is only available with a valid API key. Models are automatically
              loaded when your API key is validated.
            </Typography>
          </Box>

          <Divider sx={{ my: { xs: 2, sm: 3 } }} />

          {/* Research Parameters Section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center' }}
            >
              🔬 Research Parameters
            </Typography>

            {/* Report Tone */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Report Tone
                </Typography>
                <Tooltip title="Click to see all available tones and their descriptions">
                  <IconButton size="small" onClick={handleToneInfoOpen} sx={{ ml: 1 }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={reportTone}
                  onChange={handleToneChange}
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
                  sx={{ mt: 1, display: { xs: 'none', sm: 'block' } }}
                >
                  {selectedTone.describe}
                </Typography>
              )}
            </Box>

            {/* Min Words */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <SliderSetting
                label="Minimum Words"
                value={minWords}
                onChange={handleMinWordsChange}
                min={500}
                max={10000}
                step={500}
                formatLabel={value => value.toLocaleString()}
                description="The expected length of the report"
                marks={[
                  { value: 1000, label: '1K' },
                  { value: 5000, label: '5K' },
                  { value: 10000, label: '10K' },
                ]}
              />
            </Box>

            {/* Advanced Parameters - Two Column Layout with Proper Label Containment */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 2, sm: 4 },
                rowGap: { xs: 2, sm: 3 },
              }}
            >
              {/* Thinking Budget */}
              <SliderSetting
                label="Thinking Budget"
                value={thinkingBudget}
                onChange={handleThinkingBudgetChange}
                min={1024}
                max={16384}
                step={1024}
                formatLabel={value => value.toLocaleString()}
                description="This is the maximum number of tokens that the AI can use for internal reasoning before generating the final response."
                marks={[
                  { value: 1024, label: '1K' },
                  { value: 8192, label: '8K' },
                  { value: 16384, label: '16K' },
                ]}
              />

              {/* Parallel Search */}
              <SliderSetting
                label="Parallel Search"
                value={parallelSearch}
                onChange={handleParallelSearchChange}
                min={1}
                max={5}
                step={1}
                description="The number of simultaneous search queries executed in parallel to speed up the gathering of information."
                marks={[
                  { value: 1, label: 'Sequential' },
                  { value: 3, label: 'Moderate' },
                  { value: 5, label: 'Maximum' },
                ]}
              />

              {/* Research Depth */}
              <SliderSetting
                label="Research Depth"
                value={depth}
                onChange={handleDepthChange}
                min={2}
                max={5}
                step={1}
                description="What is the ideal number of research rounds to ensure a thorough coverage of a query? First, go broad. Then, go deep."
                marks={[
                  { value: 2, label: 'Light' },
                  { value: 3, label: 'Medium' },
                  { value: 4, label: 'Deep' },
                  { value: 5, label: 'Extensive' },
                ]}
              />

              {/* Research Width */}
              <SliderSetting
                label="Research Width"
                value={wide}
                onChange={handleWideChange}
                min={2}
                max={10}
                step={1}
                descriptionNode={
                  <>
                    What is the ideal number of distinct sources to consult{' '}
                    <span className="font-semibold">in each round</span> to ensure a broad
                    understanding of a query?
                  </>
                }
                marks={[
                  { value: 2, label: 'Focused' },
                  { value: 6, label: 'Balanced' },
                  { value: 10, label: 'Broad' },
                ]}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          <Button onClick={handleClose} variant="outlined" size="medium">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ToneInfoDialog open={toneInfoOpen} onClose={handleToneInfoClose} />
    </>
  );
});

export default SettingDialog;
