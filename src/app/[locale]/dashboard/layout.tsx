import { Suspense } from 'react'
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link
              href={withLocalePrefix('/dashboard', locale)}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                B
              </div>
              <span className="text-lg font-semibold text-foreground">
                {commonT('appName')}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <DashboardNav />
          </nav>

          {/* User info (MVP: dev user) */}
          <div className="space-y-4 border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                D
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium text-foreground">
                  {userT('devMode')}
                </div>
                <div className="text-muted-foreground">
                  {userT('mvpMode')}
                </div>
              </div>
            </div>

            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
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
