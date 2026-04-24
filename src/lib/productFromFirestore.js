/**
 * Normalizes a Firestore product document into the shape used by the React app.
 */
export function productFromFirestore(docId, data) {
  if (!data) return null

  let launchedAt = data.launchedAt
  if (launchedAt && typeof launchedAt.toDate === 'function') {
    launchedAt = launchedAt.toDate().toISOString()
  } else if (launchedAt instanceof Date) {
    launchedAt = launchedAt.toISOString()
  }

  let colors = data.colors
  let sizes = data.sizes
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors)
    } catch {
      colors = []
    }
  }
  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes)
    } catch {
      sizes = []
    }
  }
  if (!Array.isArray(colors)) colors = []
  if (!Array.isArray(sizes)) sizes = []

  return {
    id: docId,
    name: data.name,
    price: typeof data.price === 'number' ? data.price : Number(data.price),
    originalPrice:
      data.originalPrice == null ? null : typeof data.originalPrice === 'number'
        ? data.originalPrice
        : Number(data.originalPrice),
    launchedAt: launchedAt ?? null,
    category: data.category,
    badge: data.badge ?? null,
    rating: typeof data.rating === 'number' ? data.rating : Number(data.rating),
    reviews: typeof data.reviews === 'number' ? data.reviews : Number(data.reviews),
    stock: typeof data.stock === 'number' ? data.stock : Number(data.stock),
    colors,
    sizes,
    image: data.image,
    description: data.description,
  }
}
