"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";

export function PartyKitTest() {
  const [messages, setMessages] = useState<string[]>([]);
  
  // Conecta ao servidor PartyKit local (a porta padrão é 1999)
  // e entra em uma sala chamada 'lobby'
  const socket = usePartySocket({
    host: "localhost:1999",
    room: "lobby",
    onMessage(event) {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data.message]);
    },
  });

  const sendPing = () => {
    socket.send(JSON.stringify({ type: "ping" }));
  };

  return (
    <div className="p-6 border rounded-lg max-w-md w-full bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-bold mb-4">Teste do PartyKit (Lobby)</h2>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Status da conexão:</p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${socket.readyState === 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{socket.readyState === 1 ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      <Button onClick={sendPing} disabled={socket.readyState !== 1} className="w-full mb-4">
        Enviar Ping para todos
      </Button>

      <div className="bg-muted p-4 rounded-md h-48 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-2 font-medium">Log de mensagens:</p>
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma mensagem ainda...</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, idx) => (
              <li key={idx} className="text-sm p-2 bg-background rounded border">
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
