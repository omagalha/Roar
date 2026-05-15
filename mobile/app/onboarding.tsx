import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useProfileStore } from '@/state/profile'
import { TEAMS_BY_GROUP, TeamOption } from '@/lib/teams'
import { colors, spacing, font, radius } from '@/lib/theme'

type Step = 'username' | 'team'

function normalizeUsername(raw: string): string {
  return raw
    .replace(/^@+/, '')        // remove @ do início
    .toLowerCase()
    .replace(/\s+/g, '_')      // espaço → _
    .replace(/[^a-z0-9_]/g, '') // remove caracteres inválidos
}

export default function OnboardingScreen() {
  const router = useRouter()
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding)
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleUsernameChange(text: string) {
    setError(null)
    setUsername(normalizeUsername(text))
  }

  function handleUsernameNext() {
    if (username.length < 3) {
      setError('mínimo 3 caracteres')
      return
    }
    setError(null)
    setStep('team')
  }

  function handleFinish() {
    completeOnboarding({
      username,
      nationalTeam: selectedTeam ? `${selectedTeam.name} ${selectedTeam.flag}` : '',
      favoriteClub: '',
    })
    router.replace('/(tabs)')
  }

  function handleSelectTeam(team: TeamOption) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedTeam((prev) => (prev?.id === team.id ? null : team))
  }

  const groups = Object.keys(TEAMS_BY_GROUP)

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.progress}>
          <View style={[styles.progressDot, step === 'username' && styles.progressDotActive]} />
          <View style={[styles.progressDot, step === 'team' && styles.progressDotActive]} />
        </View>

        {step === 'username' ? (
          <View style={styles.stepContainer}>
            <View>
              <Text style={styles.title}>como te chamam?</Text>
              <Text style={styles.subtitle}>seu nome no ROAR</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="seu_nome"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={24}
                onSubmitEditing={handleUsernameNext}
                returnKeyType="next"
              />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, username.length < 3 && styles.buttonDisabled]}
              onPress={handleUsernameNext}
              disabled={username.length < 3}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>continuar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <View>
              <Text style={styles.title}>quem você vai defender?</Text>
              <Text style={styles.subtitle}>escolha sua seleção favorita</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.teamScroll}
              contentContainerStyle={styles.teamScrollContent}
            >
              {groups.map((group) => (
                <View key={group} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group}</Text>
                    <View style={styles.groupLine} />
                  </View>

                  <View style={styles.teamGrid}>
                    {TEAMS_BY_GROUP[group].map((team) => {
                      const active = selectedTeam?.id === team.id
                      return (
                        <TouchableOpacity
                          key={team.id}
                          style={[styles.teamCard, active && styles.teamCardActive]}
                          onPress={() => handleSelectTeam(team)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.teamFlag}>{team.flag}</Text>
                          <Text
                            style={[styles.teamName, active && styles.teamNameActive]}
                            numberOfLines={1}
                          >
                            {team.name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => { setSelectedTeam(null); handleFinish() }}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Pular por enquanto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonFlex]}
                onPress={handleFinish}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  {selectedTeam ? `vai ${selectedTeam.name} ${selectedTeam.flag}` : 'confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  progress: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.red,
    width: 40,
  },

  stepContainer: { flex: 1, gap: spacing.lg },

  title: {
    fontSize: 36,
    fontWeight: font.weight.bold,
    color: colors.white,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: font.size.md,
    color: colors.muted,
    marginTop: 4,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    color: colors.muted,
    fontSize: font.size.lg,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: font.size.lg,
    letterSpacing: 1,
  },
  error: { color: colors.red, fontSize: font.size.sm },

  button: {
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonFlex: { flex: 1 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold, letterSpacing: 1 },

  teamScroll: { flex: 1 },
  teamScrollContent: { paddingBottom: spacing.md },

  group: { marginBottom: spacing.xl },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  teamCardActive: {
    borderColor: colors.red,
    backgroundColor: '#E8002D12',
  },
  teamFlag: { fontSize: 22 },
  teamName: { fontSize: font.size.sm, color: colors.muted },
  teamNameActive: { color: colors.white, fontWeight: font.weight.bold },

  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  skipButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  skipText: { color: colors.mutedLight, fontSize: font.size.sm },
})
