import { useState } from 'react'

/** Set in `.env` to pre-fill the recipient (e.g. your real inbox). Otherwise mailto opens with an empty To line. */
const contactInbox = import.meta.env.VITE_CONTACT_EMAIL?.trim() || ''

function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const buildMailtoHref = () => {
    const mailSubject = encodeURIComponent(`[NovaStore] ${subject.trim() || 'Contact form'}`)
    const mailBody = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    )
    const query = `subject=${mailSubject}&body=${mailBody}`
    return contactInbox ? `mailto:${contactInbox}?${query}` : `mailto:?${query}`
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    window.location.href = buildMailtoHref()
  }

  return (
    <section className="page narrow">
      <h1>Contact</h1>
      <p className="page-subtitle">
        Send us a message. Submitting opens your email app with a pre-filled draft
        {contactInbox ? (
          <>
            {' '}
            to <a href={`mailto:${contactInbox}`}>{contactInbox}</a>
          </>
        ) : (
          <>
            . Add your team&apos;s address in the <strong>To</strong> field, or set{' '}
            <code>VITE_CONTACT_EMAIL</code> in <code>.env</code> so it is filled automatically.
          </>
        )}{' '}
        Nothing is sent from this website until you send the message from your mail app.
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
