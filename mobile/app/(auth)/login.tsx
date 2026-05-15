import { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { colors, spacing, radius, font } from '@/lib/theme'

type Step = 'email' | 'code'

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<TextInput>(null)

  async function sendCode() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (error) {
      setError('Não conseguimos enviar o código. Tente de novo.')
      return
    }

    setStep('code')
    setTimeout(() => codeRef.current?.focus(), 300)
  }

  async function verifyCode() {
    if (code.length < 6) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    })

    setLoading(false)

    if (error) {
      setError('Código inválido ou expirado. Tente de novo.')
      setCode('')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>ROAR</Text>
          <Text style={styles.tagline}>sua reação ao vivo</Text>
        </View>

        {step === 'email' ? (
          <View style={styles.form}>
            <Text style={styles.label}>seu email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="você@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              onSubmitEditing={sendCode}
              returnKeyType="send"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, (!email.trim() || loading) && styles.buttonDisabled]}
              onPress={sendCode}
              disabled={loading || !email.trim()}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.buttonText}>enviar código</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sentTitle}>cheque seu email</Text>
            <Text style={styles.sentBody}>
              enviamos um código de 6 dígitos para{'\n'}
              <Text style={styles.sentEmail}>{email}</Text>
            </Text>

            <TextInput
              ref={codeRef}
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => { setCode(t.replace(/\D/g, '')); setError(null) }}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={8}
              onSubmitEditing={verifyCode}
              returnKeyType="done"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, (code.length < 6 || loading) && styles.buttonDisabled]}
              onPress={verifyCode}
              disabled={loading || code.length < 6}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.buttonText}>entrar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setStep('email'); setCode(''); setError(null) }}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>usar outro email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={sendCode} activeOpacity={0.7} style={styles.resendButton}>
              <Text style={styles.resendText}>reenviar código</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.terms}>ao entrar você concorda com os termos de uso</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  header: { alignItems: 'center', marginTop: spacing.xxl },
  logo: {
    fontSize: 72,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 8,
  },
  tagline: { fontSize: font.size.md, color: colors.muted, letterSpacing: 2, marginTop: spacing.xs },

  form: { gap: spacing.md },
  label: { fontSize: font.size.sm, color: colors.muted, letterSpacing: 1, textTransform: 'lowercase' },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: font.size.md,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: font.weight.bold,
    letterSpacing: 12,
    textAlign: 'center',
    color: colors.white,
  },

  error: { color: colors.red, fontSize: font.size.sm },

  button: {
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold, letterSpacing: 1 },

  sentTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.white, textAlign: 'center' },
  sentBody: { fontSize: font.size.md, color: colors.muted, textAlign: 'center', lineHeight: 24 },
  sentEmail: { color: colors.text, fontWeight: font.weight.medium },

  backButton: { alignItems: 'center', paddingVertical: spacing.xs },
  backText: { color: colors.muted, fontSize: font.size.sm, textDecorationLine: 'underline' },

  resendButton: { alignItems: 'center', paddingVertical: spacing.xs },
  resendText: { color: colors.muted, fontSize: font.size.sm },

  terms: { textAlign: 'center', color: colors.muted, fontSize: font.size.xs, lineHeight: 18 },
})
