#!/usr/bin/env node

/**
 * Script para corrigir frontmatter duplicado nos posts do blog
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIRECTORIES = [
  'blog-posts',
  'frontend/public/blog-posts'
];

let stats = {
  postsProcessed: 0,
  postsFixed: 0
};

function fixDuplicateFrontmatter() {
  console.log('🔧 Corrigindo frontmatter duplicado...\n');
  
  for (const dir of BLOG_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Processando diretório: ${dir}`);
      fixDirectory(fullPath, dir);
    }
  }
  
  console.log('\n📊 RELATÓRIO DE CORREÇÃO:');
  console.log('='.repeat(40));
  console.log(`Posts processados: ${stats.postsProcessed}`);
  console.log(`Posts corrigidos: ${stats.postsFixed}`);
}

function fixDirectory(dirPath, relativePath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile() && item.endsWith('.md')) {
      fixPost(itemPath, path.join(relativePath, item));
    }
  }
}

function fixPost(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.postsProcessed++;
    
    // Verificar se há frontmatter duplicado
    const frontmatterPattern = /^---\n([\s\S]*?)\n---\n\n---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterPattern);
    
    if (match) {
      // Manter apenas o segundo frontmatter (mais completo)
      const secondFrontmatter = match[2];
      const restOfContent = content.substring(content.indexOf(match[0]) + match[0].length);
      const fixedContent = `---\n${secondFrontmatter}\n---${restOfContent}`;
      
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      stats.postsFixed++;
      console.log(`✅ ${relativePath} - Frontmatter duplicado corrigido`);
    }
    
  } catch (error) {
    console.log(`❌ Erro ao processar ${relativePath}: ${error.message}`);
  }
}

if (require.main === module) {
  fixDuplicateFrontmatter();
}