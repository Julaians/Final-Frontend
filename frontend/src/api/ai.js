export async function breakdownTask(title, category = 'Work', type = 'schedule') {
  try {
    const res = await fetch('/api/ai/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, type }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    const json = await res.json()
    return json.data
  } catch (error) {
    console.warn('[AI] Backend unavailable, using local fallback:', error)
    return {
      suggestedCategory: category || 'Work',
      suggestedPriority: 'Medium',
      suggestedType: type || 'schedule',
      subtasks: [
        { id: 'sub_1', title: `Outline core requirements for "${title}"`, completed: false },
        { id: 'sub_2', title: 'Execute primary milestone', completed: false },
        { id: 'sub_3', title: 'Review and verify deliverables', completed: false },
      ],
      aiTip: 'Break complex tasks down into small, timeboxed increments.',
    }
  }
}