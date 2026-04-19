import React, { useState, useEffect } from 'react';
import {
  Box, Container, Tabs, Tab, AppBar, Toolbar, Typography, ThemeProvider, createTheme, CssBaseline,
  TextField, Button, Grid, Slider, Chip, Stack, Paper, Card, CardContent, IconButton, 
  LinearProgress, CircularProgress, Alert, Divider, Fade, Slide
} from '@mui/material';
import {
  Brush as BrushIcon, Image as ImageIcon, Collections as CollectionsIcon,
  WorkspacePremium as WorkspaceIcon, Settings as SettingsIcon, PlayArrow as PlayIcon,
  Refresh as RefreshIcon, Tune as TuneIcon, Code as CodeIcon, Psychology as AIIcon,
  ViewIcon, Memory as MemoryIcon, Login as LoginIcon, PersonAdd as RegisterIcon,
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import './video-game-hud.css';

const hudTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#000000', paper: 'rgba(10, 15, 30, 0.95)' },
    primary: { main: '#00f5ff', light: '#80faff', dark: '#00a8b3' },
    secondary: { main: '#ff00ff' },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", sans-serif',
    h1: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
    button: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
  },
});

// LOGIN COMPONENT
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Demo login - accept any credentials for now
    setTimeout(() => {
      setLoading(false);
      onLogin({ email, id: 'user_' + Date.now() });
    }, 1000);
  };

  return (
    <Box className="login-container">
      <Fade in timeout={1000}>
        <Card className="login-card">
          <CardContent sx={{ p: 4 }}>
            <Box className="login-logo">
              <MemoryIcon sx={{ fontSize: 64, color: '#00f5ff', filter: 'drop-shadow(0 0 20px #00f5ff)' }} />
            </Box>
            
            <Typography variant="h4" className="login-title">
              WELCOME BACK
            </Typography>
            
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', mb: 3 }}>
              Sign in to create amazing AI art
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255,0,0,0.1)', border: '1px solid #ff0044' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Typography className="login-label">
                <CodeIcon sx={{ fontSize: 14, mr: 1 }} /> EMAIL
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hud-input login-input"
                sx={{ mb: 2 }}
                required
              />

              <Typography className="login-label">
                <CodeIcon sx={{ fontSize: 14, mr: 1 }} /> PASSWORD
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hud-input login-input"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#00f5ff' }}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
                sx={{ mb: 3 }}
                required
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                className="hud-button primary login-button"
                startIcon={loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <LoginIcon />}
              >
                {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
              </Button>
            </form>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.6)' }}>
              Don't have an account?{' '}
              <Button className="text-button" onClick={() => {}} sx={{ color: '#00f5ff' }}>
                Create one
              </Button>
            </Typography>

            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,245,255,0.05)', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Share Tech Mono' }}>
                Demo: demo@example.com / demo123
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}

// MAIN APP
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [glitchTitle, setGlitchTitle] = useState('NEURAL ART SYSTEM');
  const [systemStatus, setSystemStatus] = useState({ cpu: 23, memory: 45, network: 'OPTIMAL' });

  useEffect(() => {
    const interval = setInterval(() => {
      const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const original = 'NEURAL ART SYSTEM';
      let glitched = '';
      for (let i = 0; i < original.length; i++) {
        if (Math.random() > 0.9 && original[i] !== ' ') glitched += chars[Math.floor(Math.random() * chars.length)];
        else glitched += original[i];
      }
      setGlitchTitle(glitched);
      setTimeout(() => setGlitchTitle(original), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  if (!user) {
    return (
      <ThemeProvider theme={hudTheme}>
        <CssBaseline />
        <LoginPage onLogin={setUser} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={hudTheme}>
      <CssBaseline />
      <Box className="hud-app">
        <div className="game-bg"></div>
        <div className="scanlines"></div>
        <div className="crt-flicker"></div>
        
        <AppBar position="static" className="hud-header">
          <Toolbar className="hud-toolbar">
            <Box className="hud-logo">
              <MemoryIcon className="hud-logo-icon" />
              <Box>
                <Typography variant="h4" className="hud-title">{glitchTitle}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(0,245,255,0.6)', fontFamily: 'Share Tech Mono', letterSpacing: '0.2em' }}>
                  v3.0 // VIDEO GAME INTERFACE // HUD MODE // USER: {user.email}
                </Typography>
              </Box>
            </Box>
            <Box className="hud-status">
              <Box className="hud-status-item">CPU: {systemStatus.cpu}%</Box>
              <Box className="hud-status-item">MEM: {systemStatus.memory}%</Box>
              <Box className="hud-status-item" sx={{ color: '#00ff41' }}>NET: {systemStatus.network}</Box>
              <Box className="hud-status-item" sx={{ borderColor: '#ff00ff', color: '#ff00ff', cursor: 'pointer' }} onClick={() => setUser(null)}>
                ◆ LOGOUT
              </Box>
            </Box>
          </Toolbar>
          
          <Tabs value={activeTab} onChange={handleTabChange} className="hud-tabs" textColor="primary" indicatorColor="transparent" variant="scrollable">
            <Tab icon={<BrushIcon />} label="GENERATE" className="hud-tab" />
            <Tab icon={<TuneIcon />} label="ADVANCED" className="hud-tab" />
            <Tab icon={<ImageIcon />} label="EDIT" className="hud-tab" />
            <Tab icon={<CollectionsIcon />} label="GALLERY" className="hud-tab" />
            <Tab icon={<WorkspaceIcon />} label="WORKSPACE" className="hud-tab" />
            <Tab icon={<SettingsIcon />} label="SYSTEM" className="hud-tab" />
          </Tabs>
        </AppBar>

        <Container maxWidth="xl" className="hud-main">
          <GeneratePanel />
        </Container>

        <Box className="hud-footer">
          <Typography className="hud-footer-text">
            [SYSTEM] NEURAL ART v3.0 // PROTOCOL: ONLINE // HUD: ACTIVE
          </Typography>
          <Box className="hud-footer-stats">
            <Typography className="hud-footer-stat">API: <span>READY</span></Typography>
            <Typography className="hud-footer-stat">GPU: <span>ONLINE</span></Typography>
            <Typography className="hud-footer-stat">AI: <span>ACTIVE</span></Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function GeneratePanel() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Box className="hud-panel" sx={{ p: 3 }}>
          <Typography className="hud-section-title"><AIIcon /> SELECT AI PROTOCOL</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button className="hud-button primary">HUGGING FACE</Button>
            <Button className="hud-button">OPENAI</Button>
            <Button className="hud-button">REPLICATE</Button>
          </Stack>

          <Typography className="hud-section-title"><CodeIcon /> INPUT NEURAL PROMPT</Typography>
          <TextField fullWidth multiline rows={4} placeholder="DESCRIBE YOUR VISUAL CONSTRUCT..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="hud-input" sx={{ mb: 3 }} />

          <Button fullWidth variant="contained" size="large" disabled={isGenerating || !prompt.trim()} className="hud-button primary" startIcon={isGenerating ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <PlayIcon />}>
            {isGenerating ? 'PROCESSING...' : 'INITIATE GENERATION'}
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Box className="hud-panel" sx={{ p: 3, height: '100%' }}>
          <Typography className="hud-section-title"><ViewIcon /> VISUAL OUTPUT</Typography>
          <Box className="hud-display" sx={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontFamily: 'Orbitron', color: 'rgba(0,245,255,0.5)', letterSpacing: '0.2em' }}>AWAITING INPUT</Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

export default App;
