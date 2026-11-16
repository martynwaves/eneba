import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { useWishlist } from '../api/queries'
import { AccountNav } from '../components/orders/AccountNav'
import { ProductGrid } from '../components/product/ProductRow'
import { ButtonLink } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../stores/auth'

export function WishlistPage() {
  useDocumentTitle('Wishlist')
  const signedIn = useAuth((s) => s.token !== null)
  const { data, isLoading } = useWishlist()
  const empty = !isLoading && (data?.ids.length ?? 0) === 0

  return (
    <div className="page-container pt-6 md:pt-8">
      {signedIn && <AccountNav />}
      <h1 className="mt-6 mb-2 text-2xl font-bold md:text-[30px]">Wishlist</h1>
      {!signedIn && !empty && (
        <p className="mb-6 text-sm text-soft">
          Saved on this device.{' '}
          <Link to="/login?redirect=%2Fwishlist" className="font-extrabold text-cta hover:underline">
            Log in
          </Link>{' '}
          to keep your wishlist in your account and get personalised recommendations.
        </p>
      )}
      <div className="mt-6">
        {empty ? (
          <div className="flex flex-col items-center bg-brand-deep/60 px-6 py-14 text-center">
            <Heart className="size-12 text-white/30" strokeWidth={1.2} />
            <p className="mt-3 text-lg font-extrabold">Your wishlist is empty</p>
            <p className="mt-1 text-sm text-muted">Tap the heart on any product to save it here.</p>
            <ButtonLink to="/store" className="mt-5">
              Browse the store
            </ButtonLink>
          </div>
        ) : (
          <ProductGrid products={data?.data} loading={isLoading || !data?.data} count={Math.min(data?.ids.length ?? 5, 10)} />
        )}
      </div>
    </div>
  )
}
