const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Add handleEnhancePrompt function after handleGenerate
const enhanceFunction = `
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch(API_BASE + '/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          stylePreset
        })
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
  };
`;

// Find the end of handleGenerate function and insert after it
const generateEndPattern = /(setIsGenerating\(false\);\s*}\s*}\s*\);)(\s*return)/;
content = content.replace(generateEndPattern, `$1${enhanceFunction}$2`);

fs.writeFileSync(appFile, content);
console.log('Added handleEnhancePrompt function');
