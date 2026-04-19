const fs = require('fs');

const serverFile = '/var/www/ai-generator/server/server.js';
const backupFile = '/var/www/ai-generator/server/server.js.backup';

// Restore from backup if it exists
if (fs.existsSync(backupFile)) {
  fs.copyFileSync(backupFile, serverFile);
  console.log('Restored server.js from backup');
} else {
  console.log('No backup file found');
}

let content = fs.readFileSync(serverFile, 'utf8');

// Replace providers endpoint with only HuggingFace
const oldEndpoint = `app.get('/api/generate/providers', (req, res) => {
  res.json({
    providers: [
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
    ]
  });
});`;

const newEndpoint = `app.get('/api/generate/providers', (req, res) => {
  res.json({
    providers: [
      { id: 'huggingface', name: 'HUGGING FACE', description: 'FREE Open Source Models - Midjourney Quality', models: [
        { id: 'RunDiffusion/Juggernaut-XL-v9', name: 'Juggernaut XL v9', quality: 'highest', style: 'Best overall quality & prompt adherence' },
        { id: 'SG161222/RealVisXL_V4.0', name: 'RealVisXL V4', quality: 'highest', style: 'Photorealistic - best for photos' },
        { id: 'Lykon/dreamshaper-xl-1-0', name: 'DreamShaper XL', quality: 'high', style: 'Artistic & creative' },
        { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5', quality: 'high', style: 'Aesthetic focused' },
        { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high', style: 'Balanced quality & speed' }
      ]}
    ]
  });
});`;

content = content.replace(oldEndpoint, newEndpoint);

// Simplify the provider switch to only use HuggingFace
content = content.replace(
  /let result;\s*switch \(provider\) \{[\s\S]*?default:[\s\S]*?\}/,
  `// Always use HuggingFace (free, open-source models)
    let result = await generateWithHuggingFace(finalPrompt, { model, width, height, steps, guidanceScale, seed, negativePrompt: negative });`
);

// Also update handleEdit functions if needed
content = content.replace(
  /async function generateWithOpenAI[\s\S]*?\}\s*async function generateWithReplicate[\s\S]*?\}/,
  '// Removed OpenAI and Replicate - using only free HuggingFace models'
);

fs.writeFileSync(serverFile, content);
console.log('Server updated to use only free open-source models!');
console.log('Models: JuggernautXL, RealVisXL, DreamShaperXL, Playground v2.5, SDXL');
