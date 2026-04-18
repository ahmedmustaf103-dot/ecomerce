const base = import.meta.env.VITE_API_URL ?? ''

export const AUTH_TOKEN_KEY = 'novastore-auth-token'

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function authHeaders(token = getStoredToken()) {
  if (!token) {
    return {}
  }
  return { Authorization: `Bearer ${token}` }
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...authHeaders(),
  }
  return fetch(apiUrl(path), { ...options, headers })
}
