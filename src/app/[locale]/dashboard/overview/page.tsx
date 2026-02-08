import { StatsCards } from './components/StatsCards'
import { DueWordsCard } from './components/DueWordsCard'
import { ActivityChart } from './components/ActivityChart'
import { getDashboardOverview } from './actions'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const t = await getTranslations('overview')
  const data = await getDashboardOverview()

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('title')}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">
            {t('errorLoading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards totals={data.totals} />

      {/* Due Words and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DueWordsCard due={data.due} />
        <ActivityChart activity={data.activity} />
      </div>
    </div>
  )
}
