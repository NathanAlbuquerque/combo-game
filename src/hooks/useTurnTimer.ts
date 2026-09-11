"use client";

import { useState, useEffect } from "react";

interface UseTurnTimerOptions {
  enabled?: boolean;
  turnExpiresAt?: number;
  duration?: number;
  isActive?: boolean;
}

export function useTurnTimer({
  enabled = false,
  turnExpiresAt,
  duration = 30,
  isActive = true,
}: UseTurnTimerOptions) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || !turnExpiresAt || !isActive) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [enabled, turnExpiresAt, isActive]);

  const remainingSeconds = enabled && turnExpiresAt && isActive
    ? Math.max(0, Math.ceil((turnExpiresAt - now) / 1000))
    : null;

  const progressPercentage = remainingSeconds !== null && duration > 0
    ? Math.min(100, Math.max(0, (remainingSeconds / duration) * 100))
    : 0;

  return { remainingSeconds, progressPercentage };
}
