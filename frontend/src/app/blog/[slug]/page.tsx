import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, TagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/utils/date'
import { getPostBySlug, getAllPostSlugs } from '@/services/blogService'
import { notFound } from 'next/navigation'

export const revalidate = 3600 // Revalidate this page every hour

// Gera as rotas estáticas para todas as postagens
export async function generateStaticParams() {
  const posts = await getAllPostSlugs()
  return posts
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  
  // Se o post não for encontrado, retorna 404
  if (!post) {
    notFound()
  }

  // Configuração padrão para o autor
  const author = {
    name: post.author || 'AInovar Team',
    avatar: '/images/team/default.jpg',
    bio: 'Especialista em Inteligência Artificial e Inovação Tecnológica'
  }

  return (
    <div className="min-h-screen py-20">
      <article className="container-custom max-w-4xl">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center text-primary hover:text-primary-dark mb-8"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Voltar para o Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Image
                src={author.avatar}
                alt={author.name}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">{author.name}</p>
                <p className="text-sm text-gray-500">{author.bio}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-500">
              <CalendarIcon className="w-5 h-5 mr-1" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
          </div>

          {post.coverImage && (
            <div className="relative h-[400px] rounded-xl overflow-hidden mb-6">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center text-sm font-medium text-primary bg-primary-50 px-2 py-1 rounded-full"
              >
                <TagIcon className="w-4 h-4 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio */}
        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center">
            <Image
              src={author.avatar}
              alt={author.name}
              width={64}
              height={64}
              className="rounded-full mr-4"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Sobre {author.name}
              </h3>
              <p className="text-gray-600">
                {author.bio}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}