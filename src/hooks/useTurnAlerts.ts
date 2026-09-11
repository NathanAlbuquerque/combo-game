"use client";

import { useState, useRef, useEffect } from "react";

function playTurnNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Arpejo senoidal C5 (523.25 Hz) -> G5 (783.99 Hz) sintetizado nativamente (~0.35s)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.16, gain: 0.2 },
      { freq: 783.99, start: 0.14, duration: 0.22, gain: 0.25 },
    ];

    notes.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0, now + start);
      gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch (err) {
    console.debug("Web Audio unavailable or blocked", err);
  }
}

function triggerTurnHaptics() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignora silenciosamente se o dispositivo não suportar vibração
    }
  }
}

export function useTurnAlerts(isMyTurnActive: boolean, isMyExtraPlay: boolean) {
  const [showTurnFlash, setShowTurnFlash] = useState(false);
  const wasTurnActiveRef = useRef(false);
  const wasExtraPlayRef = useRef(false);

  useEffect(() => {
    const becameMyTurn = isMyTurnActive && !wasTurnActiveRef.current;
    const becameExtraPlay = isMyExtraPlay && !wasExtraPlayRef.current;

    if (becameMyTurn || becameExtraPlay) {
      playTurnNotificationSound();
      triggerTurnHaptics();
      setShowTurnFlash(true);
      const timer = setTimeout(() => setShowTurnFlash(false), 1200);
      return () => clearTimeout(timer);
    }

    wasTurnActiveRef.current = isMyTurnActive;
    wasExtraPlayRef.current = isMyExtraPlay;
  }, [isMyTurnActive, isMyExtraPlay]);

  return { showTurnFlash };
}
