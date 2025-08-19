import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

interface ModelSelectProps {
  label: string;
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  modelList: string[];
  disabled: boolean;
  modelsDisabled: boolean;
}

const ModelSelect = memo(function ModelSelect({
  label,
  value,
  onChange,
  modelList,
  disabled,
  modelsDisabled,
}: ModelSelectProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
        {modelsDisabled && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            (disabled)
          </Typography>
        )}
      </Typography>
      <FormControl fullWidth size="small" disabled={modelsDisabled}>
        <Select value={value} disabled={disabled} onChange={onChange} displayEmpty>
          {modelList.map(model => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
});

export default ModelSelect;
