import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../api/client.js'
import { ProductsContext } from './productsContext.js'

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback((isManualRetry) => {
    if (isManualRetry) {
      setLoading(true)
      setError(null)
    }
    fetch(apiUrl('/api/products'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load products')
        return res.json()
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong')
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

  const retry = useCallback(() => {
    fetchProducts(true)
  }, [fetchProducts])

  const value = useMemo(
    () => ({ products, loading, error, retry }),
    [products, loading, error, retry],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
