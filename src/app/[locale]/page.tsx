import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'

export const dynamic = 'force-static'

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  const locale = isLocale(localeParam) ? localeParam : defaultLocale
  const t = await getTranslations('home')

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold text-foreground">
        {t('title')}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t('subtitle')}
      </p>
      <Button asChild className="mt-8">
        <Link href={withLocalePrefix('/dashboard', locale)}>
          {t('cta')}
        </Link>
      </Button>
    </main>
  )
}
