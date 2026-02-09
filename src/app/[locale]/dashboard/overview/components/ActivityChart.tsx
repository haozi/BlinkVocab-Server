'use client'

import { useLocale, useTranslations } from 'next-intl'
import { DashboardOverviewResponse } from '@/types/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ActivityChartProps = {
  activity: DashboardOverviewResponse['activity']
}

export function ActivityChart({ activity }: ActivityChartProps) {
  const locale = useLocale()
  const t = useTranslations('overview.activity')
  const maxEvents = Math.max(...activity.last7Days.map((d) => d.events), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {activity.last7Days.map((day) => {
          const date = new Date(day.date)
          const dateStr = date.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
          })
          const dayOfWeek = date.toLocaleDateString(locale, {
            weekday: 'short',
          })
          const percentage = maxEvents > 0 ? (day.events / maxEvents) * 100 : 0

          return (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-right">
                <div className="text-xs font-medium text-foreground">
                  {dateStr}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dayOfWeek}
                </div>
              </div>

              <div className="flex-1">
                <div className="h-8 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="w-12 text-right">
                <span className="text-sm font-semibold text-foreground">
                  {day.events}
                </span>
              </div>
            </div>
          )
        })}

        {activity.last7Days.every((d) => d.events === 0) && (
          <div className="mt-4 rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('noActivity')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
