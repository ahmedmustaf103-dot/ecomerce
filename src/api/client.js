const base = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
