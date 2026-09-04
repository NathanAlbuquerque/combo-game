import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage } from "../src/types/game";

export default class MainServer implements Party.Server {
  private state: GameState;

  constructor(readonly room: Party.Room) {
    // Inicialização da nova estrutura expandida
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

      // ==========================================
      // LÓGICA DE LOBBY
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

        // Jogador agora é inicializado com hand e objectArea vazios
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
        if (sender.id === this.state.creatorId) {
          this.state.status = "playing";
          
          // Define o primeiro jogador a jogar (exemplo simples: o criador)
          this.state.currentTurnPlayerId = this.state.creatorId;
          
          // O preenchimento do deck (com objetos, efeitos e coringas) 
          // e a distribuição inicial de cartas ocorrerá aqui futuramente.

          this.broadcastSync();
        } else {
          sender.send(JSON.stringify({ type: "error", message: "Apenas o criador pode iniciar o jogo." }));
        }
      }

      // ==========================================
      // LÓGICA DE JOGO (Apenas placeholders das rotas)
      // ==========================================
      if (parsed.type === "draw_card") {
        // Futura implementação de comprar carta
      }

      if (parsed.type === "play_card") {
        // Futura implementação de jogar carta (efeito ou baixar objeto)
      }

      if (parsed.type === "trade_card") {
        // Futura implementação de negociar/roubar/trocar cartas
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
          // Reset completo se a sala esvaziar
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
