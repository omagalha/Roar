import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MatchStatus } from '@/types/match'
import { colors, font, radius } from '@/lib/theme'

type Props = {
  status: MatchStatus
}

export function MatchStatusPill({ status }: Props) {
  const { t } = useTranslation()
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (status !== 'live') return

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.15, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [status, opacity])

  if (status === 'live') {
    return (
      <View style={[styles.pill, styles.pillLive]}>
        <Animated.View style={[styles.dot, { opacity }]} />
        <Text style={[styles.text, styles.textLive]}>{t('matches.livePill')}</Text>
      </View>
    )
  }

  if (status === 'upcoming') {
    return (
      <View style={[styles.pill, styles.pillUpcoming]}>
        <Text style={[styles.text, styles.textUpcoming]}>{t('matches.upcomingPill')}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.pill, styles.pillFinished]}>
      <Text style={[styles.text, styles.textFinished]}>{t('matches.finishedPill')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillLive: {
    borderColor: 'rgba(232,0,45,0.5)',
    backgroundColor: 'rgba(232,0,45,0.12)',
  },
  pillUpcoming: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillFinished: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  text: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 0.8,
  },
  textLive: { color: colors.red },
  textUpcoming: { color: colors.mutedLight },
  textFinished: { color: colors.muted },
})
