const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Find the EditPanel function and replace it
const searchStart = '// EDIT PANEL';
const searchEnd = '// GALLERY PANEL';

const startIdx = content.indexOf(searchStart);
const endIdx = content.indexOf(searchEnd);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find EditPanel boundaries');
  process.exit(1);
}

const beforeEditPanel = content.substring(0, startIdx);
const afterEditPanel = content.substring(endIdx);

const newEditPanel = `// EDIT PANEL
function EditPanel() {
  const [activeTool, setActiveTool] = useState('upscale');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [upscaleScale, setUpscaleScale] = useState(4);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [outpaintDirection, setOutpaintDirection] = useState('all');
  const [outpaintExpansion, setOutpaintExpansion] = useState(512);
  const [variationCount, setVariationCount] = useState(4);
  const [variationStrength, setVariationStrength] = useState(0.7);
  
  const tools = [
    { id: 'upscale', name: 'UPSCALE', icon: React.createElement(UpscaleIcon), desc: '2x-4x Resolution Enhancement', endpoint: '/api/edit/upscale' },
    { id: 'inpaint', name: 'INPAINT', icon: React.createElement(InpaintIcon), desc: 'Remove/Add Elements', endpoint: '/api/edit/inpaint' },
    { id: 'outpaint', name: 'OUTPAINT', icon: React.createElement(OutpaintIcon), desc: 'Extend Boundaries', endpoint: '/api/edit/outpaint' },
    { id: 'variations', name: 'VARIATIONS', icon: React.createElement(VariationIcon), desc: 'Generate Alternatives', endpoint: '/api/edit/variations' },
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  const dropzoneProps = useDropzone({
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
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
      const messages = [
        'Loading neural models...',
        'Analyzing image structure...',
        'Processing with AI...',
        'Applying transformations...',
        'Finalizing output...'
      ];
      setStatusMessage(messages[Math.floor(Math.random() * messages.length)]);
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
    React.createElement(Grid, { container: true, spacing: 3 },
      React.createElement(Grid, { item: true, xs: 12, md: 4 },
        React.createElement(Card, { className: 'edit-tools-card' },
          React.createElement(CardContent, null,
            React.createElement(Typography, { variant: 'h6', className: 'section-title' },
              React.createElement(TuneIcon), ' NEURAL EDITING TOOLS'
            ),
            tools.map((tool) =>
              React.createElement(Button, {
                key: tool.id,
                fullWidth: true,
                variant: activeTool === tool.id ? 'contained' : 'outlined',
                onClick: () => { setActiveTool(tool.id); setResult(null); },
                className: 'tool-btn ' + (activeTool === tool.id ? 'active' : ''),
                startIcon: tool.icon,
                sx: { mb: 1, justifyContent: 'flex-start', fontFamily: 'Orbitron, sans-serif', fontWeight: 600, letterSpacing: '0.05em' }
              },
                React.createElement(Box, { sx: { textAlign: 'left' } },
                  React.createElement(Typography, { sx: { fontSize: '0.85rem', fontWeight: 700 } }, tool.name),
                  React.createElement(Typography, { sx: { fontSize: '0.7rem', opacity: 0.7 } }, tool.desc)
                )
              )
            )
          )
        ),
        result && React.createElement(Card, { className: 'result-card', sx: { mt: 2 } },
          React.createElement(CardContent, null,
            React.createElement(Typography, { variant: 'h6', className: 'section-title' }, 'RESULT'),
            React.createElement(Box, { className: 'result-preview' },
              React.createElement('img', {
                src: result.url,
                alt: 'Result',
                style: { width: '100%', borderRadius: '4px', border: '2px solid #00f5ff' }
              })
            ),
            React.createElement(Button, {
              fullWidth: true,
              variant: 'contained',
              startIcon: React.createElement(DownloadIcon),
              onClick: () => window.open(result.url, '_blank'),
              sx: { mt: 2, background: 'linear-gradient(45deg, #00f5ff, #00a8b3)', fontFamily: 'Orbitron, sans-serif' }
            }, 'DOWNLOAD'),
            result.note && React.createElement(Typography, { variant: 'caption', sx: { display: 'block', mt: 1, color: 'orange' } }, result.note)
          )
        )
      ),
      React.createElement(Grid, { item: true, xs: 12, md: 8 },
        React.createElement(Card, { className: 'edit-interface-card' },
          React.createElement(CardContent, null,
            React.createElement(Typography, { variant: 'h6', className: 'section-title' },
              activeToolInfo.icon, ' ', activeToolInfo.name, ' INTERFACE'
            ),
            React.createElement(Box, {
              onClick: dropzoneProps.open,
              className: 'dropzone ' + (dropzoneProps.isDragActive ? 'active' : ''),
              sx: {
                border: '2px dashed',
                borderColor: dropzoneProps.isDragActive ? '#00f5ff' : 'rgba(0, 245, 255, 0.3)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: dropzoneProps.isDragActive ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }
            },
              React.createElement('input', dropzoneProps.getInputProps()),
              previewUrl ? React.createElement(Box, null,
                React.createElement('img', {
                  src: previewUrl,
                  alt: 'Preview',
                  style: { maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', border: '2px solid #00f5ff' }
                }),
                React.createElement(Typography, { sx: { mt: 2, color: '#00f5ff' } }, 'Click or drag to change image')
              ) : React.createElement(Box, null,
                React.createElement(UploadIcon, { sx: { fontSize: 64, mb: 2, color: '#00f5ff' } }),
                React.createElement(Typography, { sx: { fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' } },
                  dropzoneProps.isDragActive ? 'DROP IMAGE HERE' : 'DRAG & DROP IMAGE OR CLICK TO UPLOAD'
                ),
                React.createElement(Typography, { variant: 'caption', sx: { display: 'block', mt: 1, opacity: 0.6 } },
                  'Supports PNG, JPG, JPEG, GIF, WEBP'
                )
              )
            ),
            uploadedFile && React.createElement(Box, { className: 'tool-settings', sx: { mt: 3 } },
              React.createElement(Typography, { variant: 'h6', className: 'section-title' },
                React.createElement(TuneIcon), ' PARAMETERS'
              ),
              activeTool === 'upscale' && React.createElement(Grid, { container: true, spacing: 3 },
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(Typography, { gutterBottom: true }, 'UPSCALE FACTOR'),
                  React.createElement(Slider, {
                    value: upscaleScale,
                    onChange: (e, v) => setUpscaleScale(v),
                    min: 2,
                    max: 4,
                    step: 1,
                    marks: [{ value: 2, label: '2x' }, { value: 3, label: '3x' }, { value: 4, label: '4x' }],
                    valueLabelDisplay: 'auto'
                  })
                ),
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(FormControlLabel, {
                    control: React.createElement(Switch, { checked: faceEnhance, onChange: (e) => setFaceEnhance(e.target.checked) }),
                    label: 'FACE ENHANCEMENT'
                  })
                )
              ),
              activeTool === 'inpaint' && React.createElement(TextField, {
                fullWidth: true,
                label: 'INPAINTING PROMPT (OPTIONAL)',
                placeholder: 'Describe what to add/change...',
                value: inpaintPrompt,
                onChange: (e) => setInpaintPrompt(e.target.value),
                sx: { mt: 1 }
              }),
              activeTool === 'outpaint' && React.createElement(Grid, { container: true, spacing: 3 },
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(Typography, { gutterBottom: true }, 'DIRECTION'),
                  React.createElement(Stack, { direction: 'row', spacing: 1 },
                    ['all', 'left', 'right', 'up', 'down'].map(dir =>
                      React.createElement(Chip, {
                        key: dir,
                        label: dir.toUpperCase(),
                        onClick: () => setOutpaintDirection(dir),
                        color: outpaintDirection === dir ? 'primary' : 'default',
                        sx: { fontFamily: 'Orbitron, sans-serif' }
                      })
                    )
                  )
                ),
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(Typography, { gutterBottom: true }, 'EXPANSION: ' + outpaintExpansion + 'px'),
                  React.createElement(Slider, {
                    value: outpaintExpansion,
                    onChange: (e, v) => setOutpaintExpansion(v),
                    min: 256,
                    max: 1024,
                    step: 128,
                    marks: true
                  })
                )
              ),
              activeTool === 'variations' && React.createElement(Grid, { container: true, spacing: 3 },
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(Typography, { gutterBottom: true }, 'NUMBER OF VARIATIONS: ' + variationCount),
                  React.createElement(Slider, {
                    value: variationCount,
                    onChange: (e, v) => setVariationCount(v),
                    min: 1,
                    max: 8,
                    step: 1,
                    marks: [{ value: 1 }, { value: 4 }, { value: 8 }],
                    valueLabelDisplay: 'auto'
                  })
                ),
                React.createElement(Grid, { item: true, xs: 12, sm: 6 },
                  React.createElement(Typography, { gutterBottom: true }, 'VARIATION STRENGTH: ' + variationStrength),
                  React.createElement(Slider, {
                    value: variationStrength,
                    onChange: (e, v) => setVariationStrength(v),
                    min: 0.1,
                    max: 1,
                    step: 0.1,
                    valueLabelDisplay: 'auto'
                  })
                )
              ),
              React.createElement(Button, {
                fullWidth: true,
                variant: 'contained',
                size: 'large',
                onClick: handleProcess,
                disabled: isProcessing,
                sx: { mt: 3, background: 'linear-gradient(45deg, #ff00ff, #ff0080)', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, letterSpacing: '0.2em', py: 1.5 },
                startIcon: isProcessing ? React.createElement(CircularProgress, { size: 24, color: 'inherit' }) : React.createElement(PlayIcon)
              }, isProcessing ? 'PROCESSING...' : 'INITIATE ' + activeToolInfo.name)
            ),
            isProcessing && React.createElement(Box, { className: 'progress-container-hud', sx: { mt: 3 } },
              React.createElement(Box, { className: 'hud-header' },
                React.createElement(Typography, { className: 'hud-title' }, activeToolInfo.name + 'ING'),
                React.createElement(Typography, { className: 'hud-percentage' }, Math.round(progress) + '%')
              ),
              React.createElement(Box, { className: 'progress-bar-container' },
                React.createElement(LinearProgress, { variant: 'determinate', value: progress, className: 'cyberpunk-progress-hud' })
              ),
              React.createElement(Typography, { className: 'status-message-hud' }, statusMessage)
            )
          )
        )
      )
    )
  );
}

`;

const newContent = beforeEditPanel + newEditPanel + afterEditPanel;

fs.writeFileSync(appFile, newContent);
console.log('Updated EditPanel with full functionality using React.createElement');
