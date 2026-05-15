import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Constants.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync()
    status = requested
  }

  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goals', {
      name: 'Gols',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync()
  return token
}

export async function upsertPushToken(token: string, deviceId?: string) {
  const platform = Platform.OS as 'ios' | 'android' | 'web'
  await supabase.rpc('upsert_push_token', {
    token,
    token_platform: platform,
    token_device_id: deviceId ?? null,
  })
}

export async function subscribeToMatch(matchId: string, token: string) {
  await supabase.rpc('subscribe_to_match', {
    target_match_id: matchId,
    token,
  })
}

export async function unsubscribeFromMatch(matchId: string) {
  await supabase.rpc('unsubscribe_from_match', {
    target_match_id: matchId,
  })
}

export type GoalNotificationData = {
  match_id: string
  event_id: string
  type: 'goal'
}

export function isGoalNotification(data: unknown): data is GoalNotificationData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as GoalNotificationData).type === 'goal'
  )
}
