'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WordDetailResponse } from '@/types/words'
import { useTranslations } from 'next-intl'

type WordSensesProps = {
  senses: WordDetailResponse['word']['senses']
}

export function WordSenses({ senses }: WordSensesProps) {
  const t = useTranslations('wordDetail')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('definitions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {senses.map((sense, index) => {
          const examples = sense.examples
            ? Array.isArray(sense.examples)
              ? sense.examples
              : typeof sense.examples === 'object' &&
                  'examples' in sense.examples
                ? (sense.examples as { examples: string[] }).examples
                : []
            : []

          return (
            <div key={sense.id} className="border-primary border-l-2 pl-4">
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  {sense.pos && (
                    <span className="text-muted-foreground text-xs font-medium">
                      {sense.pos}
                    </span>
                  )}
                  <p className="text-foreground mt-1">{sense.definition}</p>

                  {examples.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {examples.map((example, i) => (
                        <p
                          key={i}
                          className="text-muted-foreground text-sm italic"
                        >
                          "{example}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
