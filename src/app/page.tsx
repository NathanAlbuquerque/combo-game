"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gamepad2, DoorOpen, Trophy, BookOpen, Sparkles, ChevronRight } from "lucide-react";
import { LeaderboardModal } from "@/components/game/LeaderboardModal";
import { JoinRoomModal } from "@/components/game/JoinRoomModal";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = (searchParams.get("room") || searchParams.get("code") || "").toUpperCase();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(() => Boolean(initialRoom));
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
      <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between p-6 sm:p-8 overflow-y-auto border-x border-border/40">
        {/* Header com Identidade Visual */}
        <header className="w-full flex flex-col items-center text-center pt-8 sm:pt-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] font-bold uppercase tracking-widest mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cidadania & Segurança Digital</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-foreground drop-shadow-xs">
            Combo
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium max-w-[280px]">
            Jogo pedagógico de cartas multiplayer
          </p>
        </header>

        {/* Menu Principal com 4 Ações Claras */}
        <main className="w-full space-y-3.5 my-auto py-8">
          {/* Botão 1: Criar Sala (Destaque Primário) */}
          <button
            type="button"
            onClick={handleCreateRoom}
            className="w-full group relative flex items-center justify-between p-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all cursor-pointer text-left overflow-hidden border border-primary-foreground/10"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight">
                  Criar Sala
                </span>
                <span className="block text-xs font-normal opacity-90 truncate">
                  Inicie uma nova partida e convide amigos
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </button>

          {/* Botão 2: Entrar em Sala */}
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full group flex items-center justify-between p-4 rounded-2xl bg-card hover:bg-muted/60 active:scale-[0.98] border-2 border-border/80 hover:border-primary/40 text-card-foreground font-bold shadow-xs transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight text-foreground">
                  Entrar em Sala
                </span>
                <span className="block text-xs font-normal text-muted-foreground truncate">
                  Por código da mesa ou lista aberta
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </button>

          {/* Botão 3: Ranking */}
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="w-full group flex items-center justify-between p-4 rounded-2xl bg-card hover:bg-muted/60 active:scale-[0.98] border border-border/80 hover:border-amber-500/40 text-card-foreground font-bold shadow-xs transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight text-foreground">
                  Ranking
                </span>
                <span className="block text-xs font-normal text-muted-foreground truncate">
                  Classificação global diária e recordes
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </button>

          {/* Botão 4: Cartas (Enciclopédia) */}
          <Link
            href="/cartas"
            className="w-full group flex items-center justify-between p-4 rounded-2xl bg-card hover:bg-muted/60 active:scale-[0.98] border border-border/80 hover:border-blue-500/40 text-card-foreground font-bold shadow-xs transition-all cursor-pointer text-left block"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight text-foreground">
                  Cartas
                </span>
                <span className="block text-xs font-normal text-muted-foreground truncate">
                  Enciclopédia completa de cartas e efeitos
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </Link>
        </main>

        {/* Rodapé sutil */}
        <footer className="w-full pb-4 pt-2 text-center text-[11px] text-muted-foreground">
          Combo The Game • Conscientização Digital
        </footer>

        {/* Modais */}
        <JoinRoomModal
          key={isJoinModalOpen ? "open" : "closed"}
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          initialCode={initialRoom}
        />

        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-muted-foreground font-sans text-sm">
          Carregando...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
