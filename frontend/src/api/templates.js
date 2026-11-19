export async function fetchTemplates() {
  const res = await fetch('/templates')
  if (!res.ok) throw new Error(`Status ${res.status}`)
  return res.json()
}

export async function pingTemplates() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)
    const res = await fetch('/templates', { signal: controller.signal })
    clearTimeout(timeoutId)
    return res.ok
  } catch {
    return false
  }
}