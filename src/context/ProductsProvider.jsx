import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { apiUrl } from '../api/client.js'
import { db, firebaseConfigured } from '../firebase/config.js'
import { productFromFirestore } from '../lib/productFromFirestore.js'
import { ProductsContext } from './productsContext.js'

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const autoRetriedRef = useRef(false)

  const fetchProducts = useCallback((isManualRetry) => {
    if (isManualRetry) {
      setLoading(true)
      setError(null)
    }

    if (firebaseConfigured && db) {
      getDocs(collection(db, 'products'))
        .then((snapshot) => {
          const list = snapshot.docs
            .map((docSnap) => productFromFirestore(docSnap.id, docSnap.data()))
            .filter(Boolean)
          list.sort((a, b) => a.id.localeCompare(b.id))
          setProducts(list)
          autoRetriedRef.current = false
        })
        .catch((err) => {
          const message =
            err?.code === 'permission-denied'
              ? 'Firestore permission denied. Deploy firestore.rules and seed products.'
              : err?.message || 'Something went wrong'
          setError(message)
        })
        .finally(() => {
          setLoading(false)
        })
      return
    }

    fetch(apiUrl('/api/products'))
      .then(async (res) => {
        if (res.ok) {
          return res.json()
        }
        const fallback = await fetch('/products.json')
        if (!fallback.ok) {
          throw new Error('Failed to load products')
        }
        return fallback.json()
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
        autoRetriedRef.current = false
      })
      .catch(async (err) => {
        try {
          const fallback = await fetch('/products.json')
          if (!fallback.ok) {
            throw err
          }
          const data = await fallback.json()
          setProducts(Array.isArray(data) ? data : [])
          setError(null)
          autoRetriedRef.current = false
        } catch {
          setError(err.message || 'Something went wrong')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(false)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [fetchProducts])

  useEffect(() => {
    if (loading || !error || autoRetriedRef.current) return undefined
    autoRetriedRef.current = true
    const timeoutId = setTimeout(() => {
      fetchProducts(true)
    }, 900)
    return () => clearTimeout(timeoutId)
  }, [loading, error, fetchProducts])

  const retry = useCallback(() => {
    fetchProducts(true)
  }, [fetchProducts])

  const value = useMemo(
    () => ({ products, loading, error, retry }),
    [products, loading, error, retry],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
