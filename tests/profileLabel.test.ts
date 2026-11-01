import { describe, expect, it } from 'vitest'

// 直接 import 真实的生产业务模块，消除“循环自证”
import { profileLabel, profileNickname } from '@/lib/profiles'

describe('profileLabel (Real Module)', () => {
  it('prefers the ui_meta nickname over display_name and the slug', () => {
    const row = { name: 'build-agent', display_name: 'Build', ui_meta: { display_name: '小助手' } }
    expect(profileLabel(row)).toBe('小助手')
  })

  it('falls back to the backend display_name, then the slug', () => {
    expect(profileLabel({ name: 'build-agent', display_name: 'Build', ui_meta: null })).toBe('Build')
    expect(profileLabel({ name: 'build-agent' })).toBe('build-agent')
    expect(profileLabel({ name: 'build-agent', display_name: null, ui_meta: {} })).toBe('build-agent')
  })

  it('ignores blank or non-string nicknames instead of rendering them', () => {
    expect(profileLabel({ name: 'ops', ui_meta: { display_name: '   ' }, display_name: 'Ops' })).toBe('Ops')
    expect(profileLabel({ name: 'ops', ui_meta: { display_name: 42 } })).toBe('ops')
    expect(profileLabel({ name: 'ops', ui_meta: { display_name: { nested: true } } })).toBe('ops')
  })

  it('trims the winning value', () => {
    expect(profileLabel({ name: 'ops', ui_meta: { display_name: '  小助手  ' } })).toBe('小助手')
    expect(profileLabel({ name: 'ops', display_name: ' Ops ' })).toBe('Ops')
  })

  it('uses the fallback only when there is no row at all', () => {
    expect(profileLabel(null, '默认')).toBe('默认')
    expect(profileLabel(undefined, 'default')).toBe('default')
    expect(profileLabel({ name: 'ops' }, 'ignored')).toBe('ops')
  })
})

describe('profileNickname (Real Module)', () => {
  it('returns the stored nickname as written, for edit forms', () => {
    expect(profileNickname({ name: 'ops', ui_meta: { display_name: ' 小助手 ' } })).toBe(' 小助手 ')
  })

  it('returns an empty string when unset or non-string', () => {
    expect(profileNickname(null)).toBe('')
    expect(profileNickname({ name: 'ops' })).toBe('')
    expect(profileNickname({ name: 'ops', ui_meta: { display_name: 7 } })).toBe('')
  })
})
