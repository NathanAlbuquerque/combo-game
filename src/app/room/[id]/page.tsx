"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { GameState, ServerMessage } from "@/types/game";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const roomId = params.id as string;
  const playerName = searchParams.get("name") || "";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redireciona de volta se não tiver nome
  useEffect(() => {
    if (!playerName) {
      router.push("/");
    }
  }, [playerName, router]);

  const socket = usePartySocket({
    host: "localhost:1999",
    room: roomId,
    onOpen(e) {
      // Assim que conecta, envia a mensagem de join com o nome
      if (playerName) {
        socket.send(JSON.stringify({ type: "join", name: playerName }));
      }
    },
    onMessage(event) {
      const data = JSON.parse(event.data) as ServerMessage;
      
      if (data.type === "error") {
        setErrorMsg(data.message);
      } else if (data.type === "sync") {
        setGameState(data.state);
      }
    }
  });

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
        <div className="bg-destructive text-destructive-foreground p-6 rounded-lg max-w-sm text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Erro</h2>
          <p className="mb-4">{errorMsg}</p>
          <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse">Conectando à sala {roomId}...</p>
      </div>
    );
  }

  const myId = socket.id;
  const isCreator = gameState.creatorId === myId;
  const playersList = Object.values(gameState.players);

  const handleStartGame = () => {
    socket.send(JSON.stringify({ type: "start_game" }));
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-zinc-50 dark:bg-black">
      <header className="w-full max-w-3xl flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-bold">Sala: <span className="text-primary tracking-widest">{roomId}</span></h1>
          <p className="text-sm text-muted-foreground">Status: {gameState.status === 'lobby' ? 'Aguardando jogadores' : 'Em jogo'}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>Sair da Sala</Button>
      </header>

      <main className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LOBBY / JOGADORES */}
        <div className="col-span-1 md:col-span-2 bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Jogadores ({playersList.length})</h2>
            {isCreator && gameState.status === 'lobby' && (
              <Button onClick={handleStartGame}>Iniciar Jogo</Button>
            )}
          </div>
          
          <ul className="space-y-2">
            {playersList.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {p.id === myId && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Você</span>}
                  {p.isCreator && <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">Líder</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ÁREA DE STATUS/JOGO (Placeholder) */}
        <div className="col-span-1 bg-card border rounded-lg p-6 shadow-sm flex flex-col items-center justify-center text-center">
          {gameState.status === 'lobby' ? (
            <div className="text-muted-foreground">
              <p className="mb-2">Aguardando o líder iniciar a partida...</p>
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="text-green-600">
              <h3 className="font-bold text-xl mb-2">Jogo Iniciado!</h3>
              <p className="text-sm">Área do jogo será implementada aqui.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
