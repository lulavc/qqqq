import { sanitizeObject } from '@/utils/encodingUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Configurar fetch com suporte UTF-8 adequado
const utf8Fetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  
  // Garantir headers UTF-8
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  
  if (!headers.has('Accept-Charset')) {
    headers.set('Accept-Charset', 'utf-8');
  }
  
  const modifiedOptions: RequestInit = {
    ...options,
    headers
  };
  
  // Sanitizar body se for JSON
  if (modifiedOptions.body && typeof modifiedOptions.body === 'string') {
    try {
      const parsed = JSON.parse(modifiedOptions.body);
      const sanitized = sanitizeObject(parsed);
      modifiedOptions.body = JSON.stringify(sanitized);
    } catch (e) {
      // Se não for JSON válido, manter original
    }
  }
  
  const response = await fetch(url, modifiedOptions);
  
  // Interceptar métodos de resposta para sanitizar dados
  const originalJson = response.json;
  response.json = async function() {
    const data = await originalJson.call(this);
    return sanitizeObject(data);
  };
  
  return response;
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PostData {
  title: string;
  content: string;
  published?: boolean;
}

export const api = {
  // Contact form
  submitContact: async (data: ContactFormData): Promise<ApiResponse<any>> => {
    try {
      const response = await utf8Fetch(`${API_URL}/contact`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      };
    }
  },

  // Auth
  login: async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login');
      }

      localStorage.setItem('token', result.data.token);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login',
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter usuário');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter usuário',
      };
    }
  },

  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter estatísticas');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter estatísticas',
      };
    }
  },

  getMessages: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter mensagens');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter mensagens',
      };
    }
  },

  updateMessage: async (id: string, data: { read: boolean }): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar mensagem');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar mensagem',
      };
    }
  },

  deleteMessage: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir mensagem');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir mensagem',
      };
    }
  },

  // Blog
  getPosts: async (): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/blog`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter posts');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter posts',
      };
    }
  },

  getPost: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/blog/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter post');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter post',
      };
    }
  },

  createPost: async (data: PostData): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar post');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar post',
      };
    }
  },

  updatePost: async (id: string, data: PostData): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/blog/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar post');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar post',
      };
    }
  },

  deletePost: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/admin/blog/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir post');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir post',
      };
    }
  },

  getPublishedPosts: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/blog/published`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter posts');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter posts',
      };
    }
  },

  getPostBySlug: async (slug: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/blog/${slug}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter post');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter post',
      };
    }
  },
}; 