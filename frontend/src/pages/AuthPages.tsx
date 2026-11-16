import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { Eye, EyeOff, Info } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { siApple, siDiscord, siFacebook, siSteam, siTwitch, siX } from 'simple-icons'
import { z } from 'zod'
import { Spinner } from '../components/ui/Spinner'
import { useAuthActions } from '../hooks/useAuthActions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ApiError } from '../lib/api'
import { useAuth } from '../stores/auth'
import { toast } from '../stores/toast'

/** Only allow same-site redirects after sign-in. */
function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

const REASONS: Record<string, string> = {
  auth: 'Please log in to continue.',
  checkout: 'Log in or create an account to complete your purchase. Your cart is kept.',
}

const ENEBA = 'https://www.eneba.com'

/* ------------------------------------------------------------------ building blocks */

function Card({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  const [params] = useSearchParams()
  const reason = REASONS[params.get('reason') ?? '']
  return (
    <div className="bg-[#4b1bb8] px-8 pt-8 pb-7">
      <h1 className="text-[22px] leading-tight font-extrabold tracking-wide">{title}</h1>
      <p className="mt-1 text-[13px] font-extrabold text-soft">{subtitle}</p>
      {reason && (
        <p className="mt-4 flex items-start gap-2 bg-black/20 px-3 py-2.5 text-[13px]">
          <Info className="mt-0.5 size-4 shrink-0 text-cta" /> {reason}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  )
}

const notConnected = (provider: string) => () => toast.info(`Signing in with ${provider} isn't connected in this demo. Please use your email instead.`)

function GoogleLogo({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  )
}

function SimpleIcon({ path, className = 'size-5' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const PROVIDERS = {
  google: { label: 'Google', className: 'bg-white text-black hover:bg-white/90', icon: <GoogleLogo /> },
  facebook: { label: 'Facebook', className: 'bg-[#4b6bf6] text-white hover:bg-[#5d7af7]', icon: <SimpleIcon path={siFacebook.path} /> },
  apple: { label: 'Apple', className: 'bg-black text-white hover:bg-black/80', icon: <SimpleIcon path={siApple.path} /> },
}

/** Full-width "Continue with …" buttons (login card). */
function ProviderButtons() {
  return (
    <div className="space-y-3">
      {(Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).map((key) => {
        const p = PROVIDERS[key]
        return (
          <button key={key} type="button" onClick={notConnected(p.label)} className={clsx('relative flex h-[34px] w-full items-center justify-center text-[13px] font-extrabold transition-colors', p.className)}>
            <span className="absolute left-4">{p.icon}</span>
            Continue with {p.label}
          </button>
        )
      })}
    </div>
  )
}

/** Compact Google / Facebook / Apple row (register card). */
function ProviderRow() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {(Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).map((key) => {
        const p = PROVIDERS[key]
        return (
          <button key={key} type="button" onClick={notConnected(p.label)} className={clsx('flex h-[30px] items-center justify-center gap-1.5 text-[13px] font-extrabold transition-colors', p.className)}>
            <span className="[&>svg]:size-3.5">{p.icon}</span>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

/** Steam, Discord, Twitch and X in one bordered strip. */
function GamingProviders() {
  const items = [
    { label: 'Steam', path: siSteam.path },
    { label: 'Discord', path: siDiscord.path },
    { label: 'Twitch', path: siTwitch.path },
    { label: 'X', path: siX.path },
  ]
  return (
    <div className="mt-3 grid h-[34px] grid-cols-4 border border-white/25">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={notConnected(item.label)} aria-label={`Continue with ${item.label}`} className="grid place-items-center transition-colors hover:bg-white/10">
          <SimpleIcon path={item.path} className="size-5" />
        </button>
      ))}
    </div>
  )
}

function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-2 text-[11px] text-white/40">
      <span className="h-px flex-1 bg-white/20" />
      or
      <span className="h-px flex-1 bg-white/20" />
    </div>
  )
}

const AuthInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(function AuthInput(
  { label, error, type = 'text', ...rest },
  ref,
) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && visible ? 'text' : type}
          placeholder={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={clsx(
            'h-[46px] w-full border bg-black/20 px-4 text-sm text-white placeholder:text-soft focus:outline-none',
            error ? 'border-danger' : 'border-transparent focus:border-white/40',
            isPassword && 'pr-11',
          )}
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/60 hover:text-white">
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={loading} className="flex h-[30px] w-full items-center justify-center gap-2 bg-cta text-[15px] font-extrabold text-black transition-colors hover:bg-cta-hover disabled:opacity-60">
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ pages */

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  useDocumentTitle('Log in')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signedIn = useAuth((s) => s.token !== null)
  const { login } = useAuthActions()
  const redirect = safeRedirect(params.get('redirect'))
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (signedIn && !login.isSuccess) return <Navigate to={redirect} replace />

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome back, ${user.name}!`)
        navigate(redirect, { replace: true })
      },
      onError: (e) => {
        if (e instanceof ApiError && e.field('email')) form.setError('email', { message: e.field('email') })
        else toast.error(e.message)
      },
    }),
  )

  const keep = params.toString() ? `?${params.toString()}` : ''
  const errors = form.formState.errors

  return (
    <Card
      title="Log in"
      subtitle={
        <>
          New user?{' '}
          <Link to={`/register${keep}`} className="text-cta hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <ProviderButtons />
      <GamingProviders />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <AuthInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register('email')} />
        <AuthInput label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...form.register('password')} />
        <div className="pt-3">
          <SubmitButton loading={login.isPending}>Log in</SubmitButton>
        </div>
      </form>
      <p className="mt-2.5 text-[13px] leading-5">
        Demo account: <span className="font-extrabold">demo@eneba.test</span> / <span className="font-extrabold">demo12345</span>
      </p>
    </Card>
  )
}

const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
  newsletter: z.boolean(),
})
type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  useDocumentTitle('Create account')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signedIn = useAuth((s) => s.token !== null)
  const { register } = useAuthActions()
  const redirect = safeRedirect(params.get('redirect'))
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { email: '', password: '', newsletter: false } })

  if (signedIn && !register.isSuccess) return <Navigate to={redirect} replace />

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome to Eneba, ${user.name}!`)
        navigate(redirect, { replace: true })
      },
      onError: (e) => {
        if (e instanceof ApiError) {
          for (const field of ['email', 'password'] as const) {
            const message = e.field(field)
            if (message) form.setError(field, { message })
          }
          if (!Object.keys(e.errors).length) toast.error(e.message)
        }
      },
    }),
  )

  const keep = params.toString() ? `?${params.toString()}` : ''
  const errors = form.formState.errors

  return (
    <Card
      title="Create account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to={`/login${keep}`} className="text-cta hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-3">
          <AuthInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register('email')} />
          <AuthInput label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...form.register('password')} />
        </div>
        <p className="mt-3 text-[13px] leading-5">Use at least 8 characters with letters and numbers.</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] leading-4">
          <input type="checkbox" className="peer sr-only" {...form.register('newsletter')} />
          <span className="mt-px grid size-[18px] shrink-0 place-items-center bg-black/25 peer-checked:bg-cta peer-focus-visible:outline-2 peer-focus-visible:outline-cta [&>svg]:hidden peer-checked:[&>svg]:block">
            <svg viewBox="0 0 24 24" className="size-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          I want to receive custom personalized offers for the very best game deals
        </label>
        <div className="mt-4">
          <SubmitButton loading={register.isPending}>Continue with email</SubmitButton>
        </div>
      </form>
      <OrDivider />
      <ProviderRow />
      <GamingProviders />
      <p className="mt-6 text-[13px] leading-5 font-extrabold">
        By creating account I confirm I am at least 16 and agree to Eneba{' '}
        <a href={`${ENEBA}/terms-and-conditions`} target="_blank" rel="noreferrer" className="font-semibold text-[#8fa6ff] hover:underline">
          Terms and Conditions
        </a>{' '}
        and{' '}
        <a href={`${ENEBA}/privacy-policy`} target="_blank" rel="noreferrer" className="font-semibold text-[#8fa6ff] hover:underline">
          Privacy Notice.
        </a>
      </p>
    </Card>
  )
}
