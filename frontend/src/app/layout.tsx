import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Luiz Henrique Valois Cireno | Consultoria em IA',
  description: 'Consultoria especializada em inteligência artificial e tecnologia para transformar sua empresa.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress hydration warnings and other common errors
            if (typeof window !== 'undefined') {
              window.addEventListener('error', (event) => {
                // Handle hydration warnings from browser extensions
                if (event.message && (
                    (event.message.includes('Extra attributes from the server') && event.message.includes('bbai-tooltip-injected')) ||
                    event.message.includes('Cannot read properties of undefined (reading \\'includes\\')')
                  )) {
                  event.preventDefault();
                  return true;
                }
              }, true);
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}