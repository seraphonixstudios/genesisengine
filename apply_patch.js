const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Check if already patched
if (content.includes('const API_BASE')) {
  console.log('Already patched, skipping...');
  process.exit(0);
}

// 1. Add API_BASE constant before function App()
content = content.replace('function App()', "const API_BASE = 'http://76.13.242.128:5000';\n\nfunction App()");

// 2. Fix fetch URL to use API_BASE (only the generate endpoint)
content = content.replace("fetch('/api/generate'", "fetch(API_BASE + '/api/generate'");

// 3. Add handleEnhancePrompt function after handleGenerate closes
const enhanceFunction = `\n\n  const handleEnhancePrompt = async () => {\n    if (!prompt.trim()) return;\n    setIsGenerating(true);\n    try {\n      const response = await fetch(API_BASE + '/api/enhance-prompt', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ prompt, style, stylePreset })\n      });\n      const data = await response.json();\n      if (data.enhancedPrompt) {\n        setPrompt(data.enhancedPrompt);\n      }\n    } catch (error) {\n      console.error('Enhancement error:', error);\n    } finally {\n      setIsGenerating(false);\n    }\n  }`;

// Insert after the generate function ends (look for the pattern)
content = content.replace(/(setIsGenerating\(false\);\n  };)(\n  return)/, `$1${enhanceFunction}$2`);

// 4. Add enhance button after the prompt TextField
const enhanceButton = `\n              <Button\n                variant="outlined"\n                onClick={handleEnhancePrompt}\n                disabled={isGenerating || !prompt.trim()}\n                sx={{ \n                  mt: 1, \n                  mb: 1,\n                  borderColor: '#ff00ff',\n                  color: '#ff00ff',\n                  fontFamily: 'Orbitron, sans-serif',\n                  fontWeight: 600,\n                  letterSpacing: '0.1em',\n                  '&:hover': { borderColor: '#ff80ff', backgroundColor: 'rgba(255, 0, 255, 0.1)' }\n                }}\n                startIcon={<InpaintIcon />}\n              >\n                ENHANCE PROMPT\n              </Button>`;

// Find and replace - add button after prompt TextField
const pattern = /(placeholder="DESCRIBE YOUR VISUAL CONSTRUCT\.\.\."[\s\S]{0,500}?disabled=\{isGenerating\}\s*\/>)(\s*<Accordion)/;
content = content.replace(pattern, `$1${enhanceButton}$2`);

fs.writeFileSync(appFile, content);
console.log('Patch applied successfully!');
