import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  title: {
    default: 'GraphLens AI — Network & Incident Intelligence Platform',
    template: '%s | GraphLens AI',
  },
  description: 'AI-powered network and incident intelligence. Analyze logs, CVEs, and alerts with hybrid RAG, graph intelligence, and agentic workflows.',
  keywords: ['network intelligence', 'incident analysis', 'CVE', 'SIEM', 'AI security', 'GraphRAG'],
  authors: [{ name: 'GraphLens AI' }],
  openGraph: {
    type: 'website',
    title: 'GraphLens AI',
    description: 'AI-powered network and incident intelligence platform',
    siteName: 'GraphLens AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GraphLens AI',
    description: 'AI-powered network and incident intelligence platform',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(222 40% 8%)',
              border: '1px solid hsl(222 35% 15%)',
              color: 'hsl(213 31% 91%)',
            },
          }}
        />
      </body>
    </html>
  )
}
