import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage, Card, ObjectCategory } from "../src/types/game";

function generateDeck(): Card[] {
  const deck: Card[] = [];
  const categories: ObjectCategory[] = ['cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6'];
  let idCounter = 1;

  // 30 Objetos (5 por categoria)
  categories.forEach(cat => {
    for (let i = 0; i < 5; i++) {
      deck.push({
        id: `obj_${idCounter++}`,
        type: 'object',
        category: cat,
        name: `Objeto ${cat.toUpperCase()} - ${i + 1}`,
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

  onMessage(message: string, sender: Party.Connection) {
    try {
      const parsed = JSON.parse(message) as ClientMessage;

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
      }

      if (parsed.type === "start_game") {
        // Validações
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

        // 1. Gera o baralho completo (47 cartas)
        const newDeck = generateDeck();
        
        // 2. Embaralha
        const shuffledDeck = shuffleDeck(newDeck);

        // 3. Distribui 3 cartas para cada jogador conectado
        for (const pid of playerIds) {
          const player = this.state.players[pid];
          // Remove 3 cartas do topo do baralho e coloca na mão do jogador
          player.hand = shuffledDeck.splice(-3, 3);
        }

        // 4. Atualiza o estado
        this.state.deck = shuffledDeck;
        this.state.status = "playing";
        
        // Define o líder (ou o primeiro a entrar) como o jogador atual
        this.state.currentTurnPlayerId = this.state.creatorId;

        // 5. Broadcast para todo mundo
        this.broadcastSync();
      }

      if (parsed.type === "draw_card") {
        // Futuro
      }

      if (parsed.type === "play_card") {
        // Futuro
      }

      if (parsed.type === "trade_card") {
        // Futuro
      }

    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão encerrada: ${conn.id}`);
    
    if (this.state.players[conn.id]) {
      delete this.state.players[conn.id];
      
      if (this.state.creatorId === conn.id) {
        const remainingPlayers = Object.values(this.state.players);
        if (remainingPlayers.length > 0) {
          this.state.creatorId = remainingPlayers[0].id;
          remainingPlayers[0].isCreator = true;
        } else {
          // Reset da sala caso o criador saia e não tenha ninguém
          this.state.creatorId = null;
          this.state.status = "lobby";
          this.state.deck = [];
          this.state.discard = [];
          this.state.currentTurnPlayerId = null;
          this.state.winnerId = null;
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
