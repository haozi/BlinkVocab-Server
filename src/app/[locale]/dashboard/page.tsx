'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'

export default function DashboardPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const localeFromRequest = useLocale()
  const locale = isLocale(localeFromRequest) ? localeFromRequest : defaultLocale

  useEffect(() => {
    router.replace(withLocalePrefix('/dashboard/overview', locale))
  }, [router, locale])

  return (
    <div className="p-6 text-sm text-muted-foreground">
      {t('loading')}
    </div>
  )
}
