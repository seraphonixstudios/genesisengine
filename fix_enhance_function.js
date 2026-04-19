const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Remove the badly formatted function
content = content.replace(/const handleEnhancePrompt = async \(\) => \{[\s\S]*?setIsGenerating\(false\);\s*\};\s*/, '');

// Add the correctly formatted function
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

// Insert before return statement
content = content.replace(/(\};\s*)(return \(\s*<Grid)/, `$1${enhanceFunction}$2`);

fs.writeFileSync(appFile, content);
console.log('Fixed handleEnhancePrompt function');
