"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

interface ReactionPickerProps {
  onSendReaction: (emoji: string) => void;
  className?: string;
}

const EMOJI_OPTIONS = ["🔥", "😱", "👏", "🎯", "💀", "🛡️"];

export function ReactionPicker({ onSendReaction, className = "" }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (emoji: string) => {
    onSendReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Popover flutuante com as opções de emojis */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 p-1.5 rounded-full shadow-2xl flex items-center gap-1 animate-in zoom-in-90 fade-in duration-150">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-90 transition-transform cursor-pointer rounded-full hover:bg-white/10"
              title={`Reagir com ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Botão circular de disparo do seletor */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 active:scale-90 hover:scale-105 border border-zinc-700/80 text-amber-400 flex items-center justify-center shadow-lg transition-all cursor-pointer select-none"
        title="Reações rápidas"
        aria-label="Reações rápidas"
      >
        <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      </button>
    </div>
  );
}
