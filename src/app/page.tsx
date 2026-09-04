import { PartyKitTest } from "@/components/game/PartyKitTest";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-3xl flex flex-col items-center justify-center gap-8">
        <h1 className="text-3xl font-bold text-center">Combo Multiplayer</h1>
        <p className="text-muted-foreground text-center mb-4">
          A base sólida de real-time com PartyKit está configurada.
        </p>
        
        <PartyKitTest />
      </main>
    </div>
  );
}
