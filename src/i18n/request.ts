import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale, type Locale } from './config'

export { defaultLocale, locales, type Locale } from './config'

type Messages = Record<string, unknown>

const messageImports: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import('../../messages/en.json'),
  'zh-Hans': () => import('../../messages/zh-Hans.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request or cookie
  let locale = await requestLocale

  // Validate locale
  if (!locale || !isLocale(locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await messageImports[locale as Locale]()).default,
  }
})
