/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: analytics.js
 * Назначение: Обёртка над GA4 + события тренировок
 * Версия: 1.0
 * Обновлено: 2025-11-27
 * ========================================================== */

(function () {
  'use strict';

  /* ---------------------- namespace ---------------------- */

  var A = (window.App = window.App || {});

  /* ---------------------- low-level helpers ---------------------- */

  // NOTE: ga.consent.js creates a gtag() stub even when consent is denied.
  // Поэтому проверка только на наличие window.gtag() НЕ является проверкой согласия.
  function hasAnalyticsConsent() {
    try {
      // New key
      var v = localStorage.getItem('mm.gaChoice');
      if (v === 'granted') return true;
      if (v === 'denied') return false;
    } catch (_) {}
    try {
      // Legacy key
      var old = localStorage.getItem('ga_consent');
      if (old === 'yes') return true;
      if (old === 'no') return false;
    } catch (_) {}
    return false;
  }

  function hasGA() {
    // gtag stub exists even without consent, поэтому проверяем два условия.
    return (typeof window.gtag === 'function') && hasAnalyticsConsent();
  }

  function safeTrack(eventName, params) {
    if (!hasGA()) return;
    try {
      window.gtag('event', eventName, params || {});
    } catch (_) {}
  }

  function safeSetUserProps(props) {
    if (!hasGA()) return;
    try {
      window.gtag('set', 'user_properties', props || {});
    } catch (_) {}
  }

  function makeId() {
    // Short stable-ish random id for session correlations (no PII)
    try {
      var s = '';
      var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (var i = 0; i < 16; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return s;
    } catch (_) {
      return String(nowMs()) + '_' + Math.floor(Math.random() * 1e9);
    }
  }

  function nowMs() {
    return (typeof Date.now === 'function') ? Date.now() : new Date().getTime();
  }

  function detectAppMode() {
    // PWA / standalone
    try {
      if (
        window.matchMedia &&
        window.matchMedia('(display-mode: standalone)').matches
      ) {
        return 'pwa';
      }
      // iOS standalone
      if (window.navigator && window.navigator.standalone) {
        return 'pwa';
      }
    } catch (_) {}
    return 'web';
  }

  /* ---------------------- training state ---------------------- */

  // Внутреннее состояние сессии тренировки
  var trainingState = {
    active: false,
    startedAt: null,
    lastHeartbeatAt: null,
    learnLang: null,
    uiLang: null,
    deckKey: null,
    appMode: null,
    trainerKind: null,
    sessionId: null,
    answeredTotal: 0,
    correct: 0,
    wrong: 0,
    dontKnow: 0,
    heartbeatTimer: null
  };

  // Интервал отправки "пульса" в миллисекундах
  var HEARTBEAT_INTERVAL = 40000; // 40 секунд

  function clearHeartbeatTimer() {
    if (trainingState.heartbeatTimer) {
      clearInterval(trainingState.heartbeatTimer);
      trainingState.heartbeatTimer = null;
    }
  }

  function startHeartbeatLoop() {
    clearHeartbeatTimer();
    if (!trainingState.active) return;

    trainingState.lastHeartbeatAt = nowMs();

    trainingState.heartbeatTimer = setInterval(function () {
      if (!trainingState.active) {
        clearHeartbeatTimer();
        return;
      }

      var now = nowMs();
      var elapsedSec = Math.round((now - trainingState.startedAt) / 1000);

      safeTrack('training_heartbeat', {
        learn_lang: trainingState.learnLang || null,
        ui_lang: trainingState.uiLang || null,
        deck_key: trainingState.deckKey || null,
        app_mode: trainingState.appMode || null,
        trainer_kind: trainingState.trainerKind || null,
        trainer_session_id: trainingState.sessionId || null,
        elapsed_sec: elapsedSec
      });

      trainingState.lastHeartbeatAt = now;
    }, HEARTBEAT_INTERVAL);
  }

  /* ---------------------- public API: user props ---------------------- */

  /**
   * Полная установка user_properties.
   * Если какие-то поля не переданы — берём из текущего состояния.
   */
  function setUserProps(baseProps) {
    baseProps = baseProps || {};

    var merged = {
      learn_lang: baseProps.learn_lang || trainingState.learnLang || null,
      ui_lang: baseProps.ui_lang || trainingState.uiLang || null,
      app_mode: baseProps.app_mode || trainingState.appMode || detectAppMode()
    };

    trainingState.learnLang = merged.learn_lang;
    trainingState.uiLang = merged.ui_lang;
    trainingState.appMode = merged.app_mode;

    safeSetUserProps(merged);
  }

  /**
   * Частичное обновление user_properties.
   * Сейчас используется для смены языка и т.п.
   */
  function updateUserProps(partial) {
    partial = partial || {};
    setUserProps({
      learn_lang: partial.learn_lang || trainingState.learnLang || null,
      ui_lang: partial.ui_lang || trainingState.uiLang || null,
      app_mode: partial.app_mode || trainingState.appMode || detectAppMode()
    });
  }

  /* ---------------------- public API: общие события ---------------------- */

  function track(eventName, params) {
    safeTrack(eventName, params);
  }

  /* ---------------------- public API: training ---------------------- */

  /**
   * Начало сессии тренировки.
   *
   * opts:
   *  - learnLang: 'de' / 'en' / ...
   *  - uiLang: 'ru' / 'uk'
   *  - deckKey: 'de_verbs' / 'en_nouns' и т.д.
   */
  function trainingStart(opts) {
    opts = opts || {};

    // если уже активна сессия и словарь не поменялся — не дублируем
    if (trainingState.active && trainingState.deckKey === opts.deckKey) {
      return;
    }

    // если была активная — аккуратно завершаем её
    if (trainingState.active) {
      trainingEnd({ reason: 'restart' });
    }

    trainingState.active = true;
    trainingState.startedAt = nowMs();
    trainingState.lastHeartbeatAt = trainingState.startedAt;
    trainingState.learnLang = opts.learnLang || trainingState.learnLang || null;
    trainingState.uiLang = opts.uiLang || trainingState.uiLang || null;
    trainingState.deckKey = opts.deckKey || null;
    trainingState.appMode = detectAppMode();
    trainingState.trainerKind = opts.trainerKind || (window.App && window.App.settings && window.App.settings.trainerKind) || null;
    trainingState.sessionId = makeId();
    trainingState.answeredTotal = 0;
    trainingState.correct = 0;
    trainingState.wrong = 0;
    trainingState.dontKnow = 0;

    // сразу прокинем user properties
    setUserProps({
      learn_lang: trainingState.learnLang,
      ui_lang: trainingState.uiLang,
      app_mode: trainingState.appMode
    });

    safeTrack('training_start', {
      learn_lang: trainingState.learnLang || null,
      ui_lang: trainingState.uiLang || null,
      deck_key: trainingState.deckKey || null,
      app_mode: trainingState.appMode || null,
      trainer_kind: trainingState.trainerKind || null,
      trainer_session_id: trainingState.sessionId || null
    });

    // сразу отправим первый heartbeat, чтобы было видно онлайн мгновенно
    try {
      trainingPing({ reason: 'start' });
    } catch (_) {}

    startHeartbeatLoop();
  }

  /**
   * Завершение сессии тренировки.
   *
   * opts:
   *  - reason: 'route_change:stats' / 'hidden' / 'manual' / 'restart' / ...
   */
  function trainingEnd(opts) {
    opts = opts || {};
    if (!trainingState.active) return;

    var endedAt = nowMs();
    var durationSec = Math.round((endedAt - trainingState.startedAt) / 1000);

    clearHeartbeatTimer();

    safeTrack('training_end', {
      learn_lang: trainingState.learnLang || null,
      ui_lang: trainingState.uiLang || null,
      deck_key: trainingState.deckKey || null,
      app_mode: trainingState.appMode || null,
      trainer_kind: trainingState.trainerKind || null,
      trainer_session_id: trainingState.sessionId || null,
      duration_sec: durationSec,
      reason: opts.reason || null,
      answered_total: trainingState.answeredTotal || 0,
      correct: trainingState.correct || 0,
      wrong: trainingState.wrong || 0,
      dont_know: trainingState.dontKnow || 0
    });

    // локальная статистика времени тренировки (3-й экран)
    try {
      if (window.App && window.App.Stats && typeof window.App.Stats.bump === 'function') {
        // Разделяем активность: слова / артикли / предлоги (на базе trainerKind).
        var kind = 'words';
        try {
          var tk = String(window.App && window.App.settings && window.App.settings.trainerKind || '').toLowerCase();
          if (tk === 'articles') kind = 'articles';
          else if (tk === 'prepositions') kind = 'prepositions';
        } catch (_e) {}
        window.App.Stats.bump({
          lang: trainingState.learnLang || null,
          seconds: durationSec,
          kind: kind
        });
      }
    } catch (_) {}

    trainingState.active = false;
    trainingState.startedAt = null;
    trainingState.lastHeartbeatAt = null;
    trainingState.deckKey = null;
    trainingState.trainerKind = null;
    trainingState.sessionId = null;
    trainingState.answeredTotal = 0;
    trainingState.correct = 0;
    trainingState.wrong = 0;
    trainingState.dontKnow = 0;
    // learnLang/uiLang/appMode оставляем в state — они актуальны для user props
  }

  /**
   * Ручной "пинг" тренировки (используется редко, в основном для heartbeat loop).
   * Можно дергать вручную, если понадобится зафиксировать какой-то момент.
   */
  function trainingPing(extraParams) {
    if (!trainingState.active) return;

    var now = nowMs();
    var elapsedSec = Math.round((now - trainingState.startedAt) / 1000);

    var params = extraParams || {};
    params.learn_lang = trainingState.learnLang || null;
    params.ui_lang = trainingState.uiLang || null;
    params.deck_key = trainingState.deckKey || null;
    params.app_mode = trainingState.appMode || null;
    params.trainer_kind = trainingState.trainerKind || null;
    params.trainer_session_id = trainingState.sessionId || null;
    params.elapsed_sec = elapsedSec;

    safeTrack('training_heartbeat', params);
    trainingState.lastHeartbeatAt = now;
  }

  /**
   * Ответ в тренере: правильный/неправильный/не знаю.
   * Backward-compatible: если не используется — ничего не ломает.
   */
  function trainingAnswer(opts) {
    if (!trainingState.active) return;
    opts = opts || {};
    var res = String(opts.result || '').toLowerCase();
    trainingState.answeredTotal = (trainingState.answeredTotal|0) + 1;
    if (res === 'correct') trainingState.correct = (trainingState.correct|0) + 1;
    else if (res === 'wrong') trainingState.wrong = (trainingState.wrong|0) + 1;
    else if (res === 'dont_know' || res === 'idk') trainingState.dontKnow = (trainingState.dontKnow|0) + 1;

    safeTrack('trainer_answer', {
      learn_lang: trainingState.learnLang || null,
      ui_lang: trainingState.uiLang || null,
      deck_key: trainingState.deckKey || null,
      app_mode: trainingState.appMode || null,
      trainer_kind: trainingState.trainerKind || null,
      trainer_session_id: trainingState.sessionId || null,
      result: (res === 'idk') ? 'dont_know' : (res || null),
      applied: (typeof opts.applied === 'boolean') ? opts.applied : null,
      attempt: (opts.attempt != null) ? (opts.attempt|0) : null
    });

    // Keep legacy heartbeat semantics for earlier dashboards.
    try {
      trainingPing({ reason: res === 'correct' ? 'answer_correct' : (res === 'wrong' ? 'answer_wrong' : 'answer_idk') });
    } catch (_) {}
  }

  function screen(screenName, params) {
    params = params || {};
    params.screen = screenName || null;
    params.app_mode = params.app_mode || trainingState.appMode || detectAppMode();
    params.ui_lang = params.ui_lang || trainingState.uiLang || null;
    params.learn_lang = params.learn_lang || trainingState.learnLang || null;
    safeTrack('mm_screen_view', params);
  }

  function error(code, context) {
    context = context || {};
    safeTrack('app_error', {
      code: code || 'ERR_UNKNOWN',
      screen: context.screen || null,
      where: context.where || null,
      message: context.message || null,
      deck_key: context.deck_key || trainingState.deckKey || null,
      trainer_kind: context.trainer_kind || trainingState.trainerKind || null,
      app_mode: trainingState.appMode || detectAppMode(),
      ui_lang: trainingState.uiLang || null,
      learn_lang: trainingState.learnLang || null
    });
  }

  /* ---------------- visibility / lifecycle integration --------------- */

  // Если вкладка/приложение скрывается (в т.ч. PWA свернули),
  // аккуратно завершим активную сессию тренировки.
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      try {
        if (document.visibilityState === 'hidden' && trainingState.active) {
          // treat hide as abandon (user left mid-session)
          safeTrack('trainer_abandon', {
            learn_lang: trainingState.learnLang || null,
            ui_lang: trainingState.uiLang || null,
            deck_key: trainingState.deckKey || null,
            app_mode: trainingState.appMode || null,
            trainer_kind: trainingState.trainerKind || null,
            trainer_session_id: trainingState.sessionId || null,
            answered_total: trainingState.answeredTotal || 0,
            correct: trainingState.correct || 0,
            wrong: trainingState.wrong || 0,
            dont_know: trainingState.dontKnow || 0,
            reason: 'hidden'
          });
          trainingEnd({ reason: 'hidden' });
        }
      } catch (_) {}
    });
  }

  // Global error hooks (lightweight; no stack/PII)
  try {
    window.addEventListener('error', function (e) {
      try {
        var msg = e && (e.message || (e.error && e.error.message)) ? String(e.message || (e.error && e.error.message)) : 'error';
        error('ERR_JS', { where: 'window.error', message: msg });
      } catch (_) {}
    });
    window.addEventListener('unhandledrejection', function (e) {
      try {
        var r = e && e.reason;
        var msg2 = (r && (r.message || r.toString)) ? String(r.message || r.toString()) : 'rejection';
        error('ERR_PROMISE', { where: 'window.unhandledrejection', message: msg2 });
      } catch (_) {}
    });
  } catch (_) {}

  /* ---------------------- export to App ---------------------- */

  A.Analytics = {
    track: track,
    setUserProps: setUserProps,
    updateUserProps: updateUserProps,
    detectAppMode: detectAppMode,
    screen: screen,
    error: error,
    trainingStart: trainingStart,
    trainingEnd: trainingEnd,
    trainingPing: trainingPing,
    trainingAnswer: trainingAnswer
  };
})();

/* ======================= Конец файла: analytics.js ======================= */
