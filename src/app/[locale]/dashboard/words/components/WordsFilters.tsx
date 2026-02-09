'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const statusOptions = [
  'new',
  'learning',
  'review',
  'mastered',
  'ignored',
] as const
const sortOptions = ['next_due', 'recent', 'added', 'wrong_most'] as const

export function WordsFilters() {
  const t = useTranslations('words')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStatus = searchParams.get('status')?.split(',') || []
  const currentSort = searchParams.get('sort') || 'next_due'

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to page 1 when filters change
    params.set('page', '1')

    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleStatus = (status: string) => {
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status]

    updateParams('status', newStatus.length > 0 ? newStatus.join(',') : null)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasFilters = currentStatus.length > 0 || currentSort !== 'next_due'

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {/* Status Filter */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-foreground text-sm font-medium">
              {t('filters.status')}
            </label>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-0 text-xs"
              >
                {t('filters.clear')}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const isActive = currentStatus.includes(status)

              return (
                <Button
                  key={status}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStatus(status)}
                >
                  {t(`status.${status}`)}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">
            {t('filters.sort')}
          </label>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((sort) => {
              const isActive = currentSort === sort

              return (
                <Button
                  key={sort}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams('sort', sort)}
                >
                  {t(`sort.${sort}`)}
                </Button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
