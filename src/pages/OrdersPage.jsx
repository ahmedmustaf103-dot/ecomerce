function OrdersPage({ orders }) {
  return (
    <section className="page">
      <h1>Order History</h1>
      <p className="page-subtitle">Recent demo orders from your account.</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <p>Complete checkout from cart to create your first order.</p>
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
    </section>
  )
}

export default OrdersPage
