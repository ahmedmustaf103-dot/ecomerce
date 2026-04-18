import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'

function ProductListingPage({ onAddToCart, wishlist, onToggleWishlist }) {
  const { products, loading, error } = useProducts()

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products],
  )
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 0
    return Math.ceil(Math.max(...products.map((product) => product.price)))
  }, [products])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState(null)

  const filteredProducts = useMemo(() => {
    const cap = priceRange ?? maxProductPrice
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory
      const matchesPrice =
        maxProductPrice === 0 || cap == null || product.price <= cap
      return matchesCategory && matchesPrice
    })
  }, [products, selectedCategory, priceRange, maxProductPrice])

  if (error) {
    return (
      <section className="page">
        <h1>Products</h1>
        <div className="empty-state">
          <p>Could not load products.</p>
          <p className="page-subtitle">{error}</p>
          <p className="page-subtitle">Run npm run dev:api alongside the Vite dev server, or use npm run dev:full.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <h1>Products</h1>
      <p className="page-subtitle">
        Browse our curated collection and add your favorites to cart.
      </p>

      <div className="filters">
        <label>
          Category
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            disabled={loading}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Max Price: ${(priceRange ?? maxProductPrice).toFixed(2)}
          <input
            type="range"
            min="0"
            max={maxProductPrice || 1}
            step="1"
            value={priceRange ?? maxProductPrice}
            onChange={(event) => setPriceRange(Number(event.target.value))}
            disabled={loading || maxProductPrice === 0}
          />
        </label>
      </div>

      <div className="product-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <article className="product-card skeleton-card" key={`skeleton-${index}`} />
            ))
          : filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <Link className="product-clickable" to={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="product-card-body">
                  <span className="badge">{product.badge}</span>
                  <p className="product-category">{product.category}</p>
                  <h2>
                    <Link className="product-title-link" to={`/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </h2>
                  <p className="rating-line">
                    {'★'.repeat(Math.round(product.rating))} {product.rating} ({product.reviews})
                  </p>
                  <p className="product-price">${product.price.toFixed(2)}</p>
                  <div className="product-card-actions">
                    <button className="button" onClick={() => onAddToCart(product)}>
                      Add to Cart
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => onToggleWishlist(product)}
                    >
                      {wishlist.some((item) => item.id === product.id)
                        ? 'Wishlisted'
                        : 'Wishlist'}
                    </button>
                    <Link className="button secondary" to={`/products/${product.id}`}>
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
      </div>

      {!loading && filteredProducts.length === 0 ? (
        <p className="page-subtitle">No products match the selected filters.</p>
      ) : null}
    </section>
  )
}

export default ProductListingPage
