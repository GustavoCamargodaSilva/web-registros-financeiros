import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

export function withQueryClient(ui: ReactElement, client = createTestQueryClient()) {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>
}
