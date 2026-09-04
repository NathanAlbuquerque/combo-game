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

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: roomId,
    onOpen(e) {
      if (playerName) {
        socket.send(JSON.stringify({ type: "join", name: playerName }));
      }
    },
    onMessage(event) {
      const data = JSON.parse(event.data) as ServerMessage;
      if (data.type === "error") {
        setToastMsg(data.message);
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
  const handlePlay = (cardId: string, targetId?: string) => socket.send(JSON.stringify({ type: "play_card", cardId, targetId }));
  const handleTrade = (targetPlayerId: string) => socket.send(JSON.stringify({ type: "trade_card", targetPlayerId }));
  const handleDiscard = (cardId: string) => socket.send(JSON.stringify({ type: "discard_card", cardId }));

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
    
    // Pegar categorias únicas do vencedor (ou de coringas)
    const collectedCategories = new Set<string>();
    let jokersCount = 0;
    winner?.objectArea.forEach(c => {
      if (c.type === 'object' && c.category) collectedCategories.add(c.category);
      if (c.type === 'joker') jokersCount++;
    });
    
    const catsArray = Array.from(collectedCategories);
    for (let i = 0; i < jokersCount; i++) {
       catsArray.push("CARTA CORINGA");
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-50 dark:bg-black p-4">
        <div className="bg-card text-card-foreground border p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-500">
          <span className="text-6xl mb-2">{isMe ? "🎉" : "🏆"}</span>
          <h2 className="text-3xl font-black text-primary uppercase tracking-wider text-center">Fim de Jogo!</h2>
          
          <div className="my-2 py-4 border-y border-border w-full text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">O Vencedor é</p>
            <p className="text-4xl font-black text-foreground truncate px-2">{winner?.name}</p>
          </div>
          
          {catsArray.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-2">Categorias Reunidas</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {catsArray.map((cat, i) => (
                  <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-full ${cat === 'CARTA CORINGA' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white' : 'bg-primary/10 text-primary'}`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isMe && <p className="text-sm text-green-700 font-bold bg-green-100 px-4 py-2 mt-2 rounded-full uppercase tracking-wider animate-pulse text-center">Você venceu o Combo!</p>}
          
          <Button onClick={() => socket.send(JSON.stringify({ type: "return_to_lobby" }))} className="mt-6 w-full" size="lg">Voltar ao Lobby</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-top-4 font-semibold text-sm">
          {toastMsg}
        </div>
      )}
      <GameBoard 
        state={gameState} 
        myId={myId} 
        onDraw={handleDraw} 
        onPlay={handlePlay}
        onTrade={handleTrade}
        onDiscard={handleDiscard}
      />
    </>
  );
}
