import type * as Party from "partykit/server";
import { GameState, ClientMessage, ServerMessage, Card, ObjectCategory, Player } from "../src/types/game";

function generateDeck(): Card[] {
  const deck: Card[] = [];
  const categories: ObjectCategory[] = [
    'Segurança Digital', 
    'Privacidade', 
    'Pensamento Crítico', 
    'Cidadania Digital', 
    'Ferramentas Digitais', 
    'Inteligência Artificial'
  ];
  let idCounter = 1;

  // 30 Objetos (5 por categoria)
  categories.forEach(cat => {
    for (let i = 0; i < 5; i++) {
      deck.push({
        id: `obj_${idCounter++}`,
        type: 'object',
        category: cat,
        name: `${cat} Nvl ${i + 1}`,
      });
    }
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

  // Efeitos (8 exclusivos)
  const effectsConfigs = [
    { name: 'Senha Forte', desc: 'Compre 2 cartas.' },
    { name: 'Rede de Apoio', desc: 'Compre 3 cartas e escolha outro jogador para comprar 1.' },
    { name: 'Alerta de Phishing', desc: 'Escolha um jogador. Ele deve descartar 1 carta da mão à escolha dele.' },
    { name: 'Tomou Block!', desc: 'Escolha um jogador. Ele perde o próximo turno.' },
    { name: 'Vídeo Deepfake', desc: 'Troque toda a sua mão com a mão de outro jogador.' },
    { name: 'Limpeza de Cache', desc: 'Se você tiver 0 ou 1 carta na mão (após jogar esta), compre 3 cartas.' },
    { name: 'Engajamento Merecido', desc: 'Compre 1 carta para cada objeto que você tem baixado.' },
    { name: 'Esqueceu a Senha', desc: 'Escolha um jogador. Ele descarta 1 carta aleatória da mão.' },
  ];

  // Geramos 2 de cada para um total de 16 efeitos
  effectsConfigs.forEach(conf => {
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `eff_${idCounter++}`,
        type: 'effect',
        name: conf.name,
        description: conf.desc,
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
    };
  }

  private addLog(message: string) {
    this.state.actionLog.push(message);
    if (this.state.actionLog.length > 50) {
      this.state.actionLog.shift(); // Mantém apenas os 50 últimos logs
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Conexão estabelecida: ${conn.id} na sala ${this.room.id}`);
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
      } else {
        this.state.currentTurnPlayerId = nextId;
        break;
      }
    }
  }

  private checkEliminations(): boolean {
    if (this.state.status !== 'playing') return false;
    
    let activePlayers = 0;
    let lastActiveId: string | null = null;
    
    for (const [id, player] of Object.entries(this.state.players)) {
      if (!player.isEliminated && player.hand.length === 0) {
        player.isEliminated = true;
        this.addLog(`💀 ${player.name} ficou sem cartas e foi eliminado!`);
        
        if (this.state.pendingAction?.playerId === id) {
          this.state.pendingAction = null; // Libera se o alvo morrer
        }
      }
      
      if (!player.isEliminated) {
        activePlayers++;
        lastActiveId = id;
      }
    }
    
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
      this.state.deck = shuffleDeck(this.state.discard);
      this.state.discard = [];
      this.addLog("O descarte foi embaralhado para formar um novo baralho.");
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

            switch (card.name) {
              case 'Senha Forte':
                me.hand.push(...[this.drawOneCard(), this.drawOneCard()].filter(Boolean) as Card[]);
                this.addLog(`${me.name} usou Senha Forte e comprou 2 cartas.`);
                break;
                
              case 'Rede de Apoio':
                if (!targetPlayer || targetPlayer.id === me.id) {
                  sender.send(JSON.stringify({ type: "error", message: "Você precisa escolher outro jogador como alvo." }));
                  return;
                }
                me.hand.push(...[this.drawOneCard(), this.drawOneCard(), this.drawOneCard()].filter(Boolean) as Card[]);
                targetPlayer.hand.push(...[this.drawOneCard()].filter(Boolean) as Card[]);
                this.addLog(`${me.name} usou Rede de Apoio: Comprou 3 cartas e fez ${targetPlayer.name} comprar 1.`);
                break;
                
              case 'Alerta de Phishing':
                if (!targetPlayer || targetPlayer.id === me.id) {
                  sender.send(JSON.stringify({ type: "error", message: "Escolha um jogador alvo." }));
                  return;
                }
                if (targetPlayer.hand.length === 0) {
                  sender.send(JSON.stringify({ type: "error", message: "O jogador alvo não tem cartas na mão para descartar." }));
                  return;
                }
                this.addLog(`${me.name} jogou Alerta de Phishing em ${targetPlayer.name}, que deve escolher uma carta para descartar.`);
                this.state.pendingAction = { type: 'discard', playerId: targetPlayer.id, amount: 1 };
                endsTurn = false; // Não passa o turno ainda! A vez passa após o discard_card.
                break;
                
              case 'Tomou Block!':
                if (!targetPlayer || targetPlayer.id === me.id) {
                  sender.send(JSON.stringify({ type: "error", message: "Escolha um jogador alvo." }));
                  return;
                }
                targetPlayer.skipNextTurn = true;
                this.addLog(`${me.name} deu Block em ${targetPlayer.name}! Próximo turno dele será pulado.`);
                break;
                
              case 'Vídeo Deepfake':
                if (!targetPlayer || targetPlayer.id === me.id) {
                  sender.send(JSON.stringify({ type: "error", message: "Escolha um jogador alvo." }));
                  return;
                }
                const tempHand = [...me.hand];
                me.hand = [...targetPlayer.hand];
                targetPlayer.hand = tempHand;
                this.addLog(`${me.name} trocou TODA a sua mão com a de ${targetPlayer.name}!`);
                break;
                
              case 'Limpeza de Cache':
                // Subtrai 1 pois o efeito atual vai sair da mão agora
                if ((me.hand.length - 1) <= 1) {
                  me.hand.push(...[this.drawOneCard(), this.drawOneCard(), this.drawOneCard()].filter(Boolean) as Card[]);
                  this.addLog(`${me.name} fez Limpeza de Cache e comprou 3 cartas.`);
                } else {
                  this.addLog(`${me.name} tentou Limpeza de Cache, mas tinha cartas demais.`);
                }
                break;
                
              case 'Engajamento Merecido':
                const amountToDraw = me.objectArea.length;
                for (let k = 0; k < amountToDraw; k++) {
                  const dCard = this.drawOneCard();
                  if (dCard) me.hand.push(dCard);
                }
                this.addLog(`${me.name} ganhou ${amountToDraw} carta(s) pelo seu Engajamento Merecido.`);
                break;
                
              case 'Esqueceu a Senha':
                if (!targetPlayer || targetPlayer.id === me.id) {
                  sender.send(JSON.stringify({ type: "error", message: "Escolha um jogador alvo." }));
                  return;
                }
                if (targetPlayer.hand.length > 0) {
                  const rIdx = Math.floor(Math.random() * targetPlayer.hand.length);
                  const discardedR = targetPlayer.hand.splice(rIdx, 1)[0];
                  this.state.discard.push(discardedR);
                  this.addLog(`${me.name} fez ${targetPlayer.name} esquecer a senha e perder 1 carta aleatória.`);
                } else {
                  this.addLog(`${me.name} usou Esqueceu a Senha em ${targetPlayer.name}, mas ele não tinha cartas.`);
                }
                break;
                
              default:
                sender.send(JSON.stringify({ type: "error", message: "Efeito desconhecido." }));
                return;
            }

            // Descarta o efeito executado
            me.hand.splice(cardIndex, 1);
            this.state.discard.push(card);
          }

          this.checkEliminations();
          if (!hasWon && endsTurn) {
            this.passTurn();
          }
          this.broadcastSync();
          return;
        }
      }

    } catch (e) {
      console.error("Erro ao processar mensagem", e);
    }
  }

  private syncState() {
    this.checkEliminations();
    this.broadcastSync();
  }

  onClose(conn: Party.Connection) {
    console.log(`Conexão encerrada: ${conn.id}`);
    
    if (this.state.players[conn.id]) {
      const pName = this.state.players[conn.id].name;
      delete this.state.players[conn.id];
      this.addLog(`${pName} abandonou a partida.`);
      
      const remainingPlayers = Object.values(this.state.players);
      if (remainingPlayers.length === 0) {
        this.state.creatorId = null;
        this.state.status = "lobby";
        this.state.deck = [];
        this.state.discard = [];
        this.state.currentTurnPlayerId = null;
        this.state.winnerId = null;
        this.state.actionLog = [];
        this.state.pendingAction = null;
      } else {
        if (this.state.creatorId === conn.id) {
          this.state.creatorId = remainingPlayers[0].id;
          remainingPlayers[0].isCreator = true;
        }
        
        if (this.state.currentTurnPlayerId === conn.id && this.state.status === "playing") {
          this.state.currentTurnPlayerId = remainingPlayers[0].id;
        }
        
        if (this.state.pendingAction?.playerId === conn.id) {
          this.state.pendingAction = null;
          this.passTurn();
        }
      }
      
      this.broadcastSync();
    }
  }

  private broadcastSync() {
    const syncMsg: ServerMessage = {
      type: "sync",
      state: this.state,
    };
    this.room.broadcast(JSON.stringify(syncMsg));
  }
}
