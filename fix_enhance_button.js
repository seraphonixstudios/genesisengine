const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace handleEnhancePrompt with improved version
const oldFunction = `const handleEnhancePrompt = async () => {
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
  };`;

const newFunction = `const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first!');
      return;
    }
    
    console.log('Enhancing prompt:', prompt);
    setIsGenerating(true);
    setStatusMessage('Enhancing prompt with AI...');

    try {
      const response = await fetch(API_BASE + '/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          style: style,
          stylePreset: stylePreset
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Enhancement failed: ' + errorText);
        return;
      }

      const data = await response.json();
      console.log('Enhancement result:', data);
      
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setStatusMessage('Prompt enhanced successfully!');
      } else if (data.error) {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Enhancement error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };`;

content = content.replace(oldFunction, newFunction);

fs.writeFileSync(appFile, content);
console.log('Updated handleEnhancePrompt with better error handling');
