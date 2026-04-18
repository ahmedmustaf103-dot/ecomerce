import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  comparePassword,
  hashPassword,
  signUserToken,
  verifyToken,
} from './authLib.js'
import { prisma } from './prisma.js'
import { seedProductsIfEmpty } from './seedProducts.js'
import { migrateLegacyJson } from './migrateLegacyJson.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

function productToApi(p) {
  let colors = []
  let sizes = []
  try {
    colors = JSON.parse(p.colors)
  } catch {
    colors = []
  }
  try {
    sizes = JSON.parse(p.sizes)
  } catch {
    sizes = []
  }
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    launchedAt: p.launchedAt,
    category: p.category,
    badge: p.badge,
    rating: p.rating,
    reviews: p.reviews,
    stock: p.stock,
    colors,
    sizes,
    image: p.image,
    description: p.description,
  }
}

function orderToApi(o) {
  return {
    id: o.id,
    date: o.date,
    total: o.total,
    itemsCount: o.itemsCount,
    userId: o.userId,
    items: o.items.map((i) => ({
      id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    })),
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required' })
    return
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/products', async (_req, res) => {
  try {
    const rows = await prisma.product.findMany({ orderBy: { id: 'asc' } })
    res.json(rows.map(productToApi))
  } catch {
    res.status(500).json({ error: 'Failed to load products' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!p) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json(productToApi(p))
  } catch {
    res.status(500).json({ error: 'Failed to load product' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const rawEmail = req.body?.email
    const password = req.body?.password
    if (typeof rawEmail !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    const email = rawEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email address' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }
    const passwordHash = await hashPassword(password)
    const id = randomUUID()
    const user = await prisma.user.create({
      data: {
        id,
        email,
        passwordHash,
      },
    })
    const token = signUserToken({ id: user.id, email: user.email })
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch {
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const rawEmail = req.body?.email
    const password = req.body?.password
    if (typeof rawEmail !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    const email = rawEmail.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    const token = signUserToken({ id: user.id, email: user.email })
    res.json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', (req, res) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.json({ user: null })
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    res.json({
      user: { id: payload.userId, email: payload.email },
    })
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
})

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders.map(orderToApi))
  } catch {
    res.status(500).json({ error: 'Failed to load orders' })
  }
})

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { total, itemsCount, items } = req.body
    if (typeof total !== 'number' || typeof itemsCount !== 'number') {
      res.status(400).json({ error: 'Invalid order payload' })
      return
    }
    const rawItems = Array.isArray(items) ? items : []
    const id = `NS${Date.now().toString().slice(-6)}`
    const date = new Date().toLocaleDateString()

    const order = await prisma.order.create({
      data: {
        id,
        userId: req.user.userId,
        date,
        total,
        itemsCount,
        items: {
          create: rawItems.map((item) => ({
            productId: String(item.id),
            name: String(item.name ?? ''),
            price: Number(item.price),
            quantity: Number(item.quantity),
            image: String(item.image ?? ''),
          })),
        },
      },
      include: { items: true },
    })

    res.status(201).json(orderToApi(order))
  } catch {
    res.status(500).json({ error: 'Failed to save order' })
  }
})

if (isProd) {
  const distPath = join(rootDir, 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.sendFile(join(distPath, 'index.html'))
  })
}

async function start() {
  await seedProductsIfEmpty()
  await migrateLegacyJson()

  const server = app.listen(PORT)
  server.once('listening', () => {
    console.log(`API server listening on http://localhost:${PORT}`)
  })
  server.on('error', (err) => {
    console.error(`Cannot bind to port ${PORT} (is another API or app already using it?)`, err.message)
    process.exit(1)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
