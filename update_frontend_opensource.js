const fs = require('fs');

const appFile = '/var/www/ai-generator/client/src/App.js';
let content = fs.readFileSync(appFile, 'utf8');

// Update the providers array in the frontend
const oldProviders = `const providers = [
    { id: 'huggingface', name: 'Hugging Face', icon: '🤗', color: '#ffbd4a' },
    { id: 'openai', name: 'OpenAI DALL-E', icon: '🤖', color: '#00a67e' },
    { id: 'replicate', name: 'Replicate', icon: '⚡', color: '#f26419' },
  ];`;

const newProviders = `const providers = [
    { id: 'huggingface', name: 'SDXL Base', icon: '🎨', color: '#ffbd4a', model: 'stabilityai/stable-diffusion-xl-base-1.0', desc: 'Balanced quality & speed' },
    { id: 'juggernaut', name: 'Juggernaut XL', icon: '⚔️', color: '#ff0044', model: 'RunDiffusion/Juggernaut-XL-v9', desc: 'Best prompt adherence' },
    { id: 'realvis', name: 'RealVisXL', icon: '📸', color: '#00d4aa', model: 'SG161222/RealVisXL_V4.0', desc: 'Photorealistic mastery' },
    { id: 'dreamshaper', name: 'DreamShaper', icon: '✨', color: '#9b59b6', model: 'Lykon/dreamshaper-xl-1-0', desc: 'Creative & artistic' },
    { id: 'playground', name: 'Playground', icon: '🎭', color: '#ff6b9d', model: 'playgroundai/playground-v2.5-1024px-aesthetic', desc: 'Aesthetic focused' },
  ];`;

content = content.replace(oldProviders, newProviders);

// Update the default provider
content = content.replace(`const [provider, setProvider] = useState('huggingface');`, `const [provider, setProvider] = useState('juggernaut');`);
content = content.replace(`const [model, setModel] = useState('stabilityai/stable-diffusion-xl-base-1.0');`, `const [model, setModel] = useState('RunDiffusion/Juggernaut-XL-v9');`);

// Update provider button display
const oldProviderButtons = `{providers.map((p) => (
                  <Button
                    key={p.id}
                    variant={provider === p.id ? 'contained' : 'outlined'}
                    onClick={() => setProvider(p.id)}
                    className={\`provider-btn \${provider === p.id ? 'active' : ''}\`}
                    sx={{ borderColor: p.color, color: provider === p.id ? '#000' : p.color }}
                  >
                    {p.icon} {p.name}
                  </Button>
                ))}`;

const newProviderButtons = `{providers.map((p) => (
                  <Button
                    key={p.id}
                    variant={provider === p.id ? 'contained' : 'outlined'}
                    onClick={() => { setProvider(p.id); setModel(p.model); }}
                    className={\`provider-btn \${provider === p.id ? 'active' : ''}\`}
                    sx={{ 
                      borderColor: p.color, 
                      color: provider === p.id ? '#000' : p.color,
                      background: provider === p.id ? p.color : 'transparent',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                    </Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                      {p.desc}
                    </Typography>
                  </Button>
                ))}`;

content = content.replace(oldProviderButtons, newProviderButtons);

// Update the generate call to use model from provider
content = content.replace(`body: JSON.stringify({
          prompt,
          provider,
          model,
          negativePrompt,`, `body: JSON.stringify({
          prompt,
          provider: 'huggingface',
          model: model,
          negativePrompt,`);

fs.writeFileSync(appFile, content);
console.log('Frontend updated with open-source models!');
console.log('Default: Juggernaut XL (best quality)');
