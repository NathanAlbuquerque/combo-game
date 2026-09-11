"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, Share2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function ShareRoomModal({
  isOpen,
  onClose,
  roomId,
}: ShareRoomModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const roomUrl = typeof window !== "undefined" && roomId ? `${window.location.origin}/room/${roomId}` : "";
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        // fallback abaixo
      }
    }

    if (!success && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        console.error("Erro ao copiar para clipboard:", err);
      }
    }

    if (success) {
      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const handleNativeShare = async () => {
    if (!canShare || !roomUrl) return;
    try {
      await navigator.share({
        title: "Combo The Game",
        text: `Venha jogar Combo comigo! Entre na sala com o código: ${roomId}`,
        url: roomUrl,
      });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.warn("Falha no compartilhamento nativo:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border text-card-foreground rounded-3xl max-w-sm w-full flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                Compartilhar Sala
              </h2>
              <p className="text-xs text-muted-foreground">
                Convide amigos para a partida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col items-center gap-4 overflow-y-auto max-h-[75vh]">
          {/* QR Code Container (Alto Contraste) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-md border-4 border-white flex flex-col items-center">
            {roomUrl ? (
              <QRCodeSVG
                value={roomUrl}
                size={180}
                level="M"
                marginSize={1}
                className="w-full h-auto max-w-[180px]"
              />
            ) : (
              <div className="w-[180px] h-[180px] bg-zinc-200 animate-pulse rounded-lg" />
            )}
            <span className="text-[11px] font-bold text-zinc-600 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Aponte a câmera para entrar
            </span>
          </div>

          {/* Código Alfanumérico da Sala */}
          <div className="w-full bg-muted/40 border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Código da Sala
              </span>
              <span className="text-lg font-black font-mono tracking-widest text-primary">
                {roomId}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(roomId, "code")}
              className="font-bold text-xs gap-1.5 h-8 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </Button>
          </div>

          {/* Ações de Compartilhamento */}
          <div className="w-full space-y-2 pt-1">
            {canShare && (
              <Button
                variant="default"
                onClick={handleNativeShare}
                className="w-full font-bold gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar via Dispositivo</span>
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => copyToClipboard(roomUrl, "link")}
              className="w-full font-bold gap-2 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link Completo</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold cursor-pointer">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
