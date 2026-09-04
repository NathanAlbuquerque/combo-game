import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage, Card, ObjectCategory } from "../src/types/game";

function generateDeck(): Card[] {
  const deck: Card[] = [];
  const categories: ObjectCategory[] = [
    'Segurança Digital', 
    'Privacidade', 
    'Pensamento Crítico', 
    'Cidadania Digital', 
    'Ferramentas Digitais', 
    'Inteligência Artificial'
  ];
  let idCounter = 1;

  // 30 Objetos (5 por categoria)
  categories.forEach(cat => {
    for (let i = 0; i < 5; i++) {
      deck.push({
        id: `obj_${idCounter++}`,
        type: 'object',
        category: cat,
        name: `${cat} Nvl ${i + 1}`,
      });
    }
  });

  // 2 Coringas
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `jkr_${idCounter++}`,
      type: 'joker',
      name: `Coringa ${i + 1}`,
      description: 'Pode representar qualquer categoria na área de objetos.',
    });
  }

  // 15 Efeitos
  for (let i = 0; i < 15; i++) {
    deck.push({
      id: `eff_${idCounter++}`,
      type: 'effect',
      name: `Efeito Genérico ${i + 1}`,
      description: 'Ação customizada ainda não definida.',
    });
  }

  return deck;
}

function shuffleDeck<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default class MainServer implements Party.Server {
  private state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      status: 'lobby',
      players: {},
      creatorId: null,
      deck: [],
      discard: [],
      currentTurnPlayerId: null,
      winnerId: null,
    };
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Conexão estabelecida: ${conn.id} na sala ${this.room.id}`);
  }

  private passTurn() {
    if (!this.state.currentTurnPlayerId) return;
    const playerIds = Object.keys(this.state.players);
    if (playerIds.length === 0) return;
    
    const currentIndex = playerIds.indexOf(this.state.currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.currentTurnPlayerId = playerIds[nextIndex];
  }

  private checkVictory(playerId: string): boolean {
    const p = this.state.players[playerId];
    if (!p) return false;
    const uniqueCategories = new Set<string>();
    let jokersCount = 0;
    
    for (const card of p.objectArea) {
      if (card.type === 'joker') {
        jokersCount++;
      } else if (card.type === 'object' && card.category) {
        uniqueCategories.add(card.category);
      }
    }
    
    if (uniqueCategories.size + jokersCount >= 5) {
      this.state.winnerId = playerId;
      this.state.status = 'finished';
      return true;
    }
    return false;
  }

  private drawOneCard(): Card | null {
    if (this.state.deck.length === 0) {
      if (this.state.discard.length === 0) return null;
      this.state.deck = shuffleDeck(this.state.discard);
      this.state.discard = [];
    }
    return this.state.deck.pop() || null;
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const parsed = JSON.parse(message) as ClientMessage;

      // ==========================================
      // LÓGICA DE LOBBY & INÍCIO
      // ==========================================
      if (parsed.type === "join") {
        if (this.state.status !== "lobby") {
          sender.send(JSON.stringify({ type: "error", message: "A partida já começou!" }));
          return;
        }

        const isCreator = this.state.creatorId === null || Object.keys(this.state.players).length === 0;
        if (isCreator) {
          this.state.creatorId = sender.id;
        }

        this.state.players[sender.id] = {
          id: sender.id,
          name: parsed.name,
          isCreator,
          hand: [],
          objectArea: [],
        };

        this.broadcastSync();
        return;
      }

      if (parsed.type === "start_game") {
        if (this.state.status !== "lobby") {
          sender.send(JSON.stringify({ type: "error", message: "A partida já está em andamento." }));
          return;
        }
        
        if (sender.id !== this.state.creatorId) {
          sender.send(JSON.stringify({ type: "error", message: "Apenas o criador pode iniciar o jogo." }));
          return;
        }

        const playerIds = Object.keys(this.state.players);
        if (playerIds.length === 0) return;

        const newDeck = generateDeck();
        const shuffledDeck = shuffleDeck(newDeck);

        for (const pid of playerIds) {
          const player = this.state.players[pid];
          player.hand = shuffledDeck.splice(-3, 3);
        }

        this.state.deck = shuffledDeck;
        this.state.status = "playing";
        this.state.currentTurnPlayerId = this.state.creatorId;

        this.broadcastSync();
        return;
      }

      // ==========================================
      // LÓGICA DE TURNO E AÇÕES
      // ==========================================
      
      const gameActions = ["draw_card", "play_card", "trade_card"];
      if (gameActions.includes(parsed.type)) {
        if (this.state.status !== "playing") {
          sender.send(JSON.stringify({ type: "error", message: "O jogo não está em andamento." }));
          return;
        }

        if (sender.id !== this.state.currentTurnPlayerId) {
          sender.send(JSON.stringify({ type: "error", message: "Não é o seu turno!" }));
          return;
        }

        const me = this.state.players[sender.id];

        if (parsed.type === "draw_card") {
          const card = this.drawOneCard();
          if (card) {
            me.hand.push(card);
          }
          this.passTurn();
          this.broadcastSync();
          return;
        }

        if (parsed.type === "play_card") {
          const cardIndex = me.hand.findIndex(c => c.id === parsed.cardId);
          if (cardIndex === -1) {
            sender.send(JSON.stringify({ type: "error", message: "Carta não encontrada na sua mão." }));
            return;
          }
          
          const card = me.hand[cardIndex];
          
          let hasWon = false;
          if (card.type === 'object') {
            const hasCategory = me.objectArea.some(c => c.category === card.category);
            if (hasCategory) {
              sender.send(JSON.stringify({ type: "error", message: "Você já possui um objeto dessa categoria na sua área." }));
              return;
            }
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'joker') {
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'effect') {
            me.hand.splice(cardIndex, 1);
            this.state.discard.push(card);
            // TODO: implementar lógica específica de efeitos no futuro
          }

          if (!hasWon) {
            this.passTurn();
          }
          this.broadcastSync();
          return;
        }

        if (parsed.type === "trade_card") {
          const target = this.state.players[parsed.targetPlayerId];
          if (!target) {
            sender.send(JSON.stringify({ type: "error", message: "Jogador alvo não encontrado." }));
            return;
          }
          
          if (me.id === target.id) {
             sender.send(JSON.stringify({ type: "error", message: "Você não pode trocar cartas com você mesmo." }));
             return;
          }

          if (me.hand.length === 0 || target.hand.length === 0) {
            sender.send(JSON.stringify({ type: "error", message: "Ambos os jogadores devem possuir cartas na mão para a troca." }));
            return;
          }

          // Troca aleatória (sem intervenção do cliente)
          const myCardIndex = Math.floor(Math.random() * me.hand.length);
          const targetCardIndex = Math.floor(Math.random() * target.hand.length);

          const myCard = me.hand.splice(myCardIndex, 1)[0];
          const targetCard = target.hand.splice(targetCardIndex, 1)[0];

          me.hand.push(targetCard);
          target.hand.push(myCard);

          this.passTurn();
          this.broadcastSync();
          return;
        }
      }

    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão encerrada: ${conn.id}`);
    
    if (this.state.players[conn.id]) {
      delete this.state.players[conn.id];
      
      // Se a sala esvaziar completamente
      const remainingPlayers = Object.values(this.state.players);
      if (remainingPlayers.length === 0) {
        this.state.creatorId = null;
        this.state.status = "lobby";
        this.state.deck = [];
        this.state.discard = [];
        this.state.currentTurnPlayerId = null;
        this.state.winnerId = null;
      } else {
        // Se o líder saiu, passa a liderança e tenta não quebrar o jogo
        if (this.state.creatorId === conn.id) {
          this.state.creatorId = remainingPlayers[0].id;
          remainingPlayers[0].isCreator = true;
        }
        
        // Se quem saiu era o jogador do turno, passa a vez
        if (this.state.currentTurnPlayerId === conn.id && this.state.status === "playing") {
          // A função passTurn() não funciona se o id atual não existe na lista.
          // Como já foi deletado, setamos para o próximo disponível
          this.state.currentTurnPlayerId = remainingPlayers[0].id;
        }
      }
      
      this.broadcastSync();
    }
  }

  private broadcastSync() {
    const syncMsg: ServerMessage = {
      type: "sync",
      state: this.state,
    };
    this.room.broadcast(JSON.stringify(syncMsg));
  }
}
