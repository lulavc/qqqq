import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, TagIcon, UserIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/utils/date'
import { getAllPosts } from '@/services/blogService'

export const revalidate = 3600 // Revalidate this page every hour

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog AInovar
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, novidades e tendências sobre Inteligência Artificial e Inovação Tecnológica
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/blog/${post.slug}`}>
                <div className={`relative h-48 flex items-center justify-center ${post.color || 'bg-blue-500'}`}>
                  <div className="text-6xl">{post.icon || '👋'}</div>
                </div>
              </Link>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags && post.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center text-sm font-medium text-primary bg-primary-50 px-2 py-1 rounded-full"
                    >
                      <TagIcon className="w-4 h-4 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}