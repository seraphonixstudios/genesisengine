const https = require('https');
const fs = require('fs');
const path = require('path');

// Model URLs from HuggingFace
const MODELS = {
  'sdxl-base': {
    url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
    filename: 'sd_xl_base_1.0.safetensors',
    size: '6.9 GB',
    description: 'Stable Diffusion XL Base - Good all-around performance'
  },
  'realvisxl': {
    url: 'https://huggingface.co/SG161222/RealVisXL_V4.0/resolve/main/RealVisXL_V4.0.safetensors',
    filename: 'RealVisXL_V4.0.safetensors',
    size: '6.9 GB',
    description: 'RealVisXL V4.0 - Best for photorealistic portraits'
  },
  'juggernaut': {
    url: 'https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL-v9.safetensors',
    filename: 'Juggernaut-XL-v9.safetensors',
    size: '6.9 GB',
    description: 'Juggernaut XL v9 - Best for artistic images'
  },
  'dreamshaper': {
    url: 'https://huggingface.co/Lykon/DreamShaper/resolve/main/DreamShaper_8_pruned.safetensors',
    filename: 'DreamShaper_8.safetensors',
    size: '4.0 GB',
    description: 'DreamShaper 8 - Versatile, fast, lower VRAM requirements'
  }
};

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from: ${url}`);
    console.log(`Saving to: ${outputPath}`);
    console.log('This may take 10-30 minutes depending on your connection...\n');
    
    const file = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;
    let startTime = Date.now();
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        console.log('Following redirect...');
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }
      
      const totalBytes = parseInt(response.headers['content-length'], 10);
      console.log(`Total size: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB\n`);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        file.write(chunk);
        
        // Progress update every 5 seconds
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed % 5 < 1) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          const speed = (downloadedBytes / 1024 / 1024 / elapsed).toFixed(2);
          const remaining = ((totalBytes - downloadedBytes) / 1024 / 1024 / (downloadedBytes / elapsed)).toFixed(0);
          
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`Progress: ${percent}% | Speed: ${speed} MB/s | ETA: ${remaining}s`);
        }
      });
      
      response.on('end', () => {
        file.end();
        console.log('\n\nDownload complete!');
        resolve(outputPath);
      });
      
      response.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('AI Image Generator - Model Download Script');
    console.log('==========================================\n');
    console.log('Available models:');
    
    Object.entries(MODELS).forEach(([key, model]) => {
      console.log(`\n${key}:`);
      console.log(`  Size: ${model.size}`);
      console.log(`  Description: ${model.description}`);
    });
    
    console.log('\nUsage:');
    console.log('  node download-model.js <model-key>');
    console.log('  node download-model.js <url> <filename>');
    console.log('\nExamples:');
    console.log('  node download-model.js sdxl-base');
    console.log('  node download-model.js realvisxl');
    console.log('  node download-model.js "https://custom-url.com/model.safetensors" "custom-model.safetensors"');
    process.exit(0);
  }
  
  const modelsDir = path.join(__dirname, '../stable-diffusion/models/Stable-diffusion');
  
  // Ensure directory exists
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  let url, filename;
  
  if (MODELS[args[0]]) {
    // Predefined model
    const model = MODELS[args[0]];
    url = model.url;
    filename = model.filename;
    console.log(`Downloading ${args[0]}: ${model.description}\n`);
  } else if (args.length === 2) {
    // Custom URL and filename
    url = args[0];
    filename = args[1];
  } else {
    console.error('Error: Invalid arguments');
    console.log('Run without arguments to see usage.');
    process.exit(1);
  }
  
  const outputPath = path.join(modelsDir, filename);
  
  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Model already exists: ${outputPath}`);
    console.log('Delete it first if you want to re-download.');
    process.exit(0);
  }
  
  try {
    await downloadFile(url, outputPath);
    console.log(`\nModel saved to: ${outputPath}`);
    console.log('\nYou can now start the AI Image Generator!');
  } catch (error) {
    console.error('\nDownload failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Make sure you have enough disk space (20GB free)');
    console.log('3. Try downloading manually from HuggingFace');
    process.exit(1);
  }
}

main();
