#!/usr/bin/env python3
"""
AI Image Generator - Python Flask Backend
Clean rebuild with all features
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')
CORS(app, origins='*')

# Configuration
UPLOAD_FOLDER = 'uploads'
STATIC_FOLDER = 'static'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

# Load API key
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')

@app.route('/')
def index():
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'version': '3.0.0',
        'features': ['text-to-image', 'enhancement', 'open-source']
    })

@app.route('/api/enhance-prompt', methods=['POST'])
def enhance_prompt():
    data = request.get_json()
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400
    
    # Enhance with quality keywords
    enhanced = f"{prompt}, masterpiece, best quality, highly detailed, 8k uhd, intricate details"
    
    return jsonify({
        'originalPrompt': prompt,
        'enhancedPrompt': enhanced,
        'negativePrompt': 'blurry, low quality, pixelated, watermark, signature, text, cropped'
    })

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt = data.get('prompt', '')
    model = data.get('model', 'RunDiffusion/Juggernaut-XL-v9')
    
    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400
    
    if not HUGGINGFACE_API_KEY:
        return jsonify({'error': 'HUGGINGFACE_API_KEY not configured'}), 500
    
    try:
        # Call Hugging Face API
        response = requests.post(
            f'https://api-inference.huggingface.co/models/{model}',
            headers={'Authorization': f'Bearer {HUGGINGFACE_API_KEY}'},
            json={
                'inputs': prompt,
                'parameters': {
                    'width': 1024,
                    'height': 1024,
                    'num_inference_steps': 30,
                    'guidance_scale': 7.5
                }
            },
            timeout=120
        )
        
        if response.status_code == 200:
            # Save image
            filename = f"{uuid.uuid4()}_generated.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return jsonify({
                'url': f'/uploads/{filename}',
                'filename': filename,
                'prompt': prompt,
                'model': model
            })
        else:
            return jsonify({'error': f'Generation failed: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 AI Image Generator v3.0 - Python Flask')
    print('📡 Running on http://0.0.0.0:5000')
    print('🎨 Features: JuggernautXL, RealVisXL, DreamShaperXL')
    print('💰 100% FREE using Hugging Face')
    app.run(host='0.0.0.0', port=5000, debug=True)
