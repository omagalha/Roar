import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
}

type ResourceKey = keyof typeof resources

function resolveLocale(tag: string): ResourceKey {
  if (resources[tag as ResourceKey]) return tag as ResourceKey
  // 'pt' → 'pt-BR', 'en' → 'en-US', 'es' → 'es-ES'
  const match = Object.keys(resources).find((k) =>
    k.startsWith(tag.split('-')[0]),
  )
  return (match as ResourceKey) ?? 'pt-BR'
}

const deviceTag = getLocales()[0]?.languageTag ?? 'pt-BR'

i18n.use(initReactI18next).init({
  resources,
  lng: resolveLocale(deviceTag),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

export default i18n
