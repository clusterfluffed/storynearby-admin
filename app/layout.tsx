import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'History Nearby',
  description: 'Help historical organizations share local history with their communities',
}

export default function RootLayout({
  children,
}: {
  children: React.node
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
