import { readFileSync } from 'fs'
import { join } from 'path'
import process from 'process'

function loadProducts() {
  const filePath = join(process.cwd(), 'data', 'products.json')
  const raw = readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

export default function handler(req, res) {
  try {
    const products = loadProducts()
    const id = String(req.query?.id ?? '')
    const product = products.find((item) => item.id === id)
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.status(200).json(product)
  } catch {
    res.status(500).json({ error: 'Failed to load product' })
  }
}
