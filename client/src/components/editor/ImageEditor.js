import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  ZoomIn as UpscaleIcon,
  AutoFixHigh as InpaintIcon,
  CropFree as OutpaintIcon,
  Shuffle as VariationIcon,
  Transform as TransformIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { 
  upscaleImage, 
  inpaintImage, 
  outpaintImage, 
  generateVariations,
  imageToImage,
  fetchUpscaleModels 
} from '../services/api';
import { useGeneration } from '../contexts/GenerationContext';

const ImageEditor = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Upscale settings
  const [upscaleScale, setUpscaleScale] = useState(4);
  const [upscaleModel, setUpscaleModel] = useState('real-esrgan-x4');
  const [upscaleModels, setUpscaleModels] = useState([]);
  const [faceEnhance, setFaceEnhance] = useState(false);
  
  // Inpaint settings
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [inpaintStrength, setInpaintStrength] = useState(0.75);
  
  // Outpaint settings
  const [outpaintDirection, setOutpaintDirection] = useState('all');
  const [outpaintExpansion, setOutpaintExpansion] = useState(512);
  
  // Variation settings
  const [variationCount, setVariationCount] = useState(4);
  const [variationStrength, setVariationStrength] = useState(0.7);
  
  // Img2img settings
  const [img2imgPrompt, setImg2imgPrompt] = useState('');
  const [img2imgStrength, setImg2imgStrength] = useState(0.75);

  React.useEffect(() => {
    loadUpscaleModels();
  }, []);

  const loadUpscaleModels = async () => {
    try {
      const models = await fetchUpscaleModels();
      setUpscaleModels(models);
    } catch (error) {
      console.error('Failed to load upscale models:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1
  });

  const handleUpscale = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('scale', upscaleScale);
      formData.append('model', upscaleModel);
      formData.append('faceEnhance', faceEnhance);
      
      const response = await upscaleImage(formData);
      setResult(response);
    } catch (err) {
      setError(err.error || 'Upscaling failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInpaint = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('prompt', inpaintPrompt);
      formData.append('strength', inpaintStrength);
      
      const response = await inpaintImage(formData);
      setResult(response);
    } catch (err) {
      setError(err.error || 'Inpainting failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOutpaint = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('direction', outpaintDirection);
      formData.append('expansion', outpaintExpansion);
      
      const response = await outpaintImage(formData);
      setResult(response);
    } catch (err) {
      setError(err.error || 'Outpainting failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVariations = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('count', variationCount);
      formData.append('strength', variationStrength);
      
      const response = await generateVariations(formData);
      setResult(response);
    } catch (err) {
      setError(err.error || 'Generating variations failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImg2Img = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('prompt', img2imgPrompt);
      formData.append('strength', img2imgStrength);
      
      const response = await imageToImage(formData);
      setResult(response);
    } catch (err) {
      setError(err.error || 'Image-to-image failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result?.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename || 'edited-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const editingTools = [
    { 
      label: 'Upscale', 
      icon: <UpscaleIcon />, 
      description: 'Enhance resolution with AI',
      color: '#00d4ff'
    },
    { 
      label: 'Inpaint', 
      icon: <InpaintIcon />, 
      description: 'Remove or add elements',
      color: '#ff00ff'
    },
    { 
      label: 'Outpaint', 
      icon: <OutpaintIcon />, 
      description: 'Extend image boundaries',
      color: '#00ff88'
    },
    { 
      label: 'Variations', 
      icon: <VariationIcon />, 
      description: 'Generate similar images',
      color: '#ffaa00'
    },
    { 
      label: 'Img2Img', 
      icon: <TransformIcon />, 
      description: 'Transform with prompt',
      color: '#aa00ff'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Image Editor
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.7 }}>
        Enhance, edit, and transform your images with AI-powered tools
      </Typography>

      <Grid container spacing={3}>
        {/* Image Upload */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Image
              </Typography>
              
              {!previewUrl ? (
                <Paper
                  {...getRootProps()}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'primary.dark' : 'surface.main',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <UploadIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>
                    {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    Supports PNG, JPG, WEBP
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        display: 'block'
                      }}
                    />
                    <IconButton
                      onClick={clearImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'error.main',
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Tool Selection */}
          {previewUrl && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Tool
                </Typography>
                <Stack spacing={1}>
                  {editingTools.map((tool, index) => (
                    <Button
                      key={tool.label}
                      variant={activeTab === index ? 'contained' : 'outlined'}
                      startIcon={tool.icon}
                      onClick={() => setActiveTab(index)}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        borderColor: activeTab === index ? tool.color : undefined,
                        bgcolor: activeTab === index ? tool.color : undefined
                      }}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="button">{tool.label}</Typography>
                        <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                          {tool.description}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Tool Settings & Preview */}
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isProcessing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Processing...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Upscale Settings */}
          {activeTab === 0 && previewUrl && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Upscaling
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Scale Factor</InputLabel>
                      <Select
                        value={upscaleScale}
                        onChange={(e) => setUpscaleScale(e.target.value)}
                        label="Scale Factor"
                      >
                        <MenuItem value={2}>2x (Double)</MenuItem>
                        <MenuItem value={4}>4x (Quadruple)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={upscaleModel}
                        onChange={(e) => setUpscaleModel(e.target.value)}
                        label="Model"
                      >
                        {upscaleModels.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            <Box>
                              <Typography>{model.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {model.useCase}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Chip
                      label="Face Enhancement"
                      clickable
                      color={faceEnhance ? 'primary' : 'default'}
                      onClick={() => setFaceEnhance(!faceEnhance)}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Preview
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'surface.main' }}>
                      <Typography variant="caption" display="block">
                        Original: {selectedImage?.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Size: {(selectedImage?.size / 1024).toFixed(1)} KB
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Output will be {upscaleScale}x larger
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UpscaleIcon />}
                  onClick={handleUpscale}
                  disabled={isProcessing}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Upscale Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Inpaint Settings */}
          {activeTab === 1 && previewUrl && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inpainting
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
                  Upload a mask image highlighting areas to regenerate, or describe what to add/remove
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Strength: {inpaintStrength}</Typography>
                  <Slider
                    value={inpaintStrength}
                    onChange={(e, v) => setInpaintStrength(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </Box>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<InpaintIcon />}
                  onClick={handleInpaint}
                  disabled={isProcessing}
                  fullWidth
                >
                  Inpaint Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Outpaint Settings */}
          {activeTab === 2 && previewUrl && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outpainting
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={outpaintDirection}
                    onChange={(e) => setOutpaintDirection(e.target.value)}
                    label="Direction"
                  >
                    <MenuItem value="all">All Directions</MenuItem>
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                    <MenuItem value="vertical">Vertical</MenuItem>
                    <MenuItem value="left">Left Only</MenuItem>
                    <MenuItem value="right">Right Only</MenuItem>
                    <MenuItem value="up">Up Only</MenuItem>
                    <MenuItem value="down">Down Only</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Expansion: {outpaintExpansion}px</Typography>
                  <Slider
                    value={outpaintExpansion}
                    onChange={(e, v) => setOutpaintExpansion(v)}
                    min={256}
                    max={1024}
                    step={64}
                  />
                </Box>

                <Button
                  variant="contained"
                  sx={{ bgcolor: '#00ff88', '&:hover': { bgcolor: '#00cc6a' } }}
                  startIcon={<OutpaintIcon />}
                  onClick={handleOutpaint}
                  disabled={isProcessing}
                  fullWidth
                >
                  Extend Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Variations Settings */}
          {activeTab === 3 && previewUrl && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generate Variations
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Number of Variations: {variationCount}</Typography>
                  <Slider
                    value={variationCount}
                    onChange={(e, v) => setVariationCount(v)}
                    min={1}
                    max={4}
                    step={1}
                    marks
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Variation Strength: {variationStrength}</Typography>
                  <Slider
                    value={variationStrength}
                    onChange={(e, v) => setVariationStrength(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </Box>

                <Button
                  variant="contained"
                  sx={{ bgcolor: '#ffaa00', '&:hover': { bgcolor: '#cc8800' } }}
                  startIcon={<VariationIcon />}
                  onClick={handleVariations}
                  disabled={isProcessing}
                  fullWidth
                >
                  Generate Variations
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Img2Img Settings */}
          {activeTab === 4 && previewUrl && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Image to Image
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Transformation Strength: {img2imgStrength}</Typography>
                  <Slider
                    value={img2imgStrength}
                    onChange={(e, v) => setImg2imgStrength(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </Box>

                <Button
                  variant="contained"
                  sx={{ bgcolor: '#aa00ff', '&:hover': { bgcolor: '#8800cc' } }}
                  startIcon={<TransformIcon />}
                  onClick={handleImg2Img}
                  disabled={isProcessing || !img2imgPrompt}
                  fullWidth
                >
                  Transform Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Result Display */}
          {result && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Result
                </Typography>
                
                {result.variations ? (
                  <Grid container spacing={2}>
                    {result.variations.map((variation, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Paper sx={{ p: 1 }}>
                          <img
                            src={variation.url}
                            alt={`Variation ${idx + 1}`}
                            style={{ width: '100%', borderRadius: 4 }}
                          />
                          <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                            Variation {idx + 1}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box>
                    <img
                      src={result.url}
                      alt="Result"
                      style={{ width: '100%', borderRadius: 8, mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                      fullWidth
                    >
                      Download Result
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImageEditor;