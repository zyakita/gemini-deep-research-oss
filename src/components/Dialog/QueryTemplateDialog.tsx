import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { memo, useEffect, useState } from 'react';
import { useQueryLibraryStore } from '../../stores/queryLibrary';

interface QueryTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  editingTemplate: {
    id: string;
    title: string;
    content: string;
  } | null;
}

const QueryTemplateDialog = memo(function QueryTemplateDialog({
  open,
  onClose,
  editingTemplate,
}: QueryTemplateDialogProps) {
  const { addTemplate, updateTemplate } = useQueryLibraryStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // Reset form when dialog opens/closes or editing template changes
  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setTitle(editingTemplate.title);
        setContent(editingTemplate.content);
      } else {
        setTitle('');
        setContent('');
      }
      setErrors({});
    }
  }, [open, editingTemplate]);

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, trimmedTitle, trimmedContent);
    } else {
      addTemplate(trimmedTitle, trimmedContent);
    }

    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Template Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          margin="normal"
          variant="outlined"
          placeholder="Enter a descriptive title for your template"
        />

        <Typography variant="body2" color="text.secondary" className="mt-2 mb-1">
          Template Content
        </Typography>

        <TextareaAutosize
          minRows={12}
          maxRows={20}
          className={`w-full rounded-lg border-2 p-4 text-base transition-colors focus:outline-none ${
            errors.content
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
          }`}
          placeholder="Enter your query template content. You can use placeholders like [Company Name] or [Industry] that users can replace..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        {errors.content && (
          <Typography variant="caption" color="error" className="mt-1 block">
            {errors.content}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" className="mt-1 block">
          {content.length} characters • Use square brackets like [Company Name] for placeholders
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button className="text-gray-300" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          // variant="contained"
          disabled={!title.trim() || !content.trim()}
        >
          {editingTemplate ? 'Update' : 'Save'} Template
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default QueryTemplateDialog;
