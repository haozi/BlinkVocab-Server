import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, localeCookieName, type Locale } from './config'

/**
 * Get user's preferred locale from:
 * 1. Cookie (user's previous choice)
 * 2. Accept-Language header (browser preference)
 * 3. Default locale
 */
export async function getUserLocale(): Promise<Locale> {
  // Check cookie first
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(localeCookieName)?.value

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale
  }

  // Check Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')

  if (acceptLanguage) {
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, q = '1'] = lang.trim().split(';q=')
        return { code: code.split('-')[0], quality: parseFloat(q) }
      })
      .sort((a, b) => b.quality - a.quality)

    // Find first matching locale
    for (const { code } of languages) {
      if (code === 'zh') {
        return 'zh-Hans'
      }
      if (isLocale(code)) {
        return code
      }
    }
  }

  return defaultLocale
}

/**
 * Set user's locale preference in cookie
 */
export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set(localeCookieName, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  })
}
