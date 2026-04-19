import React, { useState, useEffect } from 'react';
import {
  Box, Container, Tabs, Tab, AppBar, Toolbar, Typography, ThemeProvider, createTheme, CssBaseline,
  TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Slider, Chip, Stack,
  Paper, Card, CardContent, IconButton, Tooltip, Switch, FormControlLabel, Divider,
  LinearProgress, Alert, Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  ImageList, ImageListItem, ImageListItemBar, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Brush as BrushIcon, Image as ImageIcon, Collections as CollectionsIcon,
  WorkspacePremium as WorkspaceIcon, Settings as SettingsIcon, PlayArrow as PlayIcon,
  Refresh as RefreshIcon, ZoomIn as UpscaleIcon, AutoFixHigh as InpaintIcon,
  CropFree as OutpaintIcon, Shuffle as VariationIcon, Download as DownloadIcon,
  Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Info as InfoIcon,
  CloudUpload as UploadIcon, GridView as GridViewIcon, ViewList as ViewListIcon,
  Search as SearchIcon, FilterList as FilterIcon, Psychology as AIIcon,
  Code as CodeIcon, Gamepad as GamepadIcon, Memory as MemoryIcon,
  Speed as SpeedIcon, HighQuality as QualityIcon, Tune as TuneIcon,
  Visibility as ViewIcon, Fullscreen as FullscreenIcon, Compare as CompareIcon,
  Power as PowerIcon, BatteryFull as BatteryIcon, NetworkCheck as NetworkIcon,
  Storage as StorageIcon, DataUsage as DataIcon, Warning as WarningIcon,
  CheckCircle as CheckIcon, Error as ErrorIcon, Help as HelpIcon
} from '@mui/icons-material';
import './video-game-hud.css';

// Video Game HUD Theme
const hudTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: 'rgba(10, 15, 30, 0.95)',
    },
    primary: {
      main: '#00f5ff',
      light: '#80faff',
      dark: '#00a8b3',
    },
    secondary: {
      main: '#ff00ff',
      light: '#ff80ff',
      dark: '#b300b3',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", sans-serif',
    h1: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
    h3: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
    button: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [glitchTitle, setGlitchTitle] = useState('NEURAL ART SYSTEM');
  const [systemStatus, setSystemStatus] = useState({ cpu: 23, memory: 45, network: 'OPTIMAL' });

  // Glitch effect for title
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const original = 'NEURAL ART SYSTEM';
      let glitched = '';
      for (let i = 0; i < original.length; i++) {
        if (Math.random() > 0.9 && original[i] !== ' ') {
          glitched += chars[Math.floor(Math.random() * chars.length)];
        } else {
          glitched += original[i];
        }
      }
      setGlitchTitle(glitched);
      setTimeout(() => setGlitchTitle(original), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate system stats
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus({
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 20) + 40,
        network: 'OPTIMAL'
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={hudTheme}>
      <CssBaseline />
      <Box className="hud-app">
        {/* Video Game Background Effects */}
        <div className="game-bg"></div>
        <div className="scanlines"></div>
        <div className="crt-flicker"></div>
        <div className="digital-noise"></div>
        
        {/* Header / HUD Top */}
        <AppBar position="static" className="hud-header">
          <Toolbar className="hud-toolbar">
            <Box className="hud-logo">
              <MemoryIcon className="hud-logo-icon" />
              <Box>
                <Typography variant="h4" className="hud-title" data-text={glitchTitle}>
                  {glitchTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'Share Tech Mono', letterSpacing: '0.2em' }}>
                  v3.0 // VIDEO GAME INTERFACE // HUD MODE
                </Typography>
              </Box>
            </Box>
            
            {/* HUD Status Panel */}
            <Box className="hud-status">
              <Box className="hud-status-item">
                CPU: {systemStatus.cpu}%
              </Box>
              <Box className="hud-status-item">
                MEM: {systemStatus.memory}%
              </Box>
              <Box className="hud-status-item" sx={{ color: '#00ff41' }}>
                NET: {systemStatus.network}
              </Box>
              <Box className="hud-status-item" sx={{ borderColor: '#ff00ff', color: '#ff00ff' }}>
                ◆ ONLINE
              </Box>
            </Box>
          </Toolbar>
          
          {/* Game Menu Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            className="hud-tabs"
            textColor="primary"
            indicatorColor="transparent"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<BrushIcon />} label="GENERATE" className="hud-tab" />
            <Tab icon={<TuneIcon />} label="ADVANCED" className="hud-tab" />
            <Tab icon={<ImageIcon />} label="EDIT" className="hud-tab" />
            <Tab icon={<CollectionsIcon />} label="GALLERY" className="hud-tab" />
            <Tab icon={<WorkspaceIcon />} label="WORKSPACE" className="hud-tab" />
            <Tab icon={<SettingsIcon />} label="SYSTEM" className="hud-tab" />
          </Tabs>
        </AppBar>

        {/* Main Game Interface */}
        <Container maxWidth="xl" className="hud-main">
          <TabPanel value={activeTab} index={0}>
            <GeneratePanel />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AdvancedPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <EditPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <GalleryPanel />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <WorkspacePanel />
          </TabPanel>
          <TabPanel value={activeTab} index={5}>
            <SystemPanel />
          </TabPanel>
        </Container>

        {/* Footer / HUD Bottom */}
        <Box className="hud-footer">
          <Typography className="hud-footer-text">
            [SYSTEM] NEURAL ART v3.0 // PROTOCOL: ONLINE // HUD: ACTIVE // ATLANTEAN ARCHITECTURE
          </Typography>
          <Box className="hud-footer-stats">
            <Typography className="hud-footer-stat">
              API: <span>READY</span>
            </Typography>
            <Typography className="hud-footer-stat">
              GPU: <span>ONLINE</span>
            </Typography>
            <Typography className="hud-footer-stat">
              AI: <span>ACTIVE</span>
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function TabPanel({ children, value, index }) {
  return value === index ? (
    <Box className="tab-panel" sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {children}
    </Box>
  ) : null;
}

// GENERATE PANEL - Video Game Style
function GeneratePanel() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [provider, setProvider] = useState('huggingface');
  const [model, setModel] = useState('stabilityai/stable-diffusion-xl-base-1.0');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  
  const [steps, setSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999999));
  const [enhance, setEnhance] = useState(true);

  const providers = [
    { id: 'huggingface', name: 'HUGGING FACE', icon: '🤗' },
    { id: 'openai', name: 'OPENAI', icon: '🤖' },
    { id: 'replicate', name: 'REPLICATE', icon: '⚡' },
  ];

  const resolutions = [
    { w: 512, h: 512, label: '512²', ratio: '1:1' },
    { w: 768, h: 512, label: '768×512', ratio: '3:2' },
    { w: 512, h: 768, label: '512×768', ratio: '2:3' },
    { w: 1024, h: 1024, label: '1024²', ratio: '1:1 HD' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, provider, model, negativePrompt,
          steps, width, height, guidanceScale, seed, enhance
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
          {/* Corner Accents */}
          <Box className="hud-panel-accent top-left" />
          <Box className="hud-panel-accent top-right" />
          <Box className="hud-panel-accent bottom-left" />
          <Box className="hud-panel-accent bottom-right" />
          
          {/* Provider Selection */}
          <Typography className="hud-section-title">
            <AIIcon /> SELECT AI PROTOCOL
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            {providers.map((p) => (
              <Button
                key={p.id}
                variant={provider === p.id ? 'contained' : 'outlined'}
                onClick={() => setProvider(p.id)}
                className={`hud-button ${provider === p.id ? 'primary' : ''}`}
              >
                {p.icon} {p.name}
              </Button>
            ))}
          </Stack>

          {/* Prompt Input */}
          <Typography className="hud-section-title">
            <CodeIcon /> INPUT NEURAL PROMPT
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="DESCRIBE YOUR VISUAL CONSTRUCT..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="hud-input"
            disabled={isGenerating}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            placeholder="NEGATIVE PROMPT [ELEMENTS TO EXCLUDE]..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="hud-input"
            disabled={isGenerating}
          />

          {/* Advanced Controls */}
          <Typography className="hud-section-title" sx={{ mt: 3 }}>
            <TuneIcon /> CONFIGURATION MATRIX
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box className="hud-slider">
                <Typography gutterBottom sx={{ fontFamily: 'Share Tech Mono', color: '#00f5ff' }}>
                  PROCESSING STEPS: {steps}
                </Typography>
                <Slider
                  value={steps}
                  onChange={(e, v) => setSteps(v)}
                  min={10}
                  max={100}
                  step={5}
                  disabled={isGenerating}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box className="hud-slider">
                <Typography gutterBottom sx={{ fontFamily: 'Share Tech Mono', color: '#00f5ff' }}>
                  CFG SCALE: {guidanceScale}
                </Typography>
                <Slider
                  value={guidanceScale}
                  onChange={(e, v) => setGuidanceScale(v)}
                  min={1}
                  max={20}
                  step={0.5}
                  disabled={isGenerating}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom sx={{ fontFamily: 'Share Tech Mono', color: '#00f5ff' }}>
              RESOLUTION MATRIX
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {resolutions.map((res) => (
                <Chip
                  key={res.label}
                  label={`${res.label} [${res.ratio}]`}
                  onClick={() => { setWidth(res.w); setHeight(res.h); }}
                  className={`hud-chip ${width === res.w && height === res.h ? 'active' : ''}`}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />}
              label="NEURAL ENHANCEMENT"
              sx={{ color: '#00f5ff', fontFamily: 'Orbitron' }}
            />
            <TextField
              label="SEED"
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              size="small"
              className="hud-input"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setSeed(Math.floor(Math.random() * 999999999))} size="small" sx={{ color: '#00f5ff' }}>
                    <RefreshIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          {/* Generate Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="hud-button primary"
            startIcon={isGenerating ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <PlayIcon />}
            sx={{ mt: 3 }}
          >
            {isGenerating ? 'PROCESSING...' : 'INITIATE GENERATION'}
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Box className="hud-panel" sx={{ p: 3, height: '100%', position: 'relative' }}>
          <Box className="hud-panel-accent top-left" />
          <Box className="hud-panel-accent top-right" />
          <Box className="hud-panel-accent bottom-left" />
          <Box className="hud-panel-accent bottom-right" />
          
          <Typography className="hud-section-title">
            <ViewIcon /> VISUAL OUTPUT
          </Typography>
          
          <Box className="hud-display" sx={{ minHeight: '400px' }}>
            {result ? (
              <Box sx={{ width: '100%', p: 2 }}>
                <img
                  src={result.url}
                  alt="Generated"
                  style={{
                    width: '100%',
                    border: '2px solid #00f5ff',
                    boxShadow: '0 0 20px rgba(0,245,255,0.5)',
                  }}
                />
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                  <Button className="hud-button" startIcon={<DownloadIcon />}>
                    DOWNLOAD
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography className="hud-display-text">
                  AWAITING INPUT
                </Typography>
                <Box sx={{ width: '200px', height: '2px', bgcolor: 'rgba(0,245,255,0.3)', mt: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', width: '30%', height: '100%', bgcolor: '#00f5ff', animation: 'scanLine 2s linear infinite' }} />
                </Box>
              </Box>
            )}
          </Box>

          {isGenerating && (
            <Box sx={{ mt: 2 }}>
              <Box className="hud-loading">
                <Box className="hud-loading-bar" sx={{ width: '60%' }} />
              </Box>
              <Typography className="hud-loading-text">
                PROCESSING NEURAL CONSTRUCT...
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}

// Other panels (simplified for brevity)
function AdvancedPanel() {
  return (
    <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
      <Box className="hud-panel-accent top-left" />
      <Box className="hud-panel-accent top-right" />
      <Box className="hud-panel-accent bottom-left" />
      <Box className="hud-panel-accent bottom-right" />
      <Typography className="hud-section-title">
        <TuneIcon /> ADVANCED CONFIGURATION
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Advanced generation parameters and batch processing options will appear here.
      </Typography>
    </Box>
  );
}

function EditPanel() {
  return (
    <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
      <Box className="hud-panel-accent top-left" />
      <Box className="hud-panel-accent top-right" />
      <Box className="hud-panel-accent bottom-left" />
      <Box className="hud-panel-accent bottom-right" />
      <Typography className="hud-section-title">
        <ImageIcon /> NEURAL EDITING SUITE
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Image editing tools: Upscale, Inpaint, Outpaint, and Variations.
      </Typography>
    </Box>
  );
}

function GalleryPanel() {
  return (
    <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
      <Box className="hud-panel-accent top-left" />
      <Box className="hud-panel-accent top-right" />
      <Box className="hud-panel-accent bottom-left" />
      <Box className="hud-panel-accent bottom-right" />
      <Typography className="hud-section-title">
        <CollectionsIcon /> VISUAL ARCHIVE
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Your generated images gallery with filtering and organization.
      </Typography>
    </Box>
  );
}

function WorkspacePanel() {
  return (
    <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
      <Box className="hud-panel-accent top-left" />
      <Box className="hud-panel-accent top-right" />
      <Box className="hud-panel-accent bottom-left" />
      <Box className="hud-panel-accent bottom-right" />
      <Typography className="hud-section-title">
        <WorkspaceIcon /> PROJECT WORKSPACES
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Organize your creations into project workspaces.
      </Typography>
    </Box>
  );
}

function SystemPanel() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
          <Box className="hud-panel-accent top-left" />
          <Box className="hud-panel-accent top-right" />
          <Box className="hud-panel-accent bottom-left" />
          <Box className="hud-panel-accent bottom-right" />
          <Typography className="hud-section-title">
            <SettingsIcon /> SYSTEM STATUS
          </Typography>
          <Alert severity="success" sx={{ mb: 2, bgcolor: 'rgba(0,255,65,0.1)', border: '1px solid #00ff41' }}>
            All Systems Operational
          </Alert>
          <Typography sx={{ color: '#00f5ff', fontFamily: 'Share Tech Mono', mb: 2 }}>
            API Configuration:
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Edit /var/www/ai-generator/.env to configure API keys
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box className="hud-panel" sx={{ p: 3, position: 'relative' }}>
          <Box className="hud-panel-accent top-left" />
          <Box className="hud-panel-accent top-right" />
          <Box className="hud-panel-accent bottom-left" />
          <Box className="hud-panel-accent bottom-right" />
          <Typography className="hud-section-title">
            <CodeIcon /> API KEY SETUP
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Add your API keys to the .env file:
          </Typography>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.7)', p: 2, border: '1px solid rgba(0,245,255,0.3)', fontFamily: 'Share Tech Mono', fontSize: '0.85rem', color: '#00f5ff' }}>
            HUGGINGFACE_API_KEY=hf_...<br/>
            REPLICATE_API_TOKEN=r8_...<br/>
            OPENAI_API_KEY=sk-...
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

export default App;
