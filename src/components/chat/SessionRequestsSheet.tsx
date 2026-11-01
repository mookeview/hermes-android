import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useProfiles } from '@/components/ProfileSwitcher'
import { Bot, Search } from '@/components/icons'
import { Sheet, Text } from '@/components/ui'
import { useT } from '@/i18n'
import type { ChatMessage } from '@/lib/chat/types'
import { chatOutline, type OutlineRow } from '@/lib/chat/outline'
import { hhmm } from '@/lib/format'
import { loadHistory, useChat } from '@/store/chat'
import { font, radius, space, useTheme } from '@/theme'

const NO_MESSAGES: ChatMessage[] = []

/**
 * The request index of the active chat, opened from the toolbar title. It lists the session's
 * prompts newest first — or, while searching, every matching message — and jumps the transcript
 * to the row the user taps.
 */
export function SessionRequestsSheet({
  visible,
  onClose,
  onFocus,
}: {
  visible: boolean
  onClose: () => void
  onFocus: (messageId: string) => void
}) {
  const t = useT()
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  // Reset the search between visits; done during render, not in an effect, to avoid a re-render cascade.
  const [wasVisible, setWasVisible] = useState(visible)
  if (wasVisible !== visible) {
    setWasVisible(visible)
    if (!visible) setQuery('')
  }
  const activeId = useChat((s) => s.activeId)
  const title = useChat((s) => (s.activeId ? s.sessions[s.activeId]?.title : null))
  const messages = useChat((s) => (s.activeId ? s.sessions[s.activeId]?.messages : undefined)) ?? NO_MESSAGES
  const hasMore = useChat((s) => !!(s.activeId ? s.sessions[s.activeId]?.hasMore : false))
  const loadingHistory = useChat((s) => !!(s.activeId ? s.sessions[s.activeId]?.loadingHistory : false))
  const profileName = useChat((s) => (s.activeId ? s.sessions[s.activeId]?.info?.profile_name : null))
  const profiles = useProfiles()
  const profileRow = profileName
    ? profiles.data?.find((p) => p.name === profileName)
    : profiles.data?.find((p) => p.is_default)
  const agentName = profileRow?.display_name || profileRow?.name || profileName || t('Hermes Agent')

  const rows = useMemo(() => chatOutline(messages, query), [messages, query])

  return (
    <Sheet visible={visible} onClose={onClose} title={title || t('New chat')} noScroll heightRatio={0.72}>
      <View style={{ gap: space.sm, paddingBottom: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 20 }}>
          <Bot size={15} color={c.textMuted} strokeWidth={1.75} />
          <Text variant="small" tone="muted" numberOfLines={1}>
            {`${t('Agent')} · ${agentName}`}
          </Text>
        </View>
        <View style={[styles.search, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Search size={16} color={c.textFaint} strokeWidth={1.75} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Search this chat')}
            placeholderTextColor={c.textFaint}
            accessibilityLabel={t('Search this chat')}
            returnKeyType="search"
            style={{ flex: 1, minWidth: 0, color: c.text, fontFamily: font.regular, fontSize: 15, height: 42 }}
          />
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        keyboardShouldPersistTaps="handled"
        style={{ marginHorizontal: -space.lg }}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md }}
        renderItem={({ item }) => (
          <RequestRow item={item} onPress={() => {
            onClose()
            onFocus(item.id)
          }} />
        )}
        ListEmptyComponent={
          loadingHistory ? null : (
            <Text tone="muted" variant="small" style={{ padding: space.lg }}>
              {query ? t('No matches') : t('No requests yet')}
            </Text>
          )
        }
        ListFooterComponent={
          loadingHistory ? (
            <ActivityIndicator color={c.accent} style={{ margin: space.md }} />
          ) : hasMore ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => activeId && loadHistory(activeId, true)}
              style={({ pressed }) => [styles.more, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text variant="small" tone="muted">
                {t('Load earlier messages')}
              </Text>
            </Pressable>
          ) : null
        }
      />
    </Sheet>
  )
}

function RequestRow({ item, onPress }: { item: OutlineRow; onPress: () => void }) {
  const { c } = useTheme()
  const reply = item.role === 'assistant'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.text}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.surfaceAlt : 'transparent' }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingBottom: 2 }}>
        {reply ? <Bot size={13} color={c.textFaint} strokeWidth={1.75} /> : null}
        <Text variant="caption" tone={reply ? 'faint' : 'muted'}>
          {hhmm(item.at)}
        </Text>
      </View>
      <Text variant={reply ? 'small' : 'body'} tone={reply ? 'muted' : 'default'} numberOfLines={2}>
        {item.text}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: 2,
    minHeight: 58,
  },
  more: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
})
