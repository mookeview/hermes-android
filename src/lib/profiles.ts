/**
 * Profile label resolution shared by every roster surface (drawer chips, switcher, chat title).
 *
 * A profile's `name` is a backend slug (filesystem path, ASCII only), so human-friendly
 * names live in metadata: a client-written `ui_meta.display_name` nickname wins, then any
 * backend-populated `display_name`, then the slug itself.
 */
export interface ProfileLike {
  name: string
  display_name?: string | null
  ui_meta?: Record<string, unknown> | null
}

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Best available display label for a profile; `fallback` when there is no row at all. */
export function profileLabel(p: ProfileLike | null | undefined, fallback = ''): string {
  return clean(p?.ui_meta?.display_name) ?? clean(p?.display_name) ?? p?.name ?? fallback
}

/** The stored nickname exactly as written (for edit forms), '' when unset or non-string. */
export function profileNickname(p: ProfileLike | null | undefined): string {
  const nick = p?.ui_meta?.display_name
  return typeof nick === 'string' ? nick : ''
}
