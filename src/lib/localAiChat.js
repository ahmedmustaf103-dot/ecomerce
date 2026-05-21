const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'

let enginePromise = null

function buildSystemPrompt(products, contactEmail) {
  const catalog =
    products.length === 0
      ? 'Browse the full catalog at /products.'
      : products
          .slice(0, 30)
          .map(
            (product) =>
              `- ${product.name}: $${Number(product.price).toFixed(2)} (${product.category}) — link: /products/${product.id}`,
          )
          .join('\n')

  const contactLine = contactEmail
    ? `Customer support email: ${contactEmail} (also reachable via /contact).`
    : 'Customer support is available through the Contact page at /contact — we respond within one business day.'

  return `You are Nova Assistant, a friendly customer support agent for NovaStore, a real online retail store.

Store policies (always speak as if these are real and current):
- Checkout at /cart accepts major cards and PayPal. Sign in at /account to save your details and view order history at /orders.
- Shipping: free on orders over $75; otherwise $5.99 flat rate. US delivery typically 3–7 business days; international 7–14 business days.
- Tracking: once an order ships, tracking appears on /orders within 24 hours.
- Returns: 30-day window for unused items in original packaging. Customers can start a return from /orders or contact support.
- Wishlist and saved items are available on the site when signed in.
- ${contactLine}
- FAQ: /faq · Shop: /products

Product catalog:
${catalog}

How to respond:
- Sound like a helpful human support agent — warm, confident, and professional.
- Keep answers short: 2–4 sentences unless the customer asks for detail.
- Understand casual language, typos, and frustration (especially about late deliveries).
- For missing or late packages: apologize, ask them to check tracking on /orders, and offer to follow up via /contact if it is past the estimated delivery window.
- Suggest relevant pages (/orders, /contact, /products/id) when helpful.
- Never mention demo, portfolio, prototype, simulated, fake, test site, API, Firebase, localStorage, browser storage, WebGPU, AI, language model, or anything that breaks the illusion of a real store.
- Never say you are an AI unless the customer directly asks; even then, say you are NovaStore support.
- Do not invent specific tracking numbers — direct customers to /orders instead.`
}

/** Strip accidental technical or demo language from model output. */
export function polishReply(text) {
  let reply = String(text || '').trim()
  const replacements = [
    [/this is a (demo|portfolio|test|fake)\s*(store|site)?/gi, ''],
    [/demo store|portfolio (demo|site)|simulated checkout|no real payment/gi, ''],
    [/localStorage|firebase|webgpu|api key|language model|large language model/gi, ''],
    [/runs locally in your browser/gi, ''],
    [/\(\s*\)/g, ''],
    [/\s{2,}/g, ' '],
  ]
  for (const [pattern, replacement] of replacements) {
    reply = reply.replace(pattern, replacement)
  }
  return reply.trim()
}

export function isWebGpuAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function initLocalAi(onProgress) {
  if (!isWebGpuAvailable()) {
    throw new Error('Assistant unavailable')
  }

  if (!enginePromise) {
    enginePromise = (async () => {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
      return CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          onProgress?.({
            progress: report.progress,
          })
        },
      })
    })().catch((err) => {
      enginePromise = null
      throw err
    })
  }

  return enginePromise
}

export function preloadLocalAi(onProgress) {
  return initLocalAi(onProgress).catch(() => {})
}

export async function getLocalAiReply(
  conversationMessages,
  { products = [], contactEmail = '' },
  onProgress,
) {
  const engine = await initLocalAi(onProgress)

  const messages = [
    { role: 'system', content: buildSystemPrompt(products, contactEmail) },
    ...conversationMessages
      .filter((message) => message.role === 'user' || message.role === 'bot')
      .slice(-12)
      .map((message) => ({
        role: message.role === 'bot' ? 'assistant' : 'user',
        content: message.text,
      })),
  ]

  const response = await engine.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 220,
  })

  const reply = polishReply(response.choices?.[0]?.message?.content)
  if (!reply) {
    throw new Error('Empty reply')
  }

  return reply
}
