"use client";

import { useState, useEffect, useCallback } from "react";
import usePartySocket from "partysocket/react";
import { GameState, ServerMessage, RoomSettings, ClientMessage } from "@/types/game";
import { ReactionEvent } from "@/components/game/FloatingReactionsOverlay";
import { DEFAULT_PARTYKIT_HOST, TOAST_SHORT_DURATION_MS } from "@/constants";

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

  const partykitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || DEFAULT_PARTYKIT_HOST;

  const socket = usePartySocket({
    host: partykitHost,
    room: roomId,
    query: {
      playerId,
      playerName,
    },
    onOpen(event) {
      setErrorMsg(null);
      const name = playerName?.trim();
      const pId = playerId?.trim();
      if (name) {
        (event.target as WebSocket).send(
          JSON.stringify({ type: "join", name, playerId: pId })
        );
      }
    },
    onMessage(event) {
      try {
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
      } catch (err) {
        console.error("Erro ao decodificar mensagem do servidor:", err);
      }
    },
    onClose(event) {
      if (event.code === 1008) {
        const message = event.reason || "Este nome já está em uso nesta sala. Escolha outro!";
        setErrorMsg(message);
        setToastMsg(message);
        setGameState(null);
      } else if (!gameState && event.code !== 1000) {
        setErrorMsg("A conexão com a sala foi encerrada. Tente recarregar a página.");
      }
    },
    onError(event) {
      console.error("PartySocket connection error:", event);
      setGameState((prev) => {
        if (!prev) {
          setErrorMsg("Não foi possível conectar ao servidor da sala. Verifique sua conexão e tente novamente.");
        }
        return prev;
      });
    },
  });

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), TOAST_SHORT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Se o socket já estiver aberto quando o nome for digitado/alterado
  useEffect(() => {
    if (playerName && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", name: playerName, playerId }));
    }
  }, [playerName, socket, playerId]);

  // Timeout de segurança: Evita spinner infinito caso a rede trave silenciosamente
  useEffect(() => {
    if (gameState || errorMsg || !playerName) return;
    const timer = setTimeout(() => {
      setGameState((prev) => {
        if (!prev) {
          setErrorMsg("Tempo limite de conexão esgotado. Verifique se o servidor está ativo.");
        }
        return prev;
      });
    }, 10000);
    return () => clearTimeout(timer);
  }, [gameState, errorMsg, playerName]);

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
  const addBot = useCallback(() => send({ type: "add_bot" }), [send]);
  const removeBot = useCallback((botId: string) => send({ type: "remove_bot", botId }), [send]);

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
    addBot,
    removeBot,
  };
}
