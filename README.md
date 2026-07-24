# Yuno

Plataforma pessoal de cursos que lê conteúdo diretamente dos grupos/canais do Telegram, com streaming local e privado.

## Estrutura

```
yuno/
├── client/   # Frontend (React + Vite + Tailwind)
├── server/   # Backend (Node.js + Express + GramJS)
└── docs/     # Especificação e detalhes do projeto
```

## Pré-requisitos

- Node.js 20+
- Credenciais da API do Telegram (`api_id` e `api_hash`) em https://my.telegram.org

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o servidor:

   ```bash
   cp server/.env.example server/.env
   ```

   Preencha `API_ID`, `API_HASH` e demais variáveis no `.env`.

## Desenvolvimento

```bash
# Backend e frontend juntos
npm run dev

# Ou separadamente
npm run dev:server
npm run dev:client
```

Consulte [docs/details.md](./docs/details.md) para a especificação completa.
