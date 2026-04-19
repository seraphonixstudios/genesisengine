import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  ZoomIn as ZoomIcon,
  Clear as ClearIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  SelectAll as SelectAllIcon
} from '@mui/icons-material';
import { fetchGallery, searchGallery, deleteImage, getImageUrl } from '../../services/api';
import { useGeneration } from '../../contexts/GenerationContext';

const Gallery = () => {
  const { generatedImages } = useGeneration();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImages, setSelectedImages] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [images, searchQuery, filterType, sortBy, dateRange]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetchGallery();
      setImages(response.images || []);
      setFilteredImages(response.images || []);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...images];

    // Search filter
    if (searchQuery) {
      result = result.filter(img => 
        img.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType) {
      result = result.filter(img => {
        if (filterType === 'generated') return !img.filename.includes('_');
        if (filterType === 'upscaled') return img.filename.includes('_upscaled');
        if (filterType === 'edited') return img.filename.includes('_inpainted') || img.filename.includes('_outpainted');
        if (filterType === 'variation') return img.filename.includes('_variation');
        return true;
      });
    }

    // Date range filter
    if (dateRange.from) {
      result = result.filter(img => new Date(img.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      result = result.filter(img => new Date(img.createdAt) <= new Date(dateRange.to));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    setFilteredImages(result);
  };

  const handleDelete = async (filename) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteImage(filename);
        setImages(prev => prev.filter(img => img.filename !== filename));
        setSelectedImage(null);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };

  const handleDownload = (image) => {
    const link = document.createElement('a');
    link.href = getImageUrl(image.filename);
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectImage = (filename) => {
    setSelectedImages(prev => 
      prev.includes(filename) 
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  const handleSelectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img.filename));
    }
  };

  const getImageType = (filename) => {
    if (filename.includes('_upscaled')) return 'Upscaled';
    if (filename.includes('_inpainted')) return 'Inpainted';
    if (filename.includes('_outpainted')) return 'Outpainted';
    if (filename.includes('_variation')) return 'Variation';
    if (filename.includes('_img2img')) return 'Transformed';
    return 'Generated';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Upscaled': return '#00d4ff';
      case 'Inpainted': return '#ff00ff';
      case 'Outpainted': return '#00ff88';
      case 'Variation': return '#ffaa00';
      case 'Transformed': return '#aa00ff';
      default: return '#888';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gallery
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.7 }}>
        Browse and manage your generated images
      </Typography>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.5 }} />
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="generated">Generated</MenuItem>
                  <MenuItem value="upscaled">Upscaled</MenuItem>
                  <MenuItem value="edited">Edited</MenuItem>
                  <MenuItem value="variation">Variations</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="size">Size</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>

              <Button
                variant="outlined"
                startIcon={viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {filteredImages.length} images
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Gallery Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredImages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No images found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate some images to see them here
          </Typography>
        </Paper>
      ) : (
        <ImageList 
          cols={viewMode === 'grid' ? { xs: 2, sm: 3, md: 4, lg: 5 } : 1} 
          gap={16}
          variant="masonry"
        >
          {filteredImages.map((image) => {
            const imageType = getImageType(image.filename);
            return (
              <ImageListItem 
                key={image.filename}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 }
                }}
              >
                <img
                  src={getImageUrl(image.filename)}
                  alt={image.filename}
                  loading="lazy"
                  style={{ 
                    borderRadius: 8,
                    border: selectedImages.includes(image.filename) ? '2px solid #00d4ff' : 'none'
                  }}
                  onClick={() => setSelectedImage(image)}
                />
                <ImageListItemBar
                  title={image.filename}
                  subtitle={`${formatSize(image.size)} • ${formatDate(image.createdAt)}`}
                  actionIcon={
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={imageType}
                        size="small"
                        sx={{ 
                          bgcolor: getTypeColor(imageType),
                          color: '#000',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.filename);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                  sx={{
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'
                  }}
                />
              </ImageListItem>
            );
          })}
        </ImageList>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle>
              {selectedImage.filename}
              <Chip 
                label={getImageType(selectedImage.filename)}
                size="small"
                sx={{ 
                  ml: 2,
                  bgcolor: getTypeColor(getImageType(selectedImage.filename)),
                  color: '#000'
                }}
              />
            </DialogTitle>
            <DialogContent>
              <img
                src={getImageUrl(selectedImage.filename)}
                alt={selectedImage.filename}
                style={{ 
                  width: '100%', 
                  borderRadius: 8,
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Size: {formatSize(selectedImage.size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(selectedImage.createdAt)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedImage(null)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(selectedImage)}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDelete(selectedImage.filename)}
              >
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Gallery;