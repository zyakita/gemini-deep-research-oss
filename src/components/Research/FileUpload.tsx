import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import useDeepResearch from '../../hooks/useDeepResearch';
import { useTaskStore } from '../../stores/task';

interface FileUploadProps {
  disabled?: boolean;
}

function FileUpload({ disabled = false }: FileUploadProps) {
  const { files } = useTaskStore();
  const { uploadFile, deleteFile } = useDeepResearch();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
        // Reset input value to allow uploading the same file again
        event.target.value = '';
      }
    },
    [uploadFile]
  );

  const handleDelete = useCallback(
    async (fileName: string) => {
      if (window.confirm('Are you sure you want to delete this file?')) {
        try {
          await deleteFile(fileName);
        } catch (error) {
          console.error('Delete failed:', error);
        }
      }
    },
    [deleteFile]
  );

  const formatFileSize = (sizeBytes?: string) => {
    if (!sizeBytes) return 'Unknown size';
    const bytes = parseInt(sizeBytes);
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatExpirationTime = (expirationTime?: string) => {
    if (!expirationTime) return 'No expiration';
    const expTime = new Date(expirationTime);
    const now = new Date();
    const diffMs = expTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${diffDays}d ${remainingHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };

  const getExpirationColor = (expirationTime?: string) => {
    if (!expirationTime) return 'default';
    const expTime = new Date(expirationTime);
    const now = new Date();
    const diffMs = expTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) return 'error';
    if (diffHours < 6) return 'warning';
    if (diffHours < 24) return 'info';
    return 'success';
  };

  return (
    <Accordion
      className="mt-3"
      elevation={0}
      disableGutters
      sx={{
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className="min-h-0 px-0 py-2"
        sx={{
          '&.Mui-expanded': { minHeight: 0 },
          '& .MuiAccordionSummary-content': { margin: '8px 0' },
          '& .MuiAccordionSummary-content.Mui-expanded': { margin: '8px 0' },
        }}
      >
        <div className="flex items-center gap-2">
          <Typography variant="caption" className="tracking-wide text-gray-500 uppercase">
            Optional: Add Supporting Documents ({files.length})
          </Typography>
          <Tooltip
            title="The File API lets you store up to 50MB of PDF files. Files are stored for 48 hours. You can access them in that period with your API key, but you can't download them from the API. The File API is available at no cost in all regions where the Gemini API is available."
            placement="top"
            arrow
          >
            <HelpOutlineIcon
              fontSize="small"
              className="cursor-help text-gray-400 hover:text-gray-600"
            />
          </Tooltip>
        </div>
      </AccordionSummary>
      <AccordionDetails className="px-0 pt-0">
        <div className="mb-3 flex justify-end">
          <Button
            component="label"
            variant="text"
            size="small"
            startIcon={<CloudUploadIcon />}
            disabled={disabled || uploading}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Add File
            <input type="file" hidden onChange={handleFileSelect} accept="*/*" />
          </Button>
        </div>

        {uploading && (
          <Box className="mb-3">
            <Typography variant="caption" className="mb-1 block text-gray-600">
              Uploading file...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {files.length > 0 && (
          <List dense className="max-h-64 overflow-y-auto rounded-lg bg-gray-50">
            {files.map(file => (
              <ListItem key={file.name} className="py-2">
                <ListItemIcon>
                  <InsertDriveFileIcon className="text-gray-500" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {file.displayName || file.name?.split('/').pop()}
                      </span>
                      <Chip
                        label={formatExpirationTime(file.expirationTime)}
                        size="small"
                        variant="outlined"
                        color={
                          getExpirationColor(file.expirationTime) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        className="text-xs"
                      />
                    </span>
                  }
                  secondary={
                    <span className="text-xs text-gray-600">
                      {formatFileSize(file.sizeBytes)} • {file.mimeType}
                    </span>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => file.name && handleDelete(file.name)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {files.length === 0 && !uploading && (
          <Box className="py-2 text-center text-gray-400">
            <Typography variant="caption" className="text-xs">
              You can optionally add documents to enhance your research with additional context.
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default FileUpload;
