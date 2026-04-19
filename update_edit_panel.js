const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Find and replace the EditPanel function completely
const oldEditPanel = `// EDIT PANEL
function EditPanel() {
  const [activeTool, setActiveTool] = useState('upscale');
  
  const tools = [
    { id: 'upscale', name: 'UPSCALE', icon: <UpscaleIcon />, desc: '2x-4x Resolution Enhancement' },
    { id: 'inpaint', name: 'INPAINT', icon: <InpaintIcon />, desc: 'Remove/Add Elements' },
    { id: 'outpaint', name: 'OUTPAINT', icon: <OutpaintIcon />, desc: 'Extend Boundaries' },
    { id: 'variations', name: 'VARIATIONS', icon: <VariationIcon />, desc: 'Generate Alternatives' },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">NEURAL EDITING TOOLS</Typography>
            {tools.map((tool) => (
              <Button
                key={tool.id}
                fullWidth
                variant={activeTool === tool.id ? 'contained' : 'outlined'}
                onClick={() => setActiveTool(tool.id)}
                className="tool-btn"
                startIcon={tool.icon}
                sx={{ mb: 1 }}
              >
                {tool.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6">{tools.find(t => t.id === activeTool)?.name} INTERFACE</Typography>
            <Box className="dropzone">
              <UploadIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography>DRAG & DROP IMAGE OR CLICK TO UPLOAD</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}`;

const newEditPanel = `// EDIT PANEL
function EditPanel() {
  const [activeTool, setActiveTool] = useState('upscale');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Tool settings
  const [upscaleScale, setUpscaleScale] = useState(4);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [outpaintDirection, setOutpaintDirection] = useState('all');
  const [outpaintExpansion, setOutpaintExpansion] = useState(512);
  const [variationCount, setVariationCount] = useState(4);
  const [variationStrength, setVariationStrength] = useState(0.7);
  
  const tools = [
    { id: 'upscale', name: 'UPSCALE', icon: <UpscaleIcon />, desc: '2x-4x Resolution Enhancement', endpoint: '/api/edit/upscale' },
    { id: 'inpaint', name: 'INPAINT', icon: <InpaintIcon />, desc: 'Remove/Add Elements', endpoint: '/api/edit/inpaint' },
    { id: 'outpaint', name: 'OUTPAINT', icon: <OutpaintIcon />, desc: 'Extend Boundaries', endpoint: '/api/edit/outpaint' },
    { id: 'variations', name: 'VARIATIONS', icon: <VariationIcon />, desc: 'Generate Alternatives', endpoint: '/api/edit/variations' },
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1
  });

  const handleProcess = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Initializing neural processing...');
    setResult(null);
    
    const tool = tools.find(t => t.id === activeTool);
    const formData = new FormData();
    formData.append('image', uploadedFile);
    
    // Add tool-specific parameters
    if (activeTool === 'upscale') {
      formData.append('scale', upscaleScale);
      formData.append('faceEnhance', faceEnhance);
    } else if (activeTool === 'inpaint') {
      formData.append('prompt', inpaintPrompt);
    } else if (activeTool === 'outpaint') {
      formData.append('direction', outpaintDirection);
      formData.append('expansion', outpaintExpansion);
      formData.append('prompt', '');
    } else if (activeTool === 'variations') {
      formData.append('count', variationCount);
      formData.append('strength', variationStrength);
    }
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
      setStatusMessage(prev => {
        const messages = [
          'Loading neural models...',
          'Analyzing image structure...',
          'Processing with AI...',
          'Applying transformations...',
          'Finalizing output...'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      });
    }, 800);
    
    try {
      const response = await fetch(API_BASE + tool.endpoint, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);
      setStatusMessage('Processing complete!');
      
      if (data.success || data.url) {
        setResult(data);
      } else {
        setStatusMessage('Error: ' + (data.error || 'Processing failed'));
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Processing error:', error);
      setStatusMessage('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeToolInfo = tools.find(t => t.id === activeTool);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card className="edit-tools-card">
          <CardContent>
            <Typography variant="h6" className="section-title">
              <TuneIcon /> NEURAL EDITING TOOLS
            </Typography>
            {tools.map((tool) => (
              <Button
                key={tool.id}
                fullWidth
                variant={activeTool === tool.id ? 'contained' : 'outlined'}
                onClick={() => { setActiveTool(tool.id); setResult(null); }}
                className={'tool-btn ' + (activeTool === tool.id ? 'active' : '')}
                startIcon={tool.icon}
                sx={{ 
                  mb: 1,
                  justifyContent: 'flex-start',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{tool.name}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>{tool.desc}</Typography>
                </Box>
              </Button>
            ))}
          </CardContent>
        </Card>
        
        {result && (
          <Card className="result-card" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" className="section-title">RESULT</Typography>
              <Box className="result-preview">
                <img 
                  src={result.url} 
                  alt="Result" 
                  style={{ width: '100%', borderRadius: '4px', border: '2px solid #00f5ff' }} 
                />
              </Box>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => window.open(result.url, '_blank')}
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(45deg, #00f5ff, #00a8b3)',
                  fontFamily: 'Orbitron, sans-serif'
                }}
              >
                DOWNLOAD
              </Button>
              {result.note && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'orange' }}>
                  {result.note}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card className="edit-interface-card">
          <CardContent>
            <Typography variant="h6" className="section-title">
              {activeToolInfo?.icon} {activeToolInfo?.name} INTERFACE
            </Typography>
            
            {/* Upload Area */}
            <Box 
              {getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              sx={{ 
                border: '2px dashed',
                borderColor: isDragActive ? '#00f5ff' : 'rgba(0, 245, 255, 0.3)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: isDragActive ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#00f5ff',
                  backgroundColor: 'rgba(0, 245, 255, 0.05)'
                }
              }}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <Box>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px', 
                      borderRadius: '4px',
                      border: '2px solid #00f5ff'
                    }} 
                  />
                  <Typography sx={{ mt: 2, color: '#00f5ff' }}>
                    Click or drag to change image
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 64, mb: 2, color: '#00f5ff' }} />
                  <Typography sx={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                    {isDragActive ? 'DROP IMAGE HERE' : 'DRAG & DROP IMAGE OR CLICK TO UPLOAD'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.6 }}>
                    Supports PNG, JPG, JPEG, GIF, WEBP
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Tool Settings */}
            {uploadedFile && (
              <Box className="tool-settings" sx={{ mt: 3 }}>
                <Typography variant="h6" className="section-title">
                  <TuneIcon /> PARAMETERS
                </Typography>
                
                {activeTool === 'upscale' && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>UPSCALE FACTOR</Typography>
                      <Slider
                        value={upscaleScale}
                        onChange={(e, v) => setUpscaleScale(v)}
                        min={2}
                        max={4}
                        step={1}
                        marks={[{ value: 2, label: '2x' }, { value: 3, label: '3x' }, { value: 4, label: '4x' }]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={<Switch checked={faceEnhance} onChange={(e) => setFaceEnhance(e.target.checked)} />}
                        label="FACE ENHANCEMENT"
                      />
                    </Grid>
                  </Grid>
                )}
                
                {activeTool === 'inpaint' && (
                  <TextField
                    fullWidth
                    label="INPAINTING PROMPT (OPTIONAL)"
                    placeholder="Describe what to add/change..."
                    value={inpaintPrompt}
                    onChange={(e) => setInpaintPrompt(e.target.value)}
                    sx={{ mt: 1 }}
                  />
                )}
                
                {activeTool === 'outpaint' && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>DIRECTION</Typography>
                      <Stack direction="row" spacing={1}>
                        {['all', 'left', 'right', 'up', 'down'].map(dir => (
                          <Chip
                            key={dir}
                            label={dir.toUpperCase()}
                            onClick={() => setOutpaintDirection(dir)}
                            color={outpaintDirection === dir ? 'primary' : 'default'}
                            sx={{ fontFamily: 'Orbitron, sans-serif' }}
                          />
                        ))}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>EXPANSION: {outpaintExpansion}px</Typography>
                      <Slider
                        value={outpaintExpansion}
                        onChange={(e, v) => setOutpaintExpansion(v)}
                        min={256}
                        max={1024}
                        step={128}
                        marks
                      />
                    </Grid>
                  </Grid>
                )}
                
                {activeTool === 'variations' && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>NUMBER OF VARIATIONS: {variationCount}</Typography>
                      <Slider
                        value={variationCount}
                        onChange={(e, v) => setVariationCount(v)}
                        min={1}
                        max={8}
                        step={1}
                        marks={[{ value: 1 }, { value: 4 }, { value: 8 }]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>VARIATION STRENGTH: {variationStrength}</Typography>
                      <Slider
                        value={variationStrength}
                        onChange={(e, v) => setVariationStrength(v)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                  </Grid>
                )}
                
                {/* Process Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  sx={{ 
                    mt: 3,
                    background: 'linear-gradient(45deg, #ff00ff, #ff0080)',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    py: 1.5
                  }}
                  startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : <PlayIcon />}
                >
                  {isProcessing ? 'PROCESSING...' : `INITIATE ${activeToolInfo?.name}`}
                </Button>
              </Box>
            )}
            
            {/* Progress HUD */}
            {isProcessing && (
              <Box className="progress-container-hud" sx={{ mt: 3 }}>
                <Box className="hud-header">
                  <Typography className="hud-title">{activeToolInfo?.name}ING</Typography>
                  <Typography className="hud-percentage">{Math.round(progress)}%</Typography>
                </Box>
                <Box className="progress-bar-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    className="cyberpunk-progress-hud" 
                  />
                </Box>
                <Typography className="status-message-hud">{statusMessage}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}`;

content = content.replace(oldEditPanel, newEditPanel);

fs.writeFileSync(appFile, content);
console.log('Updated EditPanel with full functionality');
