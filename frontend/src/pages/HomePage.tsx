import { useHomepageLayout } from '../api/queries'
import { HomepageBlocks } from '../components/home/BlockRenderer'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function HomePage() {
  useDocumentTitle(undefined)
  const { data: blocks, isLoading, isError, refetch, error } = useHomepageLayout()

  if (isLoading) return <PageSpinner label="Loading the best deals…" />

  if (isError) {
    return (
      <div className="page-container flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-extrabold">We couldn't load the store</h1>
        <p className="max-w-md text-muted">{error.message}</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="sr-only">Eneba – buy games, gift cards and top-ups cheaper</h1>
      <HomepageBlocks blocks={blocks ?? []} />
    </div>
  )
}
