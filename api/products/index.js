import { readFileSync } from 'fs'
import { join } from 'path'
import process from 'process'

function loadProducts() {
  const filePath = join(process.cwd(), 'data', 'products.json')
  const raw = readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

export default function handler(_req, res) {
  try {
    const products = loadProducts()
    res.status(200).json(products)
  } catch {
    res.status(500).json({ error: 'Failed to load products' })
  }
}
