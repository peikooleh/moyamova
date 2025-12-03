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

  // новый ключ, чтобы не конфликтовать со старой логикой
  var LS_KEY = 'mm.audioEnabled.v2';
  var wordObserver = null;

  // включён ли звук (по умолчанию: НЕТ, чтобы не пугать)
  var audioEnabled = loadAudioEnabled();

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

  function getTtsLang() {
    var study = (A.settings && A.settings.studyLang) || 'de';
    switch (study) {
      case 'de':
        return 'de-DE';
      case 'en':
        return 'en-US';
      case 'fr':
        return 'fr-FR';
      case 'sr':
        return 'sr-RS';
      default:
        return 'de-DE';
    }
  }

  function getCurrentWord() {
    try {
      var root = document.querySelector('.trainer-word');
      if (!root) return '';
      var el = root.querySelector('[data-role="word-text"]') || root;
      var txt = '';
      if (el.dataset && el.dataset.word) {
        txt = el.dataset.word;
      } else {
        txt = el.textContent || '';
      }
      txt = String(txt || '').trim();
      return txt.replace(/\s+/g, ' ');
    } catch (e) {
      return '';
    }
  }

  function speakText(text) {
    if (!A.isPro || !A.isPro()) return; // озвучка только в PRO
    if (!audioEnabled) return;          // пользователь выключил звук
    if (!hasTTS()) return;
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(String(text));
      u.lang = getTtsLang();
      u.rate = 0.95;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // озвучка — необязательная фича, ошибки глотаем
    }
  }

  function speakCurrentWord() {
    var w = getCurrentWord();
    if (w) speakText(w);
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
        if (!A.isPro || !A.isPro()) return;
        if (!audioEnabled) return;
        speakCurrentWord();
      });

      // двойной клик — вкл/выкл звук (без автопроигрывания)
      btn.addEventListener('dblclick', function (e) {
        e.preventDefault();
        if (!A.isPro || !A.isPro()) return;
        audioEnabled = !audioEnabled;
        saveAudioEnabled();
        updateButtonIcon(btn);
        if (!audioEnabled) {
          try {
            window.speechSynthesis && window.speechSynthesis.cancel();
          } catch (e2) {}
        }
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
