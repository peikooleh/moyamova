/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: articles.progress.js
 * Назначение: Прогресс ("выученность"/звёзды) для упражнения
 *   "Учить артикли". Контур данных полностью изолирован от
 *   базового тренера слов.
 *
 * Принципы:
 *   - хранение по deckKey + wordId
 *   - версионированный LocalStorage ключ
 *   - экспорт/импорт для Backup
 *
 * Статус: каркас (MVP). Алгоритм начисления можно менять позже,
 *         не ломая формат (через v + миграции).
 * Версия: 0.1
 * Обновлено: 2026-01-01
 * ========================================================== */

(function () {
  'use strict';

  var A = (window.App = window.App || {});

  var LS_KEY = 'k_articles_progress_v1';

  // Формат:
  // {
  //   v: 1,
  //   byDeck: {
  //     de_nouns: { "<wordId>": { s: 0, c: 0, w: 0, ts: 0 } }
  //   }
  // }
  // где:
  //   s  = stars (0..starsMax)
  //   c  = correct answers
  //   w  = wrong answers
  //   ts = last updated (epoch ms)

  var state = load() || { v: 1, byDeck: {} };

  function safeNow() {
    return Date.now ? Date.now() : (new Date()).getTime();
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || obj.v !== 1) return null;
      if (!obj.byDeck) obj.byDeck = {};
      return obj;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  
  function normalizeDeckKey(deckKey){
    deckKey = String(deckKey || '');
    if (!deckKey) return deckKey;
    if (deckKey.indexOf('favorites:') === 0 || deckKey.indexOf('mistakes:') === 0){
      var parts = deckKey.split(':');
      return parts[parts.length - 1] || deckKey;
    }
    return deckKey;
  }

function ensure(deckKey) {
    deckKey = normalizeDeckKey(deckKey);
    var k = String(deckKey || '').trim();
    if (!k) k = 'unknown';
    if (!state.byDeck[k]) state.byDeck[k] = {};
    return state.byDeck[k];
  }

  function starsMax() {
    // Визуально хотим совпасть с базовым тренером.
    try {
      if (A.Trainer && typeof A.Trainer.starsMax === 'function') {
        var m = Number(A.Trainer.starsMax());
        if (m > 0) return m;
      }
    } catch (e) {}
    return 5;
  }

  function getEntry(deckKey, wordId) {
    deckKey = normalizeDeckKey(deckKey);
    var deck = ensure(deckKey);
    var id = String(wordId);
    if (!deck[id]) deck[id] = { s: 0, c: 0, w: 0, ts: 0 };
    return deck[id];
  }

  // Внутренний доступ (для веса/recency). Возвращает «живую» запись.
  // Не используем снаружи для мутаций.
  function _getRawEntry(deckKey, wordId) {
    return getEntry(deckKey, wordId);
  }

  function isLearned(deckKey, wordId) {
    try {
      return getStars(deckKey, wordId) >= starsMax();
    } catch (_) {
      return false;
    }
  }

  function clamp(n, a, b) {
    n = Number(n) || 0;
    if (n < a) return a;
    if (n > b) return b;
    return n;
  }

  // Начисление звёзд должно совпадать с базовым тренером (home/app.trainer.js):
  // normal: +1 / -1
  // hard:   +0.5 / -0.5
  function difficulty() {
    try {
      var domLvl = (document && document.documentElement && document.documentElement.dataset && document.documentElement.dataset.level) || null;
      var lvl = (A.settings && (A.settings.level || A.settings.mode)) || domLvl || 'normal';
      return String(lvl).toLowerCase() === 'hard' ? 'hard' : 'normal';
    } catch (_) {
      return 'normal';
    }
  }

  function deltaOnAnswer(isCorrect) {
    var hard = difficulty() === 'hard';
    if (isCorrect) return hard ? +0.5 : +1.0;
    return hard ? -0.5 : -1.0;
  }
  function onAnswer(deckKey, wordId, isCorrect, meta) {
    var e = getEntry(deckKey, wordId);
    var max = starsMax();

    if (isCorrect) e.c = (e.c || 0) + 1;
    else e.w = (e.w || 0) + 1;

    e.s = clamp((e.s || 0) + deltaOnAnswer(!!isCorrect), 0, max);
    e.ts = safeNow();
    save();
  }

  function getStars(deckKey, wordId) {
    var e = getEntry(deckKey, wordId);
    return Number(e.s) || 0;
  }

  function getLevel(deckKey, wordId) {
    // Пока level == stars.
    return getStars(deckKey, wordId);
  }

  function resetDeck(deckKey) {
    var k = String(deckKey || '').trim();
    if (!k) return;
    try { delete state.byDeck[k]; } catch (e) { state.byDeck[k] = {}; }
    save();
  }

  function exportData() {
    // Возвращаем копию, чтобы внешний код не мог мутировать state.
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (e) {
      return { v: 1, byDeck: {} };
    }
  }

  function importData(payload) {
    try {
      if (!payload || payload.v !== 1) return false;
      if (!payload.byDeck) payload.byDeck = {};
      state = payload;
      save();
      return true;
    } catch (e) {
      return false;
    }
  }

  A.ArticlesProgress = {
    lsKey: LS_KEY,
    starsMax: starsMax,
    getStars: getStars,
    getLevel: getLevel,
    isLearned: isLearned,
    onAnswer: onAnswer,
    _getRawEntry: _getRawEntry,
    resetDeck: resetDeck,
    export: exportData,
    import: importData
  };
})();
