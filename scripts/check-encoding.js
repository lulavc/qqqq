#!/usr/bin/env node

/**
 * Script para verificar problemas de encoding em arquivos do projeto
 * Execução: node scripts/check-encoding.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CHECK_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.md', '.json'];
const CHECK_DIRECTORIES = [
  'frontend/src',
  'backend/src',
  'blog-posts',
  'frontend/public/blog-posts'
];

// Padrões problemáticos
const PROBLEMATIC_PATTERNS = [
  /[��]/g,                    // Caracteres replacement
  /\u00ef\u00bf\u00bd/g,      // UTF-8 BOM em encoding errado
  /Ã[¡-ÿ]/g,                 // Encoding duplo comum
  /Â[€-￿]/g,                 // Outro padrão de encoding duplo
];

// Estatísticas
let stats = {
  filesChecked: 0,
  filesWithIssues: 0,
  issuesFound: 0,
  fixableIssues: 0
};

// Função principal
function checkEncoding() {
  console.log('🔍 Verificando problemas de encoding no projeto...\n');
  
  for (const dir of CHECK_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Verificando diretório: ${dir}`);
      checkDirectory(fullPath, dir);
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}`);
    }
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('='.repeat(50));
  console.log(`Arquivos verificados: ${stats.filesChecked}`);
  console.log(`Arquivos com problemas: ${stats.filesWithIssues}`);
  console.log(`Total de problemas encontrados: ${stats.issuesFound}`);
  console.log(`Problemas corrigíveis: ${stats.fixableIssues}`);
  
  if (stats.filesWithIssues > 0) {
    console.log('\n🛠️  Para corrigir os problemas encontrados, execute:');
    console.log('node scripts/fix-encoding.js');
    process.exit(1);
  } else {
    console.log('\n✅ Nenhum problema de encoding encontrado!');
    process.exit(0);
  }
}

function checkDirectory(dirPath, relativePath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const relativeItemPath = path.join(relativePath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Pular node_modules e .git
      if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
        checkDirectory(itemPath, relativeItemPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (CHECK_EXTENSIONS.includes(ext)) {
        checkFile(itemPath, relativeItemPath);
      }
    }
  }
}

function checkFile(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.filesChecked++;
    
    const issues = [];
    
    // Verificar padrões problemáticos
    for (let i = 0; i < PROBLEMATIC_PATTERNS.length; i++) {
      const pattern = PROBLEMATIC_PATTERNS[i];
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: 'encoding',
          pattern: pattern.toString(),
          count: matches.length,
          samples: matches.slice(0, 3) // Primeiras 3 ocorrências
        });
      }
    }
    
    // Verificar BOM UTF-8
    if (content.charCodeAt(0) === 0xFEFF) {
      issues.push({
        type: 'bom',
        message: 'Arquivo contém BOM UTF-8 desnecessário'
      });
    }
    
    // Verificar caracteres de controle inválidos
    const controlChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
    if (controlChars) {
      issues.push({
        type: 'control',
        count: controlChars.length,
        message: 'Caracteres de controle inválidos encontrados'
      });
    }
    
    // Verificar se é arquivo de texto válido UTF-8
    try {
      const buffer = Buffer.from(content, 'utf8');
      const decoded = buffer.toString('utf8');
      if (decoded !== content) {
        issues.push({
          type: 'utf8',
          message: 'Arquivo não está em UTF-8 válido'
        });
      }
    } catch (e) {
      issues.push({
        type: 'utf8',
        message: 'Erro ao validar UTF-8: ' + e.message
      });
    }
    
    if (issues.length > 0) {
      stats.filesWithIssues++;
      stats.issuesFound += issues.length;
      
      console.log(`\n❌ ${relativePath}`);
      for (const issue of issues) {
        console.log(`   ${formatIssue(issue)}`);
        if (issue.type !== 'utf8') {
          stats.fixableIssues++;
        }
      }
    }
    
  } catch (error) {
    console.log(`\n⚠️  Erro ao ler arquivo ${relativePath}: ${error.message}`);
  }
}

function formatIssue(issue) {
  switch (issue.type) {
    case 'encoding':
      return `Encoding problemático: ${issue.count} ocorrências (${issue.samples.join(', ')})`;
    case 'bom':
      return issue.message;
    case 'control':
      return `${issue.count} caracteres de controle inválidos`;
    case 'utf8':
      return issue.message;
    default:
      return JSON.stringify(issue);
  }
}

// Executar verificação se script for chamado diretamente
if (require.main === module) {
  checkEncoding();
}

module.exports = { checkEncoding };