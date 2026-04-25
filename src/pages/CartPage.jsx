import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { firebaseConfigured } from '../firebase.js'

function CartPage({
  cartItems,
  savedForLater,
  isSignedIn,
  onIncrement,
  onDecrement,
  onUpdateQuantity,
  onRemoveItem,
  onMoveToSaved,
  onMoveSavedToCart,
  onRemoveSaved,
  onClearCart,
  onCheckout,
}) {
  const navigate = useNavigate()
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const freeShippingTarget = 250
  const shippingProgress = useMemo(
    () => Math.min(100, (totalPrice / freeShippingTarget) * 100),
    [totalPrice],
  )
  const shippingGap = Math.max(0, freeShippingTarget - totalPrice)

  return (
    <section className="page">
      <h1>Your Cart</h1>
      <div className="shipping-progress">
        <p className="page-subtitle">
          {shippingGap > 0
            ? `Add $${shippingGap.toFixed(2)} more for free shipping`
            : 'You unlocked free shipping!'}
        </p>
        <div className="shipping-track">
          <span style={{ width: `${shippingProgress}%` }} />
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <p>Add something from the home page to get started.</p>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-main">
                  <h2>{item.name}</h2>
                  <p className="product-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => onDecrement(item.id)}>-</button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      onUpdateQuantity(item.id, Number(event.target.value))
                    }
                    aria-label={`Quantity for ${item.name}`}
                  />
                  <button onClick={() => onIncrement(item.id)}>+</button>
                </div>
                <button
                  className="remove-button"
                  onClick={() => onRemoveItem(item.id)}
                >
                  Remove
                </button>
                <button
                  className="button secondary"
                  onClick={() => onMoveToSaved(item.id)}
                >
                  Save for Later
                </button>
              </article>
            ))}
          </div>

          <div className="cart-footer">
            <p>
              Total Price <strong>${totalPrice.toFixed(2)}</strong>
            </p>
            <button className="button secondary" onClick={onClearCart}>
              Clear Cart
            </button>
            <button
              className="button"
              onClick={async () => {
                const checkedOut = await onCheckout()
                if (checkedOut) {
                  navigate('/orders')
                  return
                }
                if (firebaseConfigured && !isSignedIn) {
                  navigate('/account')
                }
              }}
            >
              {firebaseConfigured && !isSignedIn ? 'Sign in to Checkout' : 'Checkout'}
            </button>
          </div>
        </>
      )}

      {savedForLater.length > 0 ? (
        <div className="saved-section">
          <h2>Saved For Later</h2>
          <div className="cart-list">
            {savedForLater.map((item) => (
              <article className="cart-item" key={`saved-${item.id}`}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-main">
                  <h2>{item.name}</h2>
                  <p className="product-price">${item.price.toFixed(2)}</p>
                </div>
                <button className="button" onClick={() => onMoveSavedToCart(item.id)}>
                  Move to Cart
                </button>
                <button
                  className="remove-button"
                  onClick={() => onRemoveSaved(item.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {firebaseConfigured && !isSignedIn ? (
        <p className="page-subtitle">
          Want to save orders to your account? <Link to="/account">Create an account or sign in</Link>.
        </p>
      ) : null}
    </section>
  )
}

export default CartPage
