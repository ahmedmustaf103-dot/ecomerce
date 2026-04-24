/**
 * Uploads data/products.json into Firestore (products collection).
 *
 * 1. Enable Firestore in the Firebase console.
 * 2. Create a service account key (Project settings → Service accounts).
 * 3. export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 *
 * Run: npm run seed:firestore
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const productsPath = join(rootDir, 'data', 'products.json')

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path.')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
})

const db = admin.firestore()

function parseLaunchTimestamp(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return admin.firestore.Timestamp.fromDate(date)
}

async function main() {
  const products = JSON.parse(readFileSync(productsPath, 'utf8'))
  if (!Array.isArray(products)) {
    console.error('products.json must be an array')
    process.exit(1)
  }

  for (const p of products) {
    await db.collection('products').doc(String(p.id)).set({
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice ?? null,
      launchedAt: parseLaunchTimestamp(p.launchedAt),
      category: p.category,
      badge: p.badge ?? null,
      rating: p.rating,
      reviews: p.reviews,
      stock: p.stock,
      colors: Array.isArray(p.colors) ? p.colors : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      image: p.image,
      description: p.description,
    })
    console.log('Seeded product', p.id)
  }

  console.log('Done. Uploaded', products.length, 'products.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
