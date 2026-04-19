# AI Image Generator - Enhanced Version

A comprehensive AI image generation application with advanced features, accessibility support, and production-ready architecture.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Accessibility](#accessibility)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

The Enhanced AI Image Generator is a full-stack application featuring:
- React frontend with TypeScript
- Node.js/Express backend
- Hugging Face Stable Diffusion API integration
- User authentication with JWT
- Favorites and bulk operations
- Comprehensive accessibility support

## Features

### Core Features

✅ **AI Image Generation**
- Stable Diffusion 2.1 integration via Hugging Face
- Custom prompt and negative prompt support
- Multiple aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16)
- Style presets (Photorealistic, Digital Art, Anime, Cyberpunk, Fantasy)
- Real-time progress tracking
- Image download functionality

✅ **User Authentication**
- JWT-based authentication
- User registration and login
- Password hashing with bcrypt
- Session management
- Credit-based usage system

✅ **Gallery Management**
- View all generated images
- Filter by favorites
- Image preview modal
- Download individual images
- Bulk delete operations
- Bulk favorite operations

✅ **Favorites System**
- Mark images as favorites
- Filter gallery by favorites
- Toggle favorite status
- Persistent favorites per user

### Accessibility Features

♿ **Keyboard Navigation**
- Full keyboard support for all interactive elements
- Keyboard shortcuts (Ctrl+Enter to generate)
- Focus management and focus indicators
- Skip to main content link

♿ **Screen Reader Support**
- ARIA labels on all interactive elements
- Role attributes for semantic structure
- Live regions for status updates
- Alt text for all images

♿ **Visual Accessibility**
- High contrast mode support
- Focus visible indicators
- Reduced motion support
- Color-independent information

♿ **Semantic HTML**
- Proper heading hierarchy
- Landmark regions (main, nav, footer)
- Form labels and fieldsets
- Table/grid semantics

## Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── AppEnhanced.tsx         # Enhanced version with all features
│   ├── App-original.tsx        # Original version (backup)
│   ├── main.tsx                # Application entry point
│   ├── env.d.ts               # TypeScript environment types
│   ├── components/
│   │   ├── AccessibleComponents.tsx  # Accessible UI components
│   │   ├── CyberEffects.tsx          # Cyber-themed animations
│   │   └── ...
│   ├── pages/
│   │   ├── Generator.tsx      # Image generation page
│   │   ├── Gallery.tsx        # Gallery page
│   │   ├── History.tsx        # Generation history
│   │   ├── Login.tsx          # Login page
│   │   ├── Register.tsx       # Registration page
│   │   └── ...
│   ├── store/
│   │   ├── index.ts           # Zustand store definitions
│   │   ├── authStore.ts       # Authentication state
│   │   └── themeStore.ts      # Theme state
│   └── styles/
│       ├── enhanced-app.css   # Enhanced app styles
│       ├── cyber-theme.css    # Cyber theme styles
│       └── ...
```

### Backend Architecture

```
server-enhanced-v2.js         # Enhanced server with all features
server-vps.js                 # Original VPS server

API Endpoints:
├── Authentication
│   ├── POST /api/auth/register
│   ├── POST /api/auth/login
│   └── GET  /api/me
├── Generation
│   ├── POST /api/generate
│   ├── GET  /api/generations
│   ├── GET  /api/generations/:id
│   └── GET  /api/models
├── Favorites
│   ├── GET    /api/favorites
│   ├── POST   /api/favorites/:id
│   └── DELETE /api/favorites/:id
├── Bulk Operations
│   ├── POST /api/bulk/delete
│   └── POST /api/bulk/favorite
└── Health
    └── GET /api/health
```

## API Documentation

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 10,
    "plan": "free"
  }
}
```

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 10,
    "plan": "free"
  }
}
```

#### GET /api/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "credits": 10,
  "plan": "free"
}
```

### Generation

#### POST /api/generate
Generate a new image.

**Headers:**
```
Authorization: Bearer <token> (optional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "width": 512,
  "height": 512,
  "stylePreset": "photorealistic",
  "model": "stable-diffusion"
}
```

**Response:**
```json
{
  "generationId": "uuid",
  "status": "PROCESSING",
  "message": "Generation started"
}
```

#### GET /api/generations
List all generations for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "prompt": "A beautiful sunset",
    "status": "COMPLETED",
    "url": "/uploads/uuid.png",
    "createdAt": "2024-01-15T10:30:00Z",
    "width": 512,
    "height": 512,
    "stylePreset": "photorealistic"
  }
]
```

#### GET /api/generations/:id
Get status of a specific generation.

**Response:**
```json
{
  "id": "uuid",
  "prompt": "A beautiful sunset",
  "status": "COMPLETED",
  "url": "/uploads/uuid.png",
  "progress": 100,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Favorites

#### GET /api/favorites
Get all favorite generations for the user.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /api/favorites/:id
Add a generation to favorites.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Added to favorites"
}
```

#### DELETE /api/favorites/:id
Remove a generation from favorites.

**Headers:**
```
Authorization: Bearer <token>
```

### Bulk Operations

#### POST /api/bulk/delete
Delete multiple generations.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 3,
  "message": "3 items deleted"
}
```

#### POST /api/bulk/favorite
Add multiple generations to favorites.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2"]
}
```

## Accessibility

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Enter` | Generate image |
| `Esc` | Close modal / Cancel generation |
| `Tab` | Navigate between elements |
| `Enter` / `Space` | Activate button or link |

### ARIA Labels

All interactive elements have appropriate ARIA labels:
- Buttons have descriptive labels
- Images have alt text
- Form fields have associated labels
- Live regions announce status changes

### Focus Management

- Skip link for quick navigation to main content
- Visible focus indicators on all interactive elements
- Focus trapping in modals
- Focus restoration after modal close

### Screen Reader Features

- Semantic HTML structure
- ARIA roles and properties
- Status announcements for generation progress
- Error announcements via alert regions

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Hugging Face API key

### Server Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
HUGGINGFACE_API_KEY=your_key_here
JWT_SECRET=your_secret_here
PORT=3000

# Start server
node server-enhanced-v2.js
```

### Client Setup

```bash
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with API URL
VITE_API_URL=http://localhost:3000

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

### Environment Variables

**Server (.env):**
```
HUGGINGFACE_API_KEY=your_huggingface_key
JWT_SECRET=your_jwt_secret
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_API_URL=http://localhost:3000
```

## Usage

### Starting the Application

1. Start the server:
```bash
node server-enhanced-v2.js
```

2. Start the client:
```bash
cd client && npm run dev
```

3. Open http://localhost:5173 in your browser

### Demo Credentials

- Email: `demo@example.com`
- Password: `demo123`

### Generating Images

1. Enter a descriptive prompt
2. (Optional) Add a negative prompt
3. Select a style preset
4. Choose an aspect ratio
5. Click "Generate Image" or press `Ctrl+Enter`
6. Wait for generation to complete
7. Download or save to favorites

## Testing

### Running Tests

```bash
# End-to-end API tests
node test-e2e.js

# With custom API URL
API_URL=http://localhost:3000 node test-e2e.js
```

### Test Coverage

- Health check endpoint
- User registration
- User login
- Authentication middleware
- Image generation
- Generation status polling
- Favorites management
- Bulk operations
- Error handling

## Deployment

### VPS Deployment

1. Upload files to server
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start with PM2:
```bash
pm2 start server-enhanced-v2.js --name ai-generator
pm2 save
pm2 startup
```

5. Configure Nginx reverse proxy
6. Open firewall port:
```bash
ufw allow 3000
```

### Production Considerations

- Use environment-specific JWT_SECRET
- Enable HTTPS
- Set up proper CORS origins
- Use a database instead of in-memory stores
- Implement rate limiting per user
- Set up monitoring and logging

## Troubleshooting

### Common Issues

**"Model is loading" error:**
- First request to Hugging Face API requires model warm-up
- Wait 2-3 minutes and retry

**CORS errors:**
- Check FRONTEND_URL environment variable
- Ensure CORS origin matches your frontend URL

**Rate limiting:**
- Default: 100 requests per 15 minutes
- Generation: 5 per minute
- Adjust in server configuration if needed

## License

MIT License

## Contributing

Contributions are welcome! Please ensure:
- Code follows accessibility guidelines (WCAG 2.1 AA)
- All interactive elements are keyboard accessible
- Proper ARIA labels are added
- TypeScript types are maintained
