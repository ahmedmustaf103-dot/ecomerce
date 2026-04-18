import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'

function ProductDetailsPage({ onAddToCart, wishlist, onToggleWishlist }) {
  const { productId } = useParams()
  const { products, loading, error } = useProducts()
  const product = products.find((item) => item.id === productId)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')

  const inWishlist = useMemo(
    () => wishlist.some((item) => item.id === product?.id),
    [wishlist, product?.id],
  )
  const relatedProducts = useMemo(() => {
    if (!product) return []
    const sameCategory = products.filter(
      (item) => item.id !== product.id && item.category === product.category,
    )
    const other = products.filter(
      (item) => item.id !== product.id && item.category !== product.category,
    )
    return [...sameCategory, ...other].slice(0, 6)
  }, [product, products])

  const carouselRef = useRef(null)
  const scrollCarousel = useCallback((direction) => {
    const node = carouselRef.current
    if (!node) return
    const card = node.querySelector('.carousel-item')
    const delta =
      (card?.getBoundingClientRect().width ?? node.clientWidth * 0.75) + 16
    node.scrollBy({ left: direction * delta, behavior: 'smooth' })
  }, [])
  const sampleReviews = useMemo(
    () => [
      {
        id: 'r1',
        author: 'Ava M.',
        text: 'Excellent quality and fast delivery. Looks even better in person.',
      },
      {
        id: 'r2',
        author: 'Noah K.',
        text: 'Great value for the price. I use this every day and it still feels premium.',
      },
      {
        id: 'r3',
        author: 'Mia L.',
        text: 'Exactly as described, packaging was great, and checkout was smooth.',
      },
    ],
    [],
  )

  if (error) {
    return (
      <section className="page narrow">
        <h1>Could not load product</h1>
        <p className="page-subtitle">{error}</p>
        <Link to="/" className="button secondary">
          Back to Home
        </Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="page">
        <article className="details-card">
          <div className="skeleton-card skeleton-details-image" />
          <div className="details-content">
            <div className="skeleton-line skeleton-line-wide" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        </article>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="page narrow">
        <h1>Product not found</h1>
        <p>We could not find the product you are looking for.</p>
        <Link to="/" className="button secondary">
          Back to Home
        </Link>
      </section>
    )
  }

  return (
    <section className="page">
      <article className="details-card">
        <img src={product.image} alt={product.name} />
        <div className="details-content">
          <span className="badge">{product.badge}</span>
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="rating-line">
            {'★'.repeat(Math.round(product.rating))} {product.rating} ({product.reviews} reviews)
          </p>
          <p className="details-description">{product.description}</p>
          <p className="page-subtitle">In stock: {product.stock}</p>
          {product.colors.length > 0 ? (
            <label className="selector">
              Color
              <select
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
              >
                <option value="">Select color</option>
                {product.colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {product.sizes.length > 0 ? (
            <label className="selector">
              Size
              <select
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
              >
                <option value="">Select size</option>
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="product-price large">${product.price.toFixed(2)}</p>
          <p className="page-subtitle">
            <s>${product.originalPrice.toFixed(2)}</s> • You save $
            {(product.originalPrice - product.price).toFixed(2)}
          </p>
          <div className="details-actions">
            <button className="button" onClick={() => onAddToCart(product)}>
              Add to Cart
            </button>
            <button className="button secondary" onClick={() => onToggleWishlist(product)}>
              {inWishlist ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <Link to="/cart" className="button secondary">
              Go to Cart
            </Link>
          </div>
        </div>
      </article>

      <section className="reviews-grid">
        <h2>Customer Reviews</h2>
        <div className="reviews-list">
          {sampleReviews.map((review) => (
            <article className="review-card" key={review.id}>
              <p className="rating-line">★★★★★</p>
              <p>{review.text}</p>
              <p className="page-subtitle">{review.author}</p>
            </article>
          ))}
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="reviews-grid carousel-section">
          <div className="carousel-head">
            <h2>You May Also Like</h2>
            <div className="carousel-arrows" aria-label="Carousel controls">
              <button
                type="button"
                className="carousel-btn"
                onClick={() => scrollCarousel(-1)}
                aria-label="Previous related products"
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-btn"
                onClick={() => scrollCarousel(1)}
                aria-label="Next related products"
              >
                ›
              </button>
            </div>
          </div>
          <div className="carousel-window">
            <div className="carousel-track" ref={carouselRef}>
              {relatedProducts.map((item) => (
                <article className="product-card carousel-item" key={item.id}>
                  <Link className="product-clickable" to={`/products/${item.id}`}>
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div className="product-card-body">
                    <span className="badge">{item.badge}</span>
                    <h2>
                      <Link className="product-title-link" to={`/products/${item.id}`}>
                        {item.name}
                      </Link>
                    </h2>
                    <p className="product-price">${item.price.toFixed(2)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  )
}

export default ProductDetailsPage
