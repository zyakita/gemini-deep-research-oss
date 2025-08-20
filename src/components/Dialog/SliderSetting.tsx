import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import React, { memo } from 'react';

interface SliderSettingProps {
  label: string;
  value: number;
  onChange: (event: Event, newValue: number | number[]) => void;
  min: number;
  max: number;
  step: number;
  marks: Array<{ value: number; label: string }>;
  description?: string;
  formatLabel?: (value: number) => string;
  descriptionNode?: React.ReactNode;
}

const SliderSetting = memo(function SliderSetting({
  label,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  description,
  formatLabel,
  descriptionNode,
}: SliderSettingProps) {
  const displayValue = formatLabel ? formatLabel(value) : value;

  return (
    <Box className="px-2">
      <Typography variant="subtitle1" className="mb-1 font-medium">
        {label} ({displayValue})
      </Typography>
      {(description || descriptionNode) && (
        <Typography
          variant="caption"
          color="text.secondary"
          className="mb-1 hidden sm:mb-2 sm:block"
        >
          {descriptionNode || description}
        </Typography>
      )}
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        size="small"
        className="mx-0.5 sm:mx-1"
        sx={{
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
        marks={marks}
      />
    </Box>
  );
});

export default SliderSetting;
