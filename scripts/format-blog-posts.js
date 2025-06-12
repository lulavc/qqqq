#!/usr/bin/env node

/**
 * Script para formatar e padronizar todos os posts do blog
 * Execução: node scripts/format-blog-posts.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const BLOG_DIRECTORIES = [
  'blog-posts',
  'frontend/public/blog-posts'
];

// Estatísticas
let stats = {
  postsProcessed: 0,
  postsFixed: 0,
  issuesFound: 0,
  issuesFixed: 0
};

// Template padrão de frontmatter
const DEFAULT_FRONTMATTER = {
  title: '',
  date: '',
  author: 'Equipe AInovar',
  category: '',
  tags: [],
  featuredImage: '',
  excerpt: '',
  readTime: '5 min',
  published: true
};

function formatBlogPosts() {
  console.log('📝 Formatando e padronizando posts do blog...\n');
  
  for (const dir of BLOG_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Processando diretório: ${dir}`);
      formatDirectory(fullPath, dir);
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}`);
    }
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE FORMATAÇÃO:');
  console.log('='.repeat(50));
  console.log(`Posts processados: ${stats.postsProcessed}`);
  console.log(`Posts corrigidos: ${stats.postsFixed}`);
  console.log(`Problemas encontrados: ${stats.issuesFound}`);
  console.log(`Problemas corrigidos: ${stats.issuesFixed}`);
  
  if (stats.postsFixed > 0) {
    console.log('\n✅ Formatação concluída com sucesso!');
  } else {
    console.log('\n✅ Todos os posts já estavam formatados corretamente!');
  }
}

function formatDirectory(dirPath, relativePath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile() && item.endsWith('.md')) {
      formatPost(itemPath, path.join(relativePath, item));
    }
  }
}

function formatPost(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.postsProcessed++;
    
    const issues = [];
    let formattedContent = content;
    
    // 1. Verificar e corrigir frontmatter
    const frontmatterResult = validateAndFixFrontmatter(content);
    if (frontmatterResult.fixed) {
      formattedContent = frontmatterResult.content;
      issues.push('Frontmatter corrigido');
    }
    
    // 2. Padronizar headers
    const headersResult = fixHeaders(formattedContent);
    if (headersResult.fixed) {
      formattedContent = headersResult.content;
      issues.push('Headers padronizados');
    }
    
    // 3. Corrigir espaçamento
    const spacingResult = fixSpacing(formattedContent);
    if (spacingResult.fixed) {
      formattedContent = spacingResult.content;
      issues.push('Espaçamento corrigido');
    }
    
    // 4. Corrigir listas
    const listsResult = fixLists(formattedContent);
    if (listsResult.fixed) {
      formattedContent = listsResult.content;
      issues.push('Listas formatadas');
    }
    
    // 5. Corrigir links
    const linksResult = fixLinks(formattedContent);
    if (linksResult.fixed) {
      formattedContent = linksResult.content;
      issues.push('Links corrigidos');
    }
    
    // 6. Adicionar quebras de linha adequadas
    const lineBreaksResult = fixLineBreaks(formattedContent);
    if (lineBreaksResult.fixed) {
      formattedContent = lineBreaksResult.content;
      issues.push('Quebras de linha ajustadas');
    }
    
    // 7. Validar e corrigir encoding
    const encodingResult = fixEncoding(formattedContent);
    if (encodingResult.fixed) {
      formattedContent = encodingResult.content;
      issues.push('Encoding corrigido');
    }
    
    // Se houve correções, salvar arquivo
    if (issues.length > 0) {
      fs.writeFileSync(filePath, formattedContent, 'utf8');
      stats.postsFixed++;
      stats.issuesFound += issues.length;
      stats.issuesFixed += issues.length;
      
      console.log(`✅ ${relativePath}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.log(`❌ Erro ao processar ${relativePath}: ${error.message}`);
  }
}

function validateAndFixFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    // Adicionar frontmatter se não existir
    const title = extractTitleFromContent(content);
    const frontmatter = createFrontmatter({ title });
    return {
      fixed: true,
      content: `---\n${frontmatter}\n---\n\n${content}`
    };
  }
  
  let fixed = false;
  let frontmatterLines = match[1].split('\n');
  let frontmatterObj = {};
  
  // Parse frontmatter existente
  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove aspas desnecessárias
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Se falhar, tratar como string
        }
      }
      
      frontmatterObj[key] = value;
    }
  });
  
  // Validar campos obrigatórios
  const requiredFields = ['title', 'date', 'author', 'category'];
  requiredFields.forEach(field => {
    if (!frontmatterObj[field]) {
      frontmatterObj[field] = DEFAULT_FRONTMATTER[field] || '';
      fixed = true;
    }
  });
  
  // Garantir que tags é um array
  if (!Array.isArray(frontmatterObj.tags)) {
    if (typeof frontmatterObj.tags === 'string') {
      frontmatterObj.tags = frontmatterObj.tags.split(',').map(tag => tag.trim());
    } else {
      frontmatterObj.tags = [];
    }
    fixed = true;
  }
  
  // Validar data
  if (frontmatterObj.date && !isValidDate(frontmatterObj.date)) {
    frontmatterObj.date = new Date().toISOString().split('T')[0];
    fixed = true;
  }
  
  // Gerar excerpt se não existir
  if (!frontmatterObj.excerpt) {
    frontmatterObj.excerpt = generateExcerpt(content);
    fixed = true;
  }
  
  if (fixed) {
    const newFrontmatter = createFrontmatter(frontmatterObj);
    const newContent = content.replace(frontmatterRegex, `---\n${newFrontmatter}\n---`);
    return { fixed: true, content: newContent };
  }
  
  return { fixed: false, content };
}

function createFrontmatter(obj) {
  const lines = [];
  
  // Ordem específica dos campos
  const fieldOrder = ['title', 'date', 'author', 'category', 'tags', 'featuredImage', 'excerpt', 'readTime', 'published'];
  
  fieldOrder.forEach(field => {
    if (obj[field] !== undefined && obj[field] !== '') {
      if (Array.isArray(obj[field])) {
        lines.push(`${field}: ${JSON.stringify(obj[field])}`);
      } else if (typeof obj[field] === 'string' && obj[field].includes(':')) {
        lines.push(`${field}: "${obj[field]}"`);
      } else {
        lines.push(`${field}: ${obj[field]}`);
      }
    }
  });
  
  return lines.join('\n');
}

function fixHeaders(content) {
  let fixed = false;
  let result = content;
  
  // Garantir espaço depois do #
  result = result.replace(/^(#{1,6})([^\s#])/gm, (match, hashes, text) => {
    fixed = true;
    return `${hashes} ${text}`;
  });
  
  // Garantir linha vazia antes de headers (exceto H1 principal)
  result = result.replace(/\n([^#\n].*)\n(#{2,6} )/g, (match, prevLine, header) => {
    if (!prevLine.trim()) return match;
    fixed = true;
    return `\n${prevLine}\n\n${header}`;
  });
  
  return { fixed, content: result };
}

function fixSpacing(content) {
  let fixed = false;
  let result = content;
  
  // Remover espaços extras no final das linhas
  const beforeSpaces = result;
  result = result.replace(/[ \t]+$/gm, '');
  if (result !== beforeSpaces) fixed = true;
  
  // Corrigir múltiplas linhas vazias
  const beforeLines = result;
  result = result.replace(/\n{3,}/g, '\n\n');
  if (result !== beforeLines) fixed = true;
  
  // Garantir linha vazia após frontmatter
  result = result.replace(/(---\n)/g, '$1\n');
  
  return { fixed, content: result };
}

function fixLists(content) {
  let fixed = false;
  let result = content;
  
  // Padronizar marcadores de lista
  result = result.replace(/^[\t ]*[*+-][\t ]/gm, (match) => {
    const indentMatch = match.match(/^([\t ]*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    fixed = true;
    return `${indent}- `;
  });
  
  // Garantir espaço após números em listas numeradas
  result = result.replace(/^(\s*)(\d+)\.([^\s])/gm, (match, indent, num, text) => {
    fixed = true;
    return `${indent}${num}. ${text}`;
  });
  
  return { fixed, content: result };
}

function fixLinks(content) {
  let fixed = false;
  let result = content;
  
  // Corrigir links quebrados ou malformados
  result = result.replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, (match, text, url) => {
    if (text.trim() && url.trim()) {
      return `[${text.trim()}](${url.trim()})`;
    }
    return match;
  });
  
  // Corrigir links para contato
  result = result.replace(/\[([^\]]*contato[^\]]*)\]\(([^)]*)\)/gi, (match, text, url) => {
    fixed = true;
    return `[${text}](/contact)`;
  });
  
  return { fixed, content: result };
}

function fixLineBreaks(content) {
  let fixed = false;
  let result = content;
  
  // Garantir linha vazia antes de seções importantes
  const sectionsRegex = /\n(## [^#])/g;
  result = result.replace(sectionsRegex, '\n\n$1');
  
  // Garantir linha vazia após parágrafos antes de listas
  result = result.replace(/([^.\n])\n([-*+] )/g, '$1\n\n$2');
  
  return { fixed, content: result };
}

function fixEncoding(content) {
  let fixed = false;
  let result = content;
  
  // Corrigir encoding comum
  const encodingFixes = {
    'proóprio': 'próprio',
    'memoória': 'memória',
    'hieraórquica': 'hierárquica',
    'evoluíram': 'evoluíram'
  };
  
  for (const [wrong, correct] of Object.entries(encodingFixes)) {
    if (result.includes(wrong)) {
      result = result.replace(new RegExp(wrong, 'g'), correct);
      fixed = true;
    }
  }
  
  return { fixed, content: result };
}

// Funções auxiliares
function extractTitleFromContent(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : 'Título do Post';
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function generateExcerpt(content) {
  // Remove frontmatter e headers
  let text = content.replace(/^---[\s\S]*?---/, '');
  text = text.replace(/^#{1,6}\s+.+$/gm, '');
  text = text.replace(/[*_`]/g, '');
  text = text.trim();
  
  // Pega primeiras 2 sentenças ou 150 caracteres
  const sentences = text.split(/[.!?]+/);
  let excerpt = sentences.slice(0, 2).join('. ');
  
  if (excerpt.length > 150) {
    excerpt = excerpt.substring(0, 147) + '...';
  } else if (excerpt.length < 50 && sentences[2]) {
    excerpt += '. ' + sentences[2];
  }
  
  return excerpt.trim();
}

// Executar formatação se script for chamado diretamente
if (require.main === module) {
  formatBlogPosts();
}

module.exports = { formatBlogPosts };