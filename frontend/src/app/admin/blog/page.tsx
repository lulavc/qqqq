import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import Notification from '@/components/ui/Notification'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await api.getPosts()
      if (response.success && response.data) {
        setPosts(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao carregar posts'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) {
      return
    }

    try {
      const response = await api.deletePost(id)
      if (response.success) {
        setPosts(posts.filter(post => post.id !== id))
        setNotification({
          type: 'success',
          message: 'Post excluído com sucesso'
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao excluir post'
      })
    }
  }

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      const response = await api.updatePost(id, { published: !published })
      if (response.success) {
        setPosts(posts.map(post =>
          post.id === id ? { ...post, published: !published } : post
        ))
        setNotification({
          type: 'success',
          message: `Post ${!published ? 'publicado' : 'despublicado'} com sucesso`
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao alterar status do post'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Blog</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie os posts do blog
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/blog/new')}
            className="btn-primary"
          >
            Novo Post
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {posts.map((post) => (
            <li key={post.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary truncate">
                    {post.title}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleTogglePublish(post.id, post.published)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.published
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {post.published ? 'Publicado' : 'Rascunho'}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {post.slug}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 