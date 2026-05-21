import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import HomePage from './pages/HomePage'
import ProductListingPage from './pages/ProductListingPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import CartPage from './pages/CartPage'
import AccountPage from './pages/AccountPage'
import OrdersPage from './pages/OrdersPage'
import FaqPage from './pages/FaqPage'
import ContactPage from './pages/ContactPage'
import { auth, db, firebaseConfigured } from './firebase.js'
import './App.css'
import Chatbot from './components/Chatbot.jsx'

const CART_STORAGE_KEY = 'novastore-cart-items'
const WISHLIST_STORAGE_KEY = 'novastore-wishlist'
const SAVED_STORAGE_KEY = 'novastore-saved-later'
const readLocalArray = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function ToastIcon({ type }) {
  const svgProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  switch (type) {
    case 'cart-add':
      return (
        <svg {...svgProps}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          <path d="M12 9v6M9 12h6" />
        </svg>
      )
    case 'cart-remove':
      return (
        <svg {...svgProps}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          <path d="M9 12h6" />
        </svg>
      )
    case 'wishlist-add':
      return (
        <svg {...svgProps}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      )
    case 'wishlist-remove':
      return (
        <svg {...svgProps}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M4 4l16 16" />
        </svg>
      )
    case 'saved':
      return (
        <svg {...svgProps}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'saved-remove':
      return (
        <svg {...svgProps}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          <path d="M9 12h6" />
        </svg>
      )
    case 'order':
      return (
        <svg {...svgProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      )
    default:
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      )
  }
}

function App() {
  const [cartItems, setCartItems] = useState(() => readLocalArray(CART_STORAGE_KEY))
  const [wishlist, setWishlist] = useState(() => readLocalArray(WISHLIST_STORAGE_KEY))
  const [savedForLater, setSavedForLater] = useState(() =>
    readLocalArray(SAVED_STORAGE_KEY),
  )
  const [orders, setOrders] = useState([])
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(() => !firebaseConfigured)
  const isSignedIn = Boolean(user)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
  }, [wishlist])
  useEffect(() => {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedForLater))
  }, [savedForLater])
  useEffect(() => {
    if (!toast) return
    const timeoutId = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      return () => {}
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          emailVerified: firebaseUser.emailVerified,
        })
      } else {
        setUser(null)
        setOrders([])
      }
      setAuthReady(true)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!firebaseConfigured || !authReady || !db || !user) {
      return () => {}
    }
    let cancelled = false
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
    )
    getDocs(ordersQuery)
      .then((snapshot) => {
        if (cancelled) return
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            date: data.date,
            total: data.total,
            itemsCount: data.itemsCount,
            items: Array.isArray(data.items) ? data.items : [],
          }
        })
        setOrders(list)
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
    return () => {
      cancelled = true
    }
  }, [authReady, user])

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id)
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prevItems, { ...product, quantity: 1 }]
    })
    setSavedForLater((prevItems) => prevItems.filter((item) => item.id !== product.id))
    setToast({ type: 'cart-add', message: `${product.name} added to cart` })
  }

  const incrementItem = (productId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    )
  }

  const decrementItem = (productId) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const updateItemQuantity = (productId, quantity) => {
    const nextQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    )
  }

  const removeItem = (productId) => {
    const item = cartItems.find((entry) => entry.id === productId)
    setCartItems((prevItems) => prevItems.filter((entry) => entry.id !== productId))
    if (item) {
      setToast({ type: 'cart-remove', message: `${item.name} removed from cart` })
    }
  }

  const toggleWishlist = (product) => {
    setWishlist((prevItems) => {
      const exists = prevItems.some((item) => item.id === product.id)
      if (exists) {
        setToast({ type: 'wishlist-remove', message: `${product.name} removed from wishlist` })
        return prevItems.filter((item) => item.id !== product.id)
      }
      setToast({ type: 'wishlist-add', message: `${product.name} added to wishlist` })
      return [...prevItems, product]
    })
  }

  const moveToSavedForLater = (productId) => {
    const cartItem = cartItems.find((item) => item.id === productId)
    if (!cartItem) return
    setSavedForLater((prevItems) => {
      const exists = prevItems.some((item) => item.id === cartItem.id)
      return exists ? prevItems : [...prevItems, cartItem]
    })
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
    setToast({ type: 'saved', message: `${cartItem.name} saved for later` })
  }

  const removeSavedForLater = (productId) => {
    const item = savedForLater.find((entry) => entry.id === productId)
    setSavedForLater((prevItems) => prevItems.filter((entry) => entry.id !== productId))
    if (item) {
      setToast({ type: 'saved-remove', message: `${item.name} removed from saved` })
    }
  }

  const moveSavedToCart = (productId) => {
    const savedItem = savedForLater.find((item) => item.id === productId)
    if (!savedItem) return
    addToCart(savedItem)
  }

  const clearCart = () => setCartItems([])

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth)
      } catch {
        /* ignore */
      }
    }
    setUser(null)
    if (firebaseConfigured) {
      setOrders([])
    }
  }

  const createOrder = async () => {
    if (cartItems.length === 0) {
      return false
    }
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const date = new Date().toLocaleDateString()
    const lineItems = cartItems.map(({ id, name, price, quantity, image }) => ({
      id,
      name,
      price,
      quantity,
      image,
    }))

    if (firebaseConfigured && db && auth) {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setToast({
          type: 'cart-remove',
          message: 'Sign in to place an order.',
        })
        return false
      }
      try {
        const docRef = await addDoc(collection(db, 'orders'), {
          userId: currentUser.uid,
          date,
          total,
          itemsCount,
          items: lineItems,
          createdAt: serverTimestamp(),
        })
        const newOrder = {
          id: docRef.id,
          date,
          total,
          itemsCount,
          items: lineItems,
        }
        setOrders((prev) => [newOrder, ...prev])
        setCartItems([])
        setToast({ type: 'order', message: `Order ${newOrder.id} placed successfully` })
        return true
      } catch {
        setToast({
          type: 'cart-remove',
          message: 'Checkout failed. Check Firestore rules and your Firebase project.',
        })
        return false
      }
    }

    const newOrder = {
      id: `NS${Date.now().toString().slice(-6)}`,
      date,
      total,
      itemsCount,
      items: lineItems,
    }
    setOrders((prev) => [newOrder, ...prev])
    setCartItems([])
    setToast({ type: 'order', message: `Order ${newOrder.id} placed successfully` })
    return true
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <span className="brand-text">NovaStore</span>
          </Link>
          <nav className="topbar-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/orders">Orders</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="topbar-actions">
            <NavLink className="account-link" to="/account">
              {firebaseConfigured ? (isSignedIn ? 'Account' : 'Sign In') : 'Account'}
            </NavLink>
            <button className="button topbar-cart-button" onClick={() => setIsCartDrawerOpen(true)}>
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onAddToCart={addToCart}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductListingPage
                onAddToCart={addToCart}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
              />
            }
          />
          <Route
            path="/products/:productId"
            element={
              <ProductDetailsPage
                onAddToCart={addToCart}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                savedForLater={savedForLater}
                isSignedIn={isSignedIn}
                onIncrement={incrementItem}
                onDecrement={decrementItem}
                onUpdateQuantity={updateItemQuantity}
                onRemoveItem={removeItem}
                onMoveToSaved={moveToSavedForLater}
                onMoveSavedToCart={moveSavedToCart}
                onRemoveSaved={removeSavedForLater}
                onClearCart={clearCart}
                onCheckout={createOrder}
              />
            }
          />
          <Route path="/account" element={<AccountPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/orders" element={<OrdersPage orders={orders} user={user} />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>

      {isCartDrawerOpen ? (
        <aside className="cart-drawer">
          <div className="cart-drawer-head">
            <h2>Your Cart</h2>
            <button
              className="button secondary"
              onClick={() => setIsCartDrawerOpen(false)}
            >
              Close
            </button>
          </div>
          <p className="page-subtitle">
            {cartCount} items • $
            {cartItems
              .reduce((sum, item) => sum + item.price * item.quantity, 0)
              .toFixed(2)}
          </p>
          <Link className="button" to="/cart" onClick={() => setIsCartDrawerOpen(false)}>
            Go to Cart
          </Link>
        </aside>
      ) : null}

      {toast ? (
        <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
          <span className="toast-icon">
            <ToastIcon type={toast.type} />
          </span>
          <span className="toast-text">{toast.message}</span>
        </div>
      ) : null}

      <Chatbot />
    </div>
  )
}

export default App
