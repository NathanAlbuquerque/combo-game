"use client";

import { useEffect } from "react";
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";
import { Play, ArrowLeft, X, Lock } from "lucide-react";

interface CardPreviewModalProps {
  card: CardType | null;
  isOpen: boolean;
  canPlay?: boolean;
  canPlayReason?: string;
  onClose: () => void;
  onConfirmPlay?: (card: CardType) => void;
}

const TARGET_EFFECTS = [
  "Senha Fraca Detectada",
  "Rede de Apoio",
  "Tomou Block!",
  "Vídeo Deepfake",
  "Esqueceu a Senha",
  "Plágio Detectado",
  "Alerta de Phishing",
  "LI E ACEITO!",
];

export function CardPreviewModal({
  card,
  isOpen,
  canPlay = false,
  canPlayReason,
  onClose,
  onConfirmPlay,
}: CardPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const isTargetEffect =
    card.type === "effect" &&
    Boolean(card.name && TARGET_EFFECTS.includes(card.name));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Inspeção da carta"
    >
      <div className="relative flex flex-col items-center max-w-xs sm:max-w-sm w-full my-auto animate-in zoom-in-95 duration-200">
        {/* Botão Fechar discreto */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-2 sm:-top-3.5 sm:-right-3.5 z-20 w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600/80 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          aria-label="Fechar pré-visualização"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Carta Ampliada */}
        <div className="relative rounded-2xl shadow-2xl transition-transform hover:scale-[1.01] shrink-0">
          <Card card={card} size="large" />
        </div>

        {/* Botões de Ação */}
        {onConfirmPlay ? (
          <div className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-3">
            {/* Botão Secundário: Voltar */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            {/* Botão Principal: Jogar Carta */}
            {canPlay ? (
              <button
                type="button"
                onClick={() => onConfirmPlay(card)}
                className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer border border-emerald-400/40"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span className="truncate">
                  {isTargetEffect ? "Jogar (Escolher Alvo)" : "Jogar Carta"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[11px] sm:text-xs text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 cursor-not-allowed opacity-75 shadow-sm"
                title={canPlayReason || "Não é seu turno"}
              >
                <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{canPlayReason || "Não é seu turno"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full mt-3 sm:mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-zinc-200 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
