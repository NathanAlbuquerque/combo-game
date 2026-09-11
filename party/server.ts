import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage, Card, Player, MatchStats, RoomSummary, PlayerRankEntry, LeaderboardData, RoomSettings } from "../src/types/game";
import { OBJECT_CARDS_DATA, EFFECTS_CARDS_DATA } from "../src/data/cards";

function shuffleDeck<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function generateDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 1;

  // 30 Cartas-Objeto (5 de cada uma das 6 categorias)
  OBJECT_CARDS_DATA.forEach(item => {
    deck.push({
      id: `obj_${idCounter++}`,
      type: 'object',
      category: item.category,
      name: item.name,
      description: item.description,
      visualDetail: item.visualDetail,
      imageUrl: item.imageUrl,
    });
  });

  // 2 Coringas
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `jkr_${idCounter++}`,
      type: 'joker',
      name: `Coringa ${i + 1}`,
      description: 'Pode representar qualquer categoria na área de objetos.',
      imageUrl: '/images/objects/coringa.jpg',
    });
  }

  // 16 Cartas de Efeito (1 cópia de cada uma das 16 cartas)
  EFFECTS_CARDS_DATA.forEach(conf => {
    deck.push({
      id: `eff_${idCounter++}`,
      type: 'effect',
      name: conf.name,
      description: conf.desc,
      tip: conf.tip,
      fact: conf.fact,
    });
  });

  // Embaralhamento Fisher-Yates logo após a instanciação do deck
  return shuffleDeck(deck);
}

export default class MainServer implements Party.Server {
  private state: GameState;
  private createdAt: number = Date.now();
  private registryRooms: Map<string, RoomSummary> = new Map();
  private globalLeaderboard: Map<string, PlayerRankEntry> = new Map();
  private leaderboardLastResetAt: number = Date.now();
  private matchRecorded: boolean = false;
  private reactionTimestamps: Map<string, number[]> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = {
      status: 'lobby',
      players: {},
      creatorId: null,
      deck: [],
      discard: [],
      currentTurnPlayerId: null,
      winnerId: null,
      turnOrder: [],
      actionLog: [],
      pendingAction: null,
      extraPlayPlayerId: null,
      revealedHandsUntilTurnOfPlayerId: null,
      revealedPlayerIds: [],
      revealedPlayerUntilTurn: {},
      stats: null,
      roomLeaderboard: {},
      roomSettings: {
        turnTimerEnabled: false,
        turnTimerDuration: 30,
      },
      turnExpiresAt: undefined,
    };
  }

  async onStart() {
    if (this.room.id === "global-registry") {
      try {
        const savedRooms = await this.room.storage.get<Record<string, RoomSummary>>("rooms");
        if (savedRooms) {
          this.registryRooms = new Map(Object.entries(savedRooms));
        }

        const savedLeaderboard = await this.room.storage.get<{
          ranks: Record<string, PlayerRankEntry>;
          lastResetAt: number;
        }>("global_leaderboard");

        if (savedLeaderboard) {
          this.leaderboardLastResetAt = savedLeaderboard.lastResetAt || Date.now();
          this.globalLeaderboard = new Map(Object.entries(savedLeaderboard.ranks || {}));
          this.checkDailyReset();
        }
      } catch (err) {
        console.warn("Aviso ao recuperar storage do global-registry:", err);
      }
    }
  }

  private checkDailyReset(): boolean {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (now - this.leaderboardLastResetAt >= ONE_DAY_MS) {
      this.globalLeaderboard.clear();
      this.leaderboardLastResetAt = now;
      this.saveLeaderboard();
      return true;
    }
    return false;
  }

  private async saveLeaderboard() {
    try {
      await this.room.storage.put("global_leaderboard", {
        ranks: Object.fromEntries(this.globalLeaderboard),
        lastResetAt: this.leaderboardLastResetAt,
      });
    } catch (e) {
      console.warn("Aviso ao persistir global_leaderboard:", e);
    }
  }

  async onRequest(req: Party.Request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (this.room.id === "global-registry") {
      const url = new URL(req.url);

      if (req.method === "GET") {
        // Rota de Ranking Geral
        if (url.searchParams.get("type") === "leaderboard" || url.pathname.endsWith("/leaderboard")) {
          this.checkDailyReset();
          const list = Array.from(this.globalLeaderboard.values());
          list.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.lastWinAt !== a.lastWinAt) return b.lastWinAt - a.lastWinAt;
            return a.matchesPlayed - b.matchesPlayed;
          });

          const data: LeaderboardData = {
            global: list.slice(0, 20),
            lastResetAt: this.leaderboardLastResetAt,
          };

          return new Response(JSON.stringify(data), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, max-age=0",
              ...corsHeaders,
            },
          });
        }

        // Rota de Salas Públicas
        const now = Date.now();
        const activeRooms: RoomSummary[] = [];

        for (const [id, summary] of this.registryRooms.entries()) {
          if (summary.playerCount <= 0 || now - summary.createdAt > 3 * 60 * 60 * 1000) {
            this.registryRooms.delete(id);
          } else {
            activeRooms.push(summary);
          }
        }

        activeRooms.sort((a, b) => {
          if (a.status === "lobby" && b.status !== "lobby") return -1;
          if (a.status !== "lobby" && b.status === "lobby") return 1;
          return b.createdAt - a.createdAt;
        });

        return new Response(JSON.stringify(activeRooms), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
            ...corsHeaders,
          },
        });
      }

      if (req.method === "POST") {
        try {
          const body = (await req.json()) as {
            action: "update" | "delete" | "record_match_result";
            roomId?: string;
            summary?: RoomSummary;
            winnerName?: string;
            participants?: string[];
          };

          if (body.action === "record_match_result") {
            this.checkDailyReset();
            const participants = body.participants || [];
            const winnerName = body.winnerName;

            for (const pName of participants) {
              const clean = pName.trim();
              if (!clean) continue;
              let entry = this.globalLeaderboard.get(clean);
              if (!entry) {
                entry = {
                  name: clean,
                  wins: 0,
                  matchesPlayed: 0,
                  lastWinAt: 0,
                };
                this.globalLeaderboard.set(clean, entry);
              }
              entry.matchesPlayed += 1;
            }

            if (winnerName) {
              const cleanWinner = winnerName.trim();
              let entry = this.globalLeaderboard.get(cleanWinner);
              if (!entry) {
                entry = {
                  name: cleanWinner,
                  wins: 0,
                  matchesPlayed: 1,
                  lastWinAt: 0,
                };
                this.globalLeaderboard.set(cleanWinner, entry);
              }
              entry.wins += 1;
              entry.lastWinAt = Date.now();
            }

            await this.saveLeaderboard();

            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          if (body.action === "delete" || (body.summary && body.summary.playerCount <= 0)) {
            const targetId = body.roomId || body.summary?.id;
            if (targetId) {
              this.registryRooms.delete(targetId);
            }
          } else if (body.action === "update" && body.summary) {
            this.registryRooms.set(body.summary.id, body.summary);
          }

          try {
            await this.room.storage.put("rooms", Object.fromEntries(this.registryRooms));
          } catch (storageErr) {
            console.warn("Aviso ao persistir storage no global-registry:", storageErr);
          }

          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    return new Response(JSON.stringify({ status: "ok", roomId: this.room.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  private async notifyRegistry(action?: "update" | "delete") {
    if (this.room.id === "global-registry") return;

    try {
      const activeCount = this.playerToConnectionId.size;
      const isDelete = action === "delete" || activeCount === 0;

      const leader = this.state.creatorId
        ? this.state.players[this.state.creatorId]
        : Object.values(this.state.players)[0];

      const summary: RoomSummary = {
        id: this.room.id,
        playerCount: activeCount,
        maxPlayers: 5,
        status: this.state.status,
        createdAt: this.createdAt,
        leaderName: leader?.name || "Líder",
      };

      const partyName = this.room.name || "main";
      const registryStub = this.room.context?.parties?.[partyName]?.get("global-registry");
      if (registryStub) {
        await registryStub.fetch("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: isDelete ? "delete" : "update",
            roomId: this.room.id,
            summary: isDelete ? undefined : summary,
          }),
        });
      }
    } catch (err) {
      console.error("Erro ao notificar global-registry:", err);
    }
  }

  private recordMatchLeaderboard(winnerId: string | null) {
    if (!this.state.roomLeaderboard) {
      this.state.roomLeaderboard = {};
    }

    const participants: string[] = [];
    const winnerPlayer = winnerId ? this.state.players[winnerId] : null;
    const winnerName = winnerPlayer?.name ? winnerPlayer.name.trim() : null;

    for (const pid of Object.keys(this.state.players)) {
      const p = this.state.players[pid];
      if (p && !p.isSpectating) {
        const pName = p.name.trim() || "Jogador";
        participants.push(pName);

        if (!this.state.roomLeaderboard[pName]) {
          this.state.roomLeaderboard[pName] = {
            name: pName,
            wins: 0,
            matchesPlayed: 0,
            lastWinAt: 0,
          };
        }
        this.state.roomLeaderboard[pName].matchesPlayed += 1;
      }
    }

    if (winnerName) {
      if (!this.state.roomLeaderboard[winnerName]) {
        this.state.roomLeaderboard[winnerName] = {
          name: winnerName,
          wins: 0,
          matchesPlayed: 1,
          lastWinAt: 0,
        };
      }
      this.state.roomLeaderboard[winnerName].wins += 1;
      this.state.roomLeaderboard[winnerName].lastWinAt = Date.now();
    }

    this.notifyGlobalLeaderboard(winnerName, participants);
  }

  private async notifyGlobalLeaderboard(winnerName: string | null, participants: string[]) {
    if (this.room.id === "global-registry") return;
    try {
      const partyName = this.room.name || "main";
      const registryStub = this.room.context?.parties?.[partyName]?.get("global-registry");
      if (registryStub) {
        await registryStub.fetch("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "record_match_result",
            winnerName: winnerName || undefined,
            participants,
          }),
        });
      }
    } catch (err) {
      console.error("Erro ao notificar global-registry sobre resultado da partida:", err);
    }
  }

  private handleMatchFinished() {
    if (this.matchRecorded) return;
    this.matchRecorded = true;
    this.recordMatchLeaderboard(this.state.winnerId);
  }

  private addLog(message: string) {
    this.state.actionLog.push(message);
    if (this.state.actionLog.length > 50) {
      this.state.actionLog.shift(); // Mantém apenas os 50 últimos logs
    }
  }

  private recordCardDrawn(playerId: string) {
    if (!this.state.stats) return;
    this.state.stats.totalCardsDrawn++;
    if (!this.state.stats.playerStats[playerId]) {
      this.state.stats.playerStats[playerId] = {
        playerName: this.state.players[playerId]?.name || "Jogador",
        cardsDrawn: 0,
        effectsPlayed: 0,
        objectsPlayed: 0,
        eliminated: false,
      };
    }
    this.state.stats.playerStats[playerId].cardsDrawn++;
  }

  private recordObjectPlayed(playerId: string) {
    if (!this.state.stats) return;
    this.state.stats.totalObjectsPlayed++;
    if (!this.state.stats.playerStats[playerId]) {
      this.state.stats.playerStats[playerId] = {
        playerName: this.state.players[playerId]?.name || "Jogador",
        cardsDrawn: 0,
        effectsPlayed: 0,
        objectsPlayed: 0,
        eliminated: false,
      };
    }
    this.state.stats.playerStats[playerId].objectsPlayed++;
  }

  private recordEffectPlayed(playerId: string) {
    if (!this.state.stats) return;
    this.state.stats.totalEffectsPlayed++;
    if (!this.state.stats.playerStats[playerId]) {
      this.state.stats.playerStats[playerId] = {
        playerName: this.state.players[playerId]?.name || "Jogador",
        cardsDrawn: 0,
        effectsPlayed: 0,
        objectsPlayed: 0,
        eliminated: false,
      };
    }
    this.state.stats.playerStats[playerId].effectsPlayed++;
  }

  private autoStartTimeout: ReturnType<typeof setTimeout> | null = null;

  private clearAutoStartTimer() {
    if (this.autoStartTimeout) {
      clearTimeout(this.autoStartTimeout);
      this.autoStartTimeout = null;
    }
    this.state.autoStartAt = undefined;
  }

  private handleAutoStart() {
    this.autoStartTimeout = null;
    this.state.autoStartAt = undefined;
    if (this.state.status === "lobby" && Object.keys(this.state.players).length >= 2) {
      this.addLog("⏳ Tempo de lobby finalizado! A partida iniciou automaticamente.");
      this.startGame();
    }
  }

  private checkAutoStartTimer() {
    if (this.state.status !== "lobby") {
      this.clearAutoStartTimer();
      return;
    }
    const count = Object.keys(this.state.players).length;
    if (count >= 2) {
      if (!this.autoStartTimeout) {
        this.state.autoStartAt = Date.now() + 60000;
        this.autoStartTimeout = setTimeout(() => {
          this.handleAutoStart();
        }, 60000);
      }
    } else {
      this.clearAutoStartTimer();
    }
  }

  private turnTimeout: ReturnType<typeof setTimeout> | null = null;

  private clearTurnTimer() {
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
    this.state.turnExpiresAt = undefined;
  }

  private resetTurnTimer() {
    this.clearTurnTimer();
    if (!this.state.roomSettings?.turnTimerEnabled || this.state.status !== "playing") {
      return;
    }

    const durationSec = this.state.roomSettings.turnTimerDuration || 30;
    this.state.turnExpiresAt = Date.now() + durationSec * 1000;

    this.turnTimeout = setTimeout(() => {
      this.handleTurnTimeout();
    }, durationSec * 1000);
  }

  private handleTurnTimeout() {
    this.turnTimeout = null;
    this.state.turnExpiresAt = undefined;

    if (this.state.status !== "playing") {
      return;
    }

    // 1. Caso haja ação pendente na mesa (ex: Phishing ou LI E ACEITO!)
    if (this.state.pendingAction) {
      const pAction = this.state.pendingAction;
      const targetPlayer = this.state.players[pAction.requiredPlayerId];
      const initiatorPlayer = this.state.players[pAction.initiatorPlayerId];

      if (targetPlayer && targetPlayer.hand.length > 0) {
        const chosenCard = targetPlayer.hand.splice(0, 1)[0];
        if (pAction.type === 'CHOOSE_CARD_TO_DISCARD') {
          this.state.discard.push(chosenCard);
          this.addLog(`⏱️ Tempo esgotado! ${targetPlayer.name} descartou automaticamente "${chosenCard.name || 'Carta'}".`);
        } else if (pAction.type === 'CHOOSE_CARD_TO_GIVE') {
          if (initiatorPlayer && !initiatorPlayer.isEliminated) {
            initiatorPlayer.hand.push(chosenCard);
            this.addLog(`⏱️ Tempo esgotado! ${targetPlayer.name} entregou automaticamente "${chosenCard.name || 'Carta'}" para ${initiatorPlayer.name}.`);
          } else {
            this.state.discard.push(chosenCard);
            this.addLog(`⏱️ Tempo esgotado! ${targetPlayer.name} descartou automaticamente "${chosenCard.name || 'Carta'}".`);
          }
        }
      }

      this.state.pendingAction = null;
      this.checkEliminations();
      this.passTurn();
      this.broadcastSync();
      return;
    }

    // 2. Caso haja jogada extra pendente (Prompt Perfeito)
    if (this.state.extraPlayPlayerId) {
      const me = this.state.players[this.state.extraPlayPlayerId];
      this.state.extraPlayPlayerId = null;
      if (me) {
        this.addLog(`⏱️ Tempo esgotado! A jogada extra de ${me.name} foi encerrada.`);
      }
      this.passTurn();
      this.broadcastSync();
      return;
    }

    // 3. Turno normal do jogador da vez
    if (!this.state.currentTurnPlayerId) {
      this.passTurn();
      this.broadcastSync();
      return;
    }

    const me = this.state.players[this.state.currentTurnPlayerId];
    if (!me || me.isEliminated || me.isSpectating) {
      this.passTurn();
      this.broadcastSync();
      return;
    }

    // Ação segura: compra 1 carta do baralho ou descarta a última da mão
    const card = this.drawOneCard();
    if (card) {
      me.hand.push(card);
      this.recordCardDrawn(me.id);
      this.addLog(`⏱️ Tempo esgotado! ${me.name} comprou 1 carta automaticamente e passou a vez.`);
    } else if (me.hand.length > 0) {
      const discarded = me.hand.pop()!;
      this.state.discard.push(discarded);
      this.addLog(`⏱️ Tempo esgotado e deck vazio! ${me.name} descartou "${discarded.name || 'Carta'}" e passou a vez.`);
    } else {
      this.addLog(`⏱️ Tempo esgotado! ${me.name} passou a vez.`);
    }

    this.checkEliminations();
    this.passTurn();
    this.broadcastSync();
  }

  private startGame() {
    this.clearAutoStartTimer();
    this.matchRecorded = false;
    if (this.state.status !== "lobby") return;
    const playerIds = Object.keys(this.state.players);
    if (playerIds.length < 2) return;

    const shuffledDeck = generateDeck();

    for (const pid of playerIds) {
      const player = this.state.players[pid];
      player.hand = shuffledDeck.splice(-3, 3);
      player.isSpectating = false;
    }

    this.state.deck = shuffledDeck;
    this.state.status = "playing";
    this.state.currentTurnPlayerId = this.state.creatorId || playerIds[0];
    this.state.turnOrder = playerIds;
    this.state.actionLog = [];
    this.state.pendingAction = null;
    this.state.extraPlayPlayerId = null;
    this.state.revealedHandsUntilTurnOfPlayerId = null;
    this.state.revealedPlayerIds = [];
    this.state.revealedPlayerUntilTurn = {};

    const initialPlayerStats: MatchStats['playerStats'] = {};
    for (const pid of playerIds) {
      initialPlayerStats[pid] = {
        playerName: this.state.players[pid]?.name || "Jogador",
        cardsDrawn: 0,
        effectsPlayed: 0,
        objectsPlayed: 0,
        eliminated: false,
      };
    }

    this.state.stats = {
      startedAt: Date.now(),
      totalTurns: 1,
      totalCardsDrawn: 0,
      totalEffectsPlayed: 0,
      totalObjectsPlayed: 0,
      playerStats: initialPlayerStats,
    };

    this.addLog("A partida começou!");
    if (this.state.roomSettings?.turnTimerEnabled) {
      this.resetTurnTimer();
    } else {
      this.clearTurnTimer();
    }
    this.notifyRegistry();
    this.broadcastSync();
  }

  private connectionToPlayerId: Map<string, string> = new Map();
  private playerToConnectionId: Map<string, string> = new Map();

  private getPlayerId(connId: string): string {
    return this.connectionToPlayerId.get(connId) || connId;
  }

  onConnect(conn: Party.Connection) {
    if (this.room.id === "global-registry") {
      conn.close();
      return;
    }
    console.log(`Conexão estabelecida: ${conn.id} na sala ${this.room.id}`);
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão fechada: ${conn.id}`);
    const playerId = this.connectionToPlayerId.get(conn.id);
    if (!playerId) return;

    // Se este jogador já tem uma conexão mais nova ativa, ignora o fechamento do socket antigo
    const activeConnId = this.playerToConnectionId.get(playerId);
    if (activeConnId && activeConnId !== conn.id) {
      this.connectionToPlayerId.delete(conn.id);
      return;
    }

    this.connectionToPlayerId.delete(conn.id);
    this.playerToConnectionId.delete(playerId);

    if (this.state.status === "playing") {
      const player = this.state.players[playerId];
      if (player?.isSpectating) {
        this.addLog(`O espectador ${player.name || playerId} desconectou.`);
        delete this.state.players[playerId];
      } else {
        this.addLog(`O jogador ${player?.name || playerId} desconectou.`);
        this.reclaimPlayerCards(playerId);
        this.checkEliminations();
      }
      this.broadcastSync();
    } else {
      delete this.state.players[playerId];
      if (this.state.creatorId === playerId) {
        const remaining = Object.keys(this.state.players);
        this.state.creatorId = remaining.length > 0 ? remaining[0] : null;
        if (this.state.creatorId && this.state.players[this.state.creatorId]) {
          this.state.players[this.state.creatorId].isCreator = true;
        }
      }
      this.checkAutoStartTimer();
      this.broadcastSync();
    }
    this.notifyRegistry();
  }

  private reclaimPlayerCards(playerId: string) {
    const player = this.state.players[playerId];
    if (!player || player.isEliminated || player.isSpectating) return;

    if (this.state.revealedHandsUntilTurnOfPlayerId === playerId) {
      this.state.revealedHandsUntilTurnOfPlayerId = null;
    }
    if (this.state.extraPlayPlayerId === playerId) {
      this.state.extraPlayPlayerId = null;
    }
    const hadPendingActionWithPlayer = Boolean(
      this.state.pendingAction?.requiredPlayerId === playerId ||
      this.state.pendingAction?.initiatorPlayerId === playerId
    );
    if (hadPendingActionWithPlayer) {
      this.state.pendingAction = null;
    }
    if (this.state.revealedPlayerIds?.includes(playerId)) {
      this.state.revealedPlayerIds = this.state.revealedPlayerIds.filter(id => id !== playerId);
    }
    if (this.state.revealedPlayerUntilTurn) {
      delete this.state.revealedPlayerUntilTurn[playerId];
      const targetsToClear = Object.keys(this.state.revealedPlayerUntilTurn).filter(
        tId => this.state.revealedPlayerUntilTurn![tId] === playerId
      );
      for (const tId of targetsToClear) {
        delete this.state.revealedPlayerUntilTurn[tId];
        this.state.revealedPlayerIds = (this.state.revealedPlayerIds || []).filter(id => id !== tId);
      }
    }

    const recoveredCards = [...player.hand, ...player.objectArea];
    player.hand = [];
    player.objectArea = [];
    player.isEliminated = true;
    if (this.state.stats?.playerStats[playerId]) {
      this.state.stats.playerStats[playerId].eliminated = true;
    }

    if (recoveredCards.length > 0) {
      this.state.deck.push(...recoveredCards);
      this.state.deck = shuffleDeck(this.state.deck);
      this.addLog(`Cartas de ${player.name} retornaram ao baralho.`);
    }

    if (this.state.currentTurnPlayerId === playerId || hadPendingActionWithPlayer) {
      this.passTurn();
    }
  }

  private clearExpiredReveals(playerId: string) {
    if (this.state.revealedHandsUntilTurnOfPlayerId === playerId) {
      this.state.revealedHandsUntilTurnOfPlayerId = null;
      this.addLog("O efeito de Vazamento de Dados terminou. As mãos voltaram a ser secretas.");
    }
    if (this.state.revealedPlayerUntilTurn) {
      const targetsToClear = Object.keys(this.state.revealedPlayerUntilTurn).filter(
        tId => this.state.revealedPlayerUntilTurn![tId] === playerId
      );
      if (targetsToClear.length > 0) {
        this.state.revealedPlayerIds = (this.state.revealedPlayerIds || []).filter(
          id => !targetsToClear.includes(id)
        );
        for (const tId of targetsToClear) {
          delete this.state.revealedPlayerUntilTurn[tId];
          const targetName = this.state.players[tId]?.name || "Jogador";
          this.addLog(`A mão de ${targetName} voltou a ser secreta.`);
        }
      }
    }
  }

  private passTurn() {
    this.state.extraPlayPlayerId = null;
    if (!this.state.currentTurnPlayerId) return;
    const turnOrder = (this.state.turnOrder && this.state.turnOrder.length > 0)
      ? this.state.turnOrder
      : Object.keys(this.state.players).filter(id => !this.state.players[id]?.isSpectating);

    if (turnOrder.length === 0) return;
    
    let currentIndex = turnOrder.indexOf(this.state.currentTurnPlayerId);
    if (currentIndex === -1) currentIndex = 0;
    
    for (let i = 0; i < turnOrder.length; i++) {
      currentIndex = (currentIndex + 1) % turnOrder.length;
      const nextId = turnOrder[currentIndex];
      const nextPlayer = this.state.players[nextId];
      if (!nextPlayer) continue;
      
      if (nextPlayer.isEliminated || nextPlayer.isSpectating) {
        continue; // Pula os eliminados e espectadores sumariamente
      }
      
      if (nextPlayer.skipNextTurn || nextPlayer.isBlocked) {
        nextPlayer.skipNextTurn = false;
        nextPlayer.isBlocked = false;
        this.addLog(`🚫 ${nextPlayer.name} perdeu a vez pelo block!`);
        this.clearExpiredReveals(nextId);
      } else {
        this.state.currentTurnPlayerId = nextId;
        break;
      }
    }

    // Se o turno voltou para o jogador que ativou revelações, limpa as flags expiradas
    if (this.state.currentTurnPlayerId) {
      this.clearExpiredReveals(this.state.currentTurnPlayerId);
    }

    if (this.state.stats) {
      this.state.stats.totalTurns++;
    }

    if (this.state.status === "playing" && this.state.roomSettings?.turnTimerEnabled) {
      this.resetTurnTimer();
    } else {
      this.clearTurnTimer();
    }
  }

  private checkEliminations(): boolean {
    if (this.state.status !== 'playing') return false;
    
    let activePlayers = 0;
    let lastActiveId: string | null = null;
    
    for (const [id, player] of Object.entries(this.state.players)) {
      if (player.isSpectating) continue; // Espectadores não participam de eliminação

      if (!player.isEliminated && player.hand.length === 0) {
        this.addLog(`💀 ${player.name} ficou sem cartas e foi eliminado!`);
        this.reclaimPlayerCards(id);
      }
      
      if (!player.isEliminated) {
        activePlayers++;
        lastActiveId = id;
      }
    }
    
    // DETECÇÃO DE W.O.
    if (activePlayers === 1 && lastActiveId) {
      this.state.winnerId = lastActiveId;
      this.state.status = 'finished';
      this.clearTurnTimer();
      if (this.state.stats && !this.state.stats.finishedAt) {
        this.state.stats.finishedAt = Date.now();
      }
      this.addLog(`🏆 ${this.state.players[lastActiveId].name} é o último sobrevivente e venceu o jogo!`);
      this.handleMatchFinished();
      return true;
    }
    
    if (activePlayers === 0) {
      this.state.status = 'finished';
      this.clearTurnTimer();
      if (this.state.stats && !this.state.stats.finishedAt) {
        this.state.stats.finishedAt = Date.now();
      }
      this.addLog(`Empate catastrófico! Todos foram eliminados.`);
      this.handleMatchFinished();
      return true;
    }
    
    return false;
  }

  private checkVictory(playerId: string): boolean {
    const p = this.state.players[playerId];
    if (!p || p.isSpectating) return false;
    const uniqueCategories = new Set<string>();
    let jokersCount = 0;
    
    for (const card of p.objectArea) {
      if (card.type === 'joker') {
        jokersCount++;
      } else if (card.type === 'object' && card.category) {
        uniqueCategories.add(card.category);
      }
    }
    
    if (uniqueCategories.size + jokersCount >= 5) {
      this.state.winnerId = playerId;
      this.state.status = 'finished';
      this.clearTurnTimer();
      if (this.state.stats && !this.state.stats.finishedAt) {
        this.state.stats.finishedAt = Date.now();
      }
      this.addLog(`🏆 ${p.name} fechou o Combo e venceu o jogo!`);
      this.handleMatchFinished();
      return true;
    }
    return false;
  }

  private drawOneCard(): Card | null {
    if (this.state.deck.length === 0) {
      if (this.state.discard.length === 0) return null;
      if (this.state.discard.length === 1) {
        return this.state.discard.pop() || null;
      }
      
      const topDiscard = this.state.discard.pop()!;
      this.state.deck = shuffleDeck([...this.state.discard]);
      this.state.discard = [topDiscard];
      this.addLog("O descarte foi reembaralhado no baralho!");
    }
    return this.state.deck.pop() || null;
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const parsed = JSON.parse(message) as ClientMessage;

      // ==========================================
      // LÓGICA DE LOBBY & INÍCIO
      // ==========================================
      if (parsed.type === "join") {
        const rawPlayerId = parsed.playerId?.trim();
        const trimmedName = parsed.name.trim();

        // 1. Tenta associar a um jogador já registrado (estritamente por playerId estável)
        if (rawPlayerId && this.state.players[rawPlayerId]) {
          const player = this.state.players[rawPlayerId];

          // Se o jogador estiver renomeando, garante que o novo nome não colida com outro jogador
          const nameConflict = Object.values(this.state.players).some(
            p => p.id !== rawPlayerId && p.name.trim().toLowerCase() === trimmedName.toLowerCase()
          );

          if (nameConflict) {
            sender.send(JSON.stringify({
              type: "error",
              message: "Este nome já está em uso nesta sala. Escolha outro!",
            }));
            sender.close(1008, "Name already in use");
            return;
          }

          // Reutiliza a sessão existente do jogador com o mesmo playerId
          player.name = trimmedName;

          const oldConnId = this.playerToConnectionId.get(rawPlayerId);
          if (oldConnId && oldConnId !== sender.id) {
            this.connectionToPlayerId.delete(oldConnId);
          }

          this.connectionToPlayerId.set(sender.id, rawPlayerId);
          this.playerToConnectionId.set(rawPlayerId, sender.id);

          this.notifyRegistry();
          this.broadcastSync();
          return;
        }

        // 2. Novo jogador ou playerId diferente conectando
        // Rejeita a entrada se o nome já estiver em uso na sala
        const nameInUse = Object.values(this.state.players).some(
          p => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );

        if (nameInUse) {
          sender.send(JSON.stringify({
            type: "error",
            message: "Este nome já está em uso nesta sala. Escolha outro!",
          }));
          sender.close(1008, "Name already in use");
          return;
        }

        // 2. Novo jogador querendo entrar na sala
        const isSpectating = this.state.status === "playing" || this.state.status === "finished";

        const newPlayerId = rawPlayerId || sender.id;
        const isCreator = (this.state.creatorId === null || Object.keys(this.state.players).length === 0) && !isSpectating;
        if (isCreator) {
          this.state.creatorId = newPlayerId;
        }

        this.connectionToPlayerId.set(sender.id, newPlayerId);
        this.playerToConnectionId.set(newPlayerId, sender.id);

        this.state.players[newPlayerId] = {
          id: newPlayerId,
          name: trimmedName,
          isCreator,
          hand: [],
          objectArea: [],
          skipNextTurn: false,
          isEliminated: false,
          isSpectating,
        };

        if (isSpectating) {
          this.addLog(`👁️ ${trimmedName} entrou em modo espectador.`);
        }

        this.checkAutoStartTimer();
        this.notifyRegistry();
        this.broadcastSync();
        return;
      }

      const myPlayerId = this.getPlayerId(sender.id);

      if (parsed.type === "start_game") {
        if (this.state.status !== "lobby") {
          sender.send(JSON.stringify({ type: "error", message: "A partida já está em andamento." }));
          return;
        }
        
        if (myPlayerId !== this.state.creatorId) {
          sender.send(JSON.stringify({ type: "error", message: "Apenas o criador pode iniciar o jogo." }));
          return;
        }

        if (Object.keys(this.state.players).length < 2) {
          sender.send(JSON.stringify({ type: "error", message: "A partida precisa de pelo menos 2 jogadores para iniciar." }));
          return;
        }

        this.startGame();
        return;
      }

      // ==========================================
      // PENDING ACTION (Alerta de Phishing & LI E ACEITO!)
      // ==========================================
      if (this.state.pendingAction && this.state.status === "playing") {
        const pAction = this.state.pendingAction;
        
        // Só aceita mensagem do requiredPlayerId E que seja resolve_pending_action ou discard_card
        if (myPlayerId !== pAction.requiredPlayerId || (parsed.type !== 'resolve_pending_action' && parsed.type !== 'discard_card')) {
           sender.send(JSON.stringify({ type: "error", message: "Aguardando outro jogador resolver a ação pendente." }));
           return;
        }

        const targetPlayer = this.state.players[myPlayerId];
        const initiatorPlayer = this.state.players[pAction.initiatorPlayerId];
        const cIndex = targetPlayer.hand.findIndex(c => c.id === parsed.cardId);
        
        if (cIndex === -1) {
           sender.send(JSON.stringify({ type: "error", message: "Carta não encontrada na sua mão." }));
           return;
        }

        // Remove a carta da mão do jogador alvo
        const chosenCard = targetPlayer.hand.splice(cIndex, 1)[0];

        if (pAction.type === 'CHOOSE_CARD_TO_DISCARD') {
          this.state.discard.push(chosenCard);
          this.addLog(`🚨 ${targetPlayer.name} escolheu descartar "${chosenCard.name || 'Carta'}" pelo Alerta de Phishing.`);
        } else if (pAction.type === 'CHOOSE_CARD_TO_GIVE') {
          if (initiatorPlayer && !initiatorPlayer.isEliminated) {
            initiatorPlayer.hand.push(chosenCard);
            this.addLog(`📜 ${targetPlayer.name} entregou "${chosenCard.name || 'Carta'}" para ${initiatorPlayer.name} pelo LI E ACEITO!.`);
          } else {
            this.state.discard.push(chosenCard);
            this.addLog(`📜 ${targetPlayer.name} descartou "${chosenCard.name || 'Carta'}", pois o jogador que usou a carta foi eliminado.`);
          }
        }

        this.state.pendingAction = null;
        this.checkEliminations();
        this.passTurn();
        this.broadcastSync();
        return;
      }

      // ==========================================
      // PULAR / FINALIZAR JOGADA EXTRA (Prompt Perfeito)
      // ==========================================
      if (parsed.type === "skip_extra_play" || parsed.type === "end_turn") {
        if (this.state.status !== "playing") return;
        if (this.state.extraPlayPlayerId !== myPlayerId) {
          sender.send(JSON.stringify({ type: "error", message: "Você não possui jogada extra pendente." }));
          return;
        }
        const me = this.state.players[myPlayerId];
        this.state.extraPlayPlayerId = null;
        this.addLog(`⚡ ${me.name} finalizou a jogada extra sem baixar novo objeto.`);
        this.passTurn();
        this.broadcastSync();
        return;
      }

      // ==========================================
      // LÓGICA DE TURNO E AÇÕES NORMAIS
      // ==========================================
      const gameActions = ["draw_card", "play_card", "play_effect"];
      if (gameActions.includes(parsed.type)) {
        if (this.state.status !== "playing") {
          sender.send(JSON.stringify({ type: "error", message: "O jogo não está em andamento." }));
          return;
        }

        if (this.state.pendingAction) {
          sender.send(JSON.stringify({ type: "error", message: "Ação pendente ocorrendo na mesa." }));
          return;
        }

        if (myPlayerId !== this.state.currentTurnPlayerId) {
          sender.send(JSON.stringify({ type: "error", message: "Não é o seu turno!" }));
          return;
        }

        const me = this.state.players[myPlayerId];
        if (!me || me.isSpectating) {
          sender.send(JSON.stringify({ type: "error", message: "Espectadores não realizam jogadas na rodada atual." }));
          return;
        }

        // Se estiver na jogada extra, não pode comprar cartas
        if (this.state.extraPlayPlayerId === me.id && parsed.type === "draw_card") {
          sender.send(JSON.stringify({ type: "error", message: "Durante a jogada extra do Prompt Perfeito, baixe um novo Objeto ou finalize o turno." }));
          return;
        }

        // -------------------------
        // COMPRAR
        // -------------------------
        if (parsed.type === "draw_card") {
          const card = this.drawOneCard();
          if (card) {
            me.hand.push(card);
            this.recordCardDrawn(me.id);
            this.addLog(`${me.name} comprou uma carta do baralho.`);
          }
          this.checkEliminations();
          this.passTurn();
          this.broadcastSync();
          return;
        }

        // -------------------------
        // JOGAR CARTA / EFEITO
        // -------------------------
        if (parsed.type === "play_card" || parsed.type === "play_effect") {
          const cardIndex = me.hand.findIndex(c => c.id === parsed.cardId);
          if (cardIndex === -1) {
            sender.send(JSON.stringify({ type: "error", message: "Carta não encontrada na sua mão." }));
            return;
          }
          
          const card = me.hand[cardIndex];

          // Se estiver na jogada extra do Prompt Perfeito, só pode baixar Objeto de categoria nova
          if (this.state.extraPlayPlayerId === me.id) {
            if (card.type !== 'object') {
              sender.send(JSON.stringify({ type: "error", message: "Durante a jogada extra do Prompt Perfeito, baixe um novo Objeto ou finalize o turno." }));
              return;
            }
          }

          let hasWon = false;
          let endsTurn = true; // Por padrão, jogar carta passa o turno, a menos que gere pendingAction ou extraPlay
          
          if (card.type === 'object') {
            const hasCategory = me.objectArea.some(c => c.category === card.category);
            if (hasCategory) {
              sender.send(JSON.stringify({ type: "error", message: "Você já possui um objeto dessa categoria na sua área." }));
              return;
            }
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            this.recordObjectPlayed(me.id);

            if (this.state.extraPlayPlayerId === me.id) {
              this.state.extraPlayPlayerId = null;
              this.addLog(`⚡ ${me.name} baixou o objeto ${card.name} como jogada extra do Prompt Perfeito!`);
            } else {
              this.addLog(`${me.name} baixou o objeto ${card.name}.`);
            }
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'joker') {
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            this.recordObjectPlayed(me.id);
            this.addLog(`${me.name} ativou um Coringa!`);
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'effect') {
            // RESOLUÇÃO DE EFEITOS
            let targetPlayer: Player | undefined;
            const targetId = ('targetPlayerId' in parsed ? parsed.targetPlayerId : undefined) ||
                             ('targetId' in parsed ? parsed.targetId : undefined);
            if (targetId) {
              targetPlayer = this.state.players[targetId];
            }

            // Validação para efeitos que exigem alvo
            const targetEffects = [
              'Senha Fraca Detectada',
              'Rede de Apoio',
              'Tomou Block!',
              'Vídeo Deepfake',
              'Esqueceu a Senha',
              'Plágio Detectado',
              'Alerta de Phishing',
              'LI E ACEITO!'
            ];
            if (card.name && targetEffects.includes(card.name)) {
              if (!targetPlayer || targetPlayer.id === me.id) {
                sender.send(JSON.stringify({ type: "error", message: "Você precisa escolher outro jogador como alvo válido." }));
                return;
              }
              if (targetPlayer.isEliminated || targetPlayer.isSpectating) {
                sender.send(JSON.stringify({ type: "error", message: "O jogador alvo não está ativo na partida." }));
                return;
              }
            }

            // Descarta o efeito executado da mão antes de aplicar o efeito
            me.hand.splice(cardIndex, 1);
            this.state.discard.push(card);
            this.recordEffectPlayed(me.id);

            switch (card.name) {
              case 'Senha Forte':
                for (let k = 0; k < 2; k++) {
                  const c = this.drawOneCard();
                  if (c) {
                    me.hand.push(c);
                    this.recordCardDrawn(me.id);
                  }
                }
                this.addLog(`🔑 ${me.name} usou Senha Forte e comprou 2 cartas do baralho.`);
                break;

              case 'Senha Fraca Detectada': {
                if (!targetPlayer) break;
                const c = this.drawOneCard();
                if (c) {
                  me.hand.push(c);
                  this.recordCardDrawn(me.id);
                }

                this.state.revealedPlayerIds = Array.from(
                  new Set([...(this.state.revealedPlayerIds || []), targetPlayer.id])
                );
                this.state.revealedPlayerUntilTurn = {
                  ...(this.state.revealedPlayerUntilTurn || {}),
                  [targetPlayer.id]: me.id
                };
                this.addLog(`🔍 ${me.name} detectou Senha Fraca de ${targetPlayer.name}! A mão de ${targetPlayer.name} foi revelada a todos (+1 carta comprada).`);
                break;
              }

              case 'Vazamento de Dados': {
                this.state.revealedHandsUntilTurnOfPlayerId = me.id;
                const c = this.drawOneCard();
                if (c) {
                  me.hand.push(c);
                  this.recordCardDrawn(me.id);
                }
                this.addLog(`👁️ ${me.name} usou Vazamento de Dados! Todos jogam com as mãos reveladas até o próximo turno de ${me.name} (+1 carta comprada).`);
                break;
              }

              case 'Six Seven': {
                const activePlayerIds = Object.keys(this.state.players).filter(
                  id => !this.state.players[id].isEliminated
                );
                if (activePlayerIds.length > 1) {
                  const originalHands: Record<string, Card[]> = {};
                  for (const pid of activePlayerIds) {
                    originalHands[pid] = [...this.state.players[pid].hand];
                  }
                  for (let i = 0; i < activePlayerIds.length; i++) {
                    const fromId = activePlayerIds[i];
                    const toIndex = (i + 1) % activePlayerIds.length;
                    const toId = activePlayerIds[toIndex];
                    this.state.players[toId].hand = originalHands[fromId];
                  }
                  this.addLog(`🔄 ${me.name} usou Six Seven! Todos os jogadores passaram suas mãos inteiras de cartas para a esquerda.`);
                } else {
                  this.addLog(`${me.name} usou Six Seven, mas não há outros jogadores ativos para passar a mão.`);
                }
                break;
              }

              case 'Limpeza de Cache':
                if (me.hand.length <= 1) {
                  for (let k = 0; k < 3; k++) {
                    const c = this.drawOneCard();
                    if (c) {
                      me.hand.push(c);
                      this.recordCardDrawn(me.id);
                    }
                  }
                  this.addLog(`🧹 ${me.name} fez Limpeza de Cache e comprou 3 cartas!`);
                } else {
                  this.addLog(`${me.name} tentou Limpeza de Cache, mas tinha ${me.hand.length} cartas na mão (necessário 0 ou 1). Nenhuma carta comprada.`);
                }
                break;

              case 'Engajamento Merecido': {
                const amountToDraw = me.objectArea.length;
                for (let k = 0; k < amountToDraw; k++) {
                  const c = this.drawOneCard();
                  if (c) {
                    me.hand.push(c);
                    this.recordCardDrawn(me.id);
                  }
                }
                this.addLog(`⭐ ${me.name} ganhou ${amountToDraw} carta(s) pelo seu Engajamento Merecido.`);
                break;
              }

              case 'Formatar o Sistema': {
                const activePlayers = Object.values(this.state.players).filter(p => !p.isEliminated);
                // Envia todas as mãos dos jogadores ativos para o descarte
                for (const p of activePlayers) {
                  this.state.discard.push(...p.hand);
                  p.hand = [];
                }
                // Distribui 3 cartas novas do baralho para cada participante ativo
                for (let round = 0; round < 3; round++) {
                  for (const p of activePlayers) {
                    const c = this.drawOneCard();
                    if (c) {
                      p.hand.push(c);
                      this.recordCardDrawn(p.id);
                    }
                  }
                }
                this.addLog(`💻 ${me.name} formatou o sistema! Todos descartaram suas mãos inteiras e compraram 3 cartas novas do baralho.`);
                break;
              }

              case 'Rede de Apoio': {
                for (let k = 0; k < 3; k++) {
                  const c = this.drawOneCard();
                  if (c) {
                    me.hand.push(c);
                    this.recordCardDrawn(me.id);
                  }
                }
                if (targetPlayer) {
                  const targetCard = this.drawOneCard();
                  if (targetCard) {
                    targetPlayer.hand.push(targetCard);
                    this.recordCardDrawn(targetPlayer.id);
                  }
                  this.addLog(`🤝 ${me.name} usou Rede de Apoio: comprou 3 cartas e ${targetPlayer.name} comprou 1.`);
                }
                break;
              }

              case 'Tomou Block!': {
                if (!targetPlayer) break;
                const c = this.drawOneCard();
                if (c) {
                  me.hand.push(c);
                  this.recordCardDrawn(me.id);
                }
                targetPlayer.skipNextTurn = true;
                targetPlayer.isBlocked = true;
                this.addLog(`🚫 ${me.name} deu Block em ${targetPlayer.name}! Ele perderá a vez no próximo turno (+1 carta comprada).`);
                break;
              }

              case 'Vídeo Deepfake': {
                if (!targetPlayer) break;
                // Garante que a carta Vídeo Deepfake seja enviada para o discardPile e excluída da mão antes da troca
                me.hand = me.hand.filter(c => c.id !== card.id);
                if (!this.state.discard.some(c => c.id === card.id)) {
                  this.state.discard.push(card);
                }
                const myHandToGive = [...me.hand];
                me.hand = [...targetPlayer.hand];
                targetPlayer.hand = myHandToGive;
                this.addLog(`🎭 ${me.name} usou Vídeo Deepfake e trocou de mão com ${targetPlayer.name}!`);
                break;
              }

              case 'Agência de Checagem': {
                let returnedCount = 0;
                for (const [pid, player] of Object.entries(this.state.players)) {
                  if (pid !== me.id && !player.isEliminated && player.objectArea.length > 0) {
                    const returnedCard = player.objectArea.pop()!;
                    player.hand.push(returnedCard);
                    returnedCount++;
                  }
                }
                if (returnedCount > 0) {
                  this.addLog(`🔎 ${me.name} acionou a Agência de Checagem! ${returnedCount} adversário(s) devolveram o último objeto da mesa para a mão.`);
                } else {
                  this.addLog(`🔎 ${me.name} acionou a Agência de Checagem, mas nenhum adversário possuía objetos na mesa.`);
                }
                break;
              }

              case 'Esqueceu a Senha': {
                if (!targetPlayer) break;
                if (targetPlayer.hand.length > 0) {
                  const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
                  const discardedCard = targetPlayer.hand.splice(randomIndex, 1)[0];
                  this.state.discard.push(discardedCard);
                  this.addLog(`🔒 ${me.name} usou Esqueceu a Senha! ${targetPlayer.name} descartou 1 carta aleatória (${discardedCard.name || 'Carta'}).`);
                } else {
                  this.addLog(`🔒 ${me.name} usou Esqueceu a Senha contra ${targetPlayer.name}, mas ele não possuía cartas na mão.`);
                }
                break;
              }

              case 'Plágio Detectado': {
                if (!targetPlayer) break;
                if (targetPlayer.objectArea.length > 0) {
                  const discardedObj = targetPlayer.objectArea.pop()!;
                  this.state.discard.push(discardedObj);
                  this.addLog(`🚨 ${me.name} detectou Plágio de ${targetPlayer.name}! O objeto "${discardedObj.name}" foi removido da mesa e descartado.`);
                } else {
                  this.addLog(`🚨 ${me.name} usou Plágio Detectado contra ${targetPlayer.name}, mas ele não possuía objetos na mesa.`);
                }
                break;
              }

              case 'Prompt Perfeito': {
                for (let k = 0; k < 2; k++) {
                  const c = this.drawOneCard();
                  if (c) {
                    me.hand.push(c);
                    this.recordCardDrawn(me.id);
                  }
                }

                const existingCategories = new Set(
                  me.objectArea.filter(c => c.type === 'object' && c.category).map(c => c.category)
                );
                const hasEligibleObject = me.hand.some(
                  c => c.type === 'object' && c.category && !existingCategories.has(c.category)
                );

                if (hasEligibleObject) {
                  this.state.extraPlayPlayerId = me.id;
                  endsTurn = false;
                  this.addLog(`✨ ${me.name} usou Prompt Perfeito! Comprou 2 cartas e tem a chance de baixar um novo Objeto como jogada extra.`);
                } else {
                  this.addLog(`✨ ${me.name} usou Prompt Perfeito e comprou 2 cartas, mas não possui nenhum Objeto novo para baixar.`);
                  endsTurn = true;
                }
                break;
              }

              case 'Alerta de Phishing': {
                if (!targetPlayer) break;
                if (targetPlayer.hand.length === 0) {
                  this.addLog(`🚨 ${me.name} usou Alerta de Phishing em ${targetPlayer.name}, mas ele não possuía cartas na mão.`);
                  endsTurn = true;
                } else if (targetPlayer.hand.length === 1) {
                  const discardedCard = targetPlayer.hand.splice(0, 1)[0];
                  this.state.discard.push(discardedCard);
                  this.addLog(`🚨 ${me.name} usou Alerta de Phishing! Como ${targetPlayer.name} só tinha 1 carta (${discardedCard.name || 'Carta'}), ela foi descartada automaticamente.`);
                  endsTurn = true;
                } else {
                  this.state.pendingAction = {
                    type: 'CHOOSE_CARD_TO_DISCARD',
                    requiredPlayerId: targetPlayer.id,
                    initiatorPlayerId: me.id,
                    sourceCardName: card.name,
                  };
                  endsTurn = false;
                  this.addLog(`🚨 ${me.name} jogou Alerta de Phishing em ${targetPlayer.name}, que deve escolher 1 carta da mão para descartar.`);
                }
                break;
              }

              case 'LI E ACEITO!': {
                if (!targetPlayer) break;
                if (targetPlayer.hand.length === 0) {
                  this.addLog(`📜 ${me.name} usou LI E ACEITO! em ${targetPlayer.name}, mas ele não possuía cartas na mão.`);
                  endsTurn = true;
                } else if (targetPlayer.hand.length === 1) {
                  const transferredCard = targetPlayer.hand.splice(0, 1)[0];
                  me.hand.push(transferredCard);
                  this.addLog(`📜 ${me.name} usou LI E ACEITO! Como ${targetPlayer.name} só tinha 1 carta (${transferredCard.name || 'Carta'}), ela foi entregue automaticamente a ${me.name}.`);
                  endsTurn = true;
                } else {
                  this.state.pendingAction = {
                    type: 'CHOOSE_CARD_TO_GIVE',
                    requiredPlayerId: targetPlayer.id,
                    initiatorPlayerId: me.id,
                    sourceCardName: card.name,
                  };
                  endsTurn = false;
                  this.addLog(`📜 ${me.name} jogou LI E ACEITO! em ${targetPlayer.name}, que deve escolher 1 carta da mão para entregar a ${me.name}.`);
                }
                break;
              }

              default:
                sender.send(JSON.stringify({ type: "error", message: "Efeito desconhecido." }));
                return;
            }
          }

          this.checkEliminations();
          if (!hasWon && endsTurn) {
            this.passTurn();
          } else if (!hasWon && !endsTurn && this.state.roomSettings?.turnTimerEnabled) {
            this.resetTurnTimer();
          }
          this.broadcastSync();
          return;
        }
      }

      // ==========================================
      // REINICIAR PARTIDA
      // ==========================================
      if (parsed.type === "return_to_lobby") {
        if (this.state.status !== "finished") {
          sender.send(JSON.stringify({ type: "error", message: "A partida precisa terminar primeiro." }));
          return;
        }

        this.clearTurnTimer();

        // Reseta tudo, mantém os jogadores conectados
        this.state.status = "lobby";
        this.state.deck = [];
        this.state.discard = [];
        this.state.currentTurnPlayerId = null;
        this.state.winnerId = null;
        this.state.turnOrder = [];
        this.state.actionLog = [];
        this.state.pendingAction = null;
        this.state.extraPlayPlayerId = null;
        this.state.revealedHandsUntilTurnOfPlayerId = null;
        this.state.revealedPlayerIds = [];
        this.state.revealedPlayerUntilTurn = {};
        this.state.stats = null;

        for (const pid of Object.keys(this.state.players)) {
          const player = this.state.players[pid];
          player.hand = [];
          player.objectArea = [];
          player.skipNextTurn = false;
          player.isBlocked = false;
          player.isEliminated = false;
          player.isSpectating = false;
        }

        this.matchRecorded = false;
        this.checkAutoStartTimer();
        this.notifyRegistry();
        this.syncState();
        return;
      }

      // ==========================================
      // ATUALIZAR CONFIGURAÇÕES DA SALA (Líder)
      // ==========================================
      if (parsed.type === "update_room_settings") {
        if (myPlayerId !== this.state.creatorId) {
          sender.send(JSON.stringify({
            type: "error",
            message: "Apenas o líder da sala pode alterar as configurações.",
          }));
          return;
        }

        const currentSettings: RoomSettings = this.state.roomSettings || {
          turnTimerEnabled: false,
          turnTimerDuration: 30,
        };

        this.state.roomSettings = {
          ...currentSettings,
          ...parsed.settings,
        };

        if (this.state.status === "playing") {
          if (this.state.roomSettings.turnTimerEnabled) {
            this.resetTurnTimer();
          } else {
            this.clearTurnTimer();
          }
        }

        const timerDesc = this.state.roomSettings.turnTimerEnabled
          ? `ativado (${this.state.roomSettings.turnTimerDuration}s)`
          : "desativado";
        this.addLog(`⚙️ Configurações da sala atualizadas: Anti-Stall ${timerDesc}.`);
        this.broadcastSync();
        return;
      }

      // ==========================================
      // REAÇÕES RÁPIDAS COM EMOJIS FLUTUANTES
      // ==========================================
      if (parsed.type === "send_reaction") {
        if (!parsed.emoji || typeof parsed.emoji !== "string") return;

        const now = Date.now();
        const timestamps = (this.reactionTimestamps.get(sender.id) || []).filter(t => now - t < 2000);
        if (timestamps.length >= 3) {
          // Rate-limit: Máximo de 3 reações a cada 2 segundos por conexão
          return;
        }
        timestamps.push(now);
        this.reactionTimestamps.set(sender.id, timestamps);

        const senderPlayer = this.state.players[myPlayerId];
        const senderName = senderPlayer?.name ? senderPlayer.name.split(" ")[0] : "Alguém";

        const reactionMsg: ServerMessage = {
          type: "reaction_received",
          id: `rx_${now}_${Math.random().toString(36).substring(2, 7)}`,
          emoji: parsed.emoji,
          senderName,
        };

        this.room.broadcast(JSON.stringify(reactionMsg));
        return;
      }

    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  private syncState() {
    this.checkEliminations();
    if (this.state.status === "finished") {
      this.handleMatchFinished();
      this.notifyRegistry();
    }
    this.broadcastSync();
  }



  private broadcastSync() {
    const syncMsg: ServerMessage = {
      type: "sync",
      state: this.state,
    };
    this.room.broadcast(JSON.stringify(syncMsg));
  }
}
