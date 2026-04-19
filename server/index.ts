import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import Queue from 'bull'
import { createClient } from 'redis'
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { validationResult, body } from 'express-validator'
import { createBullBoard } from '@bull-board/express'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/api/dist/src/queueAdapters/express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'

// Load environment variables
dotenv.config()

// Initialize Prisma
const prisma = new PrismaClient()

// Initialize Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})
redisClient.connect().catch(console.error)

// Initialize queues
const imageGenerationQueue = new Queue('image-generation', process.env.REDIS_URL || 'redis://localhost:6379')

// Express app
const app = express()
const PORT = process.env.PORT || 5000

// Prometheus metrics
collectDefaultMetrics({ register })

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
})

const imageGenerationDuration = new Histogram({
  name: 'image_generation_duration_seconds',
  help: 'Duration of image generation in seconds',
  labelNames: ['model'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register]
})

const imagesGeneratedTotal = new Counter({
  name: 'images_generated_total',
  help: 'Total images generated',
  labelNames: ['model', 'status'],
  registers: [register]
})

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    })
  })
  next()
})

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Generation limit exceeded. Max 5 generations per minute.' }
})

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
    
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Bull Board (Queue monitoring)
const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullAdapter(imageGenerationQueue)],
  serverAdapter
})
serverAdapter.setBasePath('/admin/queues')
app.use('/admin/queues', serverAdapter.getRouter())

// File upload setup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Queue processor
imageGenerationQueue.process(async (job) => {
  const startTime = Date.now()
  const { prompt, negativePrompt, model, width, height, steps, guidanceScale, stylePreset, userId } = job.data

  try {
    // Simulate image generation (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const duration = (Date.now() - startTime) / 1000
    imageGenerationDuration.observe({ model }, duration)
    imagesGeneratedTotal.inc({ model, status: 'success' })

    // Save to database
    const generation = await prisma.generation.create({
      data: {
        id: uuidv4(),
        userId,
        prompt,
        negativePrompt,
        model,
        width,
        height,
        steps,
        guidanceScale,
        stylePreset,
        status: 'completed',
        url: `/uploads/sample-${Date.now()}.png`,
        duration,
      }
    })

    return { success: true, generation }
  } catch (error) {
    imagesGeneratedTotal.inc({ model, status: 'error' })
    throw error
  }
})

// Routes

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      services: {
        database: 'connected',
        redis: redisClient.isReady ? 'connected' : 'disconnected',
        queue: 'active'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// Authentication routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2)
    })

    const { email, password, name } = schema.parse(req.body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        credits: 100,
        plan: 'free'
      }
    })

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      },
      accessToken,
      refreshToken
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      },
      accessToken,
      refreshToken
    })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// Protected routes
app.use('/api', apiLimiter)
app.use('/api/generate', authenticate, strictLimiter)

// Image generation
app.post('/api/generate', [
  body('prompt').trim().notEmpty().isLength({ max: 1000 }),
  body('model').optional().isIn(['stable-diffusion', 'realistic-vision', 'dreamlike', 'anime']),
  body('width').optional().isInt({ min: 256, max: 2048 }),
  body('height').optional().isInt({ min: 256, max: 2048 }),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const {
      prompt,
      negativePrompt,
      model = 'stable-diffusion',
      width = 1024,
      height = 1024,
      steps = 30,
      guidanceScale = 7.5,
      stylePreset = 'none'
    } = req.body

    // Check user credits
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user || user.credits < 1) {
      return res.status(403).json({ error: 'Insufficient credits' })
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { credits: { decrement: 1 } }
    })

    // Add to queue
    const job = await imageGenerationQueue.add({
      prompt,
      negativePrompt,
      model,
      width,
      height,
      steps,
      guidanceScale,
      stylePreset,
      userId: req.user!.userId
    })

    res.json({
      jobId: job.id,
      status: 'processing',
      message: 'Image generation started'
    })
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: 'Failed to start generation' })
  }
})

// Get generation status
app.get('/api/generate/:jobId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const job = await imageGenerationQueue.getJob(req.params.jobId)
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const state = await job.getState()
    const result = job.returnvalue

    res.json({
      jobId: job.id,
      status: state,
      result: state === 'completed' ? result : null,
      progress: job.progress()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job status' })
  }
})

// Get user's generations
app.get('/api/generations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const generations = await prisma.generation.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(generations)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generations' })
  }
})

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  await redisClient.disconnect()
  process.exit(0)
})

// Start server
app.listen(PORT, () => {
  console.log(`AI Image Generator server running on port ${PORT}`)
  console.log(`Bull Board available at http://localhost:${PORT}/admin/queues`)
})

export default app
