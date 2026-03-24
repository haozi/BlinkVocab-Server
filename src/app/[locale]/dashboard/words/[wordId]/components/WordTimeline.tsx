'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WordDetailResponse } from '@/types/words'
import { useLocale, useTranslations } from 'next-intl'

type WordTimelineProps = {
  events: WordDetailResponse['events']
}

const eventTypeColors: Record<string, string> = {
  added_manual: 'bg-primary/10 text-primary',
  added_by_dictionary: 'bg-primary/10 text-primary',
  view: 'bg-muted text-muted-foreground',
  correct: 'bg-primary/20 text-primary',
  incorrect: 'bg-destructive/10 text-destructive',
  skip: 'bg-muted text-muted-foreground',
}

export function WordTimeline({ events }: WordTimelineProps) {
  const t = useTranslations('wordDetail')
  const locale = useLocale()

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('timeline.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t('timeline.noEvents')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('timeline.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const date = new Date(event.createdAt)
            const colorClass =
              eventTypeColors[event.type] || 'bg-muted text-muted-foreground'

            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  {index < events.length - 1 && (
                    <div className="bg-border h-full w-0.5" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-medium">
                      {t(`timeline.eventTypes.${event.type}`, {
                        defaultValue: event.type,
                      })}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {date.toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {event.payload && (
                    <div className="text-muted-foreground mt-1 text-xs">
                      {JSON.stringify(event.payload)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
