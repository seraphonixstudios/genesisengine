#!/bin/bash
# Fix App.js - Add API_BASE, fix fetch URLs, add prompt enhancement

APP_FILE="/var/www/ai-generator/client/src/App.js"

# 1. Add API_BASE constant before function App()
sed -i '148i\
// API Configuration\
const API_BASE = "http://76.13.242.128:5000";\
' "$APP_FILE"

# 2. Replace fetch URL to use API_BASE  
sed -i "s|fetch('/api/generate'|fetch(API_BASE + '/api/generate'|g" "$APP_FILE"

# 3. Add handleEnhancePrompt function after handleGenerate
# Find the line with "setIsGenerating(false);" and "};" after handleGenerate
sed -i '/setIsGenerating(false);/{N;N;s/\(setIsGenerating(false);\n    \}\n  \}\);/\1\n    \}\n  \}\);\n\n  const handleEnhancePrompt = async () => {\n    if (!prompt.trim()) return;\n    setIsGenerating(true);\n    try {\n      const response = await fetch(API_BASE + \/api\/enhance-prompt', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application\/json' },\n        body: JSON.stringify({ prompt })\n      });\n      const data = await response.json();\n      if (data.enhancedPrompt) {\n        setPrompt(data.enhancedPrompt);\n      }\n    } catch (error) {\n      console.error('Enhancement error:', error);\n    } finally {\n      setIsGenerating(false);\n    }\n  };/}' "$APP_FILE"

echo "Fixes applied to App.js"
