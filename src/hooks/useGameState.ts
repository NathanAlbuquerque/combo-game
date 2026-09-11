"use client";

import { useState, useEffect, useCallback } from "react";
import usePartySocket from "partysocket/react";
import { GameState, ServerMessage, RoomSettings, ClientMessage } from "@/types/game";
import { ReactionEvent } from "@/components/game/FloatingReactionsOverlay";
import { TOAST_SHORT_DURATION_MS } from "@/constants";

interface UseGameStateOptions {
  roomId: string;
  playerName: string;
  playerId: string;
  onReactionReceived?: (reaction: ReactionEvent) => void;
}

export function useGameState({
  roomId,
  playerName,
  playerId,
  onReactionReceived,
}: UseGameStateOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const socket = usePartySocket({
    host:
      process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
      (typeof window !== "undefined"
        ? window.location.host
        : "combo.nathanalbuquerque.partykit.dev"),
    room: roomId,
    query: {
      playerId,
      playerName,
    },
    onMessage(event) {
      const data: ServerMessage = JSON.parse(event.data);
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
        if (onReactionReceived) {
          onReactionReceived({
            id: data.id,
            emoji: data.emoji,
            senderName: data.senderName,
          });
        }
      }
    },
  });

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), TOAST_SHORT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    if (playerName && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", name: playerName, playerId }));
    }
  }, [playerName, socket, playerId]);

  const send = useCallback((msg: ClientMessage) => {
    socket.send(JSON.stringify(msg));
  }, [socket]);

  const startGame = useCallback(() => send({ type: "start_game" }), [send]);
  const drawCard = useCallback(() => send({ type: "draw_card" }), [send]);
  const playCard = useCallback((cardId: string, targetId?: string) => {
    send({ type: "play_card", cardId, targetId, targetPlayerId: targetId });
  }, [send]);
  const discardCard = useCallback((cardId: string) => {
    send({ type: "discard_card", cardId });
  }, [send]);
  const resolvePendingAction = useCallback((cardId: string) => {
    send({ type: "resolve_pending_action", cardId });
  }, [send]);
  const skipExtraPlay = useCallback(() => send({ type: "skip_extra_play" }), [send]);
  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    send({ type: "update_room_settings", settings });
  }, [send]);
  const sendReaction = useCallback((emoji: string) => {
    send({ type: "send_reaction", emoji });
  }, [send]);
  const returnToLobby = useCallback(() => send({ type: "return_to_lobby" }), [send]);

  return {
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
  };
}
