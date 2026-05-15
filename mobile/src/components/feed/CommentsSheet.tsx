import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useComments, CommentWithProfile } from '@/hooks/useComments'
import { colors, spacing, font, radius } from '@/lib/theme'

type Props = {
  postId: string
  visible: boolean
  onClose: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function CommentsSheet({ postId, visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const { comments, isLoading, addComment, isAdding } = useComments(postId, visible)

  async function handleSend() {
    if (!text.trim() || isAdding) return
    const ok = await addComment(text.trim())
    if (ok) setText('')
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || spacing.lg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Comentários</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : (
          <FlatList<CommentWithProfile>
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const username = item.profile?.username ?? 'anônimo'
              return (
                <View style={styles.comment}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{username[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>@{username}</Text>
                      <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                </View>
              )
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nenhum comentário ainda</Text>
                <Text style={styles.emptySubText}>seja o primeiro a comentar</Text>
              </View>
            }
            contentContainerStyle={styles.list}
          />
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
        >
          <View style={[styles.inputRow, { paddingBottom: insets.bottom || spacing.md }]}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Adicione um comentário..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || isAdding}
              style={[styles.sendBtn, (!text.trim() || isAdding) && styles.sendBtnDisabled]}
            >
              {isAdding
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Ionicons name="send" size={18} color={colors.white} />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.white,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  emptySubText: {
    color: colors.muted,
    fontSize: font.size.sm,
  },

  list: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },

  comment: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.xs,
  },
  commentBody: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  commentUsername: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  commentTime: {
    color: colors.muted,
    fontSize: font.size.xs,
  },
  commentContent: {
    color: colors.text,
    fontSize: font.size.sm,
    lineHeight: 18,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.dark,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: font.size.sm,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
})
