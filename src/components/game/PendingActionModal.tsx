"use client";

import { AlertTriangle, FileText } from "lucide-react";
import { PendingAction, Card as CardType } from "@/types/game";
import { Card } from "./Card";

interface PendingActionModalProps {
  pendingAction: PendingAction;
  hand: CardType[];
  initiatorName?: string;
  onResolve: (cardId: string) => void;
}

export function PendingActionModal({
  pendingAction,
  hand,
  initiatorName,
  onResolve,
}: PendingActionModalProps) {
  const isDiscard = pendingAction.type === "CHOOSE_CARD_TO_DISCARD";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-card border-2 border-primary/40 text-card-foreground p-6 rounded-2xl max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        <div className="mb-4">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
            {isDiscard ? (
              <AlertTriangle className="w-8 h-8 text-destructive animate-bounce" />
            ) : (
              <FileText className="w-8 h-8 text-primary animate-pulse" />
            )}
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight mb-1">
            {isDiscard ? "🚨 Alerta de Phishing!" : "📜 LI E ACEITO!"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isDiscard ? (
              <>
                Escolha <strong>1 carta</strong> da sua mão para descartar.
              </>
            ) : (
              <>
                Escolha <strong>1 carta</strong> da sua mão para entregar a{" "}
                <strong className="text-primary">{initiatorName || "adversário"}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="w-full max-h-[50vh] overflow-y-auto p-3 flex flex-wrap gap-3 justify-center items-center rounded-xl bg-muted/20 border">
          {hand.map((card) => (
            <div
              key={card.id}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={() => onResolve(card.id)}
            >
              <Card card={card} size={hand.length > 4 ? "small" : "normal"} />
            </div>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground mt-4 animate-pulse">
          Clique em uma carta acima para confirmar sua escolha
        </span>
      </div>
    </div>
  );
}
