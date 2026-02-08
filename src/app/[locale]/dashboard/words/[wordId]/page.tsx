import { getTranslations } from 'next-intl/server'

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ locale: string; wordId: string }>
}) {
  const t = await getTranslations('wordDetail')
  const { wordId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {t('wordId', { wordId })}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400">
          {t('comingSoon')}
        </p>
      </div>
    </div>
  )
}
