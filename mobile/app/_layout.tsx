import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'
import { useProfile } from '@/hooks/useProfile'
import { registerForPushNotifications, upsertPushToken, isGoalNotification } from '@/lib/notifications'
import { colors } from '@/lib/theme'

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider />
    </QueryClientProvider>
  )
}

function AuthProvider() {
  const router = useRouter()
  const segments = useSegments()
  const { setSession, setInitialized, initialized, session } = useAuthStore()
  const { profile, isLoading: profileLoading } = useProfile()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        registerForPushNotifications().then((token) => {
          if (token) upsertPushToken(token)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized || profileLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      if (profile) router.replace('/(tabs)')
      else router.replace('/onboarding')
    } else if (session && !inAuthGroup && !inOnboarding && !profile) {
      router.replace('/onboarding')
    }
  }, [session, initialized, segments, profile, profileLoading])

  useEffect(() => {
    // Push tapped enquanto app estava fechado ou em background
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      if (isGoalNotification(data)) {
        // Vai direto para a câmera — o usuário precisa gravar agora
        router.push(`/camera/${data.match_id}?eventId=${data.event_id}`)
      }
    })

    // Push recebido com app em foreground — o match room já trata via Realtime,
    // mas garantimos o deep link caso o usuário não esteja na partida
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data
      if (isGoalNotification(data)) {
        const currentPath = segments.join('/')
        const isInMatchRoom = currentPath.includes(data.match_id)
        if (!isInMatchRoom) {
          router.push(`/camera/${data.match_id}?eventId=${data.event_id}`)
        }
      }
    })

    return () => {
      sub.remove()
      foregroundSub.remove()
    }
  }, [segments])

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.dark} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.dark } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="feed/[matchId]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="camera/[matchId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  )
}
