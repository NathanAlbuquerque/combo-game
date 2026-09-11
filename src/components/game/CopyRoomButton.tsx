"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyRoomButtonProps {
  roomId: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showTextOnMobile?: boolean;
  iconOnly?: boolean;
}

export function CopyRoomButton({
  roomId,
  variant = "outline",
  size = "default",
  className,
  showTextOnMobile = false,
  iconOnly = false,
}: CopyRoomButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === "undefined" || !roomId) return;
    const url = `${window.location.origin}/room/${roomId}`;

    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        success = true;
      } catch (err) {
        console.warn("Clipboard API falhou, tentando fallback...", err);
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        console.error("Erro ao copiar link:", err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        "transition-all duration-200 gap-1.5 select-none",
        copied && "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/15 hover:text-green-600 dark:hover:text-green-400",
        className
      )}
      title="Copiar Link da Sala"
      type="button"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500 shrink-0 animate-in zoom-in-50 duration-200" />
          {!iconOnly && <span className="font-semibold">Copiado!</span>}
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 shrink-0" />
          {!iconOnly && (
            <>
              <span className={cn(showTextOnMobile ? "inline" : "hidden sm:inline")}>
                Copiar Link da Sala
              </span>
              {!showTextOnMobile && <span className="sm:hidden">Link</span>}
            </>
          )}
        </>
      )}
    </Button>
  );
}
