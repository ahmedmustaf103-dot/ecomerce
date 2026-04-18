import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../api/client.js'
import { ProductsContext } from './productsContext.js'

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/products'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load products')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ products, loading, error }),
    [products, loading, error],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
