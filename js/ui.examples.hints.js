/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: ui.examples.hints.js
 * Назначение: Пример использования текущего слова
 *            в зоне .home-hints под сетами
 * Версия: 2.1 (2 неверные попытки → авто-перевод)
 * Обновлено: 2025-11-22
 * ========================================================== */

(function () {
  'use strict';

  const A = (window.App = window.App || {});

  let wordObserver = null;   // наблюдатель за .trainer-word
  let wrongAttempts = 0;     // счётчик неверных ответов для текущего слова

  /* ----------------------------- Вспомогательные функции ----------------------------- */

  // Язык интерфейса: ru / uk
  function getUiLang() {
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || null;
    const attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const v = (s || attr || 'ru').toLowerCase();
    return (v === 'uk') ? 'uk' : 'ru';
  }

  // Экранируем HTML
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Экранируем для RegExp
  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Подсветка: ищем только точное совпадение леммы (без угадывания форм)
  function highlightSentence(sentence, wordObj) {
    if (!sentence) return '';
    const raw = String(sentence);

    const w = wordObj && wordObj.word ? String(wordObj.word) : '';
    const lemma = w.trim().split(/\s+/).pop(); // отбрасываем артикль у существительных
    if (!lemma) return escapeHtml(raw);

    const re = new RegExp('\\b' + escapeRegExp(lemma) + '\\b', 'i');
    const m = raw.match(re);
    if (!m) {
      // нет точного совпадения — просто текст без подсветки
      return escapeHtml(raw);
    }

    const idx = m.index;
    const match = m[0];
    const before = raw.slice(0, idx);
    const after  = raw.slice(idx + match.length);

    return (
      escapeHtml(before) +
      '<span class="hint-word">' + escapeHtml(match) + '</span>' +
      escapeHtml(after)
    );
  }

  // Заголовок "Пример использования / Приклад вживання"
  function ensureTitle(section) {
    const bodyEl = section.querySelector('#hintsBody');
    if (!bodyEl) return;

    let titleEl = section.querySelector('.hints-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = 'hints-title';
      section.insertBefore(titleEl, bodyEl);
    }

    const lang = getUiLang();
    titleEl.textContent = (lang === 'uk')
      ? 'Приклад'
      : 'Пример';
  }

  /* ----------------------------- Основной рендер ----------------------------- */

  function renderExampleHint() {
    const section = document.querySelector('.home-hints');
    const body = document.getElementById('hintsBody');
    if (!section || !body) return;

    ensureTitle(section);

    const word = A.__currentWord;
    if (!word || !Array.isArray(word.examples) || !word.examples.length) {
      body.innerHTML = '';
      return;
    }

    const ex = word.examples[0] || {};
    const de = ex.L2 || ex.de || ex.deu || '';
    if (!de) {
      body.innerHTML = '';
      return;
    }

    const uiLang = getUiLang();
    const tr = (uiLang === 'uk')
      ? (ex.uk || ex.ru || '')
      : (ex.ru || ex.uk || '');

    const deHtml = highlightSentence(de, word);
    const trHtml = escapeHtml(tr);

    body.innerHTML =
      '<div class="hint-example">' +
        '<p class="hint-de">' + deHtml + '</p>' +
        (trHtml ? '<p class="hint-tr">' + trHtml + '</p>' : '') +
      '</div>';
  }

  /* ----------------------------- Автопоказ + прокрутка перевода ----------------------------- */

  // Прокрутка внутри окна подсказок, если перевод вылез за нижнюю границу
  function ensureTranslationVisible(trEl) {
    const body = document.getElementById('hintsBody');
    if (!body || !trEl) return;

    const bodyRect = body.getBoundingClientRect();
    const trRect   = trEl.getBoundingClientRect();

    // Уже полностью виден — ничего не крутим
    if (trRect.top >= bodyRect.top && trRect.bottom <= bodyRect.bottom) {
      return;
    }

    // Если нижний край ушёл вниз — прокручиваем так, чтобы он оказался в зоне видимости
    const delta = trRect.bottom - bodyRect.bottom;
    body.scrollTop += delta + 14; // небольшой запас
  }

  // Автопоказ перевода (по клику на ответ/«Не знаю»)
  function showTranslation() {
    const body = document.getElementById('hintsBody');
    if (!body) return;
    const root = body.querySelector('.hint-example');
    if (!root) return;
    const trEl = root.querySelector('.hint-tr');
    if (!trEl) return;

    trEl.classList.add('is-visible');
    ensureTranslationVisible(trEl);
  }

  /* ----------------------------- Наблюдение за тренером ----------------------------- */

  // локальный observer за .trainer-word — как в 1.2
  function setupWordObserver() {
    const wordEl = document.querySelector('.trainer-word');

    // если нет тренера — отключаем старый observer и выходим
    if (!wordEl || typeof MutationObserver === 'undefined') {
      if (wordObserver) {
        wordObserver.disconnect();
        wordObserver = null;
      }
      // хотя бы один раз попробуем что-то отрисовать
      renderExampleHint();
      return;
    }

    // если уже есть observer — отключаем, чтобы не плодить
    if (wordObserver) {
      wordObserver.disconnect();
      wordObserver = null;
    }

    let last = wordEl.textContent || '';

    wordObserver = new MutationObserver(function () {
      const t = wordEl.textContent || '';
      if (t === last) return;
      last = t;

      // новое слово → сбрасываем счётчик неверных попыток
      wrongAttempts = 0;

      // и возвращаем скролл подсказок в начало
      const body = document.getElementById('hintsBody');
      if (body) body.scrollTop = 0;

      renderExampleHint();
    });

    wordObserver.observe(wordEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // первый рендер для уже выведенного слова
    wrongAttempts = 0;
    const body = document.getElementById('hintsBody');
    if (body) body.scrollTop = 0;
    renderExampleHint();
  }

  // глобальный observer: следим только за появлением НОВОГО .trainer-word
  function setupGlobalHomeObserver() {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    const obs = new MutationObserver(function (mutations) {
      let needSetup = false;

      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (!m.addedNodes || !m.addedNodes.length) continue;

        for (let j = 0; j < m.addedNodes.length; j++) {
          const node = m.addedNodes[j];
          if (node.nodeType !== 1) continue; // только элементы

          // сам .trainer-word
          if (node.matches && node.matches('.trainer-word')) {
            needSetup = true;
            break;
          }

          // или внутри добавленного узла есть .trainer-word
          if (node.querySelector && node.querySelector('.trainer-word')) {
            needSetup = true;
            break;
          }
        }

        if (needSetup) break;
      }

      if (needSetup) {
        setupWordObserver();
      }
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* ----------------------------- Обработка кликов ----------------------------- */

  function attachClickHandlers() {
    document.addEventListener('click', function (evt) {
      const target = evt.target;

      // 1) Клик по немецкому примеру — показать/скрыть перевод вручную
      const deEl = target.closest('.hint-de');
      if (deEl) {
        const root = deEl.closest('.hint-example');
        if (!root) return;

        const trEl = root.querySelector('.hint-tr');
        if (!trEl) return;

        const willShow = !trEl.classList.contains('is-visible');

        trEl.classList.toggle('is-visible');

        // Если перевод только что показали — следим, чтобы он не спрятался под скролл
        if (willShow) {
          ensureTranslationVisible(trEl);
        }
        return;
      }

      // 2) Клик по вариантам ответов / "Не знаю"
      const answerBtn = target.closest('.answers-grid button');
      const idkBtn    = target.closest('.idk-btn');

      // 2.1) Клик по варианту ответа
      if (answerBtn) {
        // Даём тренеру сначала обработать клик (поставить is-correct / is-wrong)
        setTimeout(function () {
          // Правильный ответ → всегда сразу показываем перевод
          if (answerBtn.classList.contains('is-correct')) {
            showTranslation();
            return;
          }

          // Неверный ответ → считаем попытки
          if (answerBtn.classList.contains('is-wrong')) {
            wrongAttempts += 1;

            // Показ перевода только, когда уже было 2 неверных попытки
            if (wrongAttempts >= 2) {
              showTranslation();
            }
          }
        }, 0);

        return;
      }

      // 2.2) Клик по "Не знаю" → как раньше, сразу показываем перевод
      if (idkBtn) {
        setTimeout(showTranslation, 0);
        return;
      }
    });
  }

  /* ----------------------------- Инициализация ----------------------------- */

  function init() {
    attachClickHandlers();
    setupWordObserver();       // следим за сменой слова в тренере
    setupGlobalHomeObserver(); // восстанавливаем observer после навигации

    // ручной хук, если понадобится
    (A.HintsExamples = A.HintsExamples || {}).refresh = renderExampleHint;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
