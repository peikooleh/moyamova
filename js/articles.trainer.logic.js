/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: articles.trainer.logic.js
 * Назначение: Логика упражнения "Учить артикли" (каркас).
 *   - выбор слова (de_nouns)
 *   - проверка ответа der/die/das
 *   - режимы тренировки (копируются из базового тренера позже)
 *   - уведомление UI (card shell) через простой viewModel
 *
 * Принципы:
 *   - модуль автономный, ничего не ломает без явного start()
 *   - не трогает избранное/ошибки базового тренера
 *   - прогресс и статистика — отдельные модули
 *
 * Статус: каркас (MVP)
 * Версия: 0.1
 * Обновлено: 2026-01-01
 * ========================================================== */

(function () {
  'use strict';

  var A = (window.App = window.App || {});

  var ALLOWED = { der: true, die: true, das: true };

  var active = false;
  var deckKey = '';
  var mode = 'default';
  var currentWord = null;
  var lastWordId = '';

  // Поведение ответов должно совпадать 1:1 с базовым тренером:
  // - штраф за неправильный ответ только один раз на слово
  // - после правильного ответа ввод блокируется и идём дальше
  var solved = false;
  var penalized = false;

  // Сеты для артиклей — отдельные от базового тренера.
  // Не добавляем новые настройки: используем тот же setSizeDefault.
  var SET_LS_KEY = 'k_articles_setByDeck_v1';
  var setByDeck = loadSetState();
  var currentSetIndex = 0;
  var totalSets = 1;

  function safeNow() {
    return Date.now ? Date.now() : (new Date()).getTime();
  }

  function loadSetState() {
    try {
      var raw = window.localStorage.getItem(SET_LS_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function saveSetState() {
    try {
      window.localStorage.setItem(SET_LS_KEY, JSON.stringify(setByDeck || {}));
    } catch (e) {}
  }

  function getSetSize(dk) {
    try {
      // Lernpunkt uses smaller sets.
      var s = String(dk || '').toLowerCase();
      // Virtual keys (favorites:/mistakes:) keep the base deck key after the 2nd colon.
      if (/^(favorites|mistakes):/i.test(s)) {
        s = s.split(':').slice(2).join(':');
      }
      if (s.endsWith('_lernpunkt')) return 10;
      return (A.Config && A.Config.setSizeDefault) || 50;
    } catch (_) {
      return 50;
    }
  }

  function getArticlesStarsMax() {
    try {
      if (A.ArticlesProgress && typeof A.ArticlesProgress.starsMax === 'function') {
        var m = Number(A.ArticlesProgress.starsMax());
        if (m > 0) return m;
      }
    } catch (_) {}
    return 5;
  }

  function isLearned(deckKey, wordId) {
    try {
      if (!A.ArticlesProgress || typeof A.ArticlesProgress.getStars !== 'function') return false;
      var s = Number(A.ArticlesProgress.getStars(deckKey, wordId) || 0) || 0;
      return s >= getArticlesStarsMax();
    } catch (_) {
      return false;
    }
  }

  // Аналог Trainer.getLearnedEpsilon(), но без зависимости от App.Trainer.
  function getLearnedEpsilon() {
    try {
      var pref =
        A.settings && A.settings.learnedRepeat != null
          ? A.settings.learnedRepeat
          : (typeof TRAINER_DEFAULT_LEARNED_REPEAT !== 'undefined'
              ? TRAINER_DEFAULT_LEARNED_REPEAT
              : 'never');
      if (typeof pref === 'number') return Math.max(0, Math.min(0.2, pref));
      switch (String(pref || 'never').toLowerCase()) {
        case 'normal': return 0.05;
        case 'rare':   return 0.01;
        case 'ultra':  return 0.001;
        case 'never':
        default:       return 0;
      }
    } catch (_) {
      return 0;
    }
  }

  function norm(s) {
    return String(s || '').trim().toLowerCase();
  }

  function parseArticle(raw) {
    raw = String(raw || '').trim();
    var m = raw.match(/^(der|die|das)\s+/i);
    return m ? norm(m[1]) : '';
  }

  function stripArticle(raw) {
    raw = String(raw || '').trim();
    return raw.replace(/^(der|die|das)\s+/i, '').trim();
  }

  function getDeck() {
    try {
      if (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') {
        return A.Decks.resolveDeckByKey(deckKey) || [];
      }
    } catch (e) {}
    return [];
  }

// Deck filtered to words that actually have an article (der/die/das).
// This is critical for Lernpunkt noun decks where some entries may not have articles:
// we must keep set sizing, rendering and statistics consistent with the real trainable count.
function getDeckWithArticles() {
  var deck = getDeck();
  if (!deck || !deck.length) return [];
  try { return deck.filter(hasValidArticle); } catch (e) { return []; }
}


  // Progress for articles is tracked per base deck (e.g. de_nouns),
  // regardless of whether the training is launched from a virtual deck
  // like favorites:ru:de_nouns or mistakes:uk:de_nouns.
  function baseKeyForProgress(k){
    try{
      var s = String(k||'');
      if (/^favorites:/i.test(s) || /^mistakes:/i.test(s)) {
        return s.split(':').slice(2).join(':') || '';
      }
      return s;
    }catch(_){ return String(k||''); }
  }

  function getBatchIndex(k) {
    try {
      var key = String(k || '').trim() || 'unknown';
      var idx = (setByDeck && setByDeck[key] != null) ? (setByDeck[key] | 0) : 0;
      if (idx < 0) idx = 0;
      return idx;
    } catch (_) {
      return 0;
    }
  }

  function setBatchIndex(i, k) {
    try {
      var key = String(k || '').trim() || 'unknown';
      var idx = i | 0;
      if (idx < 0) idx = 0;
      setByDeck = setByDeck || {};
      setByDeck[key] = idx;
      saveSetState();

      // sync active set with base Trainer so UI set pills and header stats stay consistent
      try {
        if (A.Trainer && typeof A.Trainer.setBatchIndex === "function") {
          A.Trainer.setBatchIndex(idx, key);
        }
      } catch (e) {}

      return idx;
    } catch (_) {
      return 0;
    }
  }

  function hasValidArticle(w) {
    if (!w) return false;
    var raw = w.word || w.term || w.de;
    var a = parseArticle(raw);
    return !!ALLOWED[a];
  }

  function countWithArticles(arr) {
    var n = 0;
    for (var i = 0; i < (arr ? arr.length : 0); i++) {
      if (hasValidArticle(arr[i])) n++;
    }
    return n;
  }

  function countLearnedWithArticles(arr, dk) {
    var n = 0;
    var progKey = baseKeyForProgress(dk);
    for (var i = 0; i < (arr ? arr.length : 0); i++) {
      var w = arr[i];
      if (!hasValidArticle(w)) continue;
      if (isLearned(progKey, w.id)) n++;
    }
    return n;
  }

  function isCurrentSetComplete(dk, slice) {
    var withA = countWithArticles(slice);
    if (withA <= 0) return false;
    return countLearnedWithArticles(slice, dk) >= withA;
  }

  function isWholeDeckLearned(dk, deck) {
    var withA = countWithArticles(deck);
    if (withA <= 0) return false;
    return countLearnedWithArticles(deck, dk) >= withA;
  }

  function getArticlesSlice(dk) {
    var deck = getDeckWithArticles();
    if (!deck || !deck.length) return [];
    var setSize = getSetSize(dk);
    totalSets = Math.max(1, Math.ceil(deck.length / setSize));
    currentSetIndex = getBatchIndex(dk);
    if (currentSetIndex >= totalSets) currentSetIndex = totalSets - 1;

    // Автопереход, если текущий сет полностью выучен по артиклям.
    var start = currentSetIndex * setSize;
    var end = Math.min(deck.length, start + setSize);
    var slice = deck.slice(start, end);
    if (isCurrentSetComplete(dk, slice)) {
      currentSetIndex = (currentSetIndex + 1) % totalSets;
      setBatchIndex(currentSetIndex, dk);
      start = currentSetIndex * setSize;
      end = Math.min(deck.length, start + setSize);
      slice = deck.slice(start, end);
    }

    // Фильтрация по артиклям.
    var withArticles = slice.filter(hasValidArticle);

    // Прогресс артиклей ведём по базовой деке.
    var progKey = baseKeyForProgress(dk);

    // Исключение выученных (с мягким повтором через learnedRepeat).
    var eps = getLearnedEpsilon();
    var eligible = [];
    for (var i = 0; i < withArticles.length; i++) {
      var w = withArticles[i];
      var learned = isLearned(progKey, w.id);
      if (!learned) eligible.push(w);
      else if (eps > 0 && Math.random() < eps) eligible.push(w);
    }
    if (eligible.length) return eligible;

    // Если всё выучено в сете — пробуем следующий сет. Если весь deck выучен — возвращаем текущий сет.
    if (isWholeDeckLearned(dk, deck)) return withArticles;

    var nextIdx = (currentSetIndex + 1) % totalSets;
    setBatchIndex(nextIdx, dk);
    currentSetIndex = nextIdx;
    start = currentSetIndex * setSize;
    end = Math.min(deck.length, start + setSize);
    var nSlice = deck.slice(start, end);
    var nWithA = nSlice.filter(hasValidArticle);
    var nEligible = [];
    for (var j = 0; j < nWithA.length; j++) {
      var ww = nWithA[j];
      if (!isLearned(progKey, ww.id)) nEligible.push(ww);
      else if (eps > 0 && Math.random() < eps) nEligible.push(ww);
    }
    return nEligible.length ? nEligible : nWithA;
  }

  function tTranslation(w) {
    // В каркасе просто используем ту же логику, что и базовый тренер,
    // если она доступна через home.js helper tWord (он не публичный).
    // Поэтому здесь делаем максимально безопасно: ru -> uk -> ''
    if (!w) return '';
    var ui = '';
    try { ui = (A.settings && (A.settings.lang || A.settings.uiLang)) || ''; } catch (e) {}
    if (String(ui).toLowerCase() === 'uk') return String(w.uk || w.ua || w.ru || '').trim();
    return String(w.ru || w.uk || '').trim();
  }

  function weightForWord(dk, w) {
    try {
      if (!w) return 0;
      var id = w.id;
      var max = getArticlesStarsMax();
      var s = 0;
      try { s = Number(A.ArticlesProgress && A.ArticlesProgress.getStars ? A.ArticlesProgress.getStars(dk, id) : 0) || 0; } catch (_) { s = 0; }

      // базовый вес: чем меньше звёзд, тем выше приоритет
      var base = (max - Math.min(max, Math.max(0, s))) + 1;

      // recency penalty по ts (last updated) из ArticlesProgress
      var ts = 0;
      try {
        var data = (A.ArticlesProgress && A.ArticlesProgress._getRawEntry) ? A.ArticlesProgress._getRawEntry(dk, id) : null;
        ts = data && data.ts ? Number(data.ts) : 0;
      } catch (_) { ts = 0; }

      if (ts > 0) {
        var age = safeNow() - ts;
        if (age < 60 * 1000) base *= 0.10;
        else if (age < 5 * 60 * 1000) base *= 0.30;
        else if (age < 30 * 60 * 1000) base *= 0.60;
      }

      return Math.max(0, base);
    } catch (_) {
      return 1;
    }
  }

  function sampleWeighted(dk, arr) {
    if (!arr || !arr.length) return 0;
    var weights = new Array(arr.length);
    var total = 0;
    for (var i = 0; i < arr.length; i++) {
      var w = weightForWord(dk, arr[i]);
      weights[i] = w;
      total += w;
    }
    if (!(total > 0)) return Math.floor(Math.random() * arr.length);
    var r = Math.random() * total;
    for (var j = 0; j < arr.length; j++) {
      r -= weights[j];
      if (r <= 0) return j;
    }
    return Math.floor(Math.random() * arr.length);
  }

  function pickNextWord() {
    // Движок как у базового тренера, но:
    // - прогресс/learned берём из ArticlesProgress
    // - learnedRepeat применяем из App.settings.learnedRepeat
    // - recency хранится отдельно (ArticlesProgress.ts)
    var slice = getArticlesSlice(deckKey);
    if (!slice || !slice.length) return null;

    var tries = 24;
    while (tries-- > 0) {
      var idx = sampleWeighted(deckKey, slice);
      var w = slice[idx];
      if (!w) continue;
      if (String(w.id) === String(lastWordId)) continue;
      if (!hasValidArticle(w)) continue;
      return w;
    }

    // последний шанс: линейный проход
    for (var i = 0; i < slice.length; i++) {
      var ww = slice[i];
      if (!ww) continue;
      if (String(ww.id) === String(lastWordId)) continue;
      if (!hasValidArticle(ww)) continue;
      return ww;
    }
    return slice[0] || null;
  }

  function buildViewModel() {
    var w = currentWord;
    var raw = w ? (w.word || w.term || w.de || '') : '';
    var correct = parseArticle(raw);
    var deckStats = getDeckStats(deckKey);
    var statsLabelRu = 'Количество слов с артиклями / выучено';
    return {
      active: active,
      deckKey: deckKey,
      mode: mode,
      wordId: w ? w.id : '',
      wordDisplay: stripArticle(raw),
      translation: tTranslation(w),
      statsLabelRu: statsLabelRu,
      statsWithArticles: deckStats.withArticles,
      statsLearned: deckStats.learned,
      promptKey: 'choose_article',
      promptRu: 'Выберите артикль',
      promptUk: 'Оберіть артикль',
      options: ['der', 'die', 'das'],
      correct: correct
    };
  }

  function getDeckStats(dk) {
    var deck = getDeckWithArticles();
    if (!deck || !deck.length) return { withArticles: 0, learned: 0 };
    var learned = 0;
    var progKey = baseKeyForProgress(dk);
    for (var i = 0; i < deck.length; i++) {
      if (isLearned(progKey, deck[i].id)) learned++;
    }
    return { withArticles: deck.length, learned: learned };
  }

  function getSetStats(dk) {
    var deck = getDeckWithArticles();
    if (!deck || !deck.length) return { withArticles: 0, learned: 0, setIndex: 0, totalSets: 1 };
    var progKey = baseKeyForProgress(dk);
    var setSize = getSetSize(dk);
    totalSets = Math.max(1, Math.ceil(deck.length / setSize));
    currentSetIndex = getBatchIndex(dk);
    if (currentSetIndex >= totalSets) currentSetIndex = totalSets - 1;
    var start = currentSetIndex * setSize;
    var end = Math.min(deck.length, start + setSize);
    var slice = deck.slice(start, end);
    var withA = 0;
    var learned = 0;
    for (var i = 0; i < slice.length; i++) {
      var w = slice[i];
      if (!hasValidArticle(w)) continue;
      withA++;
      if (isLearned(progKey, w.id)) learned++;
    }
    return { withArticles: withA, learned: learned, setIndex: currentSetIndex, totalSets: totalSets };
  }

  function notifyUpdate() {
    // Кард-шелл может подписаться на это событие.
    try {
      if (window.UIBus && typeof window.UIBus.emit === 'function') {
        window.UIBus.emit('articles:update', buildViewModel());
      }
    } catch (e) {}
  }

  function start(k, m) {
    deckKey = String(k || '').trim();
    mode = String(m || 'default');
    active = true;

    // Учёт времени активности приложения (общая статистика):
    // обычный тренер стартует сессию через Router.routeTo('home').
    // Здесь страхуемся, чтобы при запуске тренера артиклей время тоже считалось.
    try {
      if (A.Analytics && typeof A.Analytics.trainingStart === 'function') {
        var learnLang = null;
        try {
          if (A.Decks && typeof A.Decks.langOfKey === 'function') {
            learnLang = A.Decks.langOfKey(deckKey) || null;
          }
        } catch (_) {}
        var uiLang = '';
        try { uiLang = (A.settings && (A.settings.lang || A.settings.uiLang)) || ''; } catch (_e) {}
        A.Analytics.trainingStart({ learnLang: learnLang, uiLang: uiLang, deckKey: deckKey, trainerKind: 'articles' });
      }
    } catch (_e2) {}

    solved = false;
    penalized = false;

    // статистика сессии
    try { if (A.ArticlesStats && A.ArticlesStats.startSession) A.ArticlesStats.startSession(); } catch (e) {}

    currentWord = pickNextWord();
    lastWordId = currentWord ? String(currentWord.id) : '';
    try { A.__currentWord = currentWord; } catch(e) {}
    notifyUpdate();
  }

  function stop() {
    active = false;
    deckKey = '';
    mode = 'default';
    currentWord = null;
    lastWordId = '';
    solved = false;
    penalized = false;
    try { A.__currentWord = null; } catch(e) {}
    try { if (A.ArticlesStats && A.ArticlesStats.endSession) A.ArticlesStats.endSession(); } catch (e) {}
    notifyUpdate();
  }

  function next() {
    if (!active) return;
    currentWord = pickNextWord();
    lastWordId = currentWord ? String(currentWord.id) : '';
    try { A.__currentWord = currentWord; } catch(e) {}
    solved = false;
    penalized = false;
    notifyUpdate();
  }

  function answer(article) {
    if (!active || !currentWord) return { ok: false, correct: '' };
    var raw = currentWord.word || currentWord.term || currentWord.de || '';
    var correct = parseArticle(raw);
    var picked = norm(article);
    var ok = picked === correct;

    // IMPORTANT: начисление/штраф только 1 раз на слово (как в home.js)
    var applied = false;
    if (ok) {
      if (!solved) {
        solved = true;
        applied = true;
      }
    } else {
      if (!penalized) {
        penalized = true;
        applied = true;
      }
    }

    if (applied) {
      try {
        if (A.ArticlesProgress && typeof A.ArticlesProgress.onAnswer === 'function') {
          A.ArticlesProgress.onAnswer(deckKey, currentWord.id, ok, { mode: mode });
        }
      } catch (e) {}

      // NEW: «Мои ошибки» для артиклей — добавляем слово при неверном ответе,
      // но НЕ во время тренировки ошибок (virtual key mistakes:<lang>:<baseDeckKey>).
      try {
        var isMistDeck = /^mistakes:(ru|uk):/i.test(String(deckKey || ''));
        if (!ok && !isMistDeck && A.ArticlesMistakes && typeof A.ArticlesMistakes.push === 'function') {
          A.ArticlesMistakes.push(deckKey, currentWord.id);
        }
      } catch (_eM) {}

      try {
        if (A.ArticlesStats && typeof A.ArticlesStats.onAnswer === 'function') {
          A.ArticlesStats.onAnswer(ok);
        }
      } catch (e) {}
    }

    // аналитика: фиксируем факт ответа (для воронок/отвалов)
    try {
      if (A.Analytics && typeof A.Analytics.trainingAnswer === 'function') {
        A.Analytics.trainingAnswer({ result: ok ? 'correct' : 'wrong', applied: applied });
      } else if (A.Analytics && typeof A.Analytics.trainingPing === 'function') {
        A.Analytics.trainingPing({ reason: ok ? 'answer_correct' : 'answer_wrong' });
      }
    } catch (_aE) {}

    return { ok: ok, correct: correct, applied: applied };
  }

  function answerIdk() {
    // "Не знаю" — как в обычном тренере слов:
    // показываем правильный артикль, но НЕ начисляем штраф/статистику
    // и НЕ добавляем в "Мои ошибки".
    if (!active || !currentWord) return { ok: false, correct: '', applied: false, idk: true };

    try { solved = true; } catch(_){}

    var raw = currentWord.word || currentWord.term || currentWord.de || '';
    var correct = parseArticle(raw);
    // аналитика: "не знаю" — без штрафа/начисления
    try {
      if (A.Analytics && typeof A.Analytics.trainingAnswer === 'function') {
        A.Analytics.trainingAnswer({ result: 'dont_know', applied: false });
      } else if (A.Analytics && typeof A.Analytics.trainingPing === 'function') {
        A.Analytics.trainingPing({ reason: 'answer_idk' });
      }
    } catch (_aI) {}

    return { ok: false, correct: correct, applied: false, idk: true };
  }
A.ArticlesTrainer = {
    isActive: function () { return !!active; },
    start: start,
    stop: stop,
    next: next,
    answer: answer,
    answerIdk: answerIdk,
    getViewModel: buildViewModel,
    getCurrentWord: function(){ return currentWord; },
    getDeckStats: getDeckStats,
    getSetStats: getSetStats,
    // helpers (можно использовать из UI)
    _stripArticle: stripArticle,
    _parseArticle: parseArticle,
    _hasValidArticle: hasValidArticle,
    _filterWithArticles: function(arr){ try{ return (arr||[]).filter(hasValidArticle); }catch(e){ return []; } }
    ,getSetIndex: function(k){ try{ return getBatchIndex(k||deckKey); }catch(_){ return 0; } }
    ,setSetIndex: function(i,k){
        try{ setBatchIndex(i, k||deckKey); }catch(_){}
        try{ lastWordId=''; currentWord=null; solved=false; penalized=false; }catch(_){}
        try{ next(); }catch(_){}
      }
    ,getTrainableDeck: function(k){
        try{ if (k!=null) deckKey=String(k||'').trim(); }catch(_){}
        try{ return getDeckWithArticles(); }catch(_){ return []; }
      }

  };
})();
