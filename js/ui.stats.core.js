/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: ui.stats.core.js
 * Назначение: Базовая логика вычисления и отображения статистики
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function(){
  'use strict';
  window.App = window.App || {};
  var App = window.App;

  // Базовый объект статистики
  App.Stats = App.Stats || {};
  var Stats = App.Stats;

  /* ====================== ВСПОМОГАТЕЛЬНЫЕ ====================== */

  function ensureStateStore() {
    App.state = App.state || {};
    if (!App.state.activity) {
      App.state.activity = {};
    }
    return App.state.activity;
  }

  function todayKey() {
    var d = new Date();
    var y  = d.getFullYear();
    var m  = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + dd;
  }

  function detectCurrentLang() {
    try {
      if (App.Trainer && typeof App.Trainer.getDeckKey === 'function' &&
          App.Decks  && typeof App.Decks.langOfKey === 'function') {
        var dk = App.Trainer.getDeckKey();
        if (dk) {
          return App.Decks.langOfKey(dk) || null;
        }
      }
    } catch(_) {}
    return null;
  }

  /* ====================== ПУБЛИЧНЫЙ API ======================== */

  /**
   * Инкремент дневной активности.
   * options:
   *   lang      — код языка (de/en/...), если не передан — определим по активной колоде
   *   learned   — сколько слов ДОУЧЕНО (дошли до max stars)
   *   reviewed  — сколько карточек просмотрено/отвечено
   *   seconds   — сколько секунд добавить к счётчику времени
   *   kind     — 'words' | 'articles' (необязательно). Если задан, дополнительно
   *              пишем раздельные счётчики wordsSeconds / articlesSeconds.
   */
  Stats.bump = function(options) {
    options = options || {};
    var store = ensureStateStore();

    var lang = options.lang || detectCurrentLang();
    if (!lang) {
      lang = '_unknown';
    }

    var dateKey = todayKey();

    if (!store[lang]) store[lang] = {};
    var row = store[lang][dateKey];
    if (!row) {
      row = store[lang][dateKey] = { learned: 0, reviewed: 0, seconds: 0 };
    }

    var learned  = Number(options.learned  || 0);
    var reviewed = Number(options.reviewed || 0);
    var seconds  = Number(options.seconds  || 0);
    var kind     = String(options.kind || '').toLowerCase();

    if (learned)  row.learned  += learned;
    if (reviewed) row.reviewed += reviewed;

    if (seconds) {
      row.seconds += seconds;
      // Раздельная активность (слова/артикли) — без ломки старого формата.
      if (kind === 'articles') {
        row.articlesSeconds = Number(row.articlesSeconds || 0) + seconds;
      } else if (kind === 'words') {
        row.wordsSeconds = Number(row.wordsSeconds || 0) + seconds;
      } else if (kind === 'prepositions') {
        row.prepositionsSeconds = Number(row.prepositionsSeconds || 0) + seconds;
      } else if (kind === 'prepositions') {
        row.prepositionsSeconds = Number(row.prepositionsSeconds || 0) + seconds;
      }
    }

    // При желании можно тут дернуть принудительное сохранение стейта
    try {
      if (typeof App._saveStateNow === 'function') App._saveStateNow();
      else if (typeof App.saveState === 'function') App.saveState();
    } catch(_) {}
  };

  /**
   * Получить массив активности по дням для конкретного языка.
   * Возвращает массив вида:
   *   [{ date: '2025-11-10', learned: N, reviewed: M, seconds: S }, ...]
   * options.days — ограничение по количеству последних дней (по умолчанию 30)
   */
  Stats.getDailyActivity = function(lang, options) {
    var store = (App.state && App.state.activity) || {};
    var days  = (options && options.days) || 30;

    if (!lang) {
      lang = detectCurrentLang();
    }
    if (!lang || !store[lang]) return [];

    var langMap = store[lang];
    var keys = Object.keys(langMap).sort(); // по возрастанию дат

    if (keys.length > days) {
      keys = keys.slice(-days); // только последние N
    }

    return keys.map(function(k){
      var row = langMap[k] || {};
      return {
        date: k,
        learned: Number(row.learned  || 0),
        reviewed: Number(row.reviewed || 0),
        seconds: Number(row.seconds  || 0)
      };
    });
  };

  /**
   * Получить массив активности по дням по ВСЕМ языкам (агрегация).
   * Возвращает массив вида:
   *   [{ date: '2025-11-10', learned: N, reviewed: M, seconds: S }, ...]
   * options.days — ограничение по количеству последних дней (по умолчанию 30)
   */
  Stats.getDailyActivityAll = function(options) {
    var store = (App.state && App.state.activity) || {};
    var days  = (options && options.days) || 30;
    var totalsByDate = {};

    try {
      Object.keys(store).forEach(function(lang){
        var langMap = store[lang];
        if (!langMap) return;
        Object.keys(langMap).forEach(function(dateKey){
          var d = langMap[dateKey] || {};
          if (!totalsByDate[dateKey]) totalsByDate[dateKey] = { learned:0, reviewed:0, seconds:0 };
          totalsByDate[dateKey].learned  += (d.learned  || 0);
          totalsByDate[dateKey].reviewed += (d.reviewed || 0);
          totalsByDate[dateKey].seconds  += (d.seconds  || 0);
        });
      });
    } catch(_) {}

    var keys = Object.keys(totalsByDate).sort();
    if (!keys.length) return [];

    // Берём последние N дней
    if (days > 0 && keys.length > days) {
      keys = keys.slice(keys.length - days);
    }

    return keys.map(function(k){
      var t = totalsByDate[k] || { learned:0, reviewed:0, seconds:0 };
      return { date: k, learned: t.learned||0, reviewed: t.reviewed||0, seconds: t.seconds||0 };
    });
  };

  /**
   * Унифицированный триггер пересчёта/перерисовки статистики.
   * Используется после импорта бэкапа и при жизненном цикле приложения.
   */
  Stats.recomputeAndRender = function(opts){
    try { if (typeof window.renderSetStats === 'function') window.renderSetStats(); } catch(e){}
    try { if (typeof window.updateStats === 'function') window.updateStats(); } catch(e){}
    // View.stats.mount() сам возьмёт актуальные данные при переключении на экран
  };

})();
  
/* ========================= Конец файла: ui.stats.core.js ========================= */