import { useState } from 'react'

const CONTACT_EMAIL = 'hello@novastore.com'

function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const mailSubject = encodeURIComponent(`[NovaStore] ${subject.trim() || 'Contact form'}`)
    const mailBody = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`
  }

  return (
    <section className="page narrow">
      <h1>Contact</h1>
      <p className="page-subtitle">
        Send us a message. Submitting opens your email app with a pre-filled draft to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        —nothing is sent from this website.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Your email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Subject
          <input
            type="text"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Order question, feedback…"
          />
        </label>
        <label>
          Message
          <textarea
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <div className="details-actions">
          <button type="submit" className="button">
            Open in email app
          </button>
        </div>
      </form>
    </section>
  )
}

export default ContactPage
