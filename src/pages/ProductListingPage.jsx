import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import products from '../data/products.json'

function ProductListingPage({ onAddToCart, wishlist, onToggleWishlist }) {
  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [],
  )
  const maxProductPrice = useMemo(
    () => Math.ceil(Math.max(...products.map((product) => product.price))),
    [],
  )

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState(maxProductPrice)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450)
    return () => clearTimeout(timer)
  }, [])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          selectedCategory === 'All' || product.category === selectedCategory
        const matchesPrice = product.price <= priceRange
        return matchesCategory && matchesPrice
      }),
    [selectedCategory, priceRange],
  )

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
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Max Price: ${priceRange.toFixed(2)}
          <input
            type="range"
            min="0"
            max={maxProductPrice}
            step="1"
            value={priceRange}
            onChange={(event) => setPriceRange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="product-grid">
        {isLoading
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

      {filteredProducts.length === 0 ? (
        <p className="page-subtitle">No products match the selected filters.</p>
      ) : null}
    </section>
  )
}

export default ProductListingPage
