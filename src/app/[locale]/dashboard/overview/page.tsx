'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { StatsCards } from './components/StatsCards'
import { DueWordsCard } from './components/DueWordsCard'
import { ActivityChart } from './components/ActivityChart'
import { DashboardOverviewResponse } from '@/types/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const DEV_USER_ID = 'dev-user-123'

export default function OverviewPage() {
  const t = useTranslations('overview')
  const commonT = useTranslations('common')
  const [data, setData] = useState<DashboardOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const response = await fetch('/api/dashboard/overview', {
        headers: {
          'x-user-id': DEV_USER_ID,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard overview: ${response.status}`)
      }

      const payload = (await response.json()) as DashboardOverviewResponse
      setData(payload)
    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      setData(null)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const header = (
    <div>
      <h1 className="text-3xl font-bold text-foreground">
        {t('title')}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t('subtitle')}
      </p>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{commonT('loading')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasError || !data) {
    return (
      <div className="space-y-6">
        {header}

        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-8 text-center">
            <p className="text-destructive">
              {t('errorLoading')}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                void loadData()
              }}
            >
              {commonT('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      <StatsCards totals={data.totals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DueWordsCard due={data.due} />
        <ActivityChart activity={data.activity} />
      </div>
    </div>
  )
}
