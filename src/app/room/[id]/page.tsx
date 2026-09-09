"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { GameState, ServerMessage } from "@/types/game";
import { GameBoard } from "@/components/game/GameBoard";
import { CopyRoomButton } from "@/components/game/CopyRoomButton";
import { MatchStatsModal } from "@/components/game/MatchStatsModal";

function getOrCreatePlayerId(roomId: string): string {
  if (typeof window === "undefined") return "";
  const key = `combo_player_id_${roomId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `usr_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

function RoomContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const roomId = (params.id as string)?.toUpperCase() || "";
  const initialName = searchParams.get("name") || "";

  const [playerName, setPlayerName] = useState(initialName);
  const [inputName, setInputName] = useState("");
  const [nameError, setNameError] = useState("");

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stablePlayerId] = useState(() => getOrCreatePlayerId(roomId));

  const playerNameRef = useRef(playerName);
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: roomId,
    onOpen() {
      if (playerNameRef.current) {
        socket.send(
          JSON.stringify({
            type: "join",
            name: playerNameRef.current,
            playerId: getOrCreatePlayerId(roomId),
          })
        );
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

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    if (playerName && socket.readyState === WebSocket.OPEN) {
      const pid = stablePlayerId || getOrCreatePlayerId(roomId);
      socket.send(JSON.stringify({ type: "join", name: playerName, playerId: pid }));
    }
  }, [playerName, socket, stablePlayerId, roomId]);

  const handleJoinWithName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputName.trim();
    if (!clean) {
      setNameError("Por favor, digite seu nome primeiro.");
      return;
    }
    setPlayerName(clean);
    router.replace(`/room/${roomId}?name=${encodeURIComponent(clean)}`);
    const pid = stablePlayerId || getOrCreatePlayerId(roomId);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", name: clean, playerId: pid }));
    }
  };

  // FLUXO DE ENTRADA COM NOME (para quem acessa diretamente por link de compartilhamento)
  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4 font-sans">
        <main className="w-full max-w-md bg-card text-card-foreground p-8 rounded-xl shadow-sm border flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Combo</h1>
            <p className="text-muted-foreground text-sm">
              Você foi convidado para a sala{" "}
              <span className="font-mono font-bold text-primary tracking-widest">{roomId}</span>
            </p>
          </div>

          <form onSubmit={handleJoinWithName} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-sm font-medium">
                Digite seu nome para entrar:
              </label>
              <input
                id="playerName"
                type="text"
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  setNameError("");
                }}
                placeholder="Ex: Maria"
                className="w-full p-2 rounded border bg-background"
                autoFocus
              />
              {nameError && <p className="text-sm text-red-500 font-medium">{nameError}</p>}
            </div>

            <Button type="submit" className="w-full">
              Entrar na Sala
            </Button>
          </form>

          <div className="text-center pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              Voltar para o Início
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4">
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <p className="animate-pulse">Conectando à sala {roomId}...</p>
      </div>
    );
  }

  const myId = (stablePlayerId && gameState?.players[stablePlayerId])
    ? stablePlayerId
    : socket.id;

  // AÇÕES
  const handleStartGame = () => socket.send(JSON.stringify({ type: "start_game" }));
  const handleDraw = () => socket.send(JSON.stringify({ type: "draw_card" }));
  const handlePlay = (cardId: string, targetId?: string) =>
    socket.send(JSON.stringify({ type: "play_card", cardId, targetId, targetPlayerId: targetId }));
  const handleTrade = (targetPlayerId: string) =>
    socket.send(JSON.stringify({ type: "trade_card", targetPlayerId }));
  const handleDiscard = (cardId: string) =>
    socket.send(JSON.stringify({ type: "discard_card", cardId }));
  const handleResolvePendingAction = (cardId: string) =>
    socket.send(JSON.stringify({ type: "resolve_pending_action", cardId }));
  const handleSkipExtraPlay = () =>
    socket.send(JSON.stringify({ type: "skip_extra_play" }));

  // ESTADO: LOBBY
  if (gameState.status === "lobby") {
    const isCreator = gameState.creatorId === myId;
    const playersList = Object.values(gameState.players);

    return (
      <div className="flex flex-col items-center p-4 min-h-screen bg-zinc-50 dark:bg-black font-sans">
        <header className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Sala: <span className="text-primary tracking-widest font-mono">{roomId}</span>
            </h1>
            <p className="text-sm text-muted-foreground">Aguardando jogadores...</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyRoomButton roomId={roomId} showTextOnMobile />
            <Button variant="outline" onClick={() => router.push("/")}>
              Sair da Sala
            </Button>
          </div>
        </header>

        <main className="w-full max-w-3xl bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 mb-6 bg-muted/60 border rounded-lg">
            <div className="text-sm text-muted-foreground">
              Convide amigos para jogar enviando o link direto da sala:
            </div>
            <CopyRoomButton roomId={roomId} size="sm" variant="secondary" showTextOnMobile />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Jogadores ({playersList.length})</h2>
            {isCreator && <Button onClick={handleStartGame}>Iniciar Jogo</Button>}
          </div>

          <ul className="space-y-2">
            {playersList.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {p.id === myId && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Você
                    </span>
                  )}
                  {p.isCreator && (
                    <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                      Líder
                    </span>
                  )}
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

    const collectedCategories = new Set<string>();
    let jokersCount = 0;
    winner?.objectArea.forEach((c) => {
      if (c.type === "object" && c.category) collectedCategories.add(c.category);
      if (c.type === "joker") jokersCount++;
    });

    const catsArray = Array.from(collectedCategories);
    for (let i = 0; i < jokersCount; i++) {
      catsArray.push("CARTA CORINGA");
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-50 dark:bg-black p-4 font-sans">
        <div className="bg-card text-card-foreground border p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-500">
          <span className="text-6xl mb-2">{isMe ? "🎉" : "🏆"}</span>
          <h2 className="text-3xl font-black text-primary uppercase tracking-wider text-center">
            Fim de Jogo!
          </h2>

          <div className="my-2 py-4 border-y border-border w-full text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">
              O Vencedor é
            </p>
            <p className="text-4xl font-black text-foreground truncate px-2">{winner?.name}</p>
          </div>

          {catsArray.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-2">
                Categorias Reunidas
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {catsArray.map((cat, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      cat === "CARTA CORINGA"
                        ? "bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isMe && (
            <p className="text-sm text-green-700 font-bold bg-green-100 px-4 py-2 mt-2 rounded-full uppercase tracking-wider animate-pulse text-center">
              Você venceu o Combo!
            </p>
          )}

          <div className="flex flex-col gap-2.5 w-full mt-6">
            <Button
              onClick={() => setIsStatsOpen(true)}
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-2 font-bold border-2"
            >
              <BarChart3 className="w-5 h-5 text-primary" />
              Ver Estatísticas da Partida
            </Button>

            <Button
              onClick={() => {
                setIsStatsOpen(false);
                socket.send(JSON.stringify({ type: "return_to_lobby" }));
              }}
              className="w-full font-bold"
              size="lg"
            >
              Voltar ao Lobby
            </Button>
          </div>

          <MatchStatsModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            stats={gameState.stats}
            winnerId={gameState.winnerId}
            players={gameState.players}
          />
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
        roomId={roomId}
        onDraw={handleDraw}
        onPlay={handlePlay}
        onTrade={handleTrade}
        onDiscard={handleDiscard}
        onResolvePendingAction={handleResolvePendingAction}
        onSkipExtraPlay={handleSkipExtraPlay}
      />
    </>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black font-sans"><p className="animate-pulse">Carregando sala...</p></div>}>
      <RoomContent />
    </Suspense>
  );
}
