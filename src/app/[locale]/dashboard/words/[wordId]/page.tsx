'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WordDetailResponse } from '@/types/words'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { WordHeader } from './components/WordHeader'
import { WordProgress } from './components/WordProgress'
import { WordSenses } from './components/WordSenses'
import { WordTimeline } from './components/WordTimeline'

const DEV_USER_ID = 'dev-user-123'

export default function WordDetailPage({
  params,
}: {
  params: Promise<{ locale: string; wordId: string }>
}) {
  const t = useTranslations('wordDetail')
  const commonT = useTranslations('common')

  const [wordId, setWordId] = useState<string | null>(null)
  const [data, setData] = useState<WordDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    params.then((p) => setWordId(p.wordId))
  }, [params])

  const loadData = useCallback(async () => {
    if (!wordId) return

    setIsLoading(true)
    setHasError(false)

    try {
      const response = await fetch(`/api/words/${wordId}`, {
        headers: {
          'x-user-id': DEV_USER_ID,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch word detail: ${response.status}`)
      }

      const payload = (await response.json()) as WordDetailResponse
      setData(payload)
    } catch (error) {
      console.error('Error fetching word detail:', error)
      setData(null)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [wordId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <WordHeader word={data.word} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WordSenses senses={data.word.senses} />
          <WordTimeline events={data.events} />
        </div>

        <div>
          <WordProgress user={data.user} wordId={data.word.wordId} />
        </div>
      </div>
    </div>
  )
}
