// ============================================================================
// YouTube Playables SDK Integration Wrapper
// Implements official lifecycle hooks: gameLoaded, gameReady, audio & pause
// ============================================================================

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YTPlayables = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let isInitialized = false;
  let isGameReadySent = false;
  const yt = typeof window !== 'undefined' ? window.ytgame : null;

  function init(options = {}) {
    if (isInitialized) return;
    isInitialized = true;

    if (window.ytgame) {
      console.log('[YouTube Playables] SDK detected. Initializing lifecycle...');

      // Notify YouTube that game bundle and assets are loaded
      try {
        if (typeof window.ytgame.gameLoaded === 'function') {
          window.ytgame.gameLoaded();
          console.log('[YouTube Playables] gameLoaded() sent.');
        }
      } catch (err) {
        console.warn('[YouTube Playables] gameLoaded failed:', err);
      }

      // Listen to YouTube audio mute/unmute events
      try {
        if (typeof window.ytgame.onAudioEnabledChange === 'function') {
          window.ytgame.onAudioEnabledChange((enabled) => {
            console.log('[YouTube Playables] onAudioEnabledChange:', enabled);
            if (options.onAudioChange) options.onAudioChange(enabled);
          });
        }
      } catch (err) {
        console.warn('[YouTube Playables] audio listener failed:', err);
      }

      // Listen to YouTube lifecycle pause/resume
      try {
        if (typeof window.ytgame.onPause === 'function') {
          window.ytgame.onPause(() => {
            console.log('[YouTube Playables] onPause received.');
            if (options.onPause) options.onPause();
          });
        }
        if (typeof window.ytgame.onResume === 'function') {
          window.ytgame.onResume(() => {
            console.log('[YouTube Playables] onResume received.');
            if (options.onResume) options.onResume();
          });
        }
      } catch (err) {
        console.warn('[YouTube Playables] pause/resume listener failed:', err);
      }
    } else {
      console.log('[YouTube Playables] Standalone mode (ytgame SDK not found - running in browser mode).');
    }
  }

  function notifyGameReady() {
    if (isGameReadySent) return;
    isGameReadySent = true;

    if (window.ytgame && typeof window.ytgame.gameReady === 'function') {
      try {
        window.ytgame.gameReady();
        console.log('[YouTube Playables] gameReady() sent.');
      } catch (err) {
        console.warn('[YouTube Playables] gameReady failed:', err);
      }
    }
  }

  function sendScore(score) {
    if (window.ytgame && typeof window.ytgame.sendScore === 'function') {
      try {
        window.ytgame.sendScore({ value: score });
      } catch (err) {
        console.warn('[YouTube Playables] sendScore failed:', err);
      }
    }
  }

  return {
    init,
    notifyGameReady,
    sendScore,
    isYouTubeEnvironment: () => !!(typeof window !== 'undefined' && window.ytgame),
  };
});

