'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { WordDetailResponse } from '@/types/words'
import { useLocale, useTranslations } from 'next-intl'

type WordProgressProps = {
  user: WordDetailResponse['user']
  wordId: string
}

const statusColors = {
  new: 'bg-primary/10 text-primary',
  learning: 'bg-primary/20 text-primary',
  review: 'bg-primary/30 text-primary',
  mastered: 'bg-primary/40 text-primary',
  ignored: 'bg-muted text-muted-foreground',
}

export function WordProgress({ user, wordId }: WordProgressProps) {
  const t = useTranslations('wordDetail')
  const locale = useLocale()

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('progress.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t('progress.notStarted')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const nextDue = user.nextDueAt ? new Date(user.nextDueAt) : null
  const isOverdue = nextDue && nextDue < new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('progress.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">
            {t('progress.status')}
          </p>
          <span
            className={cn(
              'mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium',
              statusColors[user.status],
            )}
          >
            {t(`progress.statusValues.${user.status}`)}
          </span>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            {t('progress.stage')}
          </p>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {user.stage}
          </p>
        </div>

        {nextDue && (
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              {t('progress.nextDue')}
            </p>
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                isOverdue ? 'text-destructive' : 'text-foreground',
              )}
            >
              {nextDue.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {isOverdue && (
                <span className="ml-2 text-xs">({t('progress.overdue')})</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
