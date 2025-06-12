import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Caminho para os arquivos de blog
const postsDirectory = path.join(process.cwd(), 'public/blog-posts');

export interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  color?: string;
  icon?: string;
  coverImage?: string;
}

export interface Post extends PostMetadata {
  content: string;
}

// Cores e ícones para os posts
const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
const icons = ['🚀', '💡', '🔍', '🌐', '🤖', '📊', '🧠', '📱', '💻', '🔬'];

// Função para obter todos os posts
export async function getAllPosts(): Promise<PostMetadata[]> {
  try {
    // Verifica se o diretório existe
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Diretório de posts não encontrado: ${postsDirectory}`);
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    
    const allPostsData = fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map((fileName, index) => {
        try {
          // Remove a extensão .md para obter o slug
          const slug = fileName.replace(/\.md$/, '');

          // Lê o conteúdo do arquivo markdown
          const fullPath = path.join(postsDirectory, fileName);
          const fileContents = fs.readFileSync(fullPath, 'utf8');

          // Usa gray-matter para parsear a seção de metadados
          const matterResult = matter(fileContents);

          // Extrai o título do conteúdo se não estiver nos metadados
          const titleMatch = fileContents.match(/^#\s+(.+)$/m);
          const title = matterResult.data.title || (titleMatch ? titleMatch[1] : slug);

          // Extrai o resumo do conteúdo
          const excerptMatch = fileContents.match(/^(?!#)(.+)$/m);
          const excerpt = matterResult.data.excerpt || 
                       (excerptMatch ? excerptMatch[1].substring(0, 160) + '...' : '');

          // Atribui uma cor e ícone aleatórios (ou usa os definidos nos metadados)
          const color = matterResult.data.color || colors[index % colors.length];
          const icon = matterResult.data.icon || icons[index % icons.length];

          // Retorna os dados do post com metadados
          return {
            slug,
            title,
            excerpt,
            color,
            icon,
            date: matterResult.data.date || new Date().toISOString().split('T')[0],
            tags: matterResult.data.tags || ['IA', 'Tecnologia'],
            author: matterResult.data.author || 'AInovar Team',
            coverImage: matterResult.data.coverImage || '/images/blog/default.jpg'
          };
        } catch (error) {
          console.error(`Erro ao processar arquivo ${fileName}:`, error);
          return null;
        }
      })
      .filter(Boolean) as PostMetadata[];

    // Ordena os posts por data, do mais recente para o mais antigo
    return allPostsData.sort((a, b) => {
      if (a.date < b.date) {
        return 1;
      } else {
        return -1;
      }
    });
  } catch (error) {
    console.error('Erro ao obter todos os posts:', error);
    return [];
  }
}

// Função para obter um post específico pelo slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      console.warn(`Post não encontrado: ${fullPath}`);
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    
    // Converte o conteúdo markdown para HTML
    const processedContent = await remark()
      .use(html)
      .process(matterResult.content);
    const contentHtml = processedContent.toString();
    
    // Extrai o título do conteúdo se não estiver nos metadados
    const titleMatch = fileContents.match(/^#\s+(.+)$/m);
    const title = matterResult.data.title || (titleMatch ? titleMatch[1] : slug);
    
    // Extrai o resumo do conteúdo
    const excerptMatch = fileContents.match(/^(?!#)(.+)$/m);
    const excerpt = matterResult.data.excerpt || 
                   (excerptMatch ? excerptMatch[1].substring(0, 160) + '...' : '');
    
    return {
      slug,
      title,
      excerpt,
      content: contentHtml,
      date: matterResult.data.date || new Date().toISOString().split('T')[0],
      tags: matterResult.data.tags || ['IA', 'Tecnologia'],
      author: matterResult.data.author || 'AInovar Team',
      coverImage: matterResult.data.coverImage || '/images/blog/default.jpg',
      color: matterResult.data.color,
      icon: matterResult.data.icon
    };
  } catch (error) {
    console.error(`Erro ao obter post ${slug}:`, error);
    return null;
  }
}

// Função para obter todos os slugs dos posts
export async function getAllPostSlugs() {
  try {
    // Verifica se o diretório existe
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Diretório de posts não encontrado: ${postsDirectory}`);
      return [];
    }
    
    const fileNames = fs.readdirSync(postsDirectory);
    
    return fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        return {
          params: {
            slug: fileName.replace(/\.md$/, '')
          }
        };
      });
  } catch (error) {
    console.error('Erro ao obter slugs dos posts:', error);
    return [];
  }
}
