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
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
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

