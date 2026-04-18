import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './prisma.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const usersPath = join(dataDir, 'users.json')
const ordersPath = join(dataDir, 'orders.json')

/**
 * Imports rows from pre-SQLite JSON files if they exist (one-way, idempotent per row).
 */
export async function migrateLegacyJson() {
  if (existsSync(usersPath)) {
    try {
      const raw = readFileSync(usersPath, 'utf8')
      const users = JSON.parse(raw)
      if (Array.isArray(users)) {
        for (const u of users) {
          if (!u?.id || !u?.email || !u?.passwordHash) continue
          const email = String(u.email).trim().toLowerCase()
          const existingEmail = await prisma.user.findUnique({ where: { email } })
          if (existingEmail) continue
          const existingId = await prisma.user.findUnique({ where: { id: u.id } })
          if (existingId) continue
          await prisma.user.create({
            data: {
              id: u.id,
              email,
              passwordHash: u.passwordHash,
              createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
            },
          })
        }
      }
    } catch (err) {
      console.warn('[migrate] users.json skipped:', err.message)
    }
  }

  if (existsSync(ordersPath)) {
    try {
      const raw = readFileSync(ordersPath, 'utf8')
      const orders = JSON.parse(raw)
      if (!Array.isArray(orders)) return
      for (const o of orders) {
        if (!o?.id || !o?.userId) continue
        const exists = await prisma.order.findUnique({ where: { id: o.id } })
        if (exists) continue
        const user = await prisma.user.findUnique({ where: { id: o.userId } })
        if (!user) continue
        const items = Array.isArray(o.items) ? o.items : []
        await prisma.order.create({
          data: {
            id: o.id,
            userId: o.userId,
            date: String(o.date ?? ''),
            total: Number(o.total),
            itemsCount: Number(o.itemsCount ?? 0),
            items: {
              create: items.map((item) => ({
                productId: String(item.id ?? ''),
                name: String(item.name ?? ''),
                price: Number(item.price),
                quantity: Number(item.quantity),
                image: String(item.image ?? ''),
              })),
            },
          },
        })
      }
    } catch (err) {
      console.warn('[migrate] orders.json skipped:', err.message)
    }
  }
}
