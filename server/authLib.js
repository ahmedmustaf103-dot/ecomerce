import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export const JWT_SECRET = process.env.JWT_SECRET || 'novastore-dev-secret-change-me'

export function signUserToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}
