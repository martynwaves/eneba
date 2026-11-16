import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { AccountNav } from '../components/orders/AccountNav'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ApiError, api } from '../lib/api'
import { formatDate } from '../lib/format'
import type { User } from '../lib/types'
import { useAuth } from '../stores/auth'
import { toast } from '../stores/toast'

export function AccountPage() {
  useDocumentTitle('Account settings')
  const user = useAuth((s) => s.user)!
  const setUser = useAuth((s) => s.setUser)
  const [name, setName] = useState(user.name)
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })

  const save = useMutation({
    mutationFn: (body: Record<string, string>) => api<{ data: User }>('/auth/me', { method: 'PATCH', body }),
    onSuccess: (r) => setUser(r.data),
  })

  const error = save.error instanceof ApiError ? save.error : null

  return (
    <div className="page-container pt-6 md:pt-8">
      <AccountNav />
      <h1 className="mt-6 text-2xl font-bold md:text-[30px]">Account settings</h1>
      <p className="mt-1 text-sm text-muted">
        {user.email} · member since {formatDate(user.created_at)}
      </p>

      <div className="mt-6 grid max-w-3xl gap-5 md:grid-cols-2">
        <form
          className="space-y-4 bg-brand-panel p-6"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate({ name }, { onSuccess: () => toast.success('Profile updated') })
          }}
        >
          <h2 className="font-extrabold">Profile</h2>
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error?.field('name')} />
          <Field label="Email" value={user.email} disabled />
          <Button type="submit" loading={save.isPending && !pw.password}>
            Save
          </Button>
        </form>

        <form
          className="space-y-4 bg-brand-panel p-6"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate(pw, {
              onSuccess: () => {
                toast.success('Password changed')
                setPw({ current_password: '', password: '', password_confirmation: '' })
              },
            })
          }}
        >
          <h2 className="font-extrabold">Change password</h2>
          <Field label="Current password" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} error={error?.field('current_password')} />
          <Field label="New password" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={error?.field('password')} />
          <Field label="Repeat new password" type="password" autoComplete="new-password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
          <Button type="submit" loading={save.isPending && Boolean(pw.password)}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
