import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage } from "../src/types/game";

export default class MainServer implements Party.Server {
  private state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      status: 'lobby',
      players: {},
      creatorId: null,
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

        // Se for o primeiro a entrar, é o criador
        const isCreator = this.state.creatorId === null || Object.keys(this.state.players).length === 0;
        if (isCreator) {
          this.state.creatorId = sender.id;
        }

        this.state.players[sender.id] = {
          id: sender.id,
          name: parsed.name,
          isCreator,
        };

        this.broadcastSync();
      }

      if (parsed.type === "start_game") {
        if (sender.id === this.state.creatorId) {
          this.state.status = "playing";
          this.broadcastSync();
        } else {
          sender.send(JSON.stringify({ type: "error", message: "Apenas o criador pode iniciar o jogo." }));
        }
      }
    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão encerrada: ${conn.id}`);
    
    // Remove o jogador
    if (this.state.players[conn.id]) {
      delete this.state.players[conn.id];
      
      // Se o criador saiu, passamos a liderança para o próximo (ou deixamos null se a sala esvaziou)
      if (this.state.creatorId === conn.id) {
        const remainingPlayers = Object.values(this.state.players);
        if (remainingPlayers.length > 0) {
          this.state.creatorId = remainingPlayers[0].id;
          remainingPlayers[0].isCreator = true;
        } else {
          this.state.creatorId = null;
          // Se a sala esvaziou, podemos resetar o status
          this.state.status = "lobby";
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
