import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { MobileNav } from './MobileNav'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Chat IA', href: '/chat' },
  { name: 'Blog', href: '/blog' },
  { name: 'Projetos', href: '/projects' },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary">AI</span>
                <span className="text-2xl font-bold text-gray-900">novar</span>
                <span className="text-2xl font-bold text-primary">.tech</span>
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2',
                    pathname === item.href
                      ? 'border-primary text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex sm:hidden">
              <MobileNav />
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-50">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AInovar.tech</h3>
              <p className="text-gray-600">
                Inovação e tecnologia com Inteligência Artificial.
                Transformando ideias em soluções inteligentes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-600 hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
              <p className="text-gray-600">
                Entre em contato conosco para saber mais sobre nossos serviços
                e como podemos ajudar sua empresa.
              </p>
              <Link
                href="/contact"
                className="inline-block mt-4 text-primary hover:text-primary/80"
              >
                Entre em contato
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500">
              © {new Date().getFullYear()} AInovar.tech. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 