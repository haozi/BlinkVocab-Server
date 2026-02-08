import { DashboardOverviewResponse } from '@/types/dashboard'
import { getTranslations } from 'next-intl/server'

type StatsCardsProps = {
  totals: DashboardOverviewResponse['totals']
}

const statItems = [
  {
    key: 'total' as const,
    color: 'text-zinc-900 dark:text-zinc-50',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
  {
    key: 'new' as const,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    key: 'learning' as const,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  {
    key: 'review' as const,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    key: 'mastered' as const,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
]

export async function StatsCards({ totals }: StatsCardsProps) {
  const t = await getTranslations('overview.stats')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => {
        const label = t(item.key)

        return (
          <div
            key={item.key}
            className={`rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </p>
                <p className={`mt-2 text-3xl font-bold ${item.color}`}>
                  {totals[item.key]}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bgColor}`}>
                <span className={`text-xl font-bold ${item.color}`}>
                  {label[0]}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
