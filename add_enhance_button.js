const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Add enhance button after the prompt TextField
const textFieldEndPattern = /(className="cyberpunk-input"\s*\n\s*disabled=\{isGenerating\}\s*\n\s*\/>)(\s*\n\s*<Accordion className="advanced-accordion">)/;

const enhanceButton = `
              <Button
                variant="outlined"
                onClick={handleEnhancePrompt}
                disabled={isGenerating || !prompt.trim()}
                className="enhance-btn"
                sx={{ 
                  mt: 1, 
                  mb: 1,
                  borderColor: '#ff00ff',
                  color: '#ff00ff',
                  '&:hover': { borderColor: '#ff80ff', backgroundColor: 'rgba(255, 0, 255, 0.1)' }
                }}
                startIcon={<InpaintIcon />}
              >
                ENHANCE PROMPT
              </Button>
`;

content = content.replace(textFieldEndPattern, `$1${enhanceButton}$2`);

fs.writeFileSync(appFile, content);
console.log('Added enhance button to UI');
