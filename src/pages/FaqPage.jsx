function FaqPage() {
  const items = [
    {
      q: 'How does checkout work?',
      a: 'NovaStore is a demo storefront. Checkout simulates an order on your device only—no real payment is processed. Sign in on the Account page, then complete checkout from your cart to see order history.',
    },
    {
      q: 'Where is my cart saved?',
      a: 'Your cart, wishlist, and saved-for-later items are stored in your browser (localStorage) so they persist after refresh. Clearing site data will remove them.',
    },
    {
      q: 'Do you ship internationally?',
      a: 'This is a portfolio demo. In a real store, shipping zones and rates would be shown at checkout.',
    },
    {
      q: 'What is your return policy?',
      a: 'Demo only. A production site would list return windows, condition requirements, and how to start a return.',
    },
    {
      q: 'How do I contact you?',
      a: 'Use the Contact page to compose an email in your default mail app (mailto). We reply to real messages sent to the address shown on that page.',
    },
  ]

  return (
    <section className="page narrow">
      <h1>Frequently asked questions</h1>
      <p className="page-subtitle">
        Quick answers about shopping on NovaStore. This site runs entirely in the browser—no
        backend required.
      </p>

      <div className="faq-list">
        {items.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default FaqPage
