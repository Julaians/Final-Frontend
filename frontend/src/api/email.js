export async function sendEmail({ to, subject, message, task }) {
  try {
    const res = await fetch('/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message, task }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { ok: false, error: data.error || 'Failed to send email.' }
    }
    return { ok: true, recipient: data.recipient }
  } catch {
    return { ok: false, error: 'Could not send email alert. Is the Express server running on port 5000?' }
  }
}