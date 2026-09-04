import type * as Party from "partykit/server";

export default class MainServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Conexão estabelecida: ${conn.id} na sala ${this.room.id}`);
    
    // Envia uma mensagem de boas-vindas para a conexão
    conn.send(JSON.stringify({
      type: "welcome",
      message: `Bem-vindo à sala ${this.room.id}, jogador ${conn.id}!`
    }));
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`Mensagem recebida do cliente ${sender.id}: ${message}`);
    
    try {
      const parsed = JSON.parse(message);
      
      // Quando receber uma mensagem 'ping', faz o broadcast para todos da sala
      if (parsed.type === "ping") {
        this.room.broadcast(JSON.stringify({
          type: "pong",
          message: `O jogador ${sender.id} enviou um ping!`,
          senderId: sender.id
        }));
      }
    } catch (e) {
      // Se não for JSON, apenas retorna a mesma mensagem para todos
      this.room.broadcast(JSON.stringify({
        type: "echo",
        message
      }));
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão encerrada: ${conn.id}`);
  }
}
