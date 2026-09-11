import { NextResponse } from "next/server";
import { RoomSummary } from "@/types/game";
import { DEFAULT_PARTYKIT_HOST } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || DEFAULT_PARTYKIT_HOST;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const partyUrl = `${protocol}://${host}/parties/main/global-registry`;

  try {
    const res = await fetch(partyUrl, { cache: "no-store" });
    if (!res.ok) {
      console.warn("Resposta não-OK do PartyKit global-registry:", res.status);
      return NextResponse.json<RoomSummary[]>([]);
    }
    const data = (await res.json()) as RoomSummary[];
    return NextResponse.json<RoomSummary[]>(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Erro ao buscar salas no PartyKit:", err);
    return NextResponse.json<RoomSummary[]>([]);
  }
}
