/**
 * Uploads data/products.json into Firestore (products collection).
 *
 * Credentials (pick one):
 * 1. export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 * 2. Add that line to .env (this script reads .env itself)
 * 3. Save your key JSON as private/serviceAccount.local.json (gitignored)
 *
 * Run: npm run seed:firestore
 */
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const productsPath = join(rootDir, 'data', 'products.json')
const envPath = join(rootDir, '.env')
const privateKeyPath = join(rootDir, 'private', 'serviceAccount.local.json')

function stripQuotes(value) {
  const v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  return v
}

function ensureGoogleApplicationCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      if (key !== 'GOOGLE_APPLICATION_CREDENTIALS') continue
      const val = stripQuotes(trimmed.slice(eq + 1))
      if (val) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = val
        return
      }
    }
  }

  if (existsSync(privateKeyPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = privateKeyPath
  }
}

ensureGoogleApplicationCredentials()

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(`
Could not find Firebase Admin credentials.

Do one of the following, then run: npm run seed:firestore

  A) Firebase Console → Project settings → Service accounts → Generate new private key
     Save the JSON file somewhere safe, then either:
     • export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/key.json"
     • or add to .env:  GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
     • or copy the file to: private/serviceAccount.local.json
`)
  process.exit(1)
}

if (!existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist:', process.env.GOOGLE_APPLICATION_CREDENTIALS)
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
