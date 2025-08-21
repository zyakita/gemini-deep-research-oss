import CloseIcon from '@mui/icons-material/Close';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import tones from '../../consts/tones';
import { useSettingStore } from '../../stores/setting';

interface ToneInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

function ToneInfoDialog({ open, onClose }: ToneInfoDialogProps) {
  const { reportTone } = useSettingStore();
  const selectedTone = tones.find(tone => tone.slug === reportTone);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h6" component="div">
          Report Tone Options
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers className="max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {tones.map(tone => (
            <Paper
              key={tone.slug}
              elevation={1}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Typography variant="body1" className="font-medium" color="primary" gutterBottom>
                {tone.name}
                {selectedTone?.slug === tone.slug && (
                  <Chip label="Selected" size="small" color="primary" sx={{ ml: 1 }} />
                )}
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                {tone.describe}
              </Typography>
              <div>
                <Typography variant="subtitle2" color="text.secondary">
                  Best used for:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tone.usage}
                </Typography>
              </div>
            </Paper>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ToneInfoDialog;
