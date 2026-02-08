'use client'

import { useLocale, useTranslations } from 'next-intl'
import { DashboardOverviewResponse } from '@/types/dashboard'

type ActivityChartProps = {
  activity: DashboardOverviewResponse['activity']
}

export function ActivityChart({ activity }: ActivityChartProps) {
  const locale = useLocale()
  const t = useTranslations('overview.activity')
  const maxEvents = Math.max(...activity.last7Days.map((d) => d.events), 1)

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </div>

      <div className="space-y-3">
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
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                  {dateStr}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {dayOfWeek}
                </div>
              </div>

              <div className="flex-1">
                <div className="h-8 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all dark:bg-blue-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="w-12 text-right">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {day.events}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {activity.last7Days.every((d) => d.events === 0) && (
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('noActivity')}
          </p>
        </div>
      )}
    </div>
  )
}
