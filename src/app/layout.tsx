import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://md-image-split.vercel.app'),
  title: 'MD Image Localizer - Convert External Images to Local',
  description: 'A frontend tool for downloading external images in Markdown files and converting links to local paths',
  keywords: 'markdown, image, download, converter, local, frontend, tool, md, image-localizer',
  openGraph: {
    title: 'MD Image Localizer',
    description: 'Convert external Markdown images to local files',
    url: 'https://md-image-split.vercel.app/',
    siteName: 'MD Image Localizer',
    locale: 'en_US',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 