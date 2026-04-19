import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))

// In-memory storage (use database in production)
const users: any[] = []
const generations: any[] = []

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2)
    })

    const { email, password, name } = schema.parse(req.body)

    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      credits: 100
    }

    users.push(user)

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
      token
    })
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' })
  }
})

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = users.find(u => u.email === email)

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  )

  res.json({
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
    token
  })
})

// Generate image
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    const user = users.find(u => u.id === decoded.userId)

    if (!user || user.credits < 1) {
      return res.status(403).json({ error: 'Insufficient credits' })
    }

    user.credits--

    const { prompt, model = 'stable-diffusion', width = 1024, height = 1024 } = req.body

    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 3000))

    const generation = {
      id: uuidv4(),
      userId: user.id,
      prompt,
      model,
      width,
      height,
      status: 'completed',
      url: `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    generations.push(generation)

    res.json({
      success: true,
      generation: {
        id: generation.id,
        url: generation.url,
        prompt: generation.prompt
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Generation failed' })
  }
})

// Get user's generations
app.get('/api/generations', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any

  const userGenerations = generations
    .filter(g => g.userId === decoded.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json(userGenerations)
})

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`✅ Frontend at http://localhost:5173`)
})
