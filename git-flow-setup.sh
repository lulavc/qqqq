#!/bin/bash

# Script para configurar a estratégia de branches GitFlow no projeto AInovar Tech

echo "Configurando estratégia de branches GitFlow para AInovar Tech..."

# Verificar se estamos em um repositório Git
if [ ! -d .git ]; then
  echo "Este diretório não é um repositório Git. Inicialize o Git primeiro."
  exit 1
fi

# Criar branch principal main (se não existir)
if ! git show-ref --quiet refs/heads/main; then
  echo "Criando branch principal 'main'..."
  git branch main
else
  echo "Branch 'main' já existe."
fi

# Criar branch de desenvolvimento (se não existir)
if ! git show-ref --quiet refs/heads/develop; then
  echo "Criando branch de desenvolvimento 'develop'..."
  git branch develop main
else
  echo "Branch 'develop' já existe."
fi

# Criar diretório para hooks Git
mkdir -p .git/hooks

# Criar hook para validar nomes de branches feature/
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

BRANCH=$(git symbolic-ref HEAD)
BRANCH=${BRANCH##refs/heads/}

# Validar nomes de branches
if [[ $BRANCH == feature/* ]]; then
  FEATURE_NAME=${BRANCH#feature/}
  if [[ ! $FEATURE_NAME =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
    echo "ERRO: Nomes de feature branches devem conter apenas letras minúsculas, números e hífens"
    echo "ERRO: O branch atual '$BRANCH' não segue esta convenção"
    exit 1
  fi
elif [[ $BRANCH == hotfix/* ]]; then
  HOTFIX_NAME=${BRANCH#hotfix/}
  if [[ ! $HOTFIX_NAME =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "ERRO: Nomes de hotfix branches devem usar versionamento semântico (ex: hotfix/1.0.1)"
    echo "ERRO: O branch atual '$BRANCH' não segue esta convenção"
    exit 1
  fi
elif [[ $BRANCH == release/* ]]; then
  RELEASE_NAME=${BRANCH#release/}
  if [[ ! $RELEASE_NAME =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "ERRO: Nomes de release branches devem usar versionamento semântico (ex: release/1.1.0)"
    echo "ERRO: O branch atual '$BRANCH' não segue esta convenção"
    exit 1
  fi
fi

exit 0
EOF

chmod +x .git/hooks/pre-push

# Criar arquivo de documentação para GitFlow
cat > GITFLOW.md << 'EOF'
# Estratégia de Branches GitFlow do AInovar Tech

Este projeto segue uma adaptação da estratégia GitFlow para gerenciamento de branches.

## Branches Principais

- `main` - Código em produção, estável e testado
- `develop` - Branch de integração, contém código em preparação para próxima release

## Branches de Funcionalidades

- `feature/nome-da-funcionalidade` - Para desenvolvimento de novas funcionalidades
  - Criado a partir de: `develop`
  - Merge para: `develop`
  - Convenção de nomenclatura: letras minúsculas, números e hífens

## Branches de Release

- `release/x.y.z` - Preparação para lançamento de versão
  - Criado a partir de: `develop`
  - Merge para: `main` e `develop`
  - Convenção de nomenclatura: versionamento semântico (x.y.z)

## Branches de Hotfix

- `hotfix/x.y.z` - Correções urgentes em produção
  - Criado a partir de: `main`
  - Merge para: `main` e `develop`
  - Convenção de nomenclatura: versionamento semântico (x.y.z)

## Fluxo de Trabalho

1. Para desenvolver uma nova funcionalidade:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nome-da-funcionalidade
   # Desenvolva a funcionalidade
   git push -u origin feature/nome-da-funcionalidade
   # Criar Pull Request para develop
   ```

2. Para lançar uma nova versão:
   ```bash
   git checkout develop
   git pull
   git checkout -b release/x.y.z
   # Ajustes finais, correções de bugs
   git push -u origin release/x.y.z
   # Criar Pull Request para main e develop
   ```

3. Para corrigir um bug em produção:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/x.y.z
   # Correção do bug
   git push -u origin hotfix/x.y.z
   # Criar Pull Request para main e develop
   ```
EOF

echo "Configuração GitFlow concluída!"
echo "Branches principais configurados: main, develop"
echo "Documentação criada: GITFLOW.md"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  git checkout develop"
echo "  git checkout -b feature/sua-nova-funcionalidade" 