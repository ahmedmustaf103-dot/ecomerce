import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, firebaseConfigured } from '../firebase.js'
import { productFromFirestore } from '../lib/productFromFirestore.js'
import { ProductsContext } from './productsContext.js'

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      if (!firebaseConfigured || !db) {
        setError(
          'Firebase is not configured. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (and other web app keys) to .env — see .env.example.',
        )
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const snapshot = await getDocs(collection(db, 'products'))
        if (cancelled) return

        const list = snapshot.docs
          .map((docSnap) => {
            const id = docSnap.id
            const data = docSnap.data()
            return productFromFirestore(id, data)
          })
          .filter(Boolean)

        list.sort((a, b) => a.id.localeCompare(b.id))
        if (list.length === 0) {
          setError(
            'No products found in the Firestore `products` collection. Seed them: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON, then run npm run seed:firestore.',
          )
        } else {
          setError(null)
        }
        setProducts(list)
      } catch (err) {
        if (cancelled) return
        const message =
          err?.code === 'permission-denied'
            ? 'Firestore permission denied. In Firebase Console → Firestore → Rules, allow public read on `products` (see firestore.rules in this repo), then Publish.'
            : err?.code === 'failed-precondition'
              ? 'Firestore may not be enabled for this project, or the database is unavailable.'
              : err?.message || 'Something went wrong'
        setError(message)
        setProducts([])
      } finally {
        // Always clear loading (avoids stuck spinner when React Strict Mode aborts an in-flight request).
        setLoading(false)
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  const value = useMemo(
    () => ({ products, loading, error, retry }),
    [products, loading, error, retry],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
