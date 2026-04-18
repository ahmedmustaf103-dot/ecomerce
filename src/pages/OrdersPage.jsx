import { Link } from 'react-router-dom'

function OrdersPage({ orders }) {
  return (
    <section className="page">
      <h1>Order History</h1>
      <p className="page-subtitle">Orders created in your current browser session.</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <p>Complete checkout from the cart to create your first order.</p>
        </div>
      ) : (
        <div className="cart-list">
          {orders.map((order) => (
            <article className="cart-item" key={order.id}>
              <div className="cart-item-main">
                <h2>Order #{order.id}</h2>
                <p className="page-subtitle">{order.date}</p>
                <p className="product-price">${order.total.toFixed(2)}</p>
                <p className="page-subtitle">{order.itemsCount} items</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="page-subtitle">
        <Link to="/products">Continue shopping</Link>
      </p>
    </section>
  )
}

export default OrdersPage
