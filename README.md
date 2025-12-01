# Flex Análise - Grupo Flex

Aplicação web para análise inteligente de contratos financeiros usando IA.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Hot Toast** - Notificações
- **Lucide React** - Ícones
- **jsPDF** - Geração de PDFs

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
web/
├── app/
│   ├── api/
│   │   └── extract/          # API route para extração
│   ├── resultados/            # Página de resultados
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página inicial
│   └── globals.css           # Estilos globais
├── components/
│   ├── ContractUpload.tsx    # Componente de upload
│   └── ContractResults.tsx   # Componente de resultados
└── package.json
```

## 🔧 Configuração

A aplicação se conecta com a API Python backend através da variável de ambiente `PYTHON_API_URL` (padrão: `http://localhost:8000/api/extract`).

## 📝 Funcionalidades

- ✅ Upload de PDFs e imagens (JPEG, PNG)
- ✅ Extração automática de informações de contratos
- ✅ Análise de cláusulas abusivas e irregularidades
- ✅ Geração de PDF com os resultados
- ✅ Interface moderna e responsiva
- ✅ Notificações toast para feedback do usuário

## 🎨 Design

Interface desenvolvida com as cores oficiais do Grupo Flex:
- Azul principal: `#1e3a8a`
- Coral: `#FF6B6B`
- Laranja: `#FF8C42`
- Verde: `#00C853`

## 📄 Licença

Proprietário - Grupo Flex



