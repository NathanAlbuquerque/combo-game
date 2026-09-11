"use client";

export interface ReactionEvent {
  id: string;
  emoji: string;
  senderName: string;
}

export interface ActiveReaction extends ReactionEvent {
  xOffset: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  rot: number;
}

interface FloatingReactionsOverlayProps {
  reactions: ActiveReaction[];
}

export function FloatingReactionsOverlay({ reactions }: FloatingReactionsOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute pointer-events-none flex flex-col items-center select-none animate-float-reaction"
          style={{
            right: `${28 + reaction.xOffset}px`,
            bottom: "100px",
            ["--rx-x1" as string]: `${reaction.x1}px`,
            ["--rx-x2" as string]: `${reaction.x2}px`,
            ["--rx-x3" as string]: `${reaction.x3}px`,
            ["--rx-x4" as string]: `${reaction.x4}px`,
            ["--rx-rot" as string]: `${reaction.rot}deg`,
          }}
        >
          <span className="text-3xl sm:text-4xl drop-shadow-lg leading-none">
            {reaction.emoji}
          </span>
          {reaction.senderName && (
            <span className="text-[9px] font-black bg-black/75 text-white/95 px-1.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10 shadow-xs mt-1 max-w-[85px] truncate">
              {reaction.senderName}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

