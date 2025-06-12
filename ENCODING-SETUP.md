# UTF-8 Encoding Configuration Guide

## Visão Geral

Este documento descreve as configurações implementadas para garantir o suporte adequado a UTF-8 e caracteres portugueses em todo o projeto AInovar-Tech.

## Problema Resolvido

Unicode escape sequences como `u00e7` ao invés de `ç` eram frequentemente introduzidos no projeto, causando problemas de exibição dos caracteres portugueses. Esta configuração previne e corrige automaticamente esses problemas.

## Configurações Implementadas

### 1. Backend (Node.js/Express)

#### Middleware de Encoding (`/backend/src/middleware/encodingMiddleware.js`)
- **Validação automática** de UTF-8 em requisições
- **Sanitização** de strings para garantir encoding correto
- **Interceptação de respostas** para garantir UTF-8 na saída
- **Correção automática** de caracteres com problemas

#### Configuração do Servidor (`/backend/src/server.js`)
- Parser JSON com verificação UTF-8
- Headers de resposta configurados para UTF-8
- Middleware aplicado globalmente

#### Dependências Adicionadas
```json
{
  "utf8": "^3.0.0",
  "iconv-lite": "^0.6.3"
}
```

#### Configuração MongoDB
- Conexão configurada com opções UTF-8
- Suporte a caracteres especiais no banco

### 2. Frontend (Next.js/React)

#### Configuração Next.js (`/frontend/next.config.js`)
- Headers automáticos para UTF-8
- Configuração webpack para arquivos .md
- Compressão e otimização mantendo encoding

#### Utilitários de Encoding (`/frontend/src/utils/encodingUtils.ts`)
- **Sanitização automática** de texto
- **Validação** de caracteres portugueses
- **Correção automática** de problemas comuns
- **Hook personalizado** para formulários
- **Fetch wrapper** com suporte UTF-8

#### API Service Atualizado (`/frontend/src/services/api.ts`)
- Todas as requisições usam encoding UTF-8
- Sanitização automática de dados de entrada/saída
- Headers corretos configurados

### 3. Docker/Deployment

#### Variáveis de Ambiente
```yaml
environment:
  - LANG=pt_BR.UTF-8
  - LC_ALL=pt_BR.UTF-8
  - LC_CTYPE=pt_BR.UTF-8
```

### 4. Ferramentas de Desenvolvimento

#### Script de Verificação (`/scripts/check-encoding.js`)
```bash
npm run check-encoding
```
- Verifica todos os arquivos do projeto
- Identifica problemas de encoding
- Relatório detalhado de problemas encontrados

#### Script de Correção (`/scripts/fix-encoding.js`)
```bash
npm run fix-encoding
```
- Corrige automaticamente problemas de encoding
- Cria backups dos arquivos originais
- Aplica correções seguras e reversíveis

## Como Usar

### Durante o Desenvolvimento

1. **Verificação Regular**
   ```bash
   npm run check-encoding
   ```

2. **Correção Automática**
   ```bash
   npm run fix-encoding
   ```

3. **Pre-commit Hook** (automático)
   - Verificação é executada antes de commits
   - Previne commits com problemas de encoding

### Novos Arquivos

- **Frontend**: Use as funções de `encodingUtils.ts`
- **Backend**: O middleware aplica automaticamente
- **Conteúdo**: Sempre salvar arquivos em UTF-8

### Exemplo de Uso no Frontend

```typescript
import { sanitizeText, useUTF8Form } from '@/utils/encodingUtils';

function MyComponent() {
  const { sanitizeFormData } = useUTF8Form();
  
  const handleSubmit = (data) => {
    const cleanData = sanitizeFormData(data);
    // Enviar dados limpos...
  };
}
```

### Exemplo de Uso no Backend

```javascript
// O middleware é aplicado automaticamente
app.post('/api/content', (req, res) => {
  // req.body já está sanitizado pelo middleware
  const { title, content } = req.body;
  
  // Resposta será automaticamente em UTF-8
  res.json({ message: 'Conteúdo salvo com acentos corretos!' });
});
```

## Mapeamento de Correções

O sistema corrige automaticamente os seguintes problemas comuns:

```javascript
const COMMON_FIXES = {
  'Ã¡': 'á',  // á
  'Ã©': 'é',  // é
  'Ã­': 'í',  // í
  'Ã³': 'ó',  // ó
  'Ãº': 'ú',  // ú
  'Ã§': 'ç',  // ç
  'Ã£': 'ã',  // ã
  'Ãµ': 'õ',  // õ
  // ... outros
};
```

## Monitoramento

### Logs do Sistema
- Problemas de encoding são registrados no console
- Métricas de correções aplicadas
- Alertas para caracteres problemáticos

### CI/CD Integration
- Verificação automática em builds
- Falha de build se problemas encontrados
- Relatórios de qualidade de encoding

## Troubleshooting

### Problema: Ainda vejo caracteres estranhos
**Solução**: Execute `npm run fix-encoding` e verifique se o arquivo está salvo em UTF-8

### Problema: API retorna caracteres incorretos
**Solução**: Verificar se o middleware está aplicado no backend

### Problema: Formulário não sanitiza dados
**Solução**: Usar `useUTF8Form()` hook ou importar funções de `encodingUtils`

## Configuração de IDE

### VS Code
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[markdown]": {
    "files.encoding": "utf8"
  }
}
```

### IntelliJ/WebStorm
```
File → Settings → Editor → File Encodings
- Global Encoding: UTF-8
- Project Encoding: UTF-8
```

## Resumo dos Benefícios

✅ **Prevenção automática** de problemas de encoding
✅ **Correção transparente** sem interferir no desenvolvimento
✅ **Validação contínua** através de ferramentas
✅ **Suporte completo** a caracteres portugueses
✅ **Configuração de produção** adequada
✅ **Monitoramento** e alertas integrados

Este sistema garante que todo o conteúdo português seja tratado corretamente em toda a aplicação, desde a entrada de dados até a exibição final.