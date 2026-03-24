'use client'

import { Card, CardContent } from '@/components/ui/card'
import { WordDetailResponse } from '@/types/words'
import { useTranslations } from 'next-intl'

type WordHeaderProps = {
  word: WordDetailResponse['word']
}

export function WordHeader({ word }: WordHeaderProps) {
  const t = useTranslations('wordDetail')

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-foreground text-4xl font-bold">{word.lemma}</h1>

            {word.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {word.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {word.dictionaries.length > 0 && (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm">
                  {t('dictionaries')}:{' '}
                  {word.dictionaries.map((d) => d.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
