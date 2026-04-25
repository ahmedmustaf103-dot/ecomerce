import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'

function swatchColor(value) {
  const name = String(value || '').toLowerCase()
  if (name.includes('black') || name.includes('charcoal') || name.includes('graphite')) return '#1f2937'
  if (name.includes('white') || name.includes('ivory')) return '#f8fafc'
  if (name.includes('silver') || name.includes('steel')) return '#94a3b8'
  if (name.includes('blue') || name.includes('navy')) return '#2563eb'
  if (name.includes('mint') || name.includes('green') || name.includes('olive')) return '#16a34a'
  if (name.includes('orange') || name.includes('coral')) return '#f97316'
  if (name.includes('sand') || name.includes('tan')) return '#c08457'
  if (name.includes('rose') || name.includes('pink')) return '#ec4899'
  return '#60a5fa'
}

function ProductCard({ product, onAddToCart, onToggleWishlist, wishlist }) {
  if (!product) return null
  const isWishlisted = wishlist.some((item) => item.id === product.id)

  return (
    <article className="product-card">
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
          <button className="button secondary" onClick={() => onToggleWishlist(product)}>
            {isWishlisted ? 'Wishlisted' : 'Wishlist'}
          </button>
          <Link className="button secondary" to={`/products/${product.id}`}>
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

function HomePage({ onAddToCart, wishlist, onToggleWishlist }) {
  const { products, loading, error, retry } = useProducts()

  const homeData = useMemo(() => {
    if (products.length === 0) {
      return {
        spotlightProduct: null,
        heroStripProducts: [],
        heroSideTop: null,
        heroSideBottom: null,
        trendingProducts: [],
        featuredByCategory: [],
        newArrivals: [],
        budgetProducts: [],
        premiumProducts: [],
      }
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    const score = (value) =>
      value.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
    const byTrending = [...products].sort((a, b) => {
      const scoreA = score(`${todayKey}-${a.id}`)
      const scoreB = score(`${todayKey}-${b.id}`)
      return scoreB - scoreA
    })
    const byNew = [...products]
      .filter((product) => product.launchedAt)
      .sort(
        (a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime(),
      )
    const byBudget = [...products]
      .filter((product) => product.price <= 60)
      .sort((a, b) => b.rating - a.rating || a.price - b.price)
    const byPremium = [...products]
      .filter((product) => product.price >= 250)
      .sort((a, b) => b.rating - a.rating || b.price - a.price)
    const byFeatured = [...products].sort(
      (a, b) => b.rating - a.rating || b.reviews - a.reviews || a.price - b.price,
    )

    /** Pick up to `count` unique products from `candidates` (fresh dedupe each call — avoids empty sections with tiny catalogs). */
    const pickUnique = (candidates, count) => {
      const seen = new Set()
      const picked = []
      for (const product of candidates) {
        if (!product || seen.has(product.id)) continue
        picked.push(product)
        seen.add(product.id)
        if (picked.length >= count) break
      }
      return picked
    }

    const spotlightProduct = pickUnique(byTrending, 1)[0] ?? null
    const heroStripProducts = pickUnique(byTrending, 3)
    const heroSideTop = pickUnique(byNew.length > 0 ? byNew : byFeatured, 1)[0] ?? null
    const heroSideBottom = pickUnique(byPremium.length > 0 ? byPremium : byFeatured, 1)[0] ?? null

    const trendingProducts = pickUnique(byTrending, 4)

    const featuredByCategory = (() => {
      const picked = []
      const seenIds = new Set()
      const usedCategories = new Set()
      for (const product of byFeatured) {
        if (seenIds.has(product.id)) continue
        if (usedCategories.has(product.category)) continue
        picked.push(product)
        seenIds.add(product.id)
        usedCategories.add(product.category)
        if (picked.length >= 4) break
      }
      if (picked.length === 0) {
        return pickUnique(byFeatured, 4)
      }
      return picked
    })()

    const newArrivals = pickUnique(
      byNew.length > 0 ? byNew : byFeatured,
      4,
    )
    const budgetProducts = pickUnique(byBudget.length > 0 ? byBudget : products, 4)
    const premiumProducts = pickUnique(byPremium.length > 0 ? byPremium : products, 4)

    return {
      spotlightProduct,
      heroStripProducts,
      heroSideTop,
      heroSideBottom,
      trendingProducts,
      featuredByCategory,
      newArrivals,
      budgetProducts,
      premiumProducts,
    }
  }, [products])

  const {
    spotlightProduct,
    heroStripProducts,
    heroSideTop,
    heroSideBottom,
    trendingProducts,
    featuredByCategory,
    newArrivals,
    budgetProducts,
    premiumProducts,
  } = homeData

  if (error) {
    return (
      <section className="page">
        <div className="empty-state">
          <p>Could not load products.</p>
          <p className="page-subtitle">{error}</p>
          <p className="page-subtitle">
            With Firebase: add web app keys to <code>.env</code>, deploy <code>firestore.rules</code>, and run{' '}
            <code>npm run seed:firestore</code>. Without Firebase: run <code>npm run dev:api</code> or{' '}
            <code>npm run dev:full</code>.
          </p>
          <button className="button secondary" onClick={retry} type="button">
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="showcase-shell">
        <div className="showcase-main">
          <div className="showcase-navline">
            <p className="eyebrow">Curated collection</p>
            <form className="showcase-search" onSubmit={(event) => event.preventDefault()}>
              <input type="text" placeholder="Search products..." aria-label="Search products" />
              <button type="submit" aria-label="Search">
                ⌕
              </button>
            </form>
          </div>

          {spotlightProduct ? (
            <article className="showcase-hero-card">
              <div className="showcase-copy">
                <p className="showcase-kicker">{spotlightProduct.category}</p>
                <h1>{spotlightProduct.name}</h1>
                <p>{spotlightProduct.description}</p>
                <div className="showcase-color-row">
                  <span>Popular Colors</span>
                  <div className="showcase-swatches">
                    {(spotlightProduct.colors ?? []).slice(0, 5).map((color) => (
                      <span
                        className="showcase-swatch"
                        key={color}
                        style={{ backgroundColor: swatchColor(color) }}
                        title={color}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="showcase-cta-row">
                  <button className="button" onClick={() => onAddToCart(spotlightProduct)}>
                    Add to Cart
                  </button>
                  <Link className="button secondary" to={`/products/${spotlightProduct.id}`}>
                    View Details
                  </Link>
                </div>
              </div>
              <Link className="showcase-image-link" to={`/products/${spotlightProduct.id}`}>
                <img src={spotlightProduct.image} alt={spotlightProduct.name} />
              </Link>
              <div className="showcase-float-btn showcase-float-heart" aria-hidden="true">
                ♥
              </div>
              <div className="showcase-float-btn showcase-float-arrow" aria-hidden="true">
                ↗
              </div>
            </article>
          ) : null}

          <div className="showcase-mini-grid">
            {heroStripProducts.map((product, index) => (
              <Link
                className="showcase-mini-card"
                key={`mini-${product.id}-${index}`}
                to={`/products/${product.id}`}
              >
                <img src={product.image} alt={product.name} />
                <div>
                  <p>{product.name}</p>
                  <span>${product.price.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="showcase-social-row">
            <span>Loved by shoppers</span>
            <div className="showcase-avatars" aria-hidden="true">
              <img src="https://i.pravatar.cc/40?img=12" alt="" />
              <img src="https://i.pravatar.cc/40?img=22" alt="" />
              <img src="https://i.pravatar.cc/40?img=32" alt="" />
            </div>
            <p>4.8 average rating</p>
          </div>
        </div>

        <aside className="showcase-side">
          {[heroSideTop, heroSideBottom].filter(Boolean).map((product, index) => (
            <article className="showcase-side-card" key={`side-${product.id}-${index}`}>
              <Link to={`/products/${product.id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="showcase-side-copy">
                <p className="showcase-kicker">{product.category}</p>
                <h3>{product.name}</h3>
                <p>${product.price.toFixed(2)}</p>
              </div>
            </article>
          ))}
        </aside>
      </div>

      <section className="page">
        <div className="section-head">
          <h2>Trending Products</h2>
          <Link to="/products" className="product-title-link">
            View all
          </Link>
        </div>

        <div className="product-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <article className="product-card skeleton-card" key={`home-skeleton-${index}`} />
              ))
            : trendingProducts.map((product, index) => (
                <ProductCard
                  key={`trend-${product.id}-${index}`}
                  product={product}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  wishlist={wishlist}
                />
              ))}
        </div>
      </section>

      <section className="page">
        <div className="section-head">
          <h2>Featured Across Categories</h2>
          <p className="page-subtitle">Top-rated picks from different categories.</p>
        </div>
        <div className="product-grid">
          {(loading ? [] : featuredByCategory).map((product, index) => (
            <ProductCard
              key={`featured-${product.id}-${index}`}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      </section>

      <section className="page">
        <div className="section-head">
          <h2>New Arrivals</h2>
          <p className="page-subtitle">Newest drops added to the catalog.</p>
        </div>
        <div className="product-grid">
          {(loading ? [] : newArrivals).map((product, index) => (
            <ProductCard
              key={`new-${product.id}-${index}`}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      </section>

      <section className="page">
        <div className="section-head">
          <h2>Budget Friendly (Under $50)</h2>
          <p className="page-subtitle">Great everyday value picks.</p>
        </div>
        <div className="product-grid">
          {(loading ? [] : budgetProducts).map((product) => (
            <ProductCard
              key={`budget-${product.id}`}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      </section>

      <section className="page">
        <div className="section-head">
          <h2>Premium Picks ($250+)</h2>
          <p className="page-subtitle">High-end products with standout features.</p>
        </div>
        <div className="product-grid">
          {(loading ? [] : premiumProducts).map((product, index) => (
            <ProductCard
              key={`premium-${product.id}-${index}`}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
