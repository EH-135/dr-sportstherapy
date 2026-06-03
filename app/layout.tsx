import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DrSportsTherapy — Body Assessment',
  description: 'Understand how your body is organising itself. Identify your movement pattern in 7 questions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#FAF8F5' }}>{children}</body>
    </html>
  )
}
