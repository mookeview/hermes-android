import { ArrowDown } from '@/components/icons'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { toastError, Text } from '@/components/ui'
import { useT } from '@/i18n'
import type { ChatMessage } from '@/lib/chat/types'
import { dayLabel } from '@/lib/format'
import { loadHistory, react, runSlash, useChat } from '@/store/chat'
import { centered, motion, space, useTheme } from '@/theme'

import { MessageItem } from './MessageItem'

const NO_MESSAGES: ChatMessage[] = []

interface Props {
  runtimeId: string
  /** Message the request sheet picked; `seq` bumps on every pick, so re-picks re-scroll. */
  focus: { id: string; seq: number } | null
  onEdit: (m: ChatMessage) => void
}

/**
 * The message list of one chat. It reads the store itself, so streamed tokens re-render this list
 * and nothing else on the chat screen.
 */
export const Transcript = memo(function Transcript({ runtimeId, focus, onEdit }: Props) {
  const t = useT()
  const { c } = useTheme()
  const messages = useChat((s) => s.sessions[runtimeId]?.messages ?? NO_MESSAGES)
  const streamingId = useChat((s) => s.sessions[runtimeId]?.streamingId ?? null)
  const busy = useChat((s) => !!s.sessions[runtimeId]?.busy)
  const hasMore = useChat((s) => !!s.sessions[runtimeId]?.hasMore)
  const loadingHistory = useChat((s) => !!s.sessions[runtimeId]?.loadingHistory)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const [awayFromEnd, setAwayFromEnd] = useState(false)

  const data = useMemo(() => [...messages].reverse(), [messages])

  // The request sheet picks a message; `data` is newest-first, so the index is where to land.
  const focusId = focus?.id ?? null
  useEffect(() => {
    if (!focus) return
    const index = data.findIndex((m) => m.id === focus.id)
    if (index >= 0) listRef.current?.scrollToIndex({ index, viewPosition: 0.4, animated: true })
    // Scroll when the pick changes, not on every streamed token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.seq])

  const onReact = useCallback(
    (m: ChatMessage, emoji: string) => {
      react(runtimeId, m, emoji).catch(toastError)
    },
    [runtimeId],
  )
  const onRetry = useCallback(() => {
    runSlash(runtimeId, '/retry').catch(toastError)
  }, [runtimeId])

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      // data is newest-first: the item above (visually) is data[index+1]. A separator sits on
      // top of a message when the next-older one belongs to a different calendar day — or it is
      // the oldest message loaded. Kept out of `data` so search-hit indexes stay aligned.
      const older = data[index + 1]
      const sep = !older || new Date(item.at).toDateString() !== new Date(older.at).toDateString() ? dayLabel(item.at) : null
      return (
        <View>
          {sep ? (
            <Text variant="caption" tone="faint" style={styles.daySep}>
              {sep}
            </Text>
          ) : null}
          <MessageItem
            message={item}
            streaming={item.id === streamingId}
            onReact={onReact}
            onEdit={onEdit}
            onRetry={index === 0 && item.role === 'assistant' && !busy ? onRetry : undefined}
            highlighted={item.id === focusId}
          />
        </View>
      )
    },
    [data, streamingId, busy, focusId, onReact, onEdit, onRetry],
  )

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={data}
        inverted
        onScroll={(e) => setAwayFromEnd(e.nativeEvent.contentOffset.y > 600)}
        onScrollToIndexFailed={(info) => {
          // Rows have different heights: jump near it, then aim again once it is measured.
          listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
          setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0.4, animated: true }), 120)
        }}
        scrollEventThrottle={100}
        keyExtractor={keyOf}
        renderItem={renderItem}
        contentContainerStyle={[centered, styles.content]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onEndReached={() => hasMore && loadHistory(runtimeId, true)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingHistory ? <ActivityIndicator color={c.accent} style={{ margin: space.lg }} /> : null}
        // No removeClippedSubviews: getChildDrawingOrder races row detach on Android and crashes.
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
      />
      {awayFromEnd ? (
        <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.fast)} style={styles.jumpWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Jump to the latest message')}
            onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
            hitSlop={4}
            style={({ pressed }) => [styles.jump, { backgroundColor: c.elevated, borderColor: c.borderStrong, opacity: pressed ? 0.8 : 1 }]}
          >
            <ArrowDown size={18} color={c.text} strokeWidth={2} />
            {busy ? <View style={[styles.jumpDot, { backgroundColor: c.accent }]} /> : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  )
})

const keyOf = (m: ChatMessage) => m.id

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.sm, paddingTop: space.sm, paddingBottom: space.lg, gap: space.md },
  daySep: { alignSelf: 'center', marginBottom: space.sm },
  jumpWrap: { position: 'absolute', right: space.lg, bottom: space.md },
  jump: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
})
