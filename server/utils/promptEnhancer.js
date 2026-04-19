// ==========================================
// ADVANCED PROMPT ENHANCEMENT ENGINE
// ==========================================

// Quality modifiers by category
const QUALITY_MODIFIERS = {
  ultra: [
    'masterpiece', 'best quality', 'ultra-detailed', '8k uhd', 'highres',
    'extremely detailed', 'intricate details', 'perfect composition',
    'professional', 'award winning', 'trending on artstation'
  ],
  high: [
    'masterpiece', 'best quality', 'highly detailed', '4k uhd',
    'detailed', 'sharp focus', 'high quality'
  ],
  medium: [
    'good quality', 'detailed', 'clear'
  ]
};

// Style-specific modifiers
const STYLE_MODIFIERS = {
  photorealistic: {
    prefix: ['photorealistic', 'professional photography', 'raw photo'],
    suffix: ['8k uhd', 'dslr', 'high quality', 'film grain', 'Fujifilm XT3', 
             'soft lighting', 'detailed skin texture', 'anatomically correct',
             'symmetrical face', 'professional photography'],
    negative: ['painting', 'drawing', 'illustration', 'cartoon', 'anime', 
               '3d render', 'sketch', 'artificial', 'deformed', 'ugly']
  },
  digital_art: {
    prefix: ['digital art', 'trending on artstation', 'highly detailed'],
    suffix: ['art by greg rutkowski and alphonse mucha and artgerm',
             'sharp focus', 'vivid colors', 'dramatic lighting',
             'illustration', 'concept art', 'wlop', 'rossdraws'],
    negative: ['photo', 'photorealistic', '3d render', 'blurry', 
               'low quality', 'amateur', 'watermark', 'signature', 'text']
  },
  anime: {
    prefix: ['anime style', 'manga', 'studio ghibli'],
    suffix: ['beautiful detailed eyes', 'vibrant colors', 'cel shading',
             'art by makoto shinkai and hayao miyazaki and katsuhiro otomo',
             'kyoto animation', 'detailed background', 'masterpiece'],
    negative: ['photo', 'photorealistic', '3d render', 'western cartoon',
               'realistic', 'blurry', 'low quality', 'bad anatomy', 'bad hands']
  },
  cinematic: {
    prefix: ['cinematic', 'film still', 'movie scene'],
    suffix: ['cinematic lighting', 'film grain', 'color grading', 'anamorphic',
             'bokeh', 'depth of field', '35mm film', 'golden hour',
             'volumetric lighting', 'lens flare', 'professional color grading'],
    negative: ['cartoon', 'anime', '3d render', 'video game', 'blurry',
               'amateur', 'snapshot', 'cell phone photography']
  },
  oil_painting: {
    prefix: ['oil painting', 'classical art', 'renaissance'],
    suffix: ['masterpiece', 'baroque', 'by rembrandt and leonardo da vinci',
             'rich colors', 'visible brushstrokes', 'museum quality', 'fine art',
             'oil on canvas', 'traditional painting'],
    negative: ['photo', 'digital art', 'modern', 'blurry', 'low quality',
               'cartoon', 'anime', '3d render']
  },
  '3d_render': {
    prefix: ['3d render', 'octane render', 'unreal engine 5'],
    suffix: ['ray tracing', 'volumetric lighting', 'global illumination',
             'physically based rendering', 'subsurface scattering',
             'ambient occlusion', '8k uhd', 'highly detailed', 'cinematic'],
    negative: ['photo', '2d', 'sketch', 'drawing', 'blurry', 'low poly',
               'video game screenshot']
  },
  fantasy: {
    prefix: ['fantasy art', 'magical', 'ethereal'],
    suffix: ['epic scene', 'dramatic lighting', 'by boris vallejo and frank frazetta',
             'intricate details', 'mystical atmosphere', 'dungeons and dragons',
             'magic the gathering', 'lord of the rings', 'concept art'],
    negative: ['modern', 'urban', 'photorealistic', 'blurry', 'low quality',
               'sci-fi', 'technology', 'contemporary']
  },
  cyberpunk: {
    prefix: ['cyberpunk', 'neon lights', 'futuristic', 'sci-fi'],
    suffix: ['blade runner style', 'neon colors', 'high tech', 'dystopian',
             'highly detailed', '8k', 'volumetric lighting', 'ray tracing',
             'unreal engine 5', 'cinematic composition', 'metropolis'],
    negative: ['natural', 'organic', 'low tech', 'blurry', 'low quality',
               'amateur', 'medieval', 'fantasy']
  }
};

// Subject type detection and modifiers
const SUBJECT_MODIFIERS = {
  portrait: {
    modifiers: ['detailed facial features', 'symmetrical face', 
                'realistic skin texture', 'professional portrait',
                'studio lighting', 'catchlights in eyes'],
    applies_to: ['person', 'portrait', 'face', 'woman', 'man', 'girl', 'boy']
  },
  landscape: {
    modifiers: ['wide angle', 'panoramic', 'atmospheric perspective',
                'detailed environment', 'epic landscape', 'scenic view'],
    applies_to: ['landscape', 'mountain', 'forest', 'ocean', 'nature', 'scenery']
  },
  architecture: {
    modifiers: ['architectural visualization', 'clean lines', 
                'detailed structure', 'professional architecture'],
    applies_to: ['building', 'architecture', 'house', 'interior', 'exterior']
  },
  animal: {
    modifiers: ['detailed fur texture', 'sharp eyes', 'nature photography',
                'wildlife photography', 'detailed animal features'],
    applies_to: ['animal', 'cat', 'dog', 'bird', 'lion', 'tiger', 'wolf']
  },
  vehicle: {
    modifiers: ['automotive photography', 'detailed metal reflections',
                'professional car photography', 'detailed engineering'],
    applies_to: ['car', 'vehicle', 'motorcycle', 'truck', 'aircraft']
  }
};

// Camera/lens modifiers
const CAMERA_MODIFIERS = [
  'Canon EOS R5', 'Sony A7R IV', 'Nikon Z9', 'Fujifilm GFX 100',
  '85mm lens', '50mm lens', '35mm lens', '24mm lens',
  'f/1.8', 'f/2.8', 'f/4', 'f/8',
  'shallow depth of field', 'deep depth of field',
  'wide angle', 'telephoto', 'macro lens'
];

// Lighting modifiers
const LIGHTING_MODIFIERS = [
  'golden hour', 'blue hour', 'midday sun', 'overcast',
  'studio lighting', 'natural lighting', 'soft lighting',
  'dramatic lighting', 'rim lighting', 'backlighting',
  'volumetric lighting', 'cinematic lighting', 'neon lighting'
];

// ==========================================
// CORE ENHANCEMENT FUNCTIONS
// ==========================================

function detectSubjectType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [type, data] of Object.entries(SUBJECT_MODIFIERS)) {
    for (const keyword of data.applies_to) {
      if (lowerPrompt.includes(keyword)) {
        return type;
      }
    }
  }
  
  return 'general';
}

function detectStyle(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const styleKeywords = {
    photorealistic: ['photo', 'photorealistic', 'realistic', 'photography'],
    anime: ['anime', 'manga', 'chibi', 'ghibli'],
    oil_painting: ['oil painting', 'oil on canvas', 'baroque', 'renaissance'],
    digital_art: ['digital art', 'concept art', 'illustration'],
    cinematic: ['cinematic', 'film', 'movie', 'anamorphic'],
    '3d_render': ['3d', 'render', 'octane', 'unreal engine', 'blender'],
    fantasy: ['fantasy', 'magical', 'dragon', 'elf', 'wizard'],
    cyberpunk: ['cyberpunk', 'neon', 'futuristic', 'sci-fi']
  };
  
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        return style;
      }
    }
  }
  
  return 'digital_art';
}

function enhancePrompt(prompt, style = 'auto', quality = 'high', imageType = 'auto') {
  if (!prompt || prompt.trim() === '') {
    return '';
  }

  // Auto-detect if needed
  if (style === 'auto') {
    style = detectStyle(prompt);
  }
  
  if (imageType === 'auto') {
    imageType = detectSubjectType(prompt);
  }

  // Get style modifiers
  const styleData = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.digital_art;
  
  // Get quality modifiers
  const qualityMods = QUALITY_MODIFIERS[quality] || QUALITY_MODIFIERS.high;
  
  // Get subject modifiers
  let subjectMods = [];
  if (imageType !== 'general' && SUBJECT_MODIFIERS[imageType]) {
    subjectMods = SUBJECT_MODIFIERS[imageType].modifiers;
  }

  // Build enhanced prompt
  const parts = [];
  
  // Add quality prefix
  parts.push(...qualityMods.slice(0, 4));
  
  // Add style prefix
  parts.push(...styleData.prefix);
  
  // Add original prompt
  parts.push(prompt);
  
  // Add subject-specific modifiers
  if (subjectMods.length > 0) {
    parts.push(...subjectMods.slice(0, 3));
  }
  
  // Add random camera modifier (only for photorealistic/cinematic)
  if (style === 'photorealistic' || style === 'cinematic') {
    const randomCamera = CAMERA_MODIFIERS[Math.floor(Math.random() * CAMERA_MODIFIERS.length)];
    parts.push(randomCamera);
  }
  
  // Add random lighting modifier
  if (Math.random() > 0.5) {
    const randomLight = LIGHTING_MODIFIERS[Math.floor(Math.random() * LIGHTING_MODIFIERS.length)];
    if (!parts.some(p => p.toLowerCase().includes('lighting'))) {
      parts.push(randomLight);
    }
  }
  
  // Add style suffix
  parts.push(...styleData.suffix);
  
  // Add quality suffix
  parts.push(...qualityMods.slice(4, 6));
  
  // Clean up and join
  let enhanced = parts
    .filter(Boolean)
    .join(', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove trailing comma
  enhanced = enhanced.replace(/,\s*$/, '');
  
  return enhanced;
}

function getNegativePrompt(style = 'default') {
  const styleData = STYLE_MODIFIERS[style];
  
  if (styleData && styleData.negative) {
    return styleData.negative.join(', ');
  }
  
  // Default comprehensive negative prompt
  return [
    'low quality', 'blurry', 'distorted', 'deformed', 'ugly', 'duplicate',
    'watermark', 'signature', 'text', 'logo', 'cropped', 'worst quality',
    'jpeg artifacts', 'error', 'mutation', 'extra limbs', 'bad anatomy',
    'disfigured', 'poorly drawn face', 'bad proportions', 'gross proportions',
    'missing arms', 'missing legs', 'extra arms', 'extra legs',
    'fused fingers', 'too many fingers', 'long neck', 'cross-eyed'
  ].join(', ');
}

function createPromptVariations(basePrompt, count = 4) {
  const variations = [basePrompt];
  
  const angleModifiers = [
    'from above', 'from below', 'side view', 'front view',
    'from behind', 'bird eye view', 'worm eye view'
  ];
  
  const timeModifiers = [
    'at golden hour', 'at blue hour', 'at midnight', 'at noon',
    'at dawn', 'at dusk', 'during sunset', 'during sunrise'
  ];
  
  const weatherModifiers = [
    'on a rainy day', 'on a sunny day', 'during fog', 'with snow',
    'during storm', 'with mist', 'with clouds'
  ];
  
  const moodModifiers = [
    'mysterious atmosphere', 'peaceful scene', 'dramatic scene',
    'serene environment', 'chaotic energy', 'calm setting'
  ];
  
  const modifierSets = [
    angleModifiers,
    timeModifiers,
    weatherModifiers,
    moodModifiers
  ];
  
  for (let i = 1; i < count; i++) {
    const modifierSet = modifierSets[(i - 1) % modifierSets.length];
    const modifier = modifierSet[Math.floor(Math.random() * modifierSet.length)];
    variations.push(`${basePrompt}, ${modifier}`);
  }
  
  return variations;
}

function createStyleTransferPrompt(contentPrompt, styleReference) {
  const styleKeywords = {
    'van gogh': ['by vincent van gogh', 'post-impressionism', 'swirling brushstrokes', 'vibrant yellows and blues'],
    'monet': ['by claude monet', 'impressionism', 'soft brushstrokes', 'water lilies', 'gardens'],
    'picasso': ['by pablo picasso', 'cubism', 'geometric shapes', 'abstract', 'multiple perspectives'],
    'kandinsky': ['by wassily kandinsky', 'abstract expressionism', 'geometric shapes', 'vibrant colors'],
    'hokusai': ['by hokusai', 'ukiyo-e', 'japanese woodblock', 'the great wave', 'mt fuji'],
    'mucha': ['by alphonse mucha', 'art nouveau', 'decorative arts', 'flowing lines', 'elegant women']
  };
  
  const lowerRef = styleReference.toLowerCase();
  let styleMods = ['artistic style transfer', 'in the style of'];
  
  for (const [artist, keywords] of Object.entries(styleKeywords)) {
    if (lowerRef.includes(artist)) {
      styleMods = keywords;
      break;
    }
  }
  
  return `${contentPrompt}, ${styleMods.join(', ')}`;
}

function addEmphasis(prompt, terms) {
  let enhanced = prompt;
  
  for (const term of terms) {
    // Add emphasis using parentheses (Stable Diffusion syntax)
    if (!enhanced.includes(`(${term})`)) {
      enhanced = enhanced.replace(new RegExp(`\\b${term}\\b`, 'gi'), `(((${term})))`);
    }
  }
  
  return enhanced;
}

function removeRedundancy(prompt) {
  const parts = prompt.split(',').map(p => p.trim());
  const seen = new Set();
  const unique = [];
  
  for (const part of parts) {
    const normalized = part.toLowerCase();
    if (!seen.has(normalized) && normalized !== '') {
      seen.add(normalized);
      unique.push(part);
    }
  }
  
  return unique.join(', ');
}

// ==========================================
// ADVANCED FEATURES
// ==========================================

function analyzePromptComplexity(prompt) {
  const parts = prompt.split(',').length;
  const words = prompt.split(' ').length;
  const hasStyle = Object.keys(STYLE_MODIFIERS).some(style => 
    prompt.toLowerCase().includes(style.replace('_', ' '))
  );
  const hasQuality = QUALITY_MODIFIERS.ultra.some(q => 
    prompt.toLowerCase().includes(q.toLowerCase())
  );
  
  let score = 0;
  score += Math.min(parts * 2, 20);
  score += Math.min(words / 2, 20);
  score += hasStyle ? 20 : 0;
  score += hasQuality ? 20 : 0;
  
  return {
    score: Math.min(score, 100),
    parts,
    words,
    hasStyle,
    hasQuality,
    rating: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'needs improvement'
  };
}

function suggestPromptImprovements(prompt) {
  const analysis = analyzePromptComplexity(prompt);
  const suggestions = [];
  
  if (!analysis.hasStyle) {
    suggestions.push('Add a style modifier (e.g., "digital art", "photorealistic", "oil painting")');
  }
  
  if (!analysis.hasQuality) {
    suggestions.push('Add quality keywords (e.g., "masterpiece", "highly detailed", "8k")');
  }
  
  if (analysis.parts < 5) {
    suggestions.push('Add more descriptive details (lighting, mood, composition)');
  }
  
  const subjectType = detectSubjectType(prompt);
  if (subjectType !== 'general') {
    suggestions.push(`Detected ${subjectType} - consider adding ${subjectType}-specific details`);
  }
  
  return suggestions;
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  enhancePrompt,
  getNegativePrompt,
  createPromptVariations,
  createStyleTransferPrompt,
  addEmphasis,
  removeRedundancy,
  detectSubjectType,
  detectStyle,
  analyzePromptComplexity,
  suggestPromptImprovements,
  STYLE_MODIFIERS,
  QUALITY_MODIFIERS
};
