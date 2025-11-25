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

  var LS_KEY = 'mm.audioEnabled';
  var wordObserver = null;

  // включён ли звук (по умолчанию: да)
  var audioEnabled = loadAudioEnabled();

  // запоминаем, какое слово было озвучено автоматически, чтобы не дублировать
  var lastAutoSpokenWord = '';

  function loadAudioEnabled() {
    try {
      var v = window.localStorage.getItem(LS_KEY);
      if (v === '0') return false;
      return true;
    } catch (e) {
      return true;
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

  function getTtsLang() {
    var study = (A.settings && A.settings.studyLang) || 'de';
    switch (study) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      case 'uk':
        return 'uk-UA';
      case 'ru':
        return 'ru-RU';
      case 'de':
      default:
        return 'de-DE';
    }
  }

  function speakText(text) {
    if (!audioEnabled) return;      // звук выключен пользователем
    if (!hasTTS()) return;
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(String(text));
      u.lang  = getTtsLang();
      u.rate  = 0.95;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // молча игнорируем
    }
  }

  // Берём слово только из словаря, а не из DOM
  function getCurrentWord() {
    var w = A.__currentWord || null;
    if (!w) return '';
    var raw = w.wordBasic || w.word || '';
    if (!raw && w.forms && w.forms.base) raw = w.forms.base;
    return String(raw || '').trim();
  }

  function speakCurrentWord() {
    var word = getCurrentWord();
    if (!word) return;
    speakText(word);
  }

  /* ==========================================================
   * === AUDIO BUTTON POSITION BLOCK ===
   * Кнопка 🔊/🔇 вставляется ВНУТРЬ .trainer-word,
   * сразу после текстового содержимого.
   * Если захочешь поменять позицию — правь только эту функцию.
   * ========================================================== */

  function updateButtonIcon(btn) {
    if (!btn) return;
    if (audioEnabled) {
      btn.textContent = '🔊';
      btn.setAttribute('aria-label', 'Озвучить слово');
    } else {
      btn.textContent = '🔇';
      btn.setAttribute('aria-label', 'Озвучка выключена');
    }
  }

  function renderAudioButton() {
    if (!hasTTS()) return;

    var wordEl = document.querySelector('.trainer-word');
    if (!wordEl) return;

    // ищем кнопку ВНУТРИ .trainer-word
    var btn = wordEl.querySelector('.trainer-audio-btn');

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'trainer-audio-btn';

      // одиночный клик — озвучка (если звук включён)
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!audioEnabled) return;
        speakCurrentWord();
      });

      // двойной клик — вкл/выкл звук
      btn.addEventListener('dblclick', function (e) {
        e.preventDefault();
        audioEnabled = !audioEnabled;
        saveAudioEnabled();
        updateButtonIcon(btn);
      });

      wordEl.appendChild(btn);
    }

    updateButtonIcon(btn);

    // автоозвучка нового слова (не повторяем одно и то же дважды подряд)
    var word = getCurrentWord();
    if (word && audioEnabled && word !== lastAutoSpokenWord) {
      lastAutoSpokenWord = word;
      setTimeout(function () {
        speakText(word);
      }, 120);
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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupGlobalObserver);
    } else {
      setupGlobalObserver();
    }

    // хук для ручного обновления, если понадобится
    (A.AudioTTS = A.AudioTTS || {}).refresh = renderAudioButton;
    A.AudioTTS.setEnabled = function (flag) {
      audioEnabled = !!flag;
      saveAudioEnabled();
      var btn = document.querySelector('.trainer-audio-btn');
      if (btn) updateButtonIcon(btn);
    };
  }

  init();
})();
