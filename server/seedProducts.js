import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './prisma.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const productsPath = join(rootDir, 'data', 'products.json')

function parseLaunchDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Syncs catalog rows from data/products.json into the Product table.
 * Existing product ids are updated; new ids are inserted.
 */
export async function seedProductsIfEmpty() {
  const raw = readFileSync(productsPath, 'utf8')
  const products = JSON.parse(raw)
  if (!Array.isArray(products) || products.length === 0) {
    return
  }
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        launchedAt: parseLaunchDate(p.launchedAt),
        category: p.category,
        badge: p.badge ?? null,
        rating: p.rating,
        reviews: p.reviews,
        stock: p.stock,
        colors: JSON.stringify(p.colors ?? []),
        sizes: JSON.stringify(p.sizes ?? []),
        image: p.image,
        description: p.description,
      },
      create: {
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        launchedAt: parseLaunchDate(p.launchedAt),
        category: p.category,
        badge: p.badge ?? null,
        rating: p.rating,
        reviews: p.reviews,
        stock: p.stock,
        colors: JSON.stringify(p.colors ?? []),
        sizes: JSON.stringify(p.sizes ?? []),
        image: p.image,
        description: p.description,
      },
    })
  }
}
