const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Add API_BASE constant before function App()
content = content.replace('function App()', "const API_BASE = 'http://76.13.242.128:5000';\n\nfunction App()");

// 2. Fix fetch URL to use API_BASE
content = content.replace(/fetch\('\/api\/generate'/g, "fetch(API_BASE + '/api/generate'");

// 3. Add handleEnhancePrompt function after handleGenerate
const enhanceFunction = `

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch(API_BASE + '/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, stylePreset })
      });
      const data = await response.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
    } finally {
      setIsGenerating(false);
    }
  }`;

// Find the pattern: setIsGenerating(false); followed by }; followed by return (
const pattern = /(setIsGenerating\(false\);\s*\}\s*\};)(\s*return \()/;
content = content.replace(pattern, `$1${enhanceFunction}$2`);

// 4. Add enhance button after the first TextField (the prompt input)
const enhanceButton = `
              <Button
                variant="outlined"
                onClick={handleEnhancePrompt}
                disabled={isGenerating || !prompt.trim()}
                sx={{ 
                  mt: 1, 
                  mb: 1,
                  borderColor: '#ff00ff',
                  color: '#ff00ff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  '&:hover': { borderColor: '#ff80ff', backgroundColor: 'rgba(255, 0, 255, 0.1)' }
                }}
                startIcon={<InpaintIcon />}
              >
                ENHANCE PROMPT
              </Button>`;

// Find the prompt TextField and add button after it
const textFieldPattern = /(placeholder="DESCRIBE YOUR VISUAL CONSTRUCT\.\.\."[\s\S]*?disabled=\{isGenerating\}\s*\/>)(\s*<Accordion)/;
content = content.replace(textFieldPattern, `$1${enhanceButton}$2`);

fs.writeFileSync(appFile, content);
console.log('All changes applied successfully!');
console.log('- Added API_BASE constant');
console.log('- Fixed fetch URLs');
console.log('- Added handleEnhancePrompt function');
console.log('- Added ENHANCE PROMPT button');
