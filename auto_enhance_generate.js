const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace handleGenerate to auto-enhance first
const oldHandleGenerate = `const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Initializing neural networks...');`;

const newHandleGenerate = `const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Enhancing prompt with AI...');
    
    // Step 1: Auto-enhance the prompt first
    let enhancedPrompt = prompt;
    if (enhance) {
      try {
        const enhanceResponse = await fetch(API_BASE + '/api/enhance-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            style: style,
            stylePreset: stylePreset
          })
        });
        
        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json();
          if (enhanceData.enhancedPrompt) {
            enhancedPrompt = enhanceData.enhancedPrompt;
            setPrompt(enhancedPrompt); // Update the UI with enhanced prompt
            setStatusMessage('Prompt enhanced! Starting generation...');
            console.log('Original:', prompt);
            console.log('Enhanced:', enhancedPrompt);
          }
        }
      } catch (err) {
        console.log('Enhancement failed, using original prompt');
      }
    }
    
    setProgress(5);
    setStatusMessage('Initializing neural networks...');`;

content = content.replace(oldHandleGenerate, newHandleGenerate);

// Update the generate fetch to use enhancedPrompt
content = content.replace(
  `body: JSON.stringify({
          prompt,`,
  `body: JSON.stringify({
          prompt: enhancedPrompt,`
);

fs.writeFileSync(appFile, content);
console.log('Updated: Generate button now auto-enhances prompt BEFORE generation!');
