"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = (searchParams.get("room") || searchParams.get("code") || "").toUpperCase();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState(initialRoom);
  const [error, setError] = useState("");

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError("Por favor, digite seu nome primeiro.");
      return;
    }
    const code = generateRoomCode();
    router.push(`/room/${code}?name=${encodeURIComponent(playerName.trim())}`);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError("Por favor, digite seu nome primeiro.");
      return;
    }
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Por favor, digite um código de sala válido (6 caracteres).");
      return;
    }
    router.push(`/room/${cleanCode}?name=${encodeURIComponent(playerName.trim())}`);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
      <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 sm:p-8 overflow-hidden border-x border-border/40">
        <main className="w-full flex flex-col items-center justify-center gap-6 text-card-foreground">
          <div className="text-center">
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-3">
              Cidadania & Segurança Digital
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Combo
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Jogo pedagógico de cartas multiplayer
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-sm font-medium">
                Seu Nome
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError("");
                }}
                placeholder="Ex: Maria"
                className="w-full p-2.5 rounded-xl border bg-background text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="pt-4 border-t space-y-4">
              <Button onClick={handleCreateRoom} className="w-full font-bold h-11 text-base">
                Criar Nova Sala
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-semibold">Ou</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  maxLength={6}
                  placeholder="CÓDIGO (6)"
                  className="w-full p-2.5 rounded-xl border bg-background uppercase text-center font-mono font-bold tracking-widest"
                />
                <Button onClick={handleJoinRoom} variant="secondary" className="font-bold h-11 px-5">
                  Entrar
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans">Carregando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
