const FAQ = [
  {
    keywords: ['checkout', 'pay', 'payment', 'place order', 'buy'],
    answer:
      'You can checkout securely from your cart with major cards or PayPal. Sign in on your Account page first so your order is saved to your history — then open Cart and complete checkout.',
    link: { to: '/cart', label: 'Go to cart' },
  },
  {
    keywords: ['cart', 'wishlist', 'saved', 'save for later'],
    answer:
      'Your cart, wishlist, and saved-for-later items stay on your account when you are signed in, so you can pick up where you left off on any device.',
    link: { to: '/cart', label: 'View cart' },
  },
  {
    keywords: [
      'ship',
      'shipping',
      'delivery',
      'international',
      'track',
      'tracking',
      'package',
      'parcel',
      'arrived',
      'arrive',
      'received',
      'receive',
      'delivered',
      'deliver',
      'missing',
      'lost',
      'late',
      'delay',
      'delayed',
      'waiting',
      'hasnt',
      'havent',
      'didnt',
      'not arrived',
      'not received',
      'not delivered',
      'where is my order',
      'order status',
    ],
    patterns: [
      /(where|when).*(order|package|parcel|delivery|shipment)/,
      /(package|parcel|order|shipment).*(not|never|still|hasn|haven|didn).*(arriv|deliver|received|come|show)/,
      /(not|never|still).*(arriv|deliver|received|come)/,
      /(hasn|haven|didn).*(arriv|deliver|received|come)/,
      /(missing|lost|late|delayed).*(package|parcel|order|delivery)/,
    ],
    answer:
      'Sorry to hear your order is delayed. Please check the Orders page for live tracking — it usually appears within 24 hours of dispatch. US orders typically arrive in 3–7 business days. If you are past your estimated delivery date, contact us and we will investigate right away.',
    link: { to: '/orders', label: 'View orders' },
  },
  {
    keywords: ['return', 'refund', 'exchange'],
    answer:
      'We offer a 30-day return window on unused items in original packaging. Open your order on the Orders page to start a return, or reach out through Contact and our team will walk you through it.',
    link: { to: '/faq', label: 'Return policy' },
  },
  {
    keywords: ['account', 'sign in', 'login', 'register', 'password', 'google'],
    answer:
      'Sign in on the Account page with your email and password or Google. From there you can reset your password, update details, and view your order history.',
    link: { to: '/account', label: 'Open account' },
  },
  {
    keywords: ['contact', 'email', 'support', 'help', 'talk'],
    answer: (contactEmail) =>
      contactEmail
        ? `Our support team is happy to help. Email us at ${contactEmail} or use the Contact page — we aim to reply within one business day.`
        : 'Our support team is happy to help. Send us a message through the Contact page and we will get back to you within one business day.',
    link: { to: '/contact', label: 'Contact us' },
  },
  {
    keywords: ['product', 'catalog', 'browse', 'shop', 'find', 'recommend'],
    answer:
      'Browse the full catalog on the Products page — filter by category, compare ratings, and open any item for photos, specs, and reviews.',
    link: { to: '/products', label: 'Browse products' },
  },
  {
    keywords: ['free shipping', 'shipping cost', 'shipping fee', 'delivery cost'],
    answer:
      'Shipping is free on orders over $75. For smaller orders, standard shipping is $5.99 flat rate anywhere in the US.',
    link: { to: '/faq', label: 'Shipping info' },
  },
]

const GREETING = /^(hi|hello|hey|yo|good (morning|afternoon|evening)|howdy)\b/i

const QUICK_PROMPTS = [
  'My package has not arrived',
  'What is your return policy?',
  'Recommend headphones',
  'Contact support',
]

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
}

function matchesFaqItem(text, item) {
  if (item.keywords?.some((word) => text.includes(word))) return true
  if (item.patterns?.some((pattern) => pattern.test(text))) return true
  return false
}

function matchFaq(text, contactEmail) {
  for (const item of FAQ) {
    if (!matchesFaqItem(text, item)) continue
    const answer =
      typeof item.answer === 'function' ? item.answer(contactEmail) : item.answer
    return { text: answer, link: item.link ?? null }
  }
  return null
}

function searchProducts(text, products) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'my',
    'has',
    'not',
    'yet',
    'how',
    'what',
    'when',
    'where',
    'why',
    'can',
    'you',
    'your',
    'our',
    'any',
    'about',
    'recommend',
  ])
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ''))
    .filter((word) => word.length > 2 && !stopWords.has(word))
  if (words.length === 0) return []

  const scored = products
    .map((product) => {
      const haystack = `${product.name} ${product.category} ${product.description ?? ''}`.toLowerCase()
      let score = 0
      for (const word of words) {
        if (haystack.includes(word)) score += 1
      }
      return { product, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)

  return scored.slice(0, 3).map(({ product }) => product)
}

export function getWelcomeMessage() {
  return {
    text: "Hi! I'm Nova Assistant, your NovaStore support specialist. I can help with orders, shipping, returns, product picks, and anything else you need.",
    quickPrompts: QUICK_PROMPTS,
  }
}

export function getBotReply(input, { products = [], contactEmail = '' } = {}) {
  const text = normalize(input)
  if (!text) {
    return { text: 'How can I help you today?', quickPrompts: QUICK_PROMPTS }
  }

  if (GREETING.test(text)) {
    return {
      text: 'Hello! Welcome to NovaStore. What can I help you with today — an order, a product question, or something else?',
      quickPrompts: QUICK_PROMPTS,
    }
  }

  const faqHit = matchFaq(text, contactEmail)
  if (faqHit) {
    return {
      text: faqHit.text,
      link: faqHit.link,
      quickPrompts: QUICK_PROMPTS,
    }
  }

  const productMatches = searchProducts(text, products)
  if (productMatches.length > 0) {
    return {
      text:
        productMatches.length === 1
          ? 'Great choice — here is a product that matches what you are looking for:'
          : 'Here are a few products that might be what you need:',
      products: productMatches,
      quickPrompts: QUICK_PROMPTS,
    }
  }

  return {
    text: 'I want to make sure I get this right. Could you tell me a bit more — is this about an order, shipping, a return, or a product? You can also browse our FAQ for quick answers.',
    link: { to: '/faq', label: 'View FAQ' },
    quickPrompts: QUICK_PROMPTS,
  }
}
