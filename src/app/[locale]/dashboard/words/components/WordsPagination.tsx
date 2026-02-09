'use client'

import { Button } from '@/components/ui/button'
import { GetWordsResponse } from '@/types/words'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type WordsPaginationProps = {
  pagination: GetWordsResponse['pagination']
}

export function WordsPagination({ pagination }: WordsPaginationProps) {
  const t = useTranslations('words')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { page, totalPages, total } = pagination

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) {
    return null
  }

  const pages = []
  const maxVisible = 5

  let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-sm">
        {t('pagination.showing', {
          start: (page - 1) * pagination.pageSize + 1,
          end: Math.min(page * pagination.pageSize, total),
          total,
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
        >
          {t('pagination.previous')}
        </Button>

        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToPage(1)}>
              1
            </Button>
            {startPage > 2 && (
              <span className="text-muted-foreground">...</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => goToPage(p)}
          >
            {p}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-muted-foreground">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
        >
          {t('pagination.next')}
        </Button>
      </div>
    </div>
  )
}
