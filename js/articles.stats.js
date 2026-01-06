/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: articles.stats.js
 * Назначение: Статистика упражнения "Учить артикли".
 *   - время в упражнении (сессии + суммарно)
 *   - ответы/точность/серии
 *   - экспорт/импорт для Backup
 *
 * Принципы:
 *   - контур данных изолирован от базовой статистики слов
 *   - время из упражнения можно прокидывать в общую активность
 *     приложения (позже: через App.Stats или другой агрегатор).
 *
 * Статус: каркас (MVP)
 * Версия: 0.1
 * Обновлено: 2026-01-01
 * ========================================================== */

(function () {
  'use strict';

  var A = (window.App = window.App || {});

  var LS_KEY = 'k_articles_stats_v1';

  // Формат:
  // {
  //   v: 1,
  //   totalMs: 0,
  //   sessions: 0,
  //   answers: 0,
  //   correct: 0,
  //   wrong: 0,
  //   bestStreak: 0
  // }

  var state = load() || {
    v: 1,
    totalMs: 0,
    sessions: 0,
    answers: 0,
    correct: 0,
    wrong: 0,
    bestStreak: 0
  };

  // runtime-only
  var sessionActive = false;
  var sessionStartTs = 0;
  var currentStreak = 0;

  function now() {
    return Date.now ? Date.now() : (new Date()).getTime();
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || obj.v !== 1) return null;
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

  function startSession() {
    if (sessionActive) return;
    sessionActive = true;
    sessionStartTs = now();
    currentStreak = 0;
    state.sessions = (state.sessions || 0) + 1;
    save();
  }

  function endSession() {
    if (!sessionActive) return;
    sessionActive = false;
    var delta = Math.max(0, now() - (sessionStartTs || 0));
    state.totalMs = (state.totalMs || 0) + delta;
    sessionStartTs = 0;
    save();
  }

  function addActiveTime(ms) {
    // Используем, если захотим "тикать" время во время активного взаимодействия.
    // Сейчас достаточно startSession/endSession.
    ms = Number(ms) || 0;
    if (ms <= 0) return;
    state.totalMs = (state.totalMs || 0) + ms;
    save();
  }

  function onAnswer(isCorrect) {
    state.answers = (state.answers || 0) + 1;
    if (isCorrect) {
      state.correct = (state.correct || 0) + 1;
      currentStreak = (currentStreak || 0) + 1;
      if ((state.bestStreak || 0) < currentStreak) state.bestStreak = currentStreak;
    } else {
      state.wrong = (state.wrong || 0) + 1;
      currentStreak = 0;
    }
    save();
  }

  function exportData() {
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (e) {
      return { v: 1, totalMs: 0, sessions: 0, answers: 0, correct: 0, wrong: 0, bestStreak: 0 };
    }
  }

  function importData(payload) {
    try {
      if (!payload || payload.v !== 1) return false;
      state = payload;
      save();
      return true;
    } catch (e) {
      return false;
    }
  }

  A.ArticlesStats = {
    lsKey: LS_KEY,
    startSession: startSession,
    endSession: endSession,
    addActiveTime: addActiveTime,
    onAnswer: onAnswer,
    export: exportData,
    import: importData
  };
})();
