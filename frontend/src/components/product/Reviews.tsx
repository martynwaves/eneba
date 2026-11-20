import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useReviews } from '../../api/queries'
import { ApiError, api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { ReviewAspect } from '../../lib/types'
import { useAuth } from '../../stores/auth'
import { toast } from '../../stores/toast'
import { Button } from '../ui/Button'
import { Pagination } from '../ui/Pagination'
import { Stars } from '../ui/Stars'

const ASPECTS: { key: ReviewAspect; label: string }[] = [
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'story', label: 'Story' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'soundtrack', label: 'Soundtrack' },
]

export function Reviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1)
  const [writing, setWriting] = useState(false)
  const { data } = useReviews(slug, page)
  const signedIn = useAuth((s) => s.token !== null)
  const location = useLocation()
  const navigate = useNavigate()
  const summary = data?.summary

  const reviewNow = () => {
    if (!signedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + '#reviews')}`)
      return
    }
    setWriting(true)
  }

  return (
    <section id="reviews" aria-label="Reviews" className="scroll-mt-4">
      <h2 className="text-[21px] font-extrabold">Reviews: {summary?.count ?? 0}</h2>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
        <dl className="flex flex-wrap gap-x-7 gap-y-4">
          {ASPECTS.map((a) => (
            <div key={a.key}>
              <dt className="text-[15px] text-white/80">{a.label}</dt>
              <dd className="mt-1.5">
                <Stars value={summary?.aspects[a.key] ?? 0} className="size-[19px]" />
              </dd>
            </div>
          ))}
        </dl>
        {!writing && (
          <Button variant="outline" onClick={reviewNow}>
            Review now
          </Button>
        )}
      </div>

      {writing && <ReviewForm slug={slug} onDone={() => setWriting(false)} />}

      {data && data.data.length > 0 && (
        <>
          <ul className="mt-6 divide-y divide-white/10 bg-black/25">
            {data.data.map((r) => (
              <li key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} className="size-4" />
                  <span className="text-sm font-extrabold">{r.author_name}</span>
                  <span className="text-xs text-white/60">{formatDate(r.created_at)}</span>
                  {r.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-green">
                      <BadgeCheck className="size-3.5" /> Verified purchase
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-soft">{r.body}</p>
              </li>
            ))}
          </ul>
          <Pagination current={data.meta.current_page} last={data.meta.last_page} onChange={setPage} />
        </>
      )}
    </section>
  )
}

function StarPicker({ label, value, onChange, optional = false }: { label: string; value: number; onChange: (v: number) => void; optional?: boolean }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-extrabold">
        {label} {optional && <span className="font-semibold text-white/50">(optional)</span>}
      </legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(optional && value === r ? 0 : r)}
            aria-label={`${label}: ${r} star${r > 1 ? 's' : ''}`}
            aria-pressed={value === r}
          >
            <Stars value={value >= r ? 1 : 0} max={1} className="size-6" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [aspects, setAspects] = useState<Partial<Record<ReviewAspect, number>>>({})
  const [body, setBody] = useState('')
  const qc = useQueryClient()

  const submit = useMutation({
    mutationFn: () => {
      const scored = Object.fromEntries(Object.entries(aspects).filter(([, v]) => v && v > 0))
      return api(`/products/${slug}/reviews`, { method: 'POST', body: { rating, body, aspects: Object.keys(scored).length ? scored : null } })
    },
    onSuccess: () => {
      toast.success('Thanks for your review!')
      onDone()
      qc.invalidateQueries({ queryKey: ['reviews', slug] })
      qc.invalidateQueries({ queryKey: ['product', slug] })
    },
  })

  const error = submit.error instanceof ApiError ? submit.error : null

  return (
    <form
      className="mt-5 space-y-4 bg-black/25 p-5 md:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        submit.mutate()
      }}
    >
      <StarPicker label="Overall" value={rating} onChange={setRating} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ASPECTS.map((a) => (
          <StarPicker key={a.key} label={a.label} optional value={aspects[a.key] ?? 0} onChange={(v) => setAspects((s) => ({ ...s, [a.key]: v }))} />
        ))}
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold">Your review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          required
          className="w-full bg-black/25 p-3 text-sm text-white placeholder:text-white/50 focus:outline-2 focus:outline-cta"
          placeholder="What did you like or dislike?"
        />
      </label>
      {error && <p className="text-sm text-danger">{error.field('body') ?? error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" loading={submit.isPending}>
          Submit review
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
