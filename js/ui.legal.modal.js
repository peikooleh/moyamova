/* ==========================================================================
 * Проект: MOYAMOVA
 * Файл: ui.legal.modal.js
 * Назначение: Модалка "Условия использования"
 * Версия: 1.1
 * Обновлено: 2025-11-23
 * ========================================================================== */

(function () {
  'use strict';

  var root = window;
  var A = (root.App = root.App || {});

  // ---------------- Язык интерфейса ----------------

  function getUiLang() {
    var s =
      (A.settings && (A.settings.lang || A.settings.uiLang)) || null;
    var attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    var v = (s || attr || 'ru').toLowerCase();
    return v === 'uk' ? 'uk' : 'ru';
  }

  // ---------------- Тексты условий ----------------

  var TERMS = {
    ru: [
      '<h2>Условия использования</h2>',
      '<p>Используя приложение MOYAMOVA, вы соглашаетесь с тем, что учебные материалы,',
      'прогресс и сохраняемые данные используются исключительно в личных образовательных целях.</p>',
      '',
      '<p>Мы не гарантируем абсолютную точность переводов, примеров и языковых данных,',
      'но постоянно работаем над их улучшением.</p>',
      '',
      '<p>Продолжая использование приложения, вы подтверждаете,',
      'что понимаете и принимаете данные условия.</p>'
    ].join('\n'),
    uk: [
      '<h2>Умови використання</h2>',
      '<p>Використовуючи застосунок MOYAMOVA, ви погоджуєтесь, що навчальні матеріали,',
      'прогрес та збережені дані використовуються виключно в особистих освітніх цілях.</p>',
      '',
      '<p>Ми не гарантуємо абсолютну точність перекладів, прикладів і мовних даних,',
      'але постійно працюємо над їх покращенням.</p>',
      '',
      '<p>Продовжуючи використання застосунку, ви підтверджуєте,',
      'що розумієте та приймаєте ці умови.</p>'
    ].join('\n')
  };

  // ---------------- Создание модалки ----------------

  function ensureModalExists() {
    var existing = document.getElementById('legalModal');
    if (existing) return existing;

    var div = document.createElement('div');
    div.id = 'legalModal';
    div.className = 'legal-modal-overlay';
    div.innerHTML =
      '<div class="legal-modal">' +
      '  <button class="legal-modal-close" aria-label="Close"></button>' +
      '  <div class="legal-modal-body"></div>' +
      '</div>';

    document.body.appendChild(div);

    // Закрытие по фону
    div.addEventListener('click', function (e) {
      if (e.target === div) {
        closeModal();
      }
    });

    // Закрытие по крестику
    var closeBtn = div.querySelector('.legal-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal();
      });
    }

    return div;
  }

  // ---------------- Определение языка для модалки ----------------

  function detectTermsLang() {
    // 1) Пытаемся понять язык по тексту чекбокса в мастере
    var el = document.querySelector('.onboarding-terms-text');
    if (el) {
      var txt = (el.textContent || '').toLowerCase();

      if (txt.indexOf('умови використання') !== -1) {
        return 'uk';
      }
      if (txt.indexOf('условия использования') !== -1) {
        return 'ru';
      }
    }

    // 2) Фолбэк — используем глобальный язык интерфейса
    return getUiLang();
  }

  // ---------------- Открытие / закрытие ----------------

  function openModal() {
    var modal = ensureModalExists();
    var body = modal.querySelector('.legal-modal-body');
    if (!body) return;

    var lang = detectTermsLang();
    body.innerHTML = TERMS[lang] || TERMS[getUiLang()] || TERMS.ru;

    modal.classList.add('is-visible');
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    var modal = document.getElementById('legalModal');
    if (!modal) return;
    modal.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
  }

  // ---------------- Оборачивание текста в ссылку ----------------

  function enhanceTermsLink() {
    // Ищем тот span, который мы пометили классом в ui.setup.modal.js
    var el = document.querySelector('.onboarding-terms-text');
    if (!el) return;

    // Уже обрабатывали — выходим
    if (el.dataset.legalEnhanced === '1') return;

    var html = el.innerHTML;
    var originalHtml = html;

    // Оборачиваем русскую фразу, если есть
    html = html.replace(
      'условия использования',
      '<button type="button" class="legal-inline-link" data-legal-link="1">условия использования</button>'
    );

    // Оборачиваем украинскую фразу, если есть
    html = html.replace(
      'умови використання',
      '<button type="button" class="legal-inline-link" data-legal-link="1">умови використання</button>'
    );

    // Если ни одна из фраз не нашлась — ничего не делаем
    if (html === originalHtml) {
      return;
    }

    el.innerHTML = html;
    el.dataset.legalEnhanced = '1';

    var link = el.querySelector('[data-legal-link]');
    if (link) {
      link.addEventListener('click', function (evt) {
        evt.preventDefault();
        openModal();
      });
    }
  }

  // ---------------- Наблюдатель за DOM ----------------

  function setupObserver() {
    var obs = new MutationObserver(function () {
      enhanceTermsLink();
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Попробуем сразу — если мастер уже открыт
    enhanceTermsLink();
  }

  // ---------------- Инициализация ----------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver, { once: true });
  } else {
    setupObserver();
  }
})();
