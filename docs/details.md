# Prompt para o Claude Code

Copie e cole o texto abaixo no Claude Code (na pasta onde você quer criar o projeto).

---

## PROMPT

Quero criar um aplicativo pessoal de "plataforma de cursos" que lê diretamente dos meus grupos do Telegram (sem baixar os arquivos permanentemente no disco), streamando os vídeos e exibindo documentos em tempo real, como se fosse uma plataforma de cursos (tipo Udemy/Hotmart), mas 100% local e privada, usando apenas conteúdo dos grupos/canais em que eu já sou membro.

### Stack

- **Backend:** Node.js + Express + TypeScript
- **Cliente Telegram:** biblioteca `telegram` (GramJS), usando a API oficial do Telegram (MTProto) com minhas próprias credenciais de API (api_id / api_hash de https://my.telegram.org)
- **Frontend:** React + TypeScript + Vite
- **Estilo:** Tailwind CSS, visual estilo plataforma de cursos (sidebar com lista de "cursos" = grupos, área central com player e lista de aulas)
- **Sem banco de dados pesado**: usar um arquivo local JSON (ou SQLite via better-sqlite3) só para guardar sessão do Telegram e progresso de "assistido/não assistido"

### Arquitetura

**Backend (`/server`)**

1. Autenticação com o Telegram via GramJS:
   - Fluxo de login: telefone → código enviado ao Telegram → (se necessário) senha 2FA
   - Sessão salva localmente (`StringSession`) para não pedir login toda vez
   - Endpoint `POST /api/auth/start` (envia código), `POST /api/auth/verify` (confirma código/senha)
2. Endpoint `GET /api/dialogs` — lista todos os grupos/canais que sou membro (nome, id, tipo, foto se tiver)
3. Endpoint `GET /api/dialogs/:id/media` — lista as mensagens com mídia (vídeo, documento, PDF, foto) de um grupo específico, com paginação (usar `offsetId` do Telegram para scroll infinito), retornando: id da mensagem, nome do arquivo, tipo, tamanho, data, thumbnail se disponível
4. Endpoint `GET /api/stream/:chatId/:messageId` — **streaming direto** do arquivo:
   - Deve suportar `Range` requests (HTTP 206 Partial Content) para permitir seek no player de vídeo
   - Usar `client.iterDownload()` do GramJS com `offset` e `limit` para pegar só o pedaço pedido, sem salvar o arquivo inteiro no disco
   - Setar os headers corretos (`Content-Type`, `Content-Range`, `Accept-Ranges`, `Content-Length`)
5. Endpoint `GET /api/thumbnail/:chatId/:messageId` — retorna a miniatura/thumbnail do vídeo ou documento (quando existir), para mostrar nos cards
6. Endpoints simples de progresso: `POST /api/progress` e `GET /api/progress/:chatId` para marcar/consultar itens como assistidos (salvar em JSON local ou SQLite)

**Frontend (`/client`)**

1. Tela de login (se ainda não autenticado): campo de telefone → campo de código → campo de senha 2FA (condicional)
2. Sidebar esquerda: lista dos grupos (tratados como "cursos"), com busca/filtro por nome
3. Área principal ao selecionar um grupo:
   - Grid ou lista de "aulas" (as mídias daquele grupo), com nome do arquivo, data, badge de tipo (vídeo/PDF/outro), indicador de assistido
   - Ao clicar em um vídeo: abre um player (usar tag `<video>` nativa com `src` apontando para o endpoint de streaming, que já suporta range requests — não precisa de player externo)
   - Ao clicar em um PDF: abrir em viewer embutido (iframe ou lib tipo react-pdf), streamando do mesmo endpoint
4. Marcar automaticamente como "assistido" quando o vídeo passar de ~90% do tempo, com opção de marcar manualmente
5. Design: cards com thumbnail, nome do arquivo truncado, badge de progresso, visual limpo tipo plataforma de curso (sidebar fixa + grid responsivo)

### Requisitos técnicos importantes

- O GramJS precisa rodar no **servidor** (Node), nunca no browser — credenciais e sessão do Telegram nunca devem ser expostas ao frontend
- Implementar corretamente o suporte a `Range` no endpoint de streaming, senão o player de vídeo não vai conseguir dar seek nem carregar corretamente
- Tratar arquivos grandes sem estourar memória — sempre usar streaming/chunks, nunca carregar o arquivo inteiro em um buffer antes de responder
- Variáveis sensíveis (`API_ID`, `API_HASH`, sessão) devem ficar em `.env` no servidor, nunca commitadas
- Adicionar um `README.md` explicando como obter `api_id`/`api_hash`, configurar `.env`, rodar o backend (`npm run dev` na pasta server) e o frontend (`npm run dev` na pasta client), e como fazer o primeiro login

### Fora de escopo (não incluir)

- Não implementar download/salvamento permanente de arquivos no disco
- Não precisa de sistema de múltiplos usuários — é uso pessoal, single-user
- Não precisa de deploy em nuvem, é só para rodar localmente

---

Comece criando a estrutura de pastas do monorepo (`/server` e `/client`), configure o backend com GramJS e o fluxo de login primeiro (é a parte mais crítica), depois os endpoints de listagem, e por último o streaming com suporte a Range. Vá me mostrando o progresso por etapas.
