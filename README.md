# Combo Multiplayer Game

Este é um projeto base em Next.js 15, configurado com App Router, TypeScript, Tailwind CSS e shadcn/ui. 
O objetivo deste repositório é servir como fundação para a construção de um jogo multiplayer, com uma estrutura de pastas organizada para escalabilidade.

## Estrutura de Pastas

A pasta `src/` contém a lógica principal do jogo, dividida da seguinte forma:

- `src/components/`: Componentes da interface de usuário, incluindo os componentes padrão do shadcn/ui.
- `src/components/game/`: Componentes específicos da UI do jogo (tabuleiro, placar, etc).
- `src/game/`: Lógica central do jogo (regras, estado, validações).
- `src/socket/`: Lógica para comunicação em tempo real via WebSockets.
- `src/store/`: Gerenciamento de estado global da aplicação.
- `src/types/`: Tipagens TypeScript globais (estruturas de dados do jogador, partida, etc).
- `src/server/actions/`: Server Actions do Next.js para operações de backend.
- `src/hooks/`: Hooks customizados do React.
- `src/lib/`: Funções utilitárias (criadas pelo shadcn, etc).

## Como Rodar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Em um terminal, inicie o servidor PartyKit (porta 1999):
   ```bash
   npm run party
   ```

3. Em outro terminal, execute o servidor Next.js:
   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado e testar a conexão com a PartyKit room `lobby`.
