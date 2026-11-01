import type { ChatMessage } from '@/lib/chat/types'
import { textOf } from '@/lib/chat/types'

/** One row of the conversation outline: a request, or a search hit on any message. */
export interface OutlineRow {
  id: string
  at: number
  role: 'user' | 'assistant'
  text: string
}

/** Shorter needles are treated as absent — same threshold the in-chat search used. */
const MIN_NEEDLE = 2

/**
 * The request index of one chat, newest first. Without a needle it lists the user's requests;
 * with one it lists every message whose text matches, agent replies included.
 */
export function chatOutline(messages: ChatMessage[], needle: string): OutlineRow[] {
  const q = needle.trim().toLowerCase()
  const searching = q.length >= MIN_NEEDLE
  const rows: OutlineRow[] = []
  for (const m of messages) {
    if (m.role === 'system') continue
    const text = textOf(m).trim()
    if (!text) continue
    if (searching ? !text.toLowerCase().includes(q) : m.role !== 'user') continue
    rows.push({ id: m.id, at: m.at, role: m.role, text })
  }
  return rows.sort((a, b) => b.at - a.at)
}
