import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'
import { DashboardOverviewResponse } from '@/types/dashboard'

type DueWordsCardProps = {
  due: DashboardOverviewResponse['due']
}

export async function DueWordsCard({ due }: DueWordsCardProps) {
  const localeFromRequest = await getLocale()
  const locale = isLocale(localeFromRequest) ? localeFromRequest : defaultLocale
  const t = await getTranslations('overview.due')
  const totalDue = due.dueToday + due.overdue

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h2>
        {totalDue > 0 && (
          <Link
            href={`${withLocalePrefix('/dashboard/words', locale)}?status=review,learning`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('reviewNow')} →
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {/* Overdue */}
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 dark:bg-red-950">
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              {t('overdue')}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {t('overdueDesc')}
            </p>
          </div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-400">
            {due.overdue}
          </div>
        </div>

        {/* Due Today */}
        <div className="flex items-center justify-between rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
              {t('dueToday')}
            </p>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              {t('dueTodayDesc')}
            </p>
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
            {due.dueToday}
          </div>
        </div>

        {/* Total */}
        {totalDue === 0 ? (
          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('allCaughtUp')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t('total')}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalDue}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
