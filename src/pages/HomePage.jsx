import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import products from '../data/products.json'

function HomePage({ onAddToCart, wishlist, onToggleWishlist }) {
  const [isLoading, setIsLoading] = useState(true)
  const trendingProducts = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const score = (value) =>
      value.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
    const ranked = [...products].sort((a, b) => {
      const scoreA = score(`${todayKey}-${a.id}`)
      const scoreB = score(`${todayKey}-${b.id}`)
      return scoreB - scoreA
    })
    return ranked.slice(0, 4)
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="page">
      <div className="hero-banner">
        <p className="eyebrow">New Season Picks</p>
        <h1>Modern essentials for everyday life.</h1>
        <p>
          Discover curated products built for comfort, style, and performance.
        </p>
        <Link className="button secondary hero-cta" to="/products">
          Shop Products
        </Link>
      </div>

      <div className="section-head">
        <h2>Trending Products</h2>
        <Link to="/products" className="product-title-link">
          View all
        </Link>
      </div>

      <div className="product-grid">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article className="product-card skeleton-card" key={`home-skeleton-${index}`} />
            ))
          : trendingProducts.map((product) => (
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
    </section>
  )
}

export default HomePage
