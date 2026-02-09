/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: ui.audio.tts.js
 * Назначение: Озвучка текущего слова в тренере (SpeechSynthesis)
 *   - Кнопка рядом со словом
 *   - Автоозвучка при смене слова
 *   - Двойной клик по кнопке — включить/выключить звук (🔊 / 🔇)
 * Версия: 2.2 (кнопка внутри .trainer-word)
 * Обновлено: 2025-11-23
 * ========================================================== */

(function () {
  'use strict';

  var A = (window.App = window.App || {});

  var LS_KEY = 'mm.audioEnabled.v2';
  var LS_TTS_WORDS = 'mm.tts.words';
  var LS_TTS_EXAMPLES = 'mm.tts.examples';
  var wordObserver = null;

  function isPwaOrTwaRunmode(){
    try {
      if (String(location.search||'').indexOf('twa=1') !== -1) return true;
    } catch(_){}
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch(_){}
    try {
      if (typeof window.navigator !== 'undefined' && window.navigator.standalone === true) return true;
    } catch(_){}
    try {
      var rm = String(document.documentElement.getAttribute('data-runmode') || document.documentElement.dataset.runmode || '').toLowerCase();
      if (rm === 'pwa' || rm === 'twa') return true;
    } catch(_){}
    return false;
  }


  // включён ли звук (по умолчанию: НЕТ, чтобы не пугать)
  var audioEnabled = loadAudioEnabled();

  function _readBoolLS(key, fallback){
    try {
      var v = window.localStorage.getItem(key);
      if (v === null || v === undefined || v === '') return (fallback===null? null : !!fallback);
      return v === '1' || v === 'true';
    } catch(e){
      return (fallback===null? null : !!fallback);
    }
  }

  // Migration from legacy mm.audioEnabled.v2:
  // if legacy enabled, default to words=ON, examples=OFF (conservative).
  (function _migrateLegacyTts(){
    try {
      var w = _readBoolLS(LS_TTS_WORDS, null);
      var ex = _readBoolLS(LS_TTS_EXAMPLES, null);
      if (w === null || ex === null) {
        var legacy = window.localStorage.getItem(LS_KEY);
        if (legacy === '1') {
          window.localStorage.setItem(LS_TTS_WORDS, '1');
          window.localStorage.setItem(LS_TTS_EXAMPLES, '0');
        } else {
          if (w === null) window.localStorage.setItem(LS_TTS_WORDS, '0');
          if (ex === null) window.localStorage.setItem(LS_TTS_EXAMPLES, '0');
        }
      }
    } catch(_e){}
  })();

  function ttsWordsEnabled(){ return !!_readBoolLS(LS_TTS_WORDS, false); }
  function ttsExamplesEnabled(){ return !!_readBoolLS(LS_TTS_EXAMPLES, false); }
  function ttsAnyEnabled(){ return ttsWordsEnabled() || ttsExamplesEnabled(); }


  function isArticlesMode() {
    try { return A.settings && A.settings.trainerKind === 'articles'; } catch (e) { return false; }
  }

  function isPrepositionsMode() {
    try { return A.settings && A.settings.trainerKind === 'prepositions'; } catch (e) { return false; }
  }

  function isReverseMode() {
    try {
      var el = document.getElementById('trainReverse');
      return !!(el && el.checked);
    } catch (e) {
      return false;
    }
  }

  // запоминаем, какое слово было озвучено автоматически, чтобы не дублировать
  var lastAutoSpokenWord = '';

  function loadAudioEnabled() {
    try {
      var v = window.localStorage.getItem(LS_KEY);
      if (v === '1') return true;   // 1 = звук ВКЛ
      if (v === '0') return false;  // 0 = звук ВЫКЛ
      return false;                 // по умолчанию: выключен
    } catch (e) {
      return false;
    }
  }

  function saveAudioEnabled() {
    try {
      window.localStorage.setItem(LS_KEY, audioEnabled ? '1' : '0');
    } catch (e) {}
  }

  function hasTTS() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }

  // ==========================================================
  // Выбор языка/голоса TTS
  // Важно: язык озвучки должен соответствовать языку текущего словаря,
  // а не "языку обучения" приложения. Иначе в EN-тренере могут звучать
  // числа и фрагменты по DE-голосу (типовой баг, который вы увидели).
  // ==========================================================

  var _voicesCache = null;
  var _voicesReady = false;
  var _voicesPromise = null;

  function _loadVoices() {
    try {
      if (!window.speechSynthesis) return [];
      var v = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function _ensureVoices() {
    if (_voicesReady && _voicesCache) return _voicesCache;
    _voicesCache = _loadVoices();
    if (_voicesCache && _voicesCache.length) _voicesReady = true;
    return _voicesCache || [];
  }

  // Голоса на iOS/мобильных часто появляются асинхронно.
  // Этот хелпер гарантирует, что список голосов будет заполнен
  // (или мы корректно продолжим без конкретного voice) ДО старта speak().
  function _ensureVoicesAsync() {
    try {
      if (_voicesReady && _voicesCache && _voicesCache.length) return Promise.resolve(_voicesCache);
      if (_voicesPromise) return _voicesPromise;

      _voicesPromise = new Promise(function (resolve) {
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          try {
            _ensureVoices();
          } catch (_e) {}
          resolve(_voicesCache || []);
        }

        // 1) пробуем сразу
        try {
          _ensureVoices();
          if (_voicesCache && _voicesCache.length) return finish();
        } catch (_e0) {}

        // 2) ждём событие voiceschanged
        var timer = null;
        var poll  = null;
        try {
          if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
            var prev = window.speechSynthesis.onvoiceschanged;
            window.speechSynthesis.onvoiceschanged = function () {
              try {
                if (typeof prev === 'function') prev();
              } catch (_ePrev) {}
              _voicesCache = null;
              _voicesReady = false;
              finish();
            };
          }
        } catch (_e1) {}

        // 3) короткий polling как фолбэк
        poll = setInterval(function () {
          try {
            _ensureVoices();
            if (_voicesCache && _voicesCache.length) finish();
          } catch (_eP) {}
        }, 120);

        timer = setTimeout(function () {
          finish();
        }, 1500);

        // очистка
        var origFinish = finish;
        finish = function () {
          try { if (poll) clearInterval(poll); } catch (_eC1) {}
          try { if (timer) clearTimeout(timer); } catch (_eC2) {}
          origFinish();
        };
      });

      return _voicesPromise;
    } catch (_e) {
      return Promise.resolve([]);
    }
  }

  // Подождать, пока SpeechSynthesis закончит текущую озвучку.
  // Важно для prepositions: пользователь может ответить быстрее, чем закончится
  // авто-озвучка текущей фразы, и UI не должен переключать паттерн "поверх" речи.
  function waitUntilIdle(timeoutMs) {
    var ms = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : 8000;
    if (!hasTTS()) return Promise.resolve();
    return new Promise(function (resolve) {
      var start = Date.now();
      function tick() {
        try {
          if (!window.speechSynthesis) return resolve();
          var busy = !!(window.speechSynthesis.speaking || window.speechSynthesis.pending);
          if (!busy) return resolve();
          if (Date.now() - start > ms) return resolve();
        } catch (_e) {
          return resolve();
        }
        setTimeout(tick, 80);
      }
      tick();
    });
  }

  // 2-letter lang -> reasonable default BCP47
  function _defaultLangTag(lang2) {
    switch (String(lang2 || '').toLowerCase()) {
      case 'en': return 'en-US';
      case 'de': return 'de-DE';
      case 'es': return 'es-ES';
      case 'uk': return 'uk-UA';
      case 'ru': return 'ru-RU';
      case 'fr': return 'fr-FR';
      case 'sr': return 'sr-RS';
      default:   return 'en-US';
    }
  }

  function _lang2FromDeckKey() {
    try {
      // Основной источник истины — активная дека.
      var key = (A.settings && A.settings.lastDeckKey) ? String(A.settings.lastDeckKey) : '';
      if (A.Decks && typeof A.Decks.langOfKey === 'function') {
        var l = A.Decks.langOfKey(key);
        if (l) return String(l).toLowerCase();
      }
      // Фолбэк — префикс ключа вида "en_*".
      var m = key.match(/^([a-z]{2})_/i);
      if (m && m[1]) return String(m[1]).toLowerCase();
    } catch (e) {}
    return null;
  }

  function getTtsLang() {
    // 1) Пытаемся определить язык по текущей деке
    var lang2 = _lang2FromDeckKey();
    // 2) Фолбэк — прежнее поведение (studyLang)
    if (!lang2) lang2 = (A.settings && A.settings.studyLang) ? String(A.settings.studyLang) : 'de';
    return _defaultLangTag(lang2);
  }

  function _pickVoiceForLang(langTag) {
    var voices = _ensureVoices();
    if (!voices || !voices.length) return null;

    var want = String(langTag || '').toLowerCase();
    var want2 = want.slice(0, 2);

    // 1) Exact match
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      if (!v || !v.lang) continue;
      if (String(v.lang).toLowerCase() === want) return v;
    }
    // 2) Prefix match (en-*, de-*)
    for (var j = 0; j < voices.length; j++) {
      var v2 = voices[j];
      if (!v2 || !v2.lang) continue;
      var l2 = String(v2.lang).toLowerCase();
      if (l2.slice(0, 2) === want2) return v2;
    }
    // 3) Anything
    return voices[0] || null;
  }

  function getCurrentWord() {
    // Для тренера предлогов озвучиваем ТО, что реально показано на экране.
    // Это важно, потому что после верного ответа в фразу вставляется предлог.
    try {
      if (isPrepositionsMode()) {
        var el = document.querySelector('.trainer-word');
        var t = el ? (el.textContent || '') : '';
        return String(t || '').replace(/\s+/g, ' ').trim();
      }
    } catch (e) {}

    var w = A.__currentWord || null;
    if (!w) return '';
    var raw = w.wordBasic || w.word || '';
    if (!raw && w.forms && w.forms.base) raw = w.forms.base;
    return String(raw || '').trim();
  }

  // force=true используется для ручной озвучки по кнопке (работает всегда).
  // Returns a Promise that resolves when the utterance finishes (or errors).
  // Used to delay UI transitions until the user has heard the audio.
  
function speakText(text, force, opts) {
    if (!A.isPro || !A.isPro()) return null; // озвучка только в PRO
    // Gate by pills.
    if (!force) {
      var isEx = !!(opts && opts.isExample);
      if (isEx && !ttsExamplesEnabled()) return null;
      if (!isEx && !ttsWordsEnabled()) return null;
    }
    // Manual calls (force=true) are additionally gated by caller (respect pills).
    if (!hasTTS()) return null;

    try {
      // Best-effort: синхронно прогреваем голоса (на iOS список может быть пустым до первого getVoices()).
      try { _ensureVoices(); } catch (_eWarm) {}

      // iOS/WebKit: иногда помогает "разбудить" движок.
      try { window.speechSynthesis.resume(); } catch (_eRes) {}

      return new Promise(function (resolve) {
        var done = false;
        var started = false;
        var watchdogId = null;
        var startCheckId = null;
        var retries = 0;

        function finish() {
          if (done) return;
          done = true;
          if (watchdogId) clearTimeout(watchdogId);
          if (startCheckId) clearTimeout(startCheckId);
          resolve();
        }

        function buildUtterance() {
          var u = new window.SpeechSynthesisUtterance(String(text));
          u.lang = getTtsLang();

          // Подбор голоса по языку активной деки (best-effort).
          // ВАЖНО (iOS/WebKit): для длинных фраз на "холодную" выбор конкретного voice
          // иногда приводит к тихому/пропущенному воспроизведению. Для примеров разрешаем
          // режим noVoice (только lang), чтобы повысить надёжность.
          var noVoice = !!(opts && opts.noVoice);
          if (!noVoice) {
            try {
              var v = _pickVoiceForLang(u.lang);
              if (v) u.voice = v;
            } catch (_eVoice) {}
          }

          u.rate = 0.95;
          u.pitch = 1.0;

          u.onstart = function () { started = true; };
          u.onend = finish;
          u.onerror = finish;

          return u;
        }

        function attemptSpeak() {
          started = false;

          // ВАЖНО: cancel перед новым speak, иначе на iOS легко получить "залипание" очереди.
          try { window.speechSynthesis.cancel(); } catch (_eCancel) {}

          // Ещё раз пробуем прогреть голоса непосредственно перед speak.
          try { _ensureVoices(); } catch (_eWarm2) {}

          var u = buildUtterance();

          // Жёсткий watchdog, чтобы UI не мог зависнуть, если onend не придёт.
          if (watchdogId) clearTimeout(watchdogId);
          watchdogId = setTimeout(finish, 7000);

          try {
            window.speechSynthesis.speak(u);
          } catch (_eSpeak) {
            finish();
            return;
          }

          // Если через небольшой интервал не началось воспроизведение — делаем один ретрай.
          // Это чинит "холодный" запуск DE на iOS, когда первый speak может быть тихим/пропущенным.
          if (startCheckId) clearTimeout(startCheckId);
          startCheckId = setTimeout(function () {
            var speaking = false;
            try { speaking = !!window.speechSynthesis.speaking; } catch (_eSp) {}
            if (started || speaking) return;

            // голоса могли подгрузиться только сейчас
            if (retries < 1) {
              retries++;

              // iOS/WebKit: на "холодную" длинная фраза (пример) на DE иногда не стартует,
              // хотя короткие слова стартуют. Тёплый "тихий" прогрев помогает.
              // Делаем один бесшумный warm-up utterance (volume=0), затем повторяем speak.
              try {
                var warm = new window.SpeechSynthesisUtterance('.');
                warm.lang = getTtsLang();
                warm.volume = 0; // бесшумно
                warm.rate = 1.0;
                warm.pitch = 1.0;

                warm.onend = function () {
                  setTimeout(function () { attemptSpeak(); }, 60);
                };
                warm.onerror = function () {
                  setTimeout(function () { attemptSpeak(); }, 60);
                };

                try { window.speechSynthesis.cancel(); } catch (_eCw) {}
                try { window.speechSynthesis.speak(warm); } catch (_eSw) {
                  setTimeout(function () { attemptSpeak(); }, 60);
                }
                return;
              } catch (_eWarm) {
                // небольшой зазор перед ретраем, чтобы voices успели появиться
                setTimeout(function () { attemptSpeak(); }, 80);
              }
            } else {
              // не удалось стартовать — не блокируем UI
              finish();
            }
          }, 260);
        }

        attemptSpeak();
      });
    } catch (e) {
      return null;
    }
  }


  function speakCurrentWord(force) {
    var w = getCurrentWord();
    if (!w) return null;
    return speakText(w, !!force);
  }

  /* ========================================================== */

  function updateButtonIcon(btn) {
    if (!btn) return;

    if (!hasTTS() || !A.isPro || !A.isPro()) {
      btn.textContent = '🔇';
      btn.setAttribute('aria-label', 'Озвучка недоступна');
      btn.disabled = true;
      return;
    }

    if (ttsAnyEnabled()) {
      btn.textContent = '🔊';
      btn.setAttribute('aria-label', 'Озвучить');
    } else {
      btn.textContent = '🔇';
      btn.setAttribute('aria-label', 'Озвучка выключена');
    }
  }

  function renderAudioButton() {
    if (!hasTTS()) return;

    var wordEl = document.querySelector('.trainer-word');
    if (!wordEl) return;

    // В тренере предлогов НЕ добавляем кнопку внутрь .trainer-word,
    // чтобы ничего не "прилипало" к тексту фразы.
    var hostEl = wordEl;
    if (isPrepositionsMode()) {
      hostEl = document.querySelector('.home-trainer') || wordEl;

      // если раньше кнопка уже была вставлена в .trainer-word — удаляем
      try {
        var oldInside = wordEl.querySelector('.trainer-audio-btn');
        if (oldInside) oldInside.remove();
      } catch (e) {}
    }

    // ищем кнопку в выбранном хосте
    var btn = hostEl.querySelector('.trainer-audio-btn');

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'trainer-audio-btn';

      // одиночный клик — озвучка (если звук включён)
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!A.isPro || !A.isPro()) return;
        // Ручная озвучка уважает пилюли.
        try {
          var wOn = ttsWordsEnabled();
          var eOn = ttsExamplesEnabled();
          if (!wOn && !eOn) {
            // WEB: prefs card hidden, user cannot enable sound — show a hint.
            if (!isPwaOrTwaRunmode()) {
              try { if (A.Msg && A.Msg.toast) A.Msg.toast('tts.web.install'); } catch(_){}
            }
            return;
          }
          if (wOn) speakText(getCurrentWord(), true);
          if (eOn) {
            var cw = A.__currentWord || null;
            var ex = (cw && cw.examples && cw.examples[0] && (cw.examples[0].L2 || cw.examples[0].de || cw.examples[0].en || cw.examples[0].text)) || '';
            var exText = String(ex||'').trim();
            if (exText) {
              // for examples use noVoice for iOS stability
              speakText(exText, true, { noVoice: true, isExample: true });
            }
          }
        } catch(_e){ /* noop */ }
      });

      hostEl.appendChild(btn);
    }

    updateButtonIcon(btn);

    // Автоозвучка нового слова — только для word-trainer в прямом режиме.
    // В articles-режиме и в режиме обратного перевода автоозвучку отключаем,
    // чтобы звук не превращался в подсказку.
    if (!isArticlesMode() && !isReverseMode() && !isPrepositionsMode()) {
      var word = getCurrentWord();
      if (word && ttsWordsEnabled() && word !== lastAutoSpokenWord) {
        lastAutoSpokenWord = word;
        setTimeout(function () {
          speakText(word, false);
        }, 120);
      }
    }
  }
  /* ========================================================== */

  // Следим за изменением .trainer-word и обновляем кнопку/озвучку
  function setupWordObserver() {
    var wordEl = document.querySelector('.trainer-word');

    if (!wordEl || typeof MutationObserver === 'undefined') {
      renderAudioButton();
      return;
    }

    if (wordObserver) {
      wordObserver.disconnect();
      wordObserver = null;
    }

    var lastText = wordEl.textContent || '';

    wordObserver = new MutationObserver(function () {
      var t = wordEl.textContent || '';
      if (t === lastText) return;
      lastText = t;
      renderAudioButton();
    });

    wordObserver.observe(wordEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // первый рендер
    renderAudioButton();
  }

  // Глобальный наблюдатель: ждём появления .trainer-word в DOM
  function setupGlobalObserver() {
    if (typeof MutationObserver === 'undefined') return;

    var obs = new MutationObserver(function (mutations) {
      var need = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (!m.addedNodes) continue;
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches('.trainer-word')) {
            need = true;
            break;
          }
          if (n.querySelector && n.querySelector('.trainer-word')) {
            need = true;
            break;
          }
        }
        if (need) break;
      }
      if (need) {
        setupWordObserver();
      }
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true
    });

    // на случай, если .trainer-word уже есть
    setupWordObserver();
  }

  function init() {
    if (!hasTTS()) return;

    // Голоса часто подгружаются асинхронно (особенно на мобильных).
    // Обновляем кэш, чтобы выбор voice по языку работал стабильно.
    try {
      if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = function () {
          _voicesCache = null;
          _voicesReady = false;
          _ensureVoices();
        };
      }
    } catch (_eVoicesChanged) {}

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupGlobalObserver);
    } else {
      setupGlobalObserver();
    }

    // хук для ручного обновления, если понадобится
    (A.AudioTTS = A.AudioTTS || {}).refresh = renderAudioButton;
    A.AudioTTS.refreshIndicators = function(){ try { var b=document.querySelector('.trainer-audio-btn'); if (b) updateButtonIcon(b); } catch(_e){} };
    // публичный хелпер: озвучить произвольный текст и дождаться завершения
    A.AudioTTS.speakText = function (text, force, opts) {
      return speakText(text, !!force, opts);
    };
    // публичный хелпер: дождаться, пока текущая озвучка завершится
    A.AudioTTS.waitUntilIdle = function (timeoutMs) {
      return waitUntilIdle(timeoutMs);
    };
    A.AudioTTS.setEnabled = function(flag){
      // legacy hook: map to words pill
      try { window.localStorage.setItem(LS_TTS_WORDS, flag? '1':'0'); } catch(_){}
      try { window.localStorage.setItem(LS_TTS_EXAMPLES, '0'); } catch(_){}
      var btn = document.querySelector('.trainer-audio-btn');
      if (btn) updateButtonIcon(btn);
    };
    // Озвучка после верного ответа:
    // - articles trainer: всегда
    // - word trainer: только в режиме обратного перевода (чтобы не было подсказки при показе вопроса)
    A.AudioTTS.onCorrect = function () {
      if (!isArticlesMode() && !isReverseMode() && !isPrepositionsMode()) return;
      if (!A.isPro || !A.isPro()) return;
      if (!ttsWordsEnabled()) return;
      try {
        var w = getCurrentWord();
        if (w) lastAutoSpokenWord = w;
      } catch (_e) {}
      return speakCurrentWord(false);
    };
  }

  init();
})();
