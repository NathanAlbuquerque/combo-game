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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-md flex flex-col items-center justify-center gap-8 bg-card text-card-foreground p-8 rounded-xl shadow-sm border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Combo</h1>
          <p className="text-muted-foreground">Multiplayer Real-time Game</p>
        </div>

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label htmlFor="playerName" className="text-sm font-medium">Seu Nome</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError("");
              }}
              placeholder="Ex: João"
              className="w-full p-2 rounded border bg-background"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="pt-4 border-t">
            <Button onClick={handleCreateRoom} className="w-full mb-4">
              Criar Nova Sala
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou</span>
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
                className="w-full p-2 rounded border bg-background uppercase text-center tracking-widest"
              />
              <Button onClick={handleJoinRoom} variant="secondary">
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </main>
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
