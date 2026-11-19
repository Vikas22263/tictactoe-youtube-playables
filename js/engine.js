// ============================================================================
// Tic Tac Toe Arena - High Performance Multi-Player Game Engine
// Supports 2, 3, and 4 Players, Grid sizes 3x3 up to 11x11, and Smart AI
// ============================================================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TicTacToeEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DRAW_WINNER = -1;
  const PLAYER_SYMBOLS = ['X', 'O', '▲', '■'];
  const GLYPHS = {
    'X': '✕',
    'O': '◯',
    '▲': '▲',
    '■': '■',
  };

  const WIN_PATTERNS_3X3 = [
    0x007, 0x038, 0x1c0, // Rows
    0x049, 0x092, 0x124, // Cols
    0x111, 0x054,       // Diagonals
  ];

  function getDefaultWinStreak(size) {
    if (size <= 3) return 3;
    if (size <= 8) return 4;
    return 5; // 5 in a row for 9x9 and 11x11
  }

  function normalizePlayerCount(count) {
    if (!count || count <= 2) return 2;
    if (count === 3) return 3;
    return 4;
  }

  function getPlayerSymbol(player) {
    const idx = Math.max(0, Math.min(PLAYER_SYMBOLS.length - 1, (player || 1) - 1));
    return PLAYER_SYMBOLS[idx];
  }

  function symbolToPlayer(symbol) {
    if (!symbol) return 0;
    const idx = PLAYER_SYMBOLS.indexOf(symbol);
    return idx >= 0 ? idx + 1 : 0;
  }

  class FlexibleEngine {
    constructor(size = 3, winStreak = 3, playerCount = 2) {
      this.size = 3;
      this.winStreak = 3;
      this.playerCount = 2;
      this.board = [];
      this.p1Mask = 0;
      this.p2Mask = 0;
      this.turn = 1;
      this.moves = 0;
      this.winner = 0; // 0 = Ongoing, 1..4 = Player, -1 = Draw
      this.winningIndices = [];
      this.winningMask = 0;
      this.configure(size, winStreak, playerCount);
    }

    configure(size, winStreak, playerCount) {
      this.size = Math.max(3, Math.min(11, size || 3));
      this.winStreak = winStreak || getDefaultWinStreak(this.size);
      if (playerCount !== undefined) {
        this.playerCount = normalizePlayerCount(playerCount);
      }
      this.reset();
    }

    getBoardSize() {
      return this.size;
    }

    getWinStreak() {
      return this.winStreak;
    }

    getPlayerCount() {
      return this.playerCount;
    }

    reset() {
      const totalCells = this.size * this.size;
      this.board = new Array(totalCells).fill(null);
      this.p1Mask = 0;
      this.p2Mask = 0;
      this.turn = 1;
      this.moves = 0;
      this.winner = 0;
      this.winningIndices = [];
      this.winningMask = 0;
    }

    checkWin3x3Classic(mask) {
      for (let i = 0; i < 8; i++) {
        const win = WIN_PATTERNS_3X3[i];
        if ((mask & win) === win) return win;
      }
      return 0;
    }

    evaluateWinner() {
      const N = this.size;
      const K = this.winStreak;
      const totalCells = N * N;

      // Fast-path for 2-player classic 3x3
      if (N === 3 && K === 3 && this.playerCount === 2) {
        const p1Win = this.checkWin3x3Classic(this.p1Mask);
        if (p1Win !== 0) {
          const indices = [];
          for (let i = 0; i < 9; i++) {
            if (p1Win & (1 << i)) indices.push(i);
          }
          return { winner: 1, winningIndices: indices, winningMask: p1Win };
        }

        const p2Win = this.checkWin3x3Classic(this.p2Mask);
        if (p2Win !== 0) {
          const indices = [];
          for (let i = 0; i < 9; i++) {
            if (p2Win & (1 << i)) indices.push(i);
          }
          return { winner: 2, winningIndices: indices, winningMask: p2Win };
        }

        if (this.moves >= 9) {
          return { winner: DRAW_WINNER, winningIndices: [], winningMask: 0 };
        }

        return { winner: 0, winningIndices: [], winningMask: 0 };
      }

      // General N x N win detection for 2..4 players
      const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal \
        [1, -1], // Diagonal /
      ];

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const startIdx = r * N + c;
          const symbol = this.board[startIdx];
          if (!symbol) continue;

          for (const [dr, dc] of directions) {
            const endR = r + dr * (K - 1);
            const endC = c + dc * (K - 1);

            if (endR < 0 || endR >= N || endC < 0 || endC >= N) continue;

            let matches = true;
            const lineIndices = [startIdx];

            for (let step = 1; step < K; step++) {
              const nextIdx = (r + dr * step) * N + (c + dc * step);
              if (this.board[nextIdx] !== symbol) {
                matches = false;
                break;
              }
              lineIndices.push(nextIdx);
            }

            if (matches) {
              let mask = 0;
              for (const idx of lineIndices) {
                if (idx < 30) mask |= (1 << idx);
              }
              return {
                winner: symbolToPlayer(symbol),
                winningIndices: lineIndices,
                winningMask: mask,
              };
            }
          }
        }
      }

      if (this.moves >= totalCells) {
        return { winner: DRAW_WINNER, winningIndices: [], winningMask: 0 };
      }

      return { winner: 0, winningIndices: [], winningMask: 0 };
    }

    getGameState() {
      const evalResult = this.evaluateWinner();
      this.winner = evalResult.winner;
      this.winningIndices = evalResult.winningIndices;
      this.winningMask = evalResult.winningMask;

      return {
        boardSize: this.size,
        winStreak: this.winStreak,
        playerCount: this.playerCount,
        currentTurn: this.turn,
        isDraw: this.winner === DRAW_WINNER,
        board: [...this.board],
        player1Board: this.p1Mask,
        player2Board: this.p2Mask,
        winner: this.winner,
        winningMask: this.winningMask,
        winningIndices: [...this.winningIndices],
        moveCount: this.moves,
      };
    }

    makeMove(cellIndex) {
      const totalCells = this.size * this.size;
      if (cellIndex < 0 || cellIndex >= totalCells) return this.getGameState();
      if (this.board[cellIndex] !== null) return this.getGameState();
      if (this.winner !== 0) return this.getGameState();

      const symbol = getPlayerSymbol(this.turn);
      this.board[cellIndex] = symbol;

      if (cellIndex < 30) {
        const bit = 1 << cellIndex;
        if (this.turn === 1) {
          this.p1Mask |= bit;
        } else if (this.turn === 2) {
          this.p2Mask |= bit;
        }
      }

      this.moves++;
      this.turn = (this.turn % this.playerCount) + 1;

      return this.getGameState();
    }

    // 3x3 Minimax Alpha-Beta (Unbeatable for 2P)
    minimax3x3(p1, p2, depth, isP1, alpha, beta) {
      if (this.checkWin3x3Classic(p1) !== 0) return 10 - depth;
      if (this.checkWin3x3Classic(p2) !== 0) return depth - 10;
      if ((p1 | p2) === 0x1ff || depth >= 9) return 0;

      if (isP1) {
        let maxEval = -100;
        for (let i = 0; i < 9; i++) {
          const bit = 1 << i;
          if (!((p1 | p2) & bit)) {
            const evalScore = this.minimax3x3(p1 | bit, p2, depth + 1, false, alpha, beta);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
          }
        }
        return maxEval;
      } else {
        let minEval = 100;
        for (let i = 0; i < 9; i++) {
          const bit = 1 << i;
          if (!((p1 | p2) & bit)) {
            const evalScore = this.minimax3x3(p1, p2 | bit, depth + 1, true, alpha, beta);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
          }
        }
        return minEval;
      }
    }

    getBestMove3x3(player, difficulty) {
      const isP1 = player === 1;

      // Easy: 50% random
      if (difficulty === 1 && Math.random() < 0.5) {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
          if (!((this.p1Mask | this.p2Mask) & (1 << i))) emptyCells.push(i);
        }
        if (emptyCells.length > 0) {
          return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
      }

      let bestMove = -1;
      let bestVal = isP1 ? -1000 : 1000;

      for (let i = 0; i < 9; i++) {
        const bit = 1 << i;
        if (!((this.p1Mask | this.p2Mask) & bit)) {
          const moveVal = isP1
            ? this.minimax3x3(this.p1Mask | bit, this.p2Mask, 0, false, -1000, 1000)
            : this.minimax3x3(this.p1Mask, this.p2Mask | bit, 0, true, -1000, 1000);

          if (isP1 ? moveVal > bestVal : moveVal < bestVal) {
            bestVal = moveVal;
            bestMove = i;
          }
        }
      }
      return bestMove;
    }

    checkHypotheticalWin(board, symbol) {
      const N = this.size;
      const K = this.winStreak;
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const startIdx = r * N + c;
          if (board[startIdx] !== symbol) continue;

          for (const [dr, dc] of directions) {
            const endR = r + dr * (K - 1);
            const endC = c + dc * (K - 1);
            if (endR < 0 || endR >= N || endC < 0 || endC >= N) continue;

            let ok = true;
            for (let step = 1; step < K; step++) {
              if (board[(r + dr * step) * N + (c + dc * step)] !== symbol) {
                ok = false;
                break;
              }
            }
            if (ok) return true;
          }
        }
      }
      return false;
    }

    evaluateCellScore(idx, mySymbol, oppSymbols) {
      const N = this.size;
      const r = Math.floor(idx / N);
      const c = idx % N;
      let score = 0;

      // Center cell preference
      const center = (N - 1) / 2;
      const distCenter = Math.abs(r - center) + Math.abs(c - center);
      score += (N * 2 - distCenter) * 2;

      // Adjacency bonus
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            const neighbor = this.board[nr * N + nc];
            if (neighbor === mySymbol) score += 6;
            else if (neighbor !== null && oppSymbols.includes(neighbor)) score += 4;
          }
        }
      }
      return score;
    }

    getBestMove(player = 2, difficulty = 3) {
      if (this.size === 3 && this.playerCount === 2) {
        return this.getBestMove3x3(player, difficulty);
      }

      const mySymbol = getPlayerSymbol(player);
      const oppSymbols = [];
      for (let offset = 1; offset < this.playerCount; offset++) {
        const oppPlayer = ((player - 1 + offset) % this.playerCount) + 1;
        oppSymbols.push(getPlayerSymbol(oppPlayer));
      }

      const totalCells = this.size * this.size;
      const availableMoves = [];

      for (let i = 0; i < totalCells; i++) {
        if (this.board[i] === null) {
          availableMoves.push(i);
        }
      }

      if (availableMoves.length === 0) return -1;

      // Easy mode: 50% chance random move
      if (difficulty === 1 && Math.random() < 0.5) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }

      // 1. Can I win this turn?
      for (const move of availableMoves) {
        this.board[move] = mySymbol;
        const wins = this.checkHypotheticalWin(this.board, mySymbol);
        this.board[move] = null;
        if (wins) return move;
      }

      // 2. Can any opponent win on their upcoming turn? Block them!
      for (const oppSymbol of oppSymbols) {
        for (const move of availableMoves) {
          this.board[move] = oppSymbol;
          const wins = this.checkHypotheticalWin(this.board, oppSymbol);
          this.board[move] = null;
          if (wins) return move;
        }
      }

      // 3. Medium / Hard: Choose best positional score
      let bestMove = availableMoves[0];
      let bestScore = -Infinity;

      for (const move of availableMoves) {
        const score = this.evaluateCellScore(move, mySymbol, oppSymbols);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    }
  }

  return {
    DRAW_WINNER,
    PLAYER_SYMBOLS,
    GLYPHS,
    getDefaultWinStreak,
    normalizePlayerCount,
    getPlayerSymbol,
    symbolToPlayer,
    FlexibleEngine,
  };
});

