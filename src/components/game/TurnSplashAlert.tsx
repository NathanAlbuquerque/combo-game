"use client";

interface TurnSplashAlertProps {
  show: boolean;
}

export function TurnSplashAlert({ show }: TurnSplashAlertProps) {
  if (!show) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50 ring-8 ring-emerald-500/80 inset-0 shadow-[inset_0_0_120px_rgba(16,185,129,0.45)] animate-pulse transition-opacity duration-300" />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-emerald-500 text-zinc-950 px-6 py-3.5 rounded-2xl font-black text-xl sm:text-2xl tracking-wider shadow-2xl shadow-emerald-500/50 border-2 border-emerald-300 flex items-center gap-3 animate-in zoom-in-75 fade-in duration-200">
          <span className="text-2xl animate-bounce">⚡</span>
          <span>SUA VEZ DE JOGAR!</span>
        </div>
      </div>
    </>
  );
}
