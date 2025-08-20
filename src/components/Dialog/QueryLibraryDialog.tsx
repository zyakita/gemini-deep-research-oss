import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { memo, useEffect, useMemo, useState } from 'react';
import { useGlobalStore } from '../../stores/global';
import { useQueryLibraryStore } from '../../stores/queryLibrary';
import { useTaskStore } from '../../stores/task';
import { builtInTemplates } from '../../templates/builtInTemplates';
import QueryTemplateDialog from './QueryTemplateDialog';

const QueryLibraryDialog = memo(function QueryLibraryDialog() {
  const { openQueryLibrary, setOpenQueryLibrary } = useGlobalStore();
  const { setQuery } = useTaskStore();
  const {
    templates,
    showBuiltInTemplates,
    searchTerm,
    setShowBuiltInTemplates,
    setSearchTerm,
    initializeBuiltInTemplates,
    deleteTemplate,
  } = useQueryLibraryStore();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  // Initialize built-in templates on first load and whenever builtInTemplates changes
  useEffect(() => {
    initializeBuiltInTemplates(builtInTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeBuiltInTemplates, builtInTemplates]);

  // Compute filtered templates reactively
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (!showBuiltInTemplates) {
      filtered = filtered.filter(template => !template.isBuiltIn);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        template =>
          template.title.toLowerCase().includes(term) ||
          template.content.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [templates, showBuiltInTemplates, searchTerm]);

  const handleCopyTemplate = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  const handleUseTemplate = (content: string) => {
    setQuery(content);
    setOpenQueryLibrary(false);
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setOpenTemplateDialog(true);
  };

  const handleEdit = (template: { id: string; title: string; content: string }) => {
    if (template.id.startsWith('builtin-')) return; // Prevent editing built-in templates
    setEditingTemplate(template);
    setOpenTemplateDialog(true);
  };

  const handleDelete = (templateId: string) => {
    if (templateId.startsWith('builtin-')) return; // Prevent deleting built-in templates
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  const handleClose = () => {
    setOpenQueryLibrary(false);
    setSearchTerm('');
  };

  return (
    <>
      <Dialog
        open={openQueryLibrary}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Query Library</Typography>
            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddNew}>
              Add New
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>

          <Box mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBuiltInTemplates}
                  onChange={e => setShowBuiltInTemplates(e.target.checked)}
                />
              }
              label="Show built-in templates"
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {filteredTemplates.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? 'No templates match your search.' : 'No templates available.'}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    ...(selectedTemplate === template.id && {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    }),
                  }}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <Box>
                        <Typography variant="h6" component="div" gutterBottom>
                          {template.title}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          {template.isBuiltIn && (
                            <Chip
                              label="Built-in"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleCopyTemplate(template.content);
                          }}
                          title="Copy content"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        {!template.isBuiltIn && (
                          <>
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleEdit(template);
                              }}
                              title="Edit template"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleDelete(template.id);
                              }}
                              title="Delete template"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {template.content}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={e => {
                        e.stopPropagation();
                        handleUseTemplate(template.content);
                      }}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <QueryTemplateDialog
        open={openTemplateDialog}
        onClose={() => {
          setOpenTemplateDialog(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
      />
    </>
  );
});

export default QueryLibraryDialog;
