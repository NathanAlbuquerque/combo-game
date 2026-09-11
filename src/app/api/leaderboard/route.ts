import { NextResponse } from "next/server";
import { LeaderboardData } from "@/types/game";
import { DEFAULT_PARTYKIT_HOST } from "@/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || DEFAULT_PARTYKIT_HOST;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const partyUrl = `${protocol}://${host}/parties/main/global-registry?type=leaderboard`;

  try {
    const res = await fetch(partyUrl, { cache: "no-store" });
    if (!res.ok) {
      console.warn("Resposta não-OK do PartyKit global-registry leaderboard:", res.status);
      return NextResponse.json<LeaderboardData>(
        {
          global: [],
          lastResetAt: Date.now(),
        },
        { status: 200 }
      );
    }
    const data = await res.json();
    const globalRanks = Array.isArray(data?.global)
      ? data.global
      : Array.isArray(data?.leaderboard)
      ? data.leaderboard
      : Array.isArray(data)
      ? data
      : [];

    return NextResponse.json<LeaderboardData>(
      {
        global: globalRanks,
        lastResetAt: typeof data?.lastResetAt === "number" ? data.lastResetAt : Date.now(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro ao buscar ranking no PartyKit:", err);
    return NextResponse.json<LeaderboardData>(
      {
        global: [],
        lastResetAt: Date.now(),
      },
      { status: 200 }
    );
  }
}
