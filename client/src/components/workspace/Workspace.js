import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  MoreVert as MoreIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import {
  fetchWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace
} from '../../services/api';

const Workspace = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await fetchWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, formData);
      } else {
        await createWorkspace(formData);
      }
      setDialogOpen(false);
      setFormData({ name: '', description: '' });
      setEditingWorkspace(null);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workspace?')) {
      try {
        await deleteWorkspace(id);
        loadWorkspaces();
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      }
    }
  };

  const openEditDialog = (workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description || ''
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingWorkspace(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
  };

  const viewWorkspace = async (id) => {
    try {
      const workspace = await getWorkspace(id);
      setSelectedWorkspace(workspace);
    } catch (error) {
      console.error('Failed to load workspace details:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Workspaces
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.7 }}>
            Organize your images into projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Workspace
        </Button>
      </Box>

      {workspaces.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No workspaces yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a workspace to organize your generated images
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Create Workspace
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {workspaces.map((workspace) => (
            <Grid item xs={12} sm={6} md={4} key={workspace.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => viewWorkspace(workspace.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <FolderIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main', opacity: 0.8 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap>
                        {workspace.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {workspace.description || 'No description'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      icon={<ImageIcon />}
                      label={`${workspace.imageCount} images`}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Updated {formatDate(workspace.updatedAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<OpenIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        viewWorkspace(workspace.id);
                      }}
                    >
                      Open
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(workspace);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workspace.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workspace Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingWorkspace ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workspace Details Dialog */}
      <Dialog
        open={!!selectedWorkspace}
        onClose={() => setSelectedWorkspace(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedWorkspace && (
          <>
            <DialogTitle>
              {selectedWorkspace.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedWorkspace.description || 'No description'}
              </Typography>
              
              {selectedWorkspace.images?.length > 0 ? (
                <Grid container spacing={2}>
                  {selectedWorkspace.images.map((image) => (
                    <Grid item xs={6} sm={4} md={3} key={image.id}>
                      <Paper sx={{ p: 1 }}>
                        <img
                          src={image.url}
                          alt={image.filename}
                          style={{ 
                            width: '100%', 
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                        />
                        <Typography variant="caption" display="block" noWrap sx={{ mt: 1 }}>
                          {image.filename}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">
                    No images in this workspace
                  </Typography>
                </Paper>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedWorkspace(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Workspace;