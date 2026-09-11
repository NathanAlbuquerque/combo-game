"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicRoomsList } from "@/components/game/PublicRoomsList";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function JoinRoomModal({
  isOpen,
  onClose,
  initialCode = "",
}: JoinRoomModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4 || cleanCode.length > 6) {
      setError("Digite um código válido de 4 a 6 caracteres.");
      return;
    }
    onClose();
    router.push(`/room/${cleanCode}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Entrar em uma Sala"
    >
      <div className="relative flex flex-col max-w-sm sm:max-w-md w-full bg-card border border-border/70 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Entrar em uma Sala
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Digite o código da mesa ou selecione uma aberta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Formulário com Código */}
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label
                htmlFor="joinRoomCode"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
              >
                Código da Sala
              </label>
              <div className="flex gap-2">
                <input
                  id="joinRoomCode"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    setError("");
                  }}
                  maxLength={6}
                  placeholder="EX: ABC123"
                  className="flex-1 p-2.5 rounded-xl border bg-background uppercase text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <Button
                  type="submit"
                  className="font-bold h-10 px-4 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
          </form>

          {/* Divisor */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-card px-2.5 text-muted-foreground font-semibold">
                ou escolha uma sala aberta
              </span>
            </div>
          </div>

          {/* Lista de Salas Abertas */}
          <div className="pt-0.5">
            <PublicRoomsList />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="w-full font-bold text-xs h-9 cursor-pointer"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
