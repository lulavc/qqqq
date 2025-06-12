#!/usr/bin/env node

/**
 * Script para corrigir automaticamente problemas de encoding
 * Execução: node scripts/fix-encoding.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const FIX_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.md', '.json'];
const FIX_DIRECTORIES = [
  'frontend/src',
  'backend/src', 
  'blog-posts',
  'frontend/public/blog-posts'
];

// Mapeamento de correções comuns
const ENCODING_FIXES = {
  'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
  'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô', 'Ã£': 'ã',
  'Ãµ': 'õ', 'Ã§': 'ç', 'Ã¼': 'ü', 'Ã¤': 'ä', 'Ã¶': 'ö',
  'Ã±': 'ñ',
  // Maiúsculas
  'Ã': 'Á', 'Ã‰': 'É', 'ÃŒ': 'Í', 'Ã"': 'Ó', 'Ãš': 'Ú',
  'Ã€': 'À', 'Ã‚': 'Â', 'ÃŠ': 'Ê', 'Ã"': 'Ô', 'Ãƒ': 'Ã',
  'Ã•': 'Õ', 'Ã‡': 'Ç',
  // Outros caracteres problemáticos
  '�': '', // Remove replacement characters
  '': '', // Remove null bytes
};

// Estatísticas
let stats = {
  filesProcessed: 0,
  filesFixed: 0,
  totalFixes: 0,
  backupsCreated: 0
};

function fixEncoding() {
  console.log('🔧 Corrigindo problemas de encoding no projeto...\n');
  
  // Criar diretório de backup
  const backupDir = path.join(process.cwd(), 'backup-encoding');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Diretório de backup criado: ${backupDir}`);
  }
  
  for (const dir of FIX_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Processando diretório: ${dir}`);
      fixDirectory(fullPath, dir, backupDir);
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}`);
    }
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE CORREÇÕES:');
  console.log('='.repeat(50));
  console.log(`Arquivos processados: ${stats.filesProcessed}`);
  console.log(`Arquivos corrigidos: ${stats.filesFixed}`);
  console.log(`Total de correções: ${stats.totalFixes}`);
  console.log(`Backups criados: ${stats.backupsCreated}`);
  
  if (stats.filesFixed > 0) {
    console.log('\n✅ Correções aplicadas com sucesso!');
    console.log(`📦 Backups salvos em: ${backupDir}`);
  } else {
    console.log('\n✅ Nenhuma correção necessária!');
  }
}

function fixDirectory(dirPath, relativePath, backupDir) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const relativeItemPath = path.join(relativePath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Pular node_modules e .git
      if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
        fixDirectory(itemPath, relativeItemPath, backupDir);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (FIX_EXTENSIONS.includes(ext)) {
        fixFile(itemPath, relativeItemPath, backupDir);
      }
    }
  }
}

function fixFile(filePath, relativePath, backupDir) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    stats.filesProcessed++;
    
    let fixedContent = originalContent;
    let fixCount = 0;
    
    // Remover BOM UTF-8 se presente
    if (fixedContent.charCodeAt(0) === 0xFEFF) {
      fixedContent = fixedContent.slice(1);
      fixCount++;
    }
    
    // Aplicar correções de encoding
    for (const [wrong, correct] of Object.entries(ENCODING_FIXES)) {
      const regex = new RegExp(escapeRegExp(wrong), 'g');
      const matches = fixedContent.match(regex);
      if (matches) {
        fixedContent = fixedContent.replace(regex, correct);
        fixCount += matches.length;
      }
    }
    
    // Remover caracteres de controle inválidos
    const beforeControl = fixedContent.length;
    fixedContent = fixedContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    const afterControl = fixedContent.length;
    if (beforeControl !== afterControl) {
      fixCount += (beforeControl - afterControl);
    }
    
    // Normalizar Unicode (NFD -> NFC)
    const normalizedContent = fixedContent.normalize('NFC');
    if (normalizedContent !== fixedContent) {
      fixedContent = normalizedContent;
      fixCount++;
    }
    
    // Se houve correções, salvar arquivo
    if (fixCount > 0) {
      // Criar backup
      const backupPath = path.join(backupDir, relativePath + '.backup');
      const backupDirPath = path.dirname(backupPath);
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      fs.writeFileSync(backupPath, originalContent, 'utf8');
      stats.backupsCreated++;
      
      // Salvar arquivo corrigido
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      
      stats.filesFixed++;
      stats.totalFixes += fixCount;
      
      console.log(`✅ ${relativePath} - ${fixCount} correções aplicadas`);
    }
    
  } catch (error) {
    console.log(`❌ Erro ao processar ${relativePath}: ${error.message}`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Executar correção se script for chamado diretamente
if (require.main === module) {
  fixEncoding();
}

module.exports = { fixEncoding };