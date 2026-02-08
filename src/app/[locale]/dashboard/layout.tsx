import { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'
import { DashboardNav } from './components/DashboardNav'
import { LocaleSwitcher } from './components/LocaleSwitcher'

export const metadata: Metadata = {
  title: 'Dashboard - BlinkVocab',
  description: 'Vocabulary learning dashboard',
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  const locale = isLocale(localeParam) ? localeParam : defaultLocale
  const commonT = await getTranslations('common')
  const userT = await getTranslations('user')

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
            <Link
              href={withLocalePrefix('/dashboard', locale)}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                B
              </div>
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {commonT('appName')}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <DashboardNav />
          </nav>

          {/* User info (MVP: dev user) */}
          <div className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium dark:bg-zinc-800">
                D
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {userT('devMode')}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">
                  {userT('mvpMode')}
                </div>
              </div>
            </div>

            <LocaleSwitcher />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
