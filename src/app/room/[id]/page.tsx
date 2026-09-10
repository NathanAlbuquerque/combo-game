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
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
        <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center p-6 border-x border-border/40">
          <main className="w-full bg-card text-card-foreground p-6 sm:p-8 rounded-2xl shadow-sm border flex flex-col gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-3">
                Convite de Partida
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Combo</h1>
              <p className="text-muted-foreground text-xs">
                Entrando na sala{" "}
                <span className="font-mono font-bold text-primary tracking-widest">{roomId}</span>
              </p>
            </div>

            <form onSubmit={handleJoinWithName} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                  className="w-full p-2.5 rounded-xl border bg-background text-sm font-medium"
                  autoFocus
                />
                {nameError && <p className="text-xs text-red-500 font-medium">{nameError}</p>}
              </div>

              <Button type="submit" className="w-full font-bold h-11">
                Entrar na Sala
              </Button>
            </form>

            <div className="text-center pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs text-muted-foreground">
                Voltar para o Início
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (errorMsg && !gameState) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
        <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 border-x border-border/40">
          <div className="bg-destructive text-destructive-foreground p-6 rounded-2xl max-w-sm text-center shadow-lg w-full">
            <h2 className="text-xl font-bold mb-2">Erro</h2>
            <p className="mb-4 text-sm">{errorMsg}</p>
            <Button variant="secondary" onClick={() => router.push("/")} className="w-full font-bold">
              Voltar para o Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
        <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 border-x border-border/40">
          <p className="animate-pulse text-muted-foreground text-sm font-medium">Conectando à sala {roomId}...</p>
        </div>
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
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
        <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between p-4 sm:p-6 overflow-hidden border-x border-border/40">
          <header className="w-full flex items-center justify-between gap-2 pb-3 border-b">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Código da Sala</span>
              <h1 className="text-2xl font-black text-primary tracking-widest font-mono">
                {roomId}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <CopyRoomButton roomId={roomId} size="sm" showTextOnMobile={false} />
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs text-muted-foreground">
                Sair
              </Button>
            </div>
          </header>

          <main className="w-full flex-1 flex flex-col justify-between py-4 space-y-4">
            <div className="p-3 bg-muted/60 border rounded-xl flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Convide amigos para jogar:</span>
              <CopyRoomButton roomId={roomId} size="sm" variant="secondary" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Jogadores ({playersList.length})
                </h2>
                <span className="text-[11px] text-muted-foreground">Min. 2 jogadores</span>
              </div>

              <ul className="space-y-2">
                {playersList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{p.name}</span>
                      {p.id === myId && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          Você
                        </span>
                      )}
                      {p.isCreator && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          Líder
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t">
              {isCreator ? (
                <Button 
                  onClick={handleStartGame} 
                  disabled={playersList.length < 2}
                  className="w-full font-black h-12 text-base shadow-lg cursor-pointer"
                >
                  {playersList.length < 2 ? "Aguardando mais jogadores..." : "Iniciar Jogo"}
                </Button>
              ) : (
                <div className="text-center py-2 text-xs text-muted-foreground animate-pulse font-medium">
                  Aguardando o líder iniciar a partida...
                </div>
              )}
            </div>
          </main>
        </div>
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
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
        <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 border-x border-border/40">
          <div className="bg-card text-card-foreground border p-6 sm:p-8 rounded-3xl w-full shadow-lg flex flex-col items-center gap-4 animate-in zoom-in duration-500">
            <span className="text-5xl mb-1">{isMe ? "🎉" : "🏆"}</span>
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider text-center">
              Fim de Jogo!
            </h2>

            <div className="my-1 py-3 border-y border-border w-full text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                O Vencedor é
              </p>
              <p className="text-3xl font-black text-foreground truncate px-2">{winner?.name}</p>
            </div>

            {catsArray.length > 0 && (
              <div className="w-full">
                <p className="text-[11px] font-bold text-muted-foreground uppercase text-center mb-2">
                  Categorias Reunidas
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
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
              <p className="text-xs text-green-700 font-bold bg-green-100 px-3 py-1.5 mt-1 rounded-full uppercase tracking-wider animate-pulse text-center">
                Você venceu o Combo!
              </p>
            )}

            <div className="flex flex-col gap-2.5 w-full mt-4">
              <Button
                onClick={() => setIsStatsOpen(true)}
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2 font-bold border-2 h-11"
              >
                <BarChart3 className="w-4 h-4 text-primary" />
                Ver Estatísticas da Partida
              </Button>

              <Button
                onClick={() => {
                  setIsStatsOpen(false);
                  socket.send(JSON.stringify({ type: "return_to_lobby" }));
                }}
                className="w-full font-bold h-11"
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
