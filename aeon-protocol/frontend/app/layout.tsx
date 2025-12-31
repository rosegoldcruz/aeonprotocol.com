import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AEON Protocol',
  description: 'Advanced media studio with intelligent AI agents for enterprises.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-black text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}

