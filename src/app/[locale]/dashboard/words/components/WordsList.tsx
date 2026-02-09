'use client'

import { Card, CardContent } from '@/components/ui/card'
import { defaultLocale, isLocale } from '@/i18n/config'
import { withLocalePrefix } from '@/i18n/pathname'
import { cn } from '@/lib/utils'
import { WordItem } from '@/types/words'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

type WordsListProps = {
  items: WordItem[]
}

const statusColors = {
  new: 'bg-primary/10 text-primary',
  learning: 'bg-primary/20 text-primary',
  review: 'bg-primary/30 text-primary',
  mastered: 'bg-primary/40 text-primary',
  ignored: 'bg-muted text-muted-foreground',
}

export function WordsList({ items }: WordsListProps) {
  const t = useTranslations('words')
  const localeFromRequest = useLocale()
  const locale = isLocale(localeFromRequest) ? localeFromRequest : defaultLocale

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t('noWords')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const nextDue = item.nextDueAt ? new Date(item.nextDueAt) : null
        const isOverdue = nextDue && nextDue < new Date()

        return (
          <Link
            key={item.wordId}
            href={withLocalePrefix(`/dashboard/words/${item.wordId}`, locale)}
          >
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-foreground text-lg font-semibold">
                        {item.lemma}
                      </h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusColors[item.status],
                        )}
                      >
                        {t(`status.${item.status}`)}
                      </span>
                      {isOverdue && (
                        <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                          {t('overdue')}
                        </span>
                      )}
                    </div>

                    <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                      <span>
                        {t('stage')}: {item.stage}
                      </span>
                      {nextDue && (
                        <span>
                          {t('nextDue')}: {nextDue.toLocaleDateString(locale)}
                        </span>
                      )}
                      {item.dictionaries.length > 0 && (
                        <span>
                          {item.dictionaries.map((d) => d.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-muted-foreground">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
