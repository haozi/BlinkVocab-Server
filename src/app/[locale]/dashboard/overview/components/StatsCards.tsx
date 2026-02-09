'use client'

import { useTranslations } from 'next-intl'
import { DashboardOverviewResponse } from '@/types/dashboard'
import { Card } from '@/components/ui/card'

type StatsCardsProps = {
  totals: DashboardOverviewResponse['totals']
}

const statItems = [
  {
    key: 'total' as const,
    color: 'text-foreground',
    bgColor: 'bg-muted',
  },
  {
    key: 'new' as const,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'learning' as const,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
  },
  {
    key: 'review' as const,
    color: 'text-primary',
    bgColor: 'bg-primary/30',
  },
  {
    key: 'mastered' as const,
    color: 'text-primary',
    bgColor: 'bg-primary/40',
  },
]

export function StatsCards({ totals }: StatsCardsProps) {
  const t = useTranslations('overview.stats')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => {
        const label = t(item.key)

        return (
          <Card key={item.key} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
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
          </Card>
        )
      })}
    </div>
  )
}
