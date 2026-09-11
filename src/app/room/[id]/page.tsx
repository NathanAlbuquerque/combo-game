"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGameState, useReactions, useTurnTimer } from "@/hooks";
import {
  GameBoard,
  LobbyView,
  GameOverView,
  FloatingReactionsOverlay,
  ShareRoomModal,
  RoomSettingsModal,
  MatchStatsModal,
} from "@/components/game";
import { STORAGE_KEYS, AUTO_START_COUNTDOWN_SECONDS } from "@/constants";

function getOrCreatePlayerId(roomId: string): string {
  if (typeof window === "undefined") return "";
  const key = `${STORAGE_KEYS.PLAYER_ID_PREFIX}${roomId}`;
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

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [stablePlayerId] = useState(() => getOrCreatePlayerId(roomId));

  // Hook desacoplado de reações com emojis flutuantes
  const { activeReactions, addReaction } = useReactions();

  // Hook desacoplado de gerenciamento do GameState e WebSocket
  const {
    gameState,
    socket,
    errorMsg,
    toastMsg,
    startGame,
    drawCard,
    playCard,
    discardCard,
    resolvePendingAction,
    skipExtraPlay,
    updateSettings,
    sendReaction,
    returnToLobby,
  } = useGameState({
    roomId,
    playerName,
    playerId: stablePlayerId,
    onReactionReceived: addReaction,
  });

  const autoStartAt = gameState?.status === "lobby" ? gameState.autoStartAt : undefined;
  const { remainingSeconds: autoStartSeconds } = useTurnTimer({
    enabled: Boolean(autoStartAt),
    turnExpiresAt: autoStartAt,
    duration: AUTO_START_COUNTDOWN_SECONDS,
    isActive: gameState?.status === "lobby",
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) {
      setNameError("Por favor, digite seu nome.");
      return;
    }
    if (trimmed.length > 15) {
      setNameError("O nome deve ter no máximo 15 caracteres.");
      return;
    }
    setPlayerName(trimmed);
  };

  // TELA DE ENTRADA / DIGITAR NICK
  if (!playerName) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center p-4 font-sans">
        <div className="bg-card text-card-foreground border p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-5 animate-in zoom-in duration-300">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black text-foreground">Como quer ser chamado?</h1>
            <p className="text-xs text-muted-foreground">
              Entrando na sala <strong className="text-primary font-mono">#{roomId}</strong>
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Ex: Joãozinho, Maria..."
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  setNameError("");
                }}
                maxLength={15}
                className="w-full px-4 py-3 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold"
                autoFocus
              />
              {nameError && (
                <p className="text-destructive text-xs text-center mt-1.5 font-semibold">
                  {nameError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full font-black h-11 text-sm shadow-md cursor-pointer">
              Entrar na Sala
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // TELA DE ERRO DE CONEXÃO
  if (!gameState && errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 font-sans space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl max-w-sm text-center space-y-3">
          <p className="text-destructive font-bold text-sm">{errorMsg}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem(`${STORAGE_KEYS.PLAYER_ID_PREFIX}${roomId}`);
              router.push("/");
            }}
            className="cursor-pointer font-bold text-xs"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  // TELA DE CARREGAMENTO
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white font-sans space-y-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-zinc-400 animate-pulse">Conectando à sala #{roomId}...</p>
      </div>
    );
  }

  const myId = stablePlayerId && gameState.players[stablePlayerId] ? stablePlayerId : socket.id;

  // ESTADO: LOBBY
  if (gameState.status === "lobby") {
    const isCreator = gameState.creatorId === myId;
    const playersList = Object.values(gameState.players);

    return (
      <>
        <LobbyView
          roomId={roomId}
          isCreator={isCreator}
          playersList={playersList}
          myId={myId}
          roomSettings={gameState.roomSettings}
          autoStartSeconds={autoStartSeconds}
          onStartGame={startGame}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onLeaveRoom={() => router.push("/")}
        />
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
          onUpdateSettings={updateSettings}
        />
      </>
    );
  }

  // ESTADO: FINISHED
  if (gameState.status === "finished") {
    const winner = gameState.winnerId ? gameState.players[gameState.winnerId] : null;
    const isMe = winner?.id === myId;
    const isLeader = gameState.creatorId === myId;

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
      <>
        <GameOverView
          winner={winner}
          isMe={isMe}
          isLeader={isLeader}
          categories={catsArray}
          onOpenStats={() => setIsStatsOpen(true)}
          onReturnToLobby={() => {
            setIsStatsOpen(false);
            returnToLobby();
          }}
        />
        <MatchStatsModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          stats={gameState.stats}
          winnerId={gameState.winnerId}
          players={gameState.players}
        />
      </>
    );
  }

  // ESTADO: PLAYING
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
        onDraw={drawCard}
        onPlay={playCard}
        onDiscard={discardCard}
        onResolvePendingAction={resolvePendingAction}
        onSkipExtraPlay={skipExtraPlay}
        onUpdateSettings={updateSettings}
        onSendReaction={sendReaction}
      />
      <FloatingReactionsOverlay reactions={activeReactions} />
    </>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 font-sans">
          <p className="animate-pulse text-zinc-400 text-xs">Carregando sala...</p>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
