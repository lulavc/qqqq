import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import Notification from '@/components/ui/Notification'

interface Post {
  id: string
  title: string
  content: string
  published: boolean
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await api.getPost(params.id)
      if (response.success && response.data) {
        setPost(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao carregar post'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!post) return

    setIsSaving(true)

    try {
      const response = await api.updatePost(params.id, {
        title: post.title,
        content: post.content,
        published: post.published,
      })

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Post atualizado com sucesso'
        })
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao atualizar post'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setPost(prev => ({
      ...prev!,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Post não encontrado</h2>
        <p className="mt-1 text-sm text-gray-500">
          O post que você está procurando não existe ou foi removido.
        </p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Editar Post</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atualize o conteúdo do post
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={post.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Conteúdo
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            value={post.content}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            name="published"
            checked={post.published}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
            Publicar
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
} 