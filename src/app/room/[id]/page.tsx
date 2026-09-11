"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { BarChart3, Settings, QrCode, Users, LogOut } from "lucide-react";
import { GameState, ServerMessage, RoomSettings } from "@/types/game";
import { GameBoard } from "@/components/game/GameBoard";
import { CopyRoomButton } from "@/components/game/CopyRoomButton";
import { MatchStatsModal } from "@/components/game/MatchStatsModal";
import { ShareRoomModal } from "@/components/game/ShareRoomModal";
import { RoomSettingsModal } from "@/components/game/RoomSettingsModal";
import { FloatingReactionsOverlay, ActiveReaction } from "@/components/game/FloatingReactionsOverlay";
import { cn } from "@/lib/utils";

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ActiveReaction[]>([]);
  const [stablePlayerId] = useState(() => getOrCreatePlayerId(roomId));
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const autoStartAt = gameState?.status === "lobby" ? gameState.autoStartAt : undefined;

  useEffect(() => {
    if (!autoStartAt) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [autoStartAt]);

  const autoStartSeconds = autoStartAt
    ? Math.max(0, Math.ceil((autoStartAt - currentTime) / 1000))
    : null;

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
      } else if (data.type === "reaction_received") {
        const item: ActiveReaction = {
          id: data.id,
          emoji: data.emoji,
          senderName: data.senderName,
          xOffset: (Math.random() - 0.5) * 50,
          x1: (Math.random() - 0.5) * 36,
          x2: (Math.random() - 0.5) * 44,
          x3: (Math.random() - 0.5) * 36,
          x4: (Math.random() - 0.5) * 20,
          rot: (Math.random() - 0.5) * 26,
        };
        setActiveReactions((prev) => [...prev.slice(-20), item]);
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((r) => r.id !== item.id));
        }, 2600);
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
            <p className="mb-4 text-sm font-medium">{errorMsg}</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setErrorMsg(null);
                  setPlayerName("");
                  setInputName("");
                  router.replace(`/room/${roomId}`);
                }}
                className="w-full font-bold cursor-pointer"
              >
                Escolher Outro Nome
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="w-full text-xs text-destructive-foreground/80 hover:text-destructive-foreground cursor-pointer"
              >
                Voltar para o Início
              </Button>
            </div>
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
  const handleDiscard = (cardId: string) =>
    socket.send(JSON.stringify({ type: "discard_card", cardId }));
  const handleResolvePendingAction = (cardId: string) =>
    socket.send(JSON.stringify({ type: "resolve_pending_action", cardId }));
  const handleSkipExtraPlay = () =>
    socket.send(JSON.stringify({ type: "skip_extra_play" }));
  const handleUpdateSettings = (settings: Partial<RoomSettings>) =>
    socket.send(JSON.stringify({ type: "update_room_settings", settings }));
  const handleSendReaction = (emoji: string) =>
    socket.send(JSON.stringify({ type: "send_reaction", emoji }));

  // ESTADO: LOBBY
  if (gameState.status === "lobby") {
    const isCreator = gameState.creatorId === myId;
    const playersList = Object.values(gameState.players);

    return (
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans relative">
        <div className="w-full flex justify-center items-stretch h-[100dvh] max-h-[100dvh]">
          {/* ========================================================= */}
          {/* FLANCO ESQUERDO DO LOBBY (Desktop: hidden lg:flex) */}
          {/* ========================================================= */}
          <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
            <div className="space-y-3 shrink-0">
              {/* Código da Sala e Ações de Compartilhamento */}
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Código da Sala
                  </span>
                  <span className="font-mono font-black text-sm text-zinc-100 tracking-widest bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-700/80 select-all shadow-inner">
                    #{roomId}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full justify-center font-bold text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 cursor-pointer gap-1.5 shadow-2xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code / Convidar</span>
                  </Button>
                  <CopyRoomButton
                    roomId={roomId}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center font-bold text-xs h-8 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border-zinc-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Regras e Metadados da Sala */}
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">
                  Regras da Sala
                </span>
                <div className="text-xs space-y-2 text-zinc-300">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400 text-[11px]">Participantes:</span>
                    <span className="font-mono font-bold text-zinc-100 text-xs">{playersList.length} / 6</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400 text-[11px]">Anti-Stall:</span>
                    <span className={cn(
                      "font-bold text-[11px]",
                      gameState.roomSettings?.turnTimerEnabled ? "text-primary" : "text-zinc-500"
                    )}>
                      {gameState.roomSettings?.turnTimerEnabled
                        ? `${gameState.roomSettings.turnTimerDuration}s / turno`
                        : "Desativado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px]">Vitória:</span>
                    <span className="font-bold text-zinc-100 text-[11px]">5 Objetos</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* CONTÊINER CENTRAL DO LOBBY (Mobile & Desktop) */}
          {/* ========================================================= */}
          <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between p-4 sm:p-5 overflow-hidden border-x border-border/40 select-none shrink-0">
            {/* Topo Mobile (lg:hidden) */}
            <header className="lg:hidden w-full flex items-center justify-between gap-2 pb-3 border-b shrink-0">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-700/80">
                <span className="font-mono font-black text-sm text-zinc-100 tracking-wider select-all">
                  #{roomId}
                </span>
                <CopyRoomButton roomId={roomId} size="sm" iconOnly className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="h-8 px-2 text-xs font-bold cursor-pointer"
                  title="Configurações da sala"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="h-8 px-2 text-xs font-bold cursor-pointer text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
                  title="Compartilhar com QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="text-xs text-muted-foreground hover:text-destructive h-8 px-2 cursor-pointer"
                >
                  Sair
                </Button>
              </div>
            </header>

            {/* Conteúdo Central: Conectar amigos, QR Code e Lista de Participantes */}
            <main className="w-full flex-1 flex flex-col justify-between py-2 sm:py-3 space-y-3 min-h-0 overflow-y-auto">
              {/* Banner de Início Automático */}
              {autoStartSeconds !== null && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse text-center shrink-0">
                  <span>⏳ Partida iniciando automaticamente em {autoStartSeconds}s... Preparem-se!</span>
                </div>
              )}

              {/* Card de Convidar / QR Code de Onboarding */}
              <div className="p-3.5 bg-muted/60 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-xs">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                    Convidar Jogadores
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Código <strong className="font-mono text-foreground font-bold">#{roomId}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                    className="font-bold text-xs gap-1.5 h-8 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    <span>QR Code</span>
                  </Button>
                  <CopyRoomButton roomId={roomId} size="sm" variant="secondary" className="flex-1 sm:flex-initial" />
                </div>
              </div>

              {/* Lista de Participantes Conectados */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border/50 shrink-0">
                  <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span>Participantes Conectados ({playersList.length})</span>
                  </h2>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Min. 2 jogadores
                  </span>
                </div>

                <ul className="space-y-2 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {playersList.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-xs transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20 shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm block truncate">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {p.isCreator ? "Criador da sala" : "Participante"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
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

              {/* Botão de Iniciar Jogo no Mobile (lg:hidden) */}
              <div className="lg:hidden pt-2 border-t shrink-0">
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

            <ShareRoomModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              roomId={roomId}
            />
            <RoomSettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              settings={gameState.roomSettings}
              isLeader={isCreator}
              onUpdateSettings={handleUpdateSettings}
            />
          </div>

          {/* ========================================================= */}
          {/* FLANCO DIREITO DO LOBBY (Desktop: hidden lg:flex) */}
          {/* ========================================================= */}
          <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
            <div className="space-y-3 shrink-0">
              <div className="px-1 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Ações do Lobby
                </span>
              </div>

              {/* Botão Iniciar Jogo (ou status de espera se não for criador) */}
              {isCreator ? (
                <Button
                  onClick={handleStartGame}
                  disabled={playersList.length < 2}
                  className="w-full h-14 font-black text-sm tracking-wide shadow-xl cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl flex flex-col items-center justify-center gap-0.5"
                >
                  <span>{playersList.length < 2 ? "Aguardando Jogadores" : "Iniciar Jogo Agora"}</span>
                  <span className="text-[10px] font-normal opacity-80">
                    {playersList.length < 2 ? "Mínimo 2 jogadores" : `${playersList.length} conectados`}
                  </span>
                </Button>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1.5 shadow-md">
                  <span className="text-xs font-black text-zinc-200 block">Aguardando o Líder</span>
                  <span className="text-[11px] text-zinc-400 block animate-pulse">
                    O líder da sala iniciará o jogo em breve...
                  </span>
                </div>
              )}

              {/* Botão Configurações da Sala */}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-primary/50 text-left transition-all cursor-pointer shadow-md group"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-700/20 text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-700/40 group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-primary transition-colors">
                    Configurações
                  </span>
                  <span className="block text-[10px] text-zinc-400 truncate">
                    {gameState.roomSettings?.turnTimerEnabled
                      ? `Anti-Stall: ${gameState.roomSettings.turnTimerDuration}s`
                      : "Anti-Stall e regras"}
                  </span>
                </div>
              </button>
            </div>

            {/* Rodapé com Botão Sair da Sala */}
            <div className="pt-3 border-t border-zinc-800/80 mt-auto">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800/60 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Sala</span>
              </button>
            </div>
          </aside>
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
        onDiscard={handleDiscard}
        onResolvePendingAction={handleResolvePendingAction}
        onSkipExtraPlay={handleSkipExtraPlay}
        onUpdateSettings={handleUpdateSettings}
        onSendReaction={handleSendReaction}
      />
      <FloatingReactionsOverlay reactions={activeReactions} />
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
