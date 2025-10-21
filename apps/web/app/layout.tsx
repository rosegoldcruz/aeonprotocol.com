import './globals.css'
import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'AEON',
  description: 'Unified AI business automation platform',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background text-foreground">
          <ErrorBoundary>
            {children}
            <Toaster theme="dark" richColors position="top-right" />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}

