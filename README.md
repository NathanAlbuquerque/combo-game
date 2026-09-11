# 🃏 Combo The Game

> **Jogo pedagógico de cartas multiplayer sobre Cidadania e Segurança Digital.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![PartyKit](https://img.shields.io/badge/PartyKit-Multiplayer-FF5B00?logo=partykit)](https://partykit.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 Sobre o Jogo

O **Combo** é um jogo de cartas multiplayer em tempo real desenvolvido para conscientizar crianças, jovens e educadores sobre hábitos digitais saudáveis, segurança na internet, pensamento crítico e o uso ético da inteligência artificial.

Projetado para partidas rápidas de **2 a 5 jogadores**, cada participante gerencia sua mão, usa cartas de efeito para sabotar ou ajudar adversários e baixa cartas-objeto em sua mesa pessoal.

### 🏆 Condições de Vitória

O jogo pode ser vencido de duas formas:
1. **Fechar o Combo (Vitória Principal):** Ser o primeiro jogador a reunir **5 categorias distintas** de Cartas-Objeto em sua mesa (Cartas Coringa podem suprir qualquer categoria faltante).
2. **Último Sobrevivente (W.O. / Sobrevivência):** Ficar sem cartas na mão elimina o jogador sumariamente (`isEliminated`). Se sobrar apenas 1 jogador ativo na partida, ele é declarado o vencedor!

---

## 🗃️ O Baralho (48 Cartas)

O deck oficial do jogo é composto por **48 cartas** distribuídas entre três tipos:

### 1. Cartas-Objeto (30 cartas — 5 por categoria)
Cada categoria representa uma competência essencial do mundo digital e possui identidade visual própria:
- 🛡️ **Segurança Digital:** *Gerenciador de Senhas, Token 2FA, Escudo VPN, Navegação Segura, Firewall Ativo.*
- 🔒 **Privacidade e Proteção de Dados:** *Privacidade de Dados, Controle de Localização, Painel de Permissões, Bloqueador de Cookies, Limpar Dados.*
- 🔍 **Informação e Pensamento Crítico:** *Verificação de Informações, Pensamento Crítico, Fontes Confiáveis, Filtro de Fake News, Divulgação Responsável.*
- 🤝 **Comunicação e Cidadania Digital:** *Respeito aos Direitos Autorais, Respeito nas Interações, Consentimento Alheio, Conversas Conscientes, Denúncia Justa.*
- 🛠️ **Competências e Ferramentas Digitais:** *Busca Avançada, Nuvem Organizada, Download Responsável, Correio Oficial, Trabalho Colaborativo.*
- 🤖 **Inteligência Artificial e Uso Crítico:** *Prompt Estruturado, Terminal Chatbot, Revisão Humana, IA + Humano, Transparência Autoral.*

### 2. Cartas Coringa (2 cartas)
- 🃏 **Coringa:** Pode assumir o papel de qualquer uma das 6 categorias para completar a condição de vitória do Combo na mesa.

### 3. Cartas de Efeito (16 cartas)
Ações estratégicas que alteram a dinâmica do jogo:
- **Compra de Cartas:** *Senha Forte*, *Rede de Apoio*, *Limpeza de Cache*, *Engajamento Merecido*.
- **Revelação e Espionagem:** *Senha Fraca Detectada* (revela a mão do alvo), *Vazamento de Dados* (mãos de todos reveladas por uma rodada).
- **Ataque e Descarte:** *Alerta de Phishing*, *Esqueceu a Senha*, *Plágio Detectado* (descarta objeto da mesa).
- **Reviravoltas:** *Tomou Block!* (bloqueia o próximo turno do jogador), *Vídeo Deepfake* (troca de mão com qualquer jogador), *Six Seven* (todos passam a mão para a esquerda), *Agência de Checagem* (devolve último objeto para a mão), *Formatar o Sistema* (todos descartam a mão e compram 3 novas), *LI E ACEITO!* (obriga o alvo a doar 1 carta).
- **Ação Extra:** *Prompt Perfeito* (compra 2 cartas e, se vier categoria inédita, baixa como ação extra imediata).

---

## ✨ Funcionalidades Principais

- ⚡ **Multiplayer em Tempo Real com PartyKit:**
  - Sincronização instantânea de estado entre salas via WebSockets sem refresh.
  - Reconexão resiliente por `sessionStorage` e recuperação automática de turnos.
- 📱 **Arquitetura Mobile-First Container:**
  - Experiência padronizada com ergonomia vertical móvel (max. 440px–480px), centralizada com plano de fundo elegante em desktops e tablets.
- 🌐 **Catálogo de Salas Públicas:**
  - Listagem em tempo real na tela inicial de salas no lobby e em andamento com badges de status e botão de atualização (`RefreshCw`).
  - Entrada direta com um clique preservando o nome informado.
- 🏆 **Sistema de Rankings Duplo:**
  - **Ranking Geral (Global):** Ciclo diário de 24h gerenciado pelo servidor no `global-registry`, com persistência em Durable Object storage e contagem regressiva para reset.
  - **Ranking da Sala:** Placar de vitórias e aproveitamento persistente durante todas as partidas da mesma sessão.
  - Pódio com badges metálicas destacadas (🥇 Ouro, 🥈 Prata, 🥉 Bronze).
- ⏳ **Temporizador de Início Automático no Lobby:**
  - Contagem regressiva de 60 segundos gerenciada pelo servidor quando houver 2 ou mais jogadores na sala de espera.
  - Início manual instantâneo pelo anfitrião a qualquer momento.
- 👁️ **Modo Espectador:**
  - Conexão tardia em salas com partidas em andamento sem interromper o jogo.
  - O espectador assiste em tempo real e entra como jogador ativo na rodada seguinte ao retornar ao lobby.
- 📖 **Enciclopédia de Cartas (`/cartas`):**
  - Galeria interativa com as 48 cartas do baralho.
  - Filtros por abas (*Todas, Objetos, Efeitos*), subfiltro por categoria e barra de pesquisa por texto e conselhos pedagógicos.
- 🔍 **Modal de Pré-visualização & Inspeção (`CardPreviewModal`):**
  - Zoom e leitura nítida das ilustrações, textos de efeito e fatos educativos antes de confirmar a jogada.
- 📊 **Estatísticas Consolidadas da Partida:**
  - Modal com métricas ao final do jogo: turnos, cartas compradas, objetos e efeitos jogados por cada participante.
- 🔔 **Percepção Acentuada de Turno:**
  - Feedback visual pulsante de alto contraste, sintetizador sonoro via Web Audio API e vibração tátil via Vibration API na troca de turno.

---

## 🗂️ Estrutura do Projeto

```text
combo/
├── party/                      # Backend WebSocket & Durable Objects (PartyKit)
│   └── server.ts               # Lógica de jogo, regras, registro global e rankings
├── public/                     # Arquivos estáticos
│   └── images/
│       ├── categories/         # SVGs dos fundos das categorias
│       └── objects/            # Ilustrações oficiais em alta resolução
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (proxy interno para PartyKit)
│   │   │   ├── leaderboard/    # GET /api/leaderboard
│   │   │   └── rooms/          # GET /api/rooms
│   │   ├── cartas/             # Página da Enciclopédia de Cartas (/cartas)
│   │   ├── room/[id]/          # Sala de Jogo e Lobby (/room/:id)
│   │   ├── layout.tsx          # Layout global
│   │   └── page.tsx            # Tela inicial com criação, busca e ranking
│   ├── components/
│   │   ├── game/               # Componentes da interface do jogo
│   │   │   ├── Card.tsx                # Renderizador da carta nos 3 tamanhos
│   │   │   ├── CardPreviewModal.tsx    # Modal de inspeção e confirmação
│   │   │   ├── GameBoard.tsx           # Mesa de jogo interativa
│   │   │   ├── LeaderboardModal.tsx    # Modal de rankings (Global e Sala)
│   │   │   ├── MatchStatsModal.tsx     # Modal de estatísticas pós-partida
│   │   │   ├── OpponentView.tsx        # Visualização de oponentes e inspeção
│   │   │   ├── PlayerHand.tsx          # Mão de cartas do jogador
│   │   │   ├── PublicRoomsList.tsx     # Listagem de salas abertas
│   │   │   └── RoomPlayersDrawer.tsx   # Gaveta lateral de jogadores
│   │   └── ui/                 # Componentes base shadcn/ui (Button, etc.)
│   ├── data/
│   │   └── cards.ts            # Base de dados das 30 cartas-objeto e 16 efeitos
│   ├── lib/
│   │   └── utils.ts            # Utilitários de classes Tailwind (clsx, twMerge)
│   └── types/
│       └── game.ts             # Tipagens TypeScript completas do jogo
└── partykit.json               # Configuração de deployment do PartyKit
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** versão 20 ou superior
- **npm:** versão 10 ou superior

### 1. Instalar as dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente (opcional em desenvolvimento)
Crie um arquivo `.env.local` na raiz:
```env
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### 3. Iniciar o servidor PartyKit
Em um terminal:
```bash
npm run party
```
*O servidor PartyKit iniciará em `http://localhost:1999`.*

### 4. Iniciar o servidor Next.js
Em outro terminal:
```bash
npm run dev
```
*Acesse [http://localhost:3000](http://localhost:3000) no navegador.*

---

## 🧪 Validação & Qualidade de Código

Para garantir a integridade do projeto antes de enviar commits:

```bash
# Verificação estática de tipos TypeScript
npx tsc --noEmit

# Análise de linting (ESLint)
npm run lint

# Build de produção do Next.js
npm run build
```

---

## 🎈 Deploy em Produção

### Servidor PartyKit (Cloudflare Workers)
```bash
npx partykit deploy
```
*Host oficial de produção:* `https://combo.nathanalbuquerque.partykit.dev`

### Front-end Next.js
Pode ser hospedado na [Vercel](https://vercel.com/) ou qualquer provedor compatível com Next.js 15+, configurando a variável de ambiente:
```env
NEXT_PUBLIC_PARTYKIT_HOST=combo.nathanalbuquerque.partykit.dev
```

---

## 📜 Licença

Projeto desenvolvido para fins educativos e pedagógicos voltados ao letramento digital, segurança cibernética e cidadania. Todos os direitos reservados.
