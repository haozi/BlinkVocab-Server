'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'
import { DashboardOverviewResponse } from '@/types/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type DueWordsCardProps = {
  due: DashboardOverviewResponse['due']
}

export function DueWordsCard({ due }: DueWordsCardProps) {
  const localeFromRequest = useLocale()
  const locale = isLocale(localeFromRequest) ? localeFromRequest : defaultLocale
  const t = useTranslations('overview.due')
  const totalDue = due.dueToday + due.overdue

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('title')}</CardTitle>
          {totalDue > 0 && (
            <Button variant="link" asChild className="h-auto p-0">
              <Link
                href={`${withLocalePrefix('/dashboard/words', locale)}?status=review,learning`}
              >
                {t('reviewNow')} →
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overdue */}
        <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-4">
          <div>
            <p className="text-sm font-medium text-destructive">
              {t('overdue')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('overdueDesc')}
            </p>
          </div>
          <div className="text-3xl font-bold text-destructive">
            {due.overdue}
          </div>
        </div>

        {/* Due Today */}
        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
          <div>
            <p className="text-sm font-medium text-primary">
              {t('dueToday')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dueTodayDesc')}
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {due.dueToday}
          </div>
        </div>

        {/* Total */}
        {totalDue === 0 ? (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t('allCaughtUp')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('total')}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totalDue}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
