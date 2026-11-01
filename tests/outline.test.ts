import { describe, expect, it } from 'vitest'

import { chatOutline } from '@/lib/chat/outline'
import type { ChatMessage } from '@/lib/chat/types'

const msg = (id: string, role: ChatMessage['role'], text: string, at: number): ChatMessage => ({
  id,
  role,
  parts: [{ kind: 'text', text }],
  at,
})

const T0 = 1_700_000_000_000

// A conversation in reading order: request, reply, request, reply, plus noise.
const messages: ChatMessage[] = [
  msg('s1', 'system', 'system preamble', T0),
  msg('u1', 'user', 'first question about DNS', T0 + 1_000),
  msg('a1', 'assistant', 'DNS answer', T0 + 2_000),
  msg('u2', 'user', '   ', T0 + 3_000),
  { ...msg('u3', 'user', '', T0 + 4_000), parts: [{ kind: 'reasoning' as const, text: 'invisible' }] },
  msg('u4', 'user', 'Second question about certificates', T0 + 5_000),
  msg('a2', 'assistant', 'certificate answer', T0 + 6_000),
]

describe('chatOutline', () => {
  it('lists only non-empty user requests, newest first', () => {
    expect(chatOutline(messages, '')).toEqual([
      { id: 'u4', at: T0 + 5_000, role: 'user', text: 'Second question about certificates' },
      { id: 'u1', at: T0 + 1_000, role: 'user', text: 'first question about DNS' },
    ])
  })

  it('searches every role, case-insensitively, excluding system messages', () => {
    expect(chatOutline(messages, 'dns')).toEqual([
      { id: 'a1', at: T0 + 2_000, role: 'assistant', text: 'DNS answer' },
      { id: 'u1', at: T0 + 1_000, role: 'user', text: 'first question about DNS' },
    ])
    expect(chatOutline(messages, 'CERTIFICATE').map((r) => r.id)).toEqual(['a2', 'u4'])
    expect(chatOutline(messages, 'preamble')).toEqual([])
  })

  it('treats needles shorter than two characters as absent', () => {
    expect(chatOutline(messages, 'd').map((r) => r.id)).toEqual(['u4', 'u1'])
    expect(chatOutline(messages, '  dn  ')).toEqual(chatOutline(messages, 'DN'))
  })
})
