import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage, Card, Player } from "../src/types/game";
import { OBJECT_CARDS_DATA, EFFECTS_CARDS_DATA } from "../src/data/cards";

function generateDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 1;

  // 30 Objetos
  OBJECT_CARDS_DATA.forEach(item => {
    deck.push({
      id: `obj_${idCounter++}`,
      type: 'object',
      category: item.category,
      name: item.name,
      description: item.description,
    });
  });

  // 2 Coringas
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `jkr_${idCounter++}`,
      type: 'joker',
      name: `Coringa ${i + 1}`,
      description: 'Pode representar qualquer categoria na área de objetos.',
    });
  }

  // Efeitos
  EFFECTS_CARDS_DATA.forEach(conf => {
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `eff_${idCounter++}`,
        type: 'effect',
        name: conf.name,
        description: conf.desc,
        tip: conf.tip,
        fact: conf.fact,
      });
    }
  });

  return deck;
}

function shuffleDeck<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default class MainServer implements Party.Server {
  private state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      status: 'lobby',
      players: {},
      creatorId: null,
      deck: [],
      discard: [],
      currentTurnPlayerId: null,
      winnerId: null,
      actionLog: [],
      pendingAction: null,
      revealedHandsUntilTurnOfPlayerId: null,
    };
  }

  private addLog(message: string) {
    this.state.actionLog.push(message);
    if (this.state.actionLog.length > 50) {
      this.state.actionLog.shift(); // Mantém apenas os 50 últimos logs
    }
  }

  onConnect(conn: Party.Connection) {
    console.log(`Conexão estabelecida: ${conn.id} na sala ${this.room.id}`);
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão fechada: ${conn.id}`);
    if (this.state.status === "playing") {
      this.addLog(`O jogador ${this.state.players[conn.id]?.name || conn.id} desconectou.`);
      this.reclaimPlayerCards(conn.id);
      this.checkEliminations();
      this.broadcastSync();
    } else {
      delete this.state.players[conn.id];
      if (this.state.creatorId === conn.id) {
        const remaining = Object.keys(this.state.players);
        this.state.creatorId = remaining.length > 0 ? remaining[0] : null;
      }
      this.broadcastSync();
    }
  }

  private reclaimPlayerCards(playerId: string) {
    const player = this.state.players[playerId];
    if (!player || player.isEliminated) return;

    if (this.state.revealedHandsUntilTurnOfPlayerId === playerId) {
      this.state.revealedHandsUntilTurnOfPlayerId = null;
    }

    const recoveredCards = [...player.hand, ...player.objectArea];
    player.hand = [];
    player.objectArea = [];
    player.isEliminated = true;

    if (recoveredCards.length > 0) {
      this.state.deck.push(...recoveredCards);
      this.state.deck = shuffleDeck(this.state.deck);
      this.addLog(`Cartas de ${player.name} retornaram ao baralho.`);
    }

    if (this.state.currentTurnPlayerId === playerId) {
      this.passTurn();
    }
  }

  private passTurn() {
    if (!this.state.currentTurnPlayerId) return;
    const playerIds = Object.keys(this.state.players);
    if (playerIds.length === 0) return;
    
    let currentIndex = playerIds.indexOf(this.state.currentTurnPlayerId);
    
    for (let i = 0; i < playerIds.length; i++) {
      currentIndex = (currentIndex + 1) % playerIds.length;
      const nextId = playerIds[currentIndex];
      const nextPlayer = this.state.players[nextId];
      
      if (nextPlayer.isEliminated) {
        continue; // Pula os eliminados sumariamente
      }
      
      if (nextPlayer.skipNextTurn) {
        nextPlayer.skipNextTurn = false;
        this.addLog(`${nextPlayer.name} perdeu a vez pelo block!`);
        if (this.state.revealedHandsUntilTurnOfPlayerId === nextId) {
          this.state.revealedHandsUntilTurnOfPlayerId = null;
          this.addLog("O efeito de Vazamento de Dados terminou. As mãos voltaram a ser secretas.");
        }
      } else {
        this.state.currentTurnPlayerId = nextId;
        break;
      }
    }

    // Se o turno voltou para o jogador que ativou Vazamento de Dados, limpa a flag
    if (
      this.state.revealedHandsUntilTurnOfPlayerId &&
      this.state.currentTurnPlayerId === this.state.revealedHandsUntilTurnOfPlayerId
    ) {
      this.state.revealedHandsUntilTurnOfPlayerId = null;
      this.addLog("O efeito de Vazamento de Dados terminou. As mãos voltaram a ser secretas.");
    }
  }

  private checkEliminations(): boolean {
    if (this.state.status !== 'playing') return false;
    
    let activePlayers = 0;
    let lastActiveId: string | null = null;
    
    for (const [id, player] of Object.entries(this.state.players)) {
      if (!player.isEliminated && player.hand.length === 0) {
        this.addLog(`💀 ${player.name} ficou sem cartas e foi eliminado!`);
        
        if (this.state.pendingAction?.playerId === id) {
          this.state.pendingAction = null; // Libera se o alvo morrer
        }

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
      this.addLog(`🏆 ${this.state.players[lastActiveId].name} é o último sobrevivente e venceu o jogo!`);
      return true;
    }
    
    if (activePlayers === 0) {
      this.state.status = 'finished';
      this.addLog(`Empate catastrófico! Todos foram eliminados.`);
      return true;
    }
    
    return false;
  }

  private checkVictory(playerId: string): boolean {
    const p = this.state.players[playerId];
    if (!p) return false;
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
      this.addLog(`🏆 ${p.name} fechou o Combo e venceu o jogo!`);
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
        if (this.state.status !== "lobby") {
          sender.send(JSON.stringify({ type: "error", message: "A partida já começou!" }));
          return;
        }

        const isCreator = this.state.creatorId === null || Object.keys(this.state.players).length === 0;
        if (isCreator) {
          this.state.creatorId = sender.id;
        }

        this.state.players[sender.id] = {
          id: sender.id,
          name: parsed.name,
          isCreator,
          hand: [],
          objectArea: [],
          skipNextTurn: false,
          isEliminated: false,
        };

        this.broadcastSync();
        return;
      }

      if (parsed.type === "start_game") {
        if (this.state.status !== "lobby") {
          sender.send(JSON.stringify({ type: "error", message: "A partida já está em andamento." }));
          return;
        }
        
        if (sender.id !== this.state.creatorId) {
          sender.send(JSON.stringify({ type: "error", message: "Apenas o criador pode iniciar o jogo." }));
          return;
        }

        const playerIds = Object.keys(this.state.players);
        if (playerIds.length === 0) return;

        const newDeck = generateDeck();
        const shuffledDeck = shuffleDeck(newDeck);

        for (const pid of playerIds) {
          const player = this.state.players[pid];
          player.hand = shuffledDeck.splice(-3, 3);
        }

        this.state.deck = shuffledDeck;
        this.state.status = "playing";
        this.state.currentTurnPlayerId = this.state.creatorId;
        this.state.actionLog = [];
        this.state.revealedHandsUntilTurnOfPlayerId = null;
        this.addLog("A partida começou!");

        this.broadcastSync();
        return;
      }

      // ==========================================
      // PENDING ACTION (Alerta de Phishing)
      // ==========================================
      if (this.state.pendingAction && this.state.status === "playing") {
        const pAction = this.state.pendingAction;
        
        // Só aceita mensagem do alvo E que seja discard_card
        if (sender.id !== pAction.playerId || parsed.type !== 'discard_card') {
           sender.send(JSON.stringify({ type: "error", message: "Aguardando o alvo descartar uma carta." }));
           return;
        }

        const targetPlayer = this.state.players[sender.id];
        const cIndex = targetPlayer.hand.findIndex(c => c.id === parsed.cardId);
        
        if (cIndex === -1) {
           sender.send(JSON.stringify({ type: "error", message: "Carta não encontrada na mão." }));
           return;
        }

        // Descarta e resolve a ação
        const discarded = targetPlayer.hand.splice(cIndex, 1)[0];
        this.state.discard.push(discarded);
        this.state.pendingAction = null;
        this.addLog(`${targetPlayer.name} escolheu descartar uma carta.`);
        
        this.checkEliminations();
        this.passTurn();
        this.broadcastSync();
        return;
      }

      // ==========================================
      // LÓGICA DE TURNO E AÇÕES NORMAIS
      // ==========================================
      const gameActions = ["draw_card", "play_card", "trade_card"];
      if (gameActions.includes(parsed.type)) {
        if (this.state.status !== "playing") {
          sender.send(JSON.stringify({ type: "error", message: "O jogo não está em andamento." }));
          return;
        }

        if (this.state.pendingAction) {
          sender.send(JSON.stringify({ type: "error", message: "Ação pendente ocorrendo na mesa." }));
          return;
        }

        if (sender.id !== this.state.currentTurnPlayerId) {
          sender.send(JSON.stringify({ type: "error", message: "Não é o seu turno!" }));
          return;
        }

        const me = this.state.players[sender.id];

        // -------------------------
        // COMPRAR
        // -------------------------
        if (parsed.type === "draw_card") {
          const card = this.drawOneCard();
          if (card) {
            me.hand.push(card);
            this.addLog(`${me.name} comprou uma carta do baralho.`);
          }
          this.checkEliminations();
          this.passTurn();
          this.broadcastSync();
          return;
        }

        // -------------------------
        // TROCAR (TRADE)
        // -------------------------
        if (parsed.type === "trade_card") {
          const target = this.state.players[parsed.targetPlayerId];
          if (!target) {
            sender.send(JSON.stringify({ type: "error", message: "Jogador alvo não encontrado." }));
            return;
          }
          
          if (me.id === target.id) {
             sender.send(JSON.stringify({ type: "error", message: "Você não pode trocar cartas com você mesmo." }));
             return;
          }

          if (me.hand.length === 0 || target.hand.length === 0) {
            sender.send(JSON.stringify({ type: "error", message: "Ambos os jogadores devem possuir cartas na mão para a troca." }));
            return;
          }

          const myCardIndex = Math.floor(Math.random() * me.hand.length);
          const targetCardIndex = Math.floor(Math.random() * target.hand.length);

          const myCard = me.hand.splice(myCardIndex, 1)[0];
          const targetCard = target.hand.splice(targetCardIndex, 1)[0];

          me.hand.push(targetCard);
          target.hand.push(myCard);

          this.addLog(`${me.name} realizou uma troca aleatória de cartas com ${target.name}.`);

          this.checkEliminations();
          this.passTurn();
          this.broadcastSync();
          return;
        }

        // -------------------------
        // JOGAR CARTA
        // -------------------------
        if (parsed.type === "play_card") {
          const cardIndex = me.hand.findIndex(c => c.id === parsed.cardId);
          if (cardIndex === -1) {
            sender.send(JSON.stringify({ type: "error", message: "Carta não encontrada na sua mão." }));
            return;
          }
          
          const card = me.hand[cardIndex];
          let hasWon = false;
          let endsTurn = true; // Por padrão, jogar carta passa o turno, a menos que gere pendingAction
          
          if (card.type === 'object') {
            const hasCategory = me.objectArea.some(c => c.category === card.category);
            if (hasCategory) {
              sender.send(JSON.stringify({ type: "error", message: "Você já possui um objeto dessa categoria na sua área." }));
              return;
            }
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            this.addLog(`${me.name} baixou o objeto ${card.name}.`);
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'joker') {
            me.hand.splice(cardIndex, 1);
            me.objectArea.push(card);
            this.addLog(`${me.name} ativou um Coringa!`);
            hasWon = this.checkVictory(me.id);
          } 
          else if (card.type === 'effect') {
            // RESOLUÇÃO DE EFEITOS
            let targetPlayer: Player | undefined;
            if (parsed.targetId) {
              targetPlayer = this.state.players[parsed.targetId];
            }

            // Validação para efeitos que exigem alvo
            const targetEffects = ['Rede de Apoio', 'Alerta de Phishing', 'Tomou Block!', 'Vídeo Deepfake', 'Esqueceu a Senha'];
            if (card.name && targetEffects.includes(card.name)) {
              if (!targetPlayer || targetPlayer.id === me.id) {
                sender.send(JSON.stringify({ type: "error", message: "Você precisa escolher outro jogador como alvo válido." }));
                return;
              }
              if (targetPlayer.isEliminated) {
                sender.send(JSON.stringify({ type: "error", message: "O jogador alvo já foi eliminado." }));
                return;
              }
            }

            // Descarta o efeito executado da mão antes de aplicar o efeito
            me.hand.splice(cardIndex, 1);
            this.state.discard.push(card);

            switch (card.name) {
              case 'Senha Forte':
                for (let k = 0; k < 2; k++) {
                  const c = this.drawOneCard();
                  if (c) me.hand.push(c);
                }
                this.addLog(`🔑 ${me.name} usou Senha Forte e comprou 2 cartas do baralho.`);
                break;

              case 'Vazamento de Dados': {
                this.state.revealedHandsUntilTurnOfPlayerId = me.id;
                const c = this.drawOneCard();
                if (c) me.hand.push(c);
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
                    if (c) me.hand.push(c);
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
                  if (c) me.hand.push(c);
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
                    if (c) p.hand.push(c);
                  }
                }
                this.addLog(`💻 ${me.name} formatou o sistema! Todos descartaram suas mãos inteiras e compraram 3 cartas novas do baralho.`);
                break;
              }

              case 'Rede de Apoio': {
                for (let k = 0; k < 3; k++) {
                  const c = this.drawOneCard();
                  if (c) me.hand.push(c);
                }
                if (targetPlayer) {
                  const targetCard = this.drawOneCard();
                  if (targetCard) targetPlayer.hand.push(targetCard);
                }
                this.addLog(`${me.name} usou Rede de Apoio: Comprou 3 cartas e fez ${targetPlayer!.name} comprar 1.`);
                break;
              }

              case 'Alerta de Phishing':
                if (targetPlayer!.hand.length === 0) {
                  sender.send(JSON.stringify({ type: "error", message: "O jogador alvo não tem cartas na mão para descartar." }));
                  return;
                }
                this.addLog(`${me.name} jogou Alerta de Phishing em ${targetPlayer!.name}, que deve escolher uma carta para descartar.`);
                this.state.pendingAction = { type: 'discard', playerId: targetPlayer!.id, amount: 1 };
                endsTurn = false; // Não passa o turno ainda! A vez passa após o discard_card.
                break;

              case 'Tomou Block!':
                targetPlayer!.skipNextTurn = true;
                this.addLog(`${me.name} deu Block em ${targetPlayer!.name}! Próximo turno dele será pulado.`);
                break;

              case 'Vídeo Deepfake': {
                const tempHand = [...me.hand];
                me.hand = [...targetPlayer!.hand];
                targetPlayer!.hand = tempHand;
                this.addLog(`${me.name} trocou TODA a sua mão com a de ${targetPlayer!.name}!`);
                break;
              }

              case 'Esqueceu a Senha':
                if (targetPlayer!.hand.length > 0) {
                  const rIdx = Math.floor(Math.random() * targetPlayer!.hand.length);
                  const discardedR = targetPlayer!.hand.splice(rIdx, 1)[0];
                  this.state.discard.push(discardedR);
                  this.addLog(`${me.name} fez ${targetPlayer!.name} esquecer a senha e perder 1 carta aleatória.`);
                } else {
                  this.addLog(`${me.name} usou Esqueceu a Senha em ${targetPlayer!.name}, mas ele não tinha cartas.`);
                }
                break;

              default:
                sender.send(JSON.stringify({ type: "error", message: "Efeito desconhecido." }));
                return;
            }
          }

          this.checkEliminations();
          if (!hasWon && endsTurn) {
            this.passTurn();
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

        // Reseta tudo, mantém os jogadores conectados
        this.state.status = "lobby";
        this.state.deck = [];
        this.state.discard = [];
        this.state.currentTurnPlayerId = null;
        this.state.winnerId = null;
        this.state.actionLog = [];
        this.state.pendingAction = null;
        this.state.revealedHandsUntilTurnOfPlayerId = null;

        for (const pid of Object.keys(this.state.players)) {
          const player = this.state.players[pid];
          player.hand = [];
          player.objectArea = [];
          player.skipNextTurn = false;
          player.isEliminated = false;
        }

        this.syncState();
        return;
      }

    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  private syncState() {
    this.checkEliminations();
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
