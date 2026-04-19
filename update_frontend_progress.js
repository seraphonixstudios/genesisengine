const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Add sessionId state and EventSource setup in GeneratePanel
const oldStateSetup = `const [enhance, setEnhance] = useState(true);
  const [batchSize, setBatchSize] = useState(1);`;

const newStateSetup = `const [enhance, setEnhance] = useState(true);
  const [batchSize, setBatchSize] = useState(1);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [progress, setProgress] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const eventSourceRef = React.useRef(null);`;

content = content.replace(oldStateSetup, newStateSetup);

// Update handleGenerate to include sessionId and connect to SSE
const oldHandleGenerate = `const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch(API_BASE + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          negativePrompt,
          steps,
          width,
          height,
          guidanceScale,
          seed,
          style,
          stylePreset,
          enhance
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };`;

const newHandleGenerate = `const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Initializing neural networks...');
    
    // Connect to progress SSE
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    eventSourceRef.current = new EventSource(API_BASE + '/api/progress/' + sessionId);
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.message) {
        setStatusMessage(data.message);
      }
      if (data.status === 'complete' && data.result) {
        setResult(data.result);
        setProgress(100);
        eventSourceRef.current.close();
      }
      if (data.status === 'error') {
        setStatusMessage('Error: ' + data.message);
        eventSourceRef.current.close();
      }
    };
    
    try {
      const response = await fetch(API_BASE + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          negativePrompt,
          steps,
          width,
          height,
          guidanceScale,
          seed,
          style,
          stylePreset,
          enhance,
          sessionId
        })
      });
      
      const data = await response.json();
      if (!result) { // Only set if SSE hasn't already set it
        setResult(data);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStatusMessage('Generation failed: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };`;

content = content.replace(oldHandleGenerate, newHandleGenerate);

// Update the output panel with cool HUD-style progress display
const oldOutputPanel = `<Box className="output-container">
              {result ? (
                <Box className="result-container">
                  <img
                    src={result.url}
                    alt="Generated"
                    className="generated-image"
                  />
                  <Box className="result-actions">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      DOWNLOAD
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                    >
                      SHARE
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box className="placeholder-container">
                  <Typography className="placeholder-text">
                    AWAITING NEURAL INPUT...
                  </Typography>
                  <Box className="placeholder-animation">
                    <div className="scan-line"></div>
                  </Box>
                </Box>
              )}
            </Box>

            {isGenerating && (
              <Box className="progress-container">
                <LinearProgress className="cyberpunk-progress" />
                <Typography className="progress-text">
                  PROCESSING NEURAL CONSTRUCT...
                </Typography>
              </Box>
            )}`;

const newOutputPanel = `<Box className="output-container">
              {result ? (
                <Box className="result-container">
                  <Box className="image-frame">
                    <img
                      src={result.url}
                      alt="Generated"
                      className="generated-image"
                    />
                    <Box className="image-overlay">
                      <Chip 
                        label={provider.toUpperCase()} 
                        size="small" 
                        sx={{ backgroundColor: '#00f5ff', color: '#000', fontWeight: 600 }}
                      />
                      <Chip 
                        label={\`\${width}×\${height}\`} 
                        size="small" 
                        sx={{ backgroundColor: '#ff00ff', color: '#fff', fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                  
                  <Box className="generation-details">
                    <Typography variant="caption" className="detail-text">
                      <strong>MODEL:</strong> {model.split('/').pop()}
                    </Typography>
                    <Typography variant="caption" className="detail-text">
                      <strong>STEPS:</strong> {steps} | <strong>CFG:</strong> {guidanceScale}
                    </Typography>
                    <Typography variant="caption" className="detail-text">
                      <strong>SEED:</strong> {seed}
                    </Typography>
                  </Box>
                  
                  <Box className="result-actions">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(result.url, '_blank')}
                      sx={{ 
                        background: 'linear-gradient(45deg, #00f5ff, #00a8b3)',
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: 600
                      }}
                    >
                      DOWNLOAD
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      sx={{ 
                        borderColor: '#ff00ff',
                        color: '#ff00ff',
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: 600,
                        '&:hover': { borderColor: '#ff80ff', backgroundColor: 'rgba(255, 0, 255, 0.1)' }
                      }}
                    >
                      SHARE
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box className="placeholder-container">
                  <Typography className="placeholder-text">
                    AWAITING NEURAL INPUT...
                  </Typography>
                  <Box className="placeholder-animation">
                    <div className="scan-line"></div>
                  </Box>
                  <Box className="system-status">
                    <Typography variant="caption" className="status-indicator">
                      ● SYSTEM READY
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {isGenerating && (
              <Box className="progress-container-hud">
                <Box className="hud-header">
                  <Typography className="hud-title">GENERATING</Typography>
                  <Typography className="hud-percentage">{progress || 0}%</Typography>
                </Box>
                
                <Box className="progress-bar-container">
                  <LinearProgress 
                    variant="determinate" 
                    value={progress || 0} 
                    className="cyberpunk-progress-hud" 
                  />
                  <Box className="progress-grid"></Box>
                </Box>
                
                <Typography className="status-message-hud">
                  {statusMessage || 'Initializing...'}
                </Typography>
                
                <Box className="hud-stats">
                  <Box className="stat-item">
                    <Typography className="stat-label">PROVIDER</Typography>
                    <Typography className="stat-value">{provider.toUpperCase()}</Typography>
                  </Box>
                  <Box className="stat-item">
                    <Typography className="stat-label">RESOLUTION</Typography>
                    <Typography className="stat-value">{width}×{height}</Typography>
                  </Box>
                  <Box className="stat-item">
                    <Typography className="stat-label">STEPS</Typography>
                    <Typography className="stat-value">{steps}</Typography>
                  </Box>
                </Box>
              </Box>
            )}`;

content = content.replace(oldOutputPanel, newOutputPanel);

fs.writeFileSync(appFile, content);
console.log('Updated frontend with real-time progress HUD');
