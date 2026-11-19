// ============================================================================
// YouTube Playables - Tic Tac Toe Arena App Controller
// ============================================================================

(function () {
  'use strict';

  // Constants
  const THEMES = [
    { id: 'neon_classic', name: 'Neon Classic', icon: '⚡' },
    { id: 'matrix_cyber', name: 'Matrix Cyber', icon: '🟢' },
    { id: 'lava_flame', name: 'Lava Flame', icon: '🔥' },
    { id: 'ice_frost', name: 'Ice Frost', icon: '❄️' },
    { id: 'galaxy_violet', name: 'Galaxy Violet', icon: '🌌' },
  ];

  // Game State
  const state = {
    screen: 'menu', // 'menu' | 'game'
    boardSize: 3,
    winStreak: 3,
    playerCount: 2, // 2 | 3 | 4
    gameMode: 'AI', // 'AI' | 'PASS_PLAY'
    aiDifficulty: 'HARD', // 'EASY' | 'MEDIUM' | 'HARD'
    playerName: localStorage.getItem('ttt_player_name') || 'Player',
    stats: JSON.parse(localStorage.getItem('ttt_stats') || '{"wins":0,"losses":0,"draws":0}'),
    scores: { players: [0, 0, 0, 0], draws: 0 },
    theme: localStorage.getItem('ttt_theme') || 'neon_classic',
    isLightMode: localStorage.getItem('ttt_light_mode') === 'true',
    currentTurn: 1,
    isAiBusy: false,
  };

  // Engine instance
  const engine = new TicTacToeEngine.FlexibleEngine(state.boardSize, state.winStreak, state.playerCount);

  // DOM Elements
  const el = {
    app: document.getElementById('app-container'),
    menuScreen: document.getElementById('menu-screen'),
    gameScreen: document.getElementById('game-screen'),
    playerNameText: document.getElementById('player-name-text'),
    board: document.getElementById('game-board'),
    statusBanner: document.getElementById('status-banner'),
    versusHud2p: document.getElementById('versus-hud-2p'),
    versusHudMulti: document.getElementById('versus-hud-multi'),
    multiHudGrid: document.getElementById('multi-hud-grid'),
    multiMetaNotice: document.getElementById('multi-meta-notice'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    drawOverlay: document.getElementById('draw-overlay'),

    // Modals
    victoryModal: document.getElementById('victory-modal'),
    victoryEmoji: document.getElementById('victory-emoji'),
    victoryTitle: document.getElementById('victory-title'),
    victorySub: document.getElementById('victory-sub'),
    victoryDetails: document.getElementById('victory-details'),

    themeModal: document.getElementById('theme-modal'),
    gridModal: document.getElementById('grid-modal'),
    infoModal: document.getElementById('info-modal'),
    nameModal: document.getElementById('name-modal'),
    nameInput: document.getElementById('name-input'),

    // HUD Elements
    p1Name: document.getElementById('p1-name'),
    p2Name: document.getElementById('p2-name'),
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    podP1: document.getElementById('pod-p1'),
    podP2: document.getElementById('pod-p2'),
    vsStreakText: document.getElementById('vs-streak-text'),
    gameGridLabel: document.getElementById('game-grid-label'),
  };

  // ==========================================================================
  // Sound & YouTube Playables Setup
  // ==========================================================================
  function initAudioAndYT() {
    YTPlayables.init({
      onAudioChange: (enabled) => {
        SoundManager.setSoundEnabled(enabled);
        updateSoundButton();
      },
      onPause: () => {
        console.log('[App] Paused by YouTube.');
      },
      onResume: () => {
        console.log('[App] Resumed by YouTube.');
      },
    });
  }

  function updateSoundButton() {
    const soundBtns = document.querySelectorAll('.btn-sound-toggle');
    soundBtns.forEach((btn) => {
      btn.textContent = SoundManager.isEnabled() ? '🔊' : '🔇';
    });
  }

  // ==========================================================================
  // Themes and Display Mode
  // ==========================================================================
  function applyTheme(themeId) {
    state.theme = themeId;
    localStorage.setItem('ttt_theme', themeId);
    document.body.setAttribute('data-theme', themeId);
  }

  function toggleLightMode() {
    state.isLightMode = !state.isLightMode;
    localStorage.setItem('ttt_light_mode', String(state.isLightMode));
    document.body.classList.toggle('light-mode', state.isLightMode);

    const themeToggleBtns = document.querySelectorAll('.btn-theme-toggle');
    themeToggleBtns.forEach((b) => {
      b.textContent = state.isLightMode ? '☀️' : '🌙';
    });
  }

  // ==========================================================================
  // Navigation & Screens
  // ==========================================================================
  function showScreen(screenName) {
    state.screen = screenName;
    if (screenName === 'menu') {
      el.menuScreen.classList.add('active');
      el.gameScreen.classList.remove('active');
    } else {
      el.menuScreen.classList.remove('active');
      el.gameScreen.classList.add('active');
      YTPlayables.notifyGameReady();
    }
  }

  // ==========================================================================
  // Gameplay Logic
  // ==========================================================================
  function startGame(mode) {
    state.gameMode = mode;
    state.scores = { players: [0, 0, 0, 0], draws: 0 };
    SoundManager.playButton();
    resetRound();
    showScreen('game');
  }

  function resetRound() {
    state.currentTurn = 1;
    state.isAiBusy = false;
    engine.configure(state.boardSize, state.winStreak, state.playerCount);

    el.drawOverlay.style.display = 'none';
    el.board.classList.remove('draw-shake');
    stopConfetti();
    closeAllModals();

    updateHUD();
    renderBoard();
    updateStatusBanner();
  }

  function getPlayerName(p) {
    if (p === 1) return state.playerName || 'Player 1';
    if (state.gameMode === 'AI') {
      return state.playerCount === 2 ? `AI (${state.aiDifficulty})` : `Bot ${p - 1}`;
    }
    return `Player ${p}`;
  }

  function getPlayerColorVar(p) {
    return `var(--player-${p})`;
  }

  function updateHUD() {
    el.vsStreakText.textContent = `${state.winStreak} IN A ROW`;
    el.gameGridLabel.textContent = `${state.boardSize}×${state.boardSize}`;

    if (state.playerCount === 2) {
      el.versusHud2p.style.display = 'flex';
      el.versusHudMulti.style.display = 'none';

      el.p1Name.textContent = getPlayerName(1);
      el.p2Name.textContent = getPlayerName(2);
      el.p1Score.textContent = state.scores.players[0];
      el.p2Score.textContent = state.scores.players[1];

      el.podP1.classList.toggle('active-turn', state.currentTurn === 1);
      el.podP2.classList.toggle('active-turn', state.currentTurn === 2);
    } else {
      el.versusHud2p.style.display = 'none';
      el.versusHudMulti.style.display = 'flex';

      el.multiHudGrid.innerHTML = '';
      for (let p = 1; p <= state.playerCount; p++) {
        const pod = document.createElement('div');
        pod.className = `multi-pod ${state.currentTurn === p ? 'active-turn' : ''}`;
        pod.style.color = getPlayerColorVar(p);

        const glyph = TicTacToeEngine.GLYPHS[TicTacToeEngine.getPlayerSymbol(p)];
        pod.innerHTML = `
          <div class="multi-avatar">${glyph}</div>
          <div class="pod-info">
            <div class="pod-name" style="color: ${getPlayerColorVar(p)}">${getPlayerName(p)}</div>
          </div>
          <div class="multi-score">${state.scores.players[p - 1]}</div>
        `;
        el.multiHudGrid.appendChild(pod);
      }

      el.multiMetaNotice.textContent = `${state.playerCount} PLAYERS • ${state.winStreak} IN A ROW • ${state.scores.draws} DRAWS`;
    }
  }

  function updateStatusBanner() {
    const gameState = engine.getGameState();
    const winner = gameState.winner;

    if (winner === TicTacToeEngine.DRAW_WINNER) {
      el.statusBanner.textContent = '⚔️ DRAW MATCH!';
      el.statusBanner.style.color = 'var(--win-highlight)';
      return;
    }

    if (winner >= 1 && winner <= 4) {
      const winnerName = getPlayerName(winner);
      el.statusBanner.textContent = `🏆 ${winnerName.toUpperCase()} WINS!`;
      el.statusBanner.style.color = getPlayerColorVar(winner);
      return;
    }

    if (state.gameMode === 'AI' && state.currentTurn >= 2) {
      el.statusBanner.textContent = `🧠 ${getPlayerName(state.currentTurn).toUpperCase()} COMPUTING...`;
      el.statusBanner.style.color = getPlayerColorVar(state.currentTurn);
    } else {
      const sym = TicTacToeEngine.GLYPHS[TicTacToeEngine.getPlayerSymbol(state.currentTurn)];
      el.statusBanner.textContent = `⚡ ${getPlayerName(state.currentTurn).toUpperCase()} (${sym}) TURN`;
      el.statusBanner.style.color = getPlayerColorVar(state.currentTurn);
    }
  }

  function renderBoard() {
    const N = state.boardSize;
    el.board.innerHTML = '';
    el.board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    el.board.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    el.board.style.gap = N >= 9 ? '4px' : N >= 6 ? '6px' : '8px';

    const fontSize = N === 3 ? '42px' : N <= 6 ? '24px' : N <= 9 ? '16px' : '13px';
    const gameState = engine.getGameState();

    for (let i = 0; i < N * N; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;

      const mark = gameState.board[i];
      if (mark) {
        cell.classList.add('filled');
        const pNum = TicTacToeEngine.symbolToPlayer(mark);
        const glyph = TicTacToeEngine.GLYPHS[mark] || mark;
        cell.innerHTML = `<span class="cell-symbol p${pNum}" style="font-size: ${fontSize}">${glyph}</span>`;
      }

      cell.addEventListener('click', () => onCellClick(i));
      el.board.appendChild(cell);
    }
  }

  function onCellClick(index) {
    const gameState = engine.getGameState();
    if (gameState.winner !== 0) return;
    if (state.isAiBusy) return;
    if (state.gameMode === 'AI' && state.currentTurn >= 2) return;
    if (gameState.board[index] !== null) return;

    executeMove(index);
  }

  function executeMove(cellIndex) {
    const playerWhoMoved = state.currentTurn;
    SoundManager.playMove(playerWhoMoved);

    const newState = engine.makeMove(cellIndex);
    state.currentTurn = newState.currentTurn;

    updateCellVisual(cellIndex, newState.board[cellIndex]);
    updateHUD();
    updateStatusBanner();

    if (newState.winner !== 0) {
      handleGameOver(newState);
      return;
    }

    // Handle AI Turns
    if (state.gameMode === 'AI' && state.currentTurn >= 2 && newState.winner === 0) {
      state.isAiBusy = true;
      const diffNum = state.aiDifficulty === 'EASY' ? 1 : state.aiDifficulty === 'MEDIUM' ? 2 : 3;

      setTimeout(() => {
        if (engine.getGameState().winner !== 0) return;
        const botMove = engine.getBestMove(state.currentTurn, diffNum);
        state.isAiBusy = false;

        if (botMove >= 0) {
          executeMove(botMove);
        }
      }, 260);
    }
  }

  function updateCellVisual(cellIndex, mark) {
    const cell = el.board.children[cellIndex];
    if (!cell) return;

    cell.classList.add('filled');
    const pNum = TicTacToeEngine.symbolToPlayer(mark);
    const glyph = TicTacToeEngine.GLYPHS[mark] || mark;
    const N = state.boardSize;
    const fontSize = N === 3 ? '42px' : N <= 6 ? '24px' : N <= 9 ? '16px' : '13px';

    cell.innerHTML = `<span class="cell-symbol p${pNum}" style="font-size: ${fontSize}">${glyph}</span>`;
  }

  function handleGameOver(gameState) {
    const winner = gameState.winner;

    if (winner === TicTacToeEngine.DRAW_WINNER) {
      SoundManager.playDraw();
      state.scores.draws++;
      state.stats.draws++;
      localStorage.setItem('ttt_stats', JSON.stringify(state.stats));

      el.board.classList.add('draw-shake');
      el.drawOverlay.style.display = 'block';

      setTimeout(() => {
        showVictoryModal(-1);
      }, 850);
      return;
    }

    if (winner >= 1 && winner <= 4) {
      SoundManager.playWin();
      state.scores.players[winner - 1]++;

      if (winner === 1) state.stats.wins++;
      else state.stats.losses++;
      localStorage.setItem('ttt_stats', JSON.stringify(state.stats));

      // Highlight winning streak line
      if (gameState.winningIndices && gameState.winningIndices.length) {
        gameState.winningIndices.forEach((idx) => {
          const cell = el.board.children[idx];
          if (cell) cell.classList.add('winning-cell');
        });
      }

      startConfetti();
      YTPlayables.sendScore(state.scores.players[0] * 100);

      setTimeout(() => {
        showVictoryModal(winner);
      }, 850);
    }
  }

  // ==========================================================================
  // Victory Modal & Confetti
  // ==========================================================================
  function showVictoryModal(winner) {
    el.victoryModal.classList.add('active');

    if (winner === -1) {
      el.victoryEmoji.textContent = '⚔️';
      el.victoryTitle.textContent = 'STALEMATE!';
      el.victoryTitle.style.color = 'var(--win-highlight)';
      el.victorySub.textContent = `All cells filled on the ${state.boardSize}×${state.boardSize} grid with zero lines surrendered.`;
      el.victoryDetails.textContent = `${state.boardSize}×${state.boardSize} ARENA • DRAW CLASH`;
    } else {
      const winnerName = getPlayerName(winner);
      el.victoryEmoji.textContent = winner === 1 ? '👑' : '🔥';
      el.victoryTitle.textContent = `${winnerName.toUpperCase()} WINS!`;
      el.victoryTitle.style.color = getPlayerColorVar(winner);
      el.victorySub.textContent = `Locked an authentic streak of ${state.winStreak} marks in a row!`;
      el.victoryDetails.textContent = `${state.boardSize}×${state.boardSize} ARENA • ${state.winStreak} IN A ROW`;
    }
  }

  let confettiAnim = null;
  function startConfetti() {
    const canvas = el.confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00F0FF', '#FF007A', '#10FF88', '#FFD700', '#C06CFF'];
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 50,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 2.5 + Math.random() * 3.5,
      speedX: -2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: -4 + Math.random() * 8,
    }));

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      confettiAnim = requestAnimationFrame(frame);
    }
    frame();
  }

  function stopConfetti() {
    if (confettiAnim) {
      cancelAnimationFrame(confettiAnim);
      confettiAnim = null;
    }
    const ctx = el.confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('active'));
  }

  // ==========================================================================
  // Event Bindings
  // ==========================================================================
  function setupEventListeners() {
    // Sound Toggles
    document.querySelectorAll('.btn-sound-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        SoundManager.toggleSound();
        updateSoundButton();
      });
    });

    // Theme Mode Toggles
    document.querySelectorAll('.btn-theme-toggle').forEach((btn) => {
      btn.addEventListener('click', toggleLightMode);
    });

    // Main Menu Buttons
    document.getElementById('card-ai').addEventListener('click', () => startGame('AI'));
    document.getElementById('card-pass-play').addEventListener('click', () => startGame('PASS_PLAY'));
    document.getElementById('card-duel').addEventListener('click', () => {
      state.boardSize = 3;
      state.winStreak = 3;
      state.playerCount = 2;
      startGame('PASS_PLAY');
    });
    document.getElementById('card-records').addEventListener('click', () => {
      document.getElementById('stats-wins').textContent = state.stats.wins;
      document.getElementById('stats-losses').textContent = state.stats.losses;
      document.getElementById('stats-draws').textContent = state.stats.draws;
      el.infoModal.classList.add('active');
    });

    // Player Count Selector Pills
    document.querySelectorAll('.player-count-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.player-count-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const count = parseInt(pill.dataset.count, 10);
        state.playerCount = count;

        // Update cards text
        const botCountText = count === 2 ? 'Smart Bot (1v1)' : `You vs ${count - 1} Bots`;
        document.getElementById('ai-card-sub').textContent = botCountText;
        document.getElementById('pass-play-title').textContent = `${count} PLAYERS`;

        // Update quick pills on card
        document.querySelectorAll('.card-player-pill').forEach((p) => {
          p.classList.toggle('players-selected', parseInt(p.dataset.count, 10) === count);
        });
      });
    });

    // Card Quick Player Pills
    document.querySelectorAll('.card-player-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const count = parseInt(pill.dataset.count, 10);
        const matchMainPill = document.querySelector(`.player-count-pill[data-count="${count}"]`);
        if (matchMainPill) matchMainPill.click();
      });
    });

    // Grid Size Selector Pills
    document.querySelectorAll('.grid-size-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.grid-size-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        state.boardSize = parseInt(pill.dataset.size, 10);
        state.winStreak = parseInt(pill.dataset.win, 10);
      });
    });

    // AI Difficulty Pills
    document.querySelectorAll('.diff-tag').forEach((tag) => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.diff-tag').forEach((t) => t.classList.remove('selected'));
        tag.classList.add('selected');
        state.aiDifficulty = tag.dataset.diff;
      });
    });

    // Game Screen Navigation
    document.getElementById('btn-leave-game').addEventListener('click', () => {
      SoundManager.playButton();
      showScreen('menu');
    });

    document.getElementById('btn-reset-game').addEventListener('click', () => {
      SoundManager.playButton();
      resetRound();
    });

    // Modal Triggers
    document.getElementById('btn-open-theme').addEventListener('click', () => {
      el.themeModal.classList.add('active');
    });
    document.getElementById('game-btn-theme').addEventListener('click', () => {
      el.themeModal.classList.add('active');
    });

    document.getElementById('btn-custom-grid').addEventListener('click', () => {
      el.gridModal.classList.add('active');
    });
    document.getElementById('game-btn-grid').addEventListener('click', () => {
      el.gridModal.classList.add('active');
    });

    document.getElementById('btn-info-menu').addEventListener('click', () => {
      document.getElementById('stats-wins').textContent = state.stats.wins;
      document.getElementById('stats-losses').textContent = state.stats.losses;
      document.getElementById('stats-draws').textContent = state.stats.draws;
      el.infoModal.classList.add('active');
    });

    // Player Name Prompt
    document.getElementById('player-chip-btn').addEventListener('click', () => {
      el.nameInput.value = state.playerName;
      el.nameModal.classList.add('active');
    });
    document.getElementById('btn-save-name').addEventListener('click', () => {
      const val = el.nameInput.value.trim();
      if (val) {
        state.playerName = val;
        localStorage.setItem('ttt_player_name', val);
        el.playerNameText.textContent = val;
      }
      closeAllModals();
    });

    // Victory Modal Action Buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      SoundManager.playButton();
      resetRound();
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      SoundManager.playButton();
      closeAllModals();
      showScreen('menu');
    });

    // Close Modals on Backdrop Click
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal && modal.id !== 'victory-modal') {
          modal.classList.remove('active');
        }
      });
    });

    // Grid Modal Options
    document.querySelectorAll('.grid-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size, 10);
        const win = parseInt(btn.dataset.win, 10);
        state.boardSize = size;
        state.winStreak = win;

        // Match menu pill if 3, 6, 9, 11
        document.querySelectorAll('.grid-size-pill').forEach((p) => {
          p.classList.toggle('active', parseInt(p.dataset.size, 10) === size);
        });

        closeAllModals();
        if (state.screen === 'game') {
          resetRound();
        }
      });
    });

    // Theme Modal Options
    document.querySelectorAll('.theme-option-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        closeAllModals();
      });
    });

    // Emoji Bar Reactions
    document.querySelectorAll('.emoji-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        SoundManager.playButton();
        el.statusBanner.textContent = `${btn.textContent} ${btn.dataset.msg}!`;
        setTimeout(updateStatusBanner, 1200);
      });
    });
  }

  // Initialize App on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    initAudioAndYT();
    applyTheme(state.theme);
    if (state.isLightMode) document.body.classList.add('light-mode');
    el.playerNameText.textContent = state.playerName;

    updateSoundButton();
    setupEventListeners();
  });
})();

