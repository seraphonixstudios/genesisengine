const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace handleEnhancePrompt to ONLY enhance and update UI, nothing else
const oldFunction = `const handleEnhancePrompt = async () => {
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

const newFunction = `const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first!');
      return;
    }
    
    console.log('Enhancing prompt:', prompt);
    setStatusMessage('Enhancing prompt...');

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

      const data = await response.json();
      console.log('Enhancement result:', data);
      
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setStatusMessage('Prompt enhanced! Ready to generate.');
      } else if (data.error) {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Enhancement failed. Please try again.');
    }
  };`;

content = content.replace(oldFunction, newFunction);

fs.writeFileSync(appFile, content);
console.log('Updated: Enhance Prompt button now ONLY enhances text (no generation)');
