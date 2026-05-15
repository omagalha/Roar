import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()

  async function handleSignOut() {
    Alert.alert('Sair', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          signOut()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            membro desde {new Date(user?.created_at ?? '').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.white,
  },
  email: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.medium,
  },
  memberSince: {
    fontSize: font.size.sm,
    color: colors.muted,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
