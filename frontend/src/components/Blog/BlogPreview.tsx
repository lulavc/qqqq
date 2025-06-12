import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  coverImage: string
  date: string
  author: {
    name: string
    avatar: string
  }
  tags: string[]
}

interface BlogPreviewProps {
  posts: BlogPost[]
}

export function BlogPreview({ posts }: BlogPreviewProps) {
  // Ensure all posts have Luiz Henrique Valois Cireno as the author
  const updatedPosts = posts.map(post => ({
    ...post,
    author: {
      name: 'Luiz Henrique Valois Cireno',
      avatar: '/images/team/luiz.jpg'
    }
  }));

  return (
    <section className="bg-gray-50 py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Últimas do Blog
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fique por dentro das últimas novidades e tendências em IA e tecnologia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {updatedPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative h-48">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link href={`/blog/${post.slug}`} className="block group">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                </Link>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-600">{post.author.name}</span>
                  </div>
                  <time className="text-sm text-gray-500">
                    {format(new Date(post.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="btn btn-outline"
          >
            Ver todos os posts
          </Link>
        </div>
      </div>
    </section>
  )
}