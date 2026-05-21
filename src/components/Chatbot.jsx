import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import { getBotReply, getWelcomeMessage } from '../lib/chatbotResponses.js'
import { getLocalAiReply, isWebGpuAvailable, preloadLocalAi } from '../lib/localAiChat.js'

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || ''

const QUICK_PROMPTS = [
  'My package has not arrived',
  'What is your return policy?',
  'Recommend headphones',
  'Contact support',
]

const WELCOME = {
  role: 'bot',
  ...getWelcomeMessage(),
}

function renderMessageText(text) {
  return text.split('\n').map((line, index, lines) => (
    <span key={`${index}-${line.slice(0, 12)}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ))
}

function BotMessage({ message, onClose }) {
  return (
    <div className={`chatbot-message chatbot-message-${message.role}`}>
      <p>{renderMessageText(message.text)}</p>
      {message.products?.length ? (
        <ul className="chatbot-product-list">
          {message.products.map((product) => (
            <li key={product.id}>
              <Link to={`/products/${product.id}`} onClick={onClose}>
                <img src={product.image} alt="" />
                <span>
                  <strong>{product.name}</strong>
                  <small>${product.price.toFixed(2)} · {product.category}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {message.link ? (
        <Link className="chatbot-inline-link" to={message.link.to} onClick={onClose}>
          {message.link.label} →
        </Link>
      ) : null}
    </div>
  )
}

function Chatbot() {
  const { products } = useProducts()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open || !isWebGpuAvailable()) return
    preloadLocalAi((report) => setLoadProgress(report))
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    if (!loading) inputRef.current?.focus()
  }, [open, messages, loading, loadProgress])

  const closePanel = () => setOpen(false)

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage = { role: 'user', text: trimmed }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      if (isWebGpuAvailable()) {
        const reply = await getLocalAiReply(history, { products, contactEmail }, (report) =>
          setLoadProgress(report),
        )
        setLoadProgress(null)
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: reply, quickPrompts: QUICK_PROMPTS },
        ])
      } else {
        throw new Error('WebGPU unavailable')
      }
    } catch {
      const fallback = getBotReply(trimmed, { products, contactEmail })
      setLoadProgress(null)
      setMessages((prev) => [
        ...prev,
        { role: 'bot', ...fallback, quickPrompts: QUICK_PROMPTS },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const latestBot = [...messages].reverse().find((message) => message.role === 'bot')
  const quickPrompts = loading ? [] : (latestBot?.quickPrompts ?? QUICK_PROMPTS)
  const progressPercent =
    loadProgress?.progress != null ? Math.round(loadProgress.progress * 100) : null

  return (
    <div className="chatbot-root">
      {open ? (
        <section className="chatbot-panel" aria-label="Nova Assistant chat">
          <header className="chatbot-head">
            <div>
              <p className="chatbot-kicker">NovaStore support</p>
              <h2>How can we help?</h2>
            </div>
            <button
              type="button"
              className="button secondary chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              Close
            </button>
          </header>

          {loadProgress && loading ? (
            <div className="chatbot-load-bar" aria-live="polite">
              <p>One moment while I pull up your details…</p>
              {progressPercent != null ? (
                <div className="chatbot-load-track">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((message, index) => (
              <BotMessage key={`${message.role}-${index}`} message={message} onClose={closePanel} />
            ))}
            {loading && !loadProgress ? (
              <div className="chatbot-message chatbot-message-bot chatbot-typing" aria-live="polite">
                <p>Just a moment…</p>
              </div>
            ) : null}
          </div>

          {quickPrompts.length ? (
            <div className="chatbot-chips" aria-label="Suggested questions">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chatbot-chip"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your order, shipping, or products…"
              aria-label="Chat message"
              autoComplete="off"
              disabled={loading}
            />
            <button type="submit" className="button" disabled={!input.trim() || loading}>
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close Nova Assistant' : 'Open Nova Assistant'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}

export default Chatbot
