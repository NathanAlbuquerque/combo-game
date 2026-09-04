"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { GameState, ServerMessage } from "@/types/game";
import { GameBoard } from "@/components/game/GameBoard";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const roomId = params.id as string;
  const playerName = searchParams.get("name") || "";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      router.push("/");
    }
  }, [playerName, router]);

  const socket = usePartySocket({
    host: "localhost:1999",
    room: roomId,
    onOpen(e) {
      if (playerName) {
        socket.send(JSON.stringify({ type: "join", name: playerName }));
      }
    },
    onMessage(event) {
      const data = JSON.parse(event.data) as ServerMessage;
      if (data.type === "error") {
        alert(data.message); // Usar alert nativo para erros não bloqueantes
        // Se for um erro na entrada, a gente mostra tela de erro.
        // Como não queremos travar a tela inteira por um "Não é seu turno",
        // Só tratamos erro fatal se o gameState estiver nulo
        setGameState((prev) => {
          if (!prev) setErrorMsg(data.message);
          return prev;
        });
      } else if (data.type === "sync") {
        setGameState(data.state);
        setErrorMsg(null);
      }
    }
  });

  if (errorMsg && !gameState) {
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

  // AÇÕES
  const handleStartGame = () => socket.send(JSON.stringify({ type: "start_game" }));
  const handleDraw = () => socket.send(JSON.stringify({ type: "draw_card" }));
  const handlePlay = (cardId: string) => socket.send(JSON.stringify({ type: "play_card", cardId }));
  const handleTrade = (targetPlayerId: string) => socket.send(JSON.stringify({ type: "trade_card", targetPlayerId }));

  // ESTADO: LOBBY
  if (gameState.status === "lobby") {
    const isCreator = gameState.creatorId === myId;
    const playersList = Object.values(gameState.players);

    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-zinc-50 dark:bg-black">
        <header className="w-full max-w-3xl flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold">Sala: <span className="text-primary tracking-widest">{roomId}</span></h1>
            <p className="text-sm text-muted-foreground">Aguardando jogadores...</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>Sair da Sala</Button>
        </header>

        <main className="w-full max-w-3xl bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Jogadores ({playersList.length})</h2>
            {isCreator && (
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
        </main>
      </div>
    );
  }

  // ESTADO: FINISHED
  if (gameState.status === "finished") {
    const winner = gameState.winnerId ? gameState.players[gameState.winnerId] : null;
    const isMe = winner?.id === myId;
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-50 p-4">
        <div className="bg-card text-card-foreground border p-8 rounded-2xl max-w-sm text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-500">
          <span className="text-6xl mb-4">{isMe ? "🎉" : "🏆"}</span>
          <h2 className="text-3xl font-black text-primary">Temos um Vencedor!</h2>
          <p className="text-lg">
            O jogador <span className="font-bold">{winner?.name}</span> conseguiu montar o Combo primeiro!
          </p>
          {isMe && <p className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full mt-2">Parabéns, você ganhou!</p>}
          <Button onClick={() => router.push("/")} className="mt-6 w-full" size="lg">Sair da Partida</Button>
        </div>
      </div>
    );
  }

  // ESTADO: PLAYING
  return (
    <GameBoard 
      state={gameState} 
      myId={myId} 
      onDraw={handleDraw} 
      onPlay={handlePlay}
      onTrade={handleTrade}
    />
  );
}
