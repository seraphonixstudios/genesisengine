const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Update the providers to use only free open-source models
const oldProviders = `const providers = [
    { id: 'huggingface', name: 'Hugging Face', description: 'Free Stable Diffusion models', models: [
      { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high' },
      { id: 'prompthero/openjourney', name: 'OpenJourney', quality: 'high' },
      { id: 'dreamlike-art/dreamlike-diffusion-1.0', name: 'Dreamlike', quality: 'high' }
    ]},
    { id: 'openai', name: 'OpenAI DALL-E', description: 'Best prompt understanding', models: [
      { id: 'dall-e-3', name: 'DALL-E 3', quality: 'highest' }
    ]},
    { id: 'replicate', name: 'Replicate', description: 'Community models including SDXL', models: [
      { id: 'stability-ai/sdxl', name: 'SDXL', quality: 'highest' }
    ]}
  ];`;

const newProviders = `const providers = [
    { id: 'huggingface', name: 'HUGGING FACE', description: 'FREE - Best Open Source Models', models: [
      { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high', style: 'balanced' },
      { id: 'RunDiffusion/Juggernaut-XL-v9', name: 'Juggernaut XL', quality: 'highest', style: 'artistic' },
      { id: 'SG161222/RealVisXL_V4.0', name: 'RealVisXL', quality: 'highest', style: 'photorealistic' },
      { id: 'Lykon/dreamshaper-xl-1-0', name: 'DreamShaper XL', quality: 'high', style: 'creative' },
      { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5', quality: 'high', style: 'aesthetic' }
    ]}
  ];`;

// Find and replace the providers endpoint
content = content.replace(/app\.get\('\/api\/generate\/providers'[\s\S]*?\}\);\n\}\);/, `app.get('/api/generate/providers', (req, res) => {
  res.json({
    ${newProviders}
  });
});`);

// Remove OpenAI and Replicate references from switch statement
content = content.replace(/case 'openai':[\s\S]*?break;\n      case 'replicate':[\s\S]*?break;\n      case 'huggingface':/, "case 'huggingface':");

// Update generate function to only use HuggingFace
content = content.replace(/switch \(provider\) \{[\s\S]*?default:[\s\S]*?\}/, 
`// Use HuggingFace for all requests (best free option)
    result = await generateWithHuggingFace(finalPrompt, { model, width, height, steps, guidanceScale, seed, negativePrompt: negative });`);

fs.writeFileSync(serverFile, content);
console.log('Updated to use only free open-source models!');
console.log('Removed: OpenAI DALL-E (paid), Replicate (paid)');
console.log('Added: JuggernautXL, RealVisXL, DreamShaperXL, Playground v2.5');
