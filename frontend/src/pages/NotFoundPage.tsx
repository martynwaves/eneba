import { ButtonLink } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="page-container flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <div className="text-[96px] leading-none font-extrabold text-cta">404</div>
      <h1 className="mt-4 text-2xl font-extrabold">This page went missing</h1>
      <p className="mt-2 max-w-md text-muted">The product may have sold out for good or the link is broken. Try searching for it instead.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink to="/" size="lg">
          Go to homepage
        </ButtonLink>
        <ButtonLink to="/store" variant="outline" size="lg">
          Browse store
        </ButtonLink>
      </div>
    </div>
  )
}
