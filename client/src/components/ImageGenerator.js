import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Paper,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as EnhanceIcon,
  ContentCopy as CopyIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  BatchPrediction as BatchIcon,
  Hub as ProviderIcon
} from '@mui/icons-material';
import { generateDirect, fetchProviders, fetchSamplers, fetchStyles } from '../services/api';
import { useGeneration } from '../contexts/GenerationContext';
import '../styles/generator.css';

const ImageGenerator = () => {
  const { isGenerating, setIsGenerating, addGeneratedImage } = useGeneration();
  
  // Basic settings
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('huggingface');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedStylePreset, setSelectedStylePreset] = useState('none');
  
  // Advanced settings
  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999999));
  const [steps, setSteps] = useState(30);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [sampler, setSampler] = useState('DPM++ 2M Karras');
  
  // Options
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [batchSize, setBatchSize] = useState(4);
  
  // Data
  const [providers, setProviders] = useState([]);
  const [samplers, setSamplers] = useState([]);
  const [styles, setStyles] = useState({ categories: {}, presets: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Status
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [providersRes, samplersRes, stylesRes] = await Promise.all([
        fetchProviders(),
        fetchSamplers(),
        fetchStyles()
      ]);
      
      setProviders(providersRes.providers || []);
      setSamplers(samplersRes || []);
      setStyles(stylesRes || { categories: {}, presets: [] });
      
      if (providersRes.providers?.length > 0) {
        setSelectedModel(providersRes.providers[0].models?.[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to load options:', error);
      setError('Failed to load configuration options');
    }
  };

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider?.models?.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const params = {
        prompt,
        provider: selectedProvider,
        model: selectedModel,
        negativePrompt,
        seed,
        steps,
        width,
        height,
        guidanceScale,
        sampler,
        style: selectedStyle,
        stylePreset: selectedStylePreset,
        enhance: enhancePrompt
      };

      const result = await generateDirect(params);
      addGeneratedImage(result);
      setSuccess('Image generated successfully!');
      
      setSeed(Math.floor(Math.random() * 999999999));
    } catch (error) {
      setError(typeof error === 'string' ? error : 'Failed to generate image');
      console.error('Generation error:', error);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999999));
  };

  const commonResolutions = [
    { width: 512, height: 512, label: 'Square', size: '512×512' },
    { width: 768, height: 512, label: 'Landscape', size: '768×512' },
    { width: 512, height: 768, label: 'Portrait', size: '512×768' },
    { width: 1024, height: 1024, label: 'HD Square', size: '1024×1024' },
    { width: 1024, height: 720, label: 'HD Wide', size: '1024×720' },
    { width: 720, height: 1024, label: 'HD Tall', size: '720×1024' }
  ];

  const getCurrentProvider = () => providers.find(p => p.id === selectedProvider);

  return (
    <Box className="generator-container">
      <Typography variant="h4" component="h1" align="center" className="main-title" gutterBottom>
        Create Stunning Visuals
      </Typography>
      <Typography variant="body1" align="center" className="subtitle" sx={{ mb: 4, opacity: 0.7 }}>
        Text-to-image generation with multiple AI providers, custom styles, and advanced controls
      </Typography>

      <Grid container spacing={3}>
        {/* Main Generation Panel */}
        <Grid item xs={12} lg={8}>
          <Card className="generator-card">
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {isGenerating && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Generating image with {getCurrentProvider()?.name}...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              {/* Prompt Input */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe your image"
                placeholder="A majestic dragon soaring through clouds at sunset, intricate scales, dramatic lighting..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                variant="outlined"
                disabled={isGenerating}
                sx={{ mb: 2 }}
              />

              {/* Provider Selection */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'surface.main' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProviderIcon fontSize="small" />
                  AI Provider
                </Typography>
                
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {providers.map((provider) => (
                    <Chip
                      key={provider.id}
                      label={provider.name}
                      onClick={() => handleProviderChange(provider.id)}
                      color={selectedProvider === provider.id ? 'primary' : 'default'}
                      variant={selectedProvider === provider.id ? 'filled' : 'outlined'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="Model"
                    disabled={isGenerating}
                    size="small"
                  >
                    {getCurrentProvider()?.models?.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box>
                          <Typography variant="body2">{model.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quality: {model.quality}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              {/* Style Presets */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'surface.main' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Style Presets
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {styles.presets?.map((preset) => (
                    <Tooltip key={preset.id} title={preset.description || ''}>
                      <Chip
                        label={`${preset.icon} ${preset.name}`}
                        onClick={() => setSelectedStylePreset(
                          selectedStylePreset === preset.id ? 'none' : preset.id
                        )}
                        color={selectedStylePreset === preset.id ? 'secondary' : 'default'}
                        variant={selectedStylePreset === preset.id ? 'filled' : 'outlined'}
                        sx={{ mb: 1 }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Paper>

              {/* Style Categories */}
              <Accordion sx={{ mb: 2, bgcolor: 'surface.main' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Art Styles & Categories</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(styles.categories || {}).map(([category, items]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.7 }}>
                        {category}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {items.map((style) => (
                          <Chip
                            key={style.id}
                            label={style.name}
                            size="small"
                            onClick={() => setSelectedStyle(
                              selectedStyle === style.id ? '' : style.id
                            )}
                            color={selectedStyle === style.id ? 'primary' : 'default'}
                            variant={selectedStyle === style.id ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* Generate Button */}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayIcon />}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Panel */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Settings
              </Typography>

              {/* Quick Options */}
              <Stack spacing={2} sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enhancePrompt}
                      onChange={(e) => setEnhancePrompt(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EnhanceIcon fontSize="small" />
                      Enhance Prompt
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={batchMode}
                      onChange={(e) => setBatchMode(e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BatchIcon fontSize="small" />
                      Batch Mode
                    </Box>
                  }
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Resolution */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Resolution
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {commonResolutions.map((res) => (
                  <Chip
                    key={res.label}
                    label={res.size}
                    size="small"
                    onClick={() => {
                      setWidth(res.width);
                      setHeight(res.height);
                    }}
                    color={width === res.width && height === res.height ? 'primary' : 'default'}
                    variant={width === res.width && height === res.height ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Advanced Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Advanced Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Negative Prompt"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      size="small"
                    />

                    <Box>
                      <Typography variant="caption">Steps: {steps}</Typography>
                      <Slider
                        value={steps}
                        onChange={(e, value) => setSteps(value)}
                        min={10}
                        max={100}
                        step={5}
                        size="small"
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption">Guidance Scale: {guidanceScale}</Typography>
                      <Slider
                        value={guidanceScale}
                        onChange={(e, value) => setGuidanceScale(value)}
                        min={1}
                        max={20}
                        step={0.5}
                        size="small"
                      />
                    </Box>

                    <FormControl fullWidth size="small">
                      <InputLabel>Sampler</InputLabel>
                      <Select
                        value={sampler}
                        onChange={(e) => setSampler(e.target.value)}
                        label="Sampler"
                      >
                        {samplers.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Seed"
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={handleRandomSeed} size="small">
                            <RefreshIcon />
                          </IconButton>
                        ),
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImageGenerator;