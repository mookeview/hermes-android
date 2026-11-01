/**
 * Built-in avatar presets.
 *
 * A picked preset is stored as `ui_meta.avatar = 'preset:<id>'` (client-owned profile metadata,
 * same channel as the display name) and rendered natively, so no image asset is uploaded or
 * decoded. An uploaded image (`profiles.set_asset`) replaces it by clearing the preset.
 */
export interface AvatarPreset {
  emoji: string
  bg: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { emoji: '🤖', bg: '#E3F2FD' },
  { emoji: '🦊', bg: '#FFF3E0' },
  { emoji: '🦉', bg: '#EDE7F6' },
  { emoji: '🐺', bg: '#ECEFF1' },
  { emoji: '🐬', bg: '#E0F7FA' },
  { emoji: '🐢', bg: '#E8F5E9' },
  { emoji: '🐉', bg: '#FFFDE7' },
  { emoji: '🦄', bg: '#F3E5F5' },
  { emoji: '🦜', bg: '#FFF8E1' },
  { emoji: '⚡', bg: '#E8EAF6' },
  { emoji: '🧠', bg: '#FCE4EC' },
  { emoji: '🚀', bg: '#E7E9F9' },
]

const PRESET_PREFIX = 'preset:'

/** The preset id stored in `ui_meta.avatar`, or null for anything else (unset/uploaded/broken). */
export function avatarPresetId(meta: unknown): number | null {
  if (typeof meta !== 'string' || !meta.startsWith(PRESET_PREFIX)) return null
  const raw = meta.slice(PRESET_PREFIX.length)
  if (!/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id < AVATAR_PRESETS.length ? id : null
}

/** The `ui_meta.avatar` value that selects a preset. */
export function avatarPresetKey(id: number): string {
  return `${PRESET_PREFIX}${id}`
}
