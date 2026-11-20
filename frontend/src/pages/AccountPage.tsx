import { useMutation, useQueryClient } from '@tanstack/react-query'
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

const EMPTY_PASSWORDS = { current_password: '', password: '', password_confirmation: '' }

/** PATCH /auth/me; the profile and password forms each get their own instance, errors and spinner. */
function useProfileUpdate(onSaved: () => void) {
  const qc = useQueryClient()
  const setUser = useAuth((s) => s.setUser)
  return useMutation({
    mutationFn: (body: Record<string, string>) => api<{ data: User }>('/auth/me', { method: 'PATCH', body }),
    onSuccess: ({ data }) => {
      setUser(data)
      // The header's account menu reads the cached profile.
      qc.setQueryData(['me'], data)
      onSaved()
    },
    // Field errors show under their inputs; anything else (network, server) needs a toast.
    onError: (e) => {
      if (!(e instanceof ApiError) || Object.keys(e.errors).length === 0) toast.error(e.message)
    },
  })
}

export function AccountPage() {
  useDocumentTitle('Account settings')
  const user = useAuth((s) => s.user)!
  const [name, setName] = useState(user.name)
  const [pw, setPw] = useState(EMPTY_PASSWORDS)

  const profile = useProfileUpdate(() => toast.success('Profile updated'))
  const password = useProfileUpdate(() => {
    toast.success('Password changed')
    setPw(EMPTY_PASSWORDS)
  })
  const profileError = profile.error instanceof ApiError ? profile.error : null
  const passwordError = password.error instanceof ApiError ? password.error : null

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
            profile.mutate({ name })
          }}
        >
          <h2 className="font-extrabold">Profile</h2>
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={profileError?.field('name')} />
          <Field label="Email" value={user.email} disabled />
          <Button type="submit" loading={profile.isPending}>
            Save
          </Button>
        </form>

        <form
          className="space-y-4 bg-brand-panel p-6"
          onSubmit={(e) => {
            e.preventDefault()
            password.mutate(pw)
          }}
        >
          <h2 className="font-extrabold">Change password</h2>
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.current_password}
            onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
            error={passwordError?.field('current_password')}
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pw.password}
            onChange={(e) => setPw({ ...pw, password: e.target.value })}
            error={passwordError?.field('password')}
          />
          <Field
            label="Repeat new password"
            type="password"
            autoComplete="new-password"
            value={pw.password_confirmation}
            onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
          />
          <Button type="submit" loading={password.isPending}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
