'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  locales,
  type Locale,
} from '@/i18n/config'
import { stripLocalePrefix, withLocalePrefix } from '@/i18n/pathname'

const localeCookieMaxAgeSeconds = 365 * 24 * 60 * 60

const localeLabelKey: Record<Locale, 'en' | 'zhHans'> = {
  en: 'en',
  'zh-Hans': 'zhHans',
}

function persistLocale(locale: Locale) {
  document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; path=/; max-age=${localeCookieMaxAgeSeconds}; samesite=lax`
}

export function LocaleSwitcher() {
  const t = useTranslations('localeSwitcher')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const localeFromRequest = useLocale()
  const locale = isLocale(localeFromRequest) ? localeFromRequest : defaultLocale
  const unprefixedPath = stripLocalePrefix(pathname)
  const queryString = searchParams.toString()

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t('label')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {locales.map((targetLocale) => {
          const href = `${withLocalePrefix(unprefixedPath, targetLocale)}${queryString ? `?${queryString}` : ''}`
          const isActive = locale === targetLocale

          return (
            <Link
              key={targetLocale}
              href={href}
              onClick={() => persistLocale(targetLocale)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-colors',
                isActive
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
              )}
            >
              {t(localeLabelKey[targetLocale])}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

