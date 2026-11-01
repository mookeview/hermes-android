import { describe, expect, it } from 'vitest'

// 直接 import 真实的生产业务模块，消除“循环自证”
import { avatarPresetId, avatarPresetKey, AVATAR_PRESETS } from '@/lib/avatars'

describe('avatar presets (Real Module)', () => {
  it('ships a non-empty, uniquely-emojied preset set', () => {
    expect(AVATAR_PRESETS.length).toBeGreaterThan(0)
    for (const p of AVATAR_PRESETS) {
      expect(p.emoji.length).toBeGreaterThan(0)
      expect(p.bg).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
    expect(new Set(AVATAR_PRESETS.map((p) => p.emoji)).size).toBe(AVATAR_PRESETS.length)
  })

  it('parses stored preset keys back to their id', () => {
    expect(avatarPresetId(avatarPresetKey(0))).toBe(0)
    expect(avatarPresetId(avatarPresetKey(AVATAR_PRESETS.length - 1))).toBe(AVATAR_PRESETS.length - 1)
  })

  it('rejects anything that is not a valid preset reference', () => {
    expect(avatarPresetId(undefined)).toBeNull()
    expect(avatarPresetId(null)).toBeNull()
    expect(avatarPresetId('')).toBeNull()
    expect(avatarPresetId('preset:')).toBeNull()
    expect(avatarPresetId('preset:abc')).toBeNull()
    expect(avatarPresetId('preset:-1')).toBeNull()
    expect(avatarPresetId(`preset:${AVATAR_PRESETS.length}`)).toBeNull()
    expect(avatarPresetId('data:image/png;base64,…')).toBeNull()
    expect(avatarPresetId(7)).toBeNull()
  })
})
