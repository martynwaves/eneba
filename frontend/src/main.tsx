import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { ApiError } from './lib/api'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry 4xx. Do retry network errors and 5xx for about 40 seconds (3, 6, then 10s
      // apart): a sleeping free-tier API takes 30-50 seconds to wake up.
      retry: (count, error) => (error instanceof ApiError && error.status >= 400 && error.status < 500 ? false : count < 5),
      retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 10_000),
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
