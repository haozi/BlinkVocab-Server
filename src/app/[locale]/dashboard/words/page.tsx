'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GetWordsResponse } from '@/types/words'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { WordsFilters } from './components/WordsFilters'
import { WordsList } from './components/WordsList'
import { WordsPagination } from './components/WordsPagination'

const DEV_USER_ID = 'dev-user-123'

export default function WordsPage() {
  const t = useTranslations('words')
  const commonT = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<GetWordsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      const params = new URLSearchParams(searchParams.toString())

      const response = await fetch(`/api/words?${params.toString()}`, {
        headers: {
          'x-user-id': DEV_USER_ID,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch words: ${response.status}`)
      }

      const payload = (await response.json()) as GetWordsResponse
      setData(payload)
    } catch (error) {
      console.error('Error fetching words:', error)
      setData(null)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const header = (
    <div>
      <h1 className="text-foreground text-3xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
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
            <p className="text-destructive">{t('errorLoading')}</p>
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

      <WordsFilters />

      <WordsList items={data.items} />

      <WordsPagination pagination={data.pagination} />
    </div>
  )
}
