import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './prisma.js'
import { seedProductsIfEmpty } from './seedProducts.js'

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
