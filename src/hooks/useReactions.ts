"use client";

import { useState, useCallback } from "react";
import { ActiveReaction, ReactionEvent } from "@/components/game/FloatingReactionsOverlay";
import { REACTION_LIFETIME_MS } from "@/constants";

export function useReactions() {
  const [activeReactions, setActiveReactions] = useState<ActiveReaction[]>([]);

  const addReaction = useCallback((event: ReactionEvent) => {
    const item: ActiveReaction = {
      id: event.id,
      emoji: event.emoji,
      senderName: event.senderName,
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
    }, REACTION_LIFETIME_MS);
  }, []);

  return { activeReactions, addReaction };
}
