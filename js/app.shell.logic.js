/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: app.shell.logic.js
 * Назначение: Логика оболочки приложения и переходов между экранами
 * ========================================================== */

(function () {
  'use strict';

  // Высоты header/footer для offcanvas
  function updateHFVars() {
    const h = document.querySelector('.header');
    const f = document.querySelector('.app-footer');
    const rs = document.documentElement.style;
    if (h) rs.setProperty('--header-h-actual', h.getBoundingClientRect().height + 'px');
    if (f) rs.setProperty('--footer-h-actual', f.getBoundingClientRect().height + 'px');
  }
  window.addEventListener('load', updateHFVars);
  window.addEventListener('resize', updateHFVars);

  const burger  = document.getElementById('btnMenu');
  const ocRoot  = document.querySelector('.oc-root');
  const ocPanel = document.querySelector('.oc-panel');
  const overlay = document.querySelector('.oc-overlay');

  function openMenu(){
    document.body.classList.add('menu-open');
    if (ocRoot) ocRoot.setAttribute('aria-hidden','false');
    updateHFVars();
  }
  function closeMenu(){
    document.body.classList.remove('menu-open');
    if (ocRoot) ocRoot.setAttribute('aria-hidden','true');
  }
  function toggleMenu(){
    if (document.body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  }

  if (burger) burger.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Закрытие меню по кликам на элементы с data-close (кнопки в меню и модалках)
  document.addEventListener('click', function(e){
    try {
      var t = e.target;
      // closest() нужен, чтобы сработало при клике по вложенным элементам (svg/span)
      var node = (t && t.closest) ? t.closest('[data-close]') : t;
      var closeAttr = node && node.getAttribute ? node.getAttribute('data-close') : null;
      if (closeAttr) {
        e.preventDefault();
        closeMenu();
      }
    } catch(_) {}
  });

  // Явная обработка кнопки "Проверить обновления" внутри бургер-меню:
  // закрываем меню, чтобы тосты не оказывались под overlay
  (function(){
    function bindUpdatesClose(){
      var btn = document.getElementById('btnCheckUpdates');
      if (!btn) return;
      btn.addEventListener('click', function(){
        try { closeMenu(); } catch(_) {}
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindUpdatesClose, { once: true });
    } else {
      bindUpdatesClose();
    }
  })();

  // ==========================================================
  // ЭТАП 1: всегда Donate, PRO-активация отключена
  // ==========================================================
  function applyProButtonState(){
    try {
      // нижняя кнопка ПРО/донат
      var btn = document.querySelector(
        '.actions-row-bottom .action-btn[data-action="pro"], ' +
        '.actions-row-bottom .action-btn[data-action="donate"]'
      );
      if (btn) {
        btn.dataset.action = 'donate';
        btn.textContent = '💰';
        btn.setAttribute('aria-label', 'Поддержать проект');
      }

      // бейдж PRO в шапке сейчас не используем
      var badge = document.querySelector('.header-pro-badge');
      if (badge) badge.classList.remove('is-visible');
    } catch(_) {}
  }

  // Версия приложения (app.core.js → App.APP_VER)
  (function(){
    function renderVersion(){
      var el = document.getElementById('appVersion');
      if (el) {
        var v = (window.App && App.APP_VER) || null;
        if (v) el.textContent = v;
      }
      applyProButtonState();
    }
    if (!(window.App && App.APP_VER)) {
      window.addEventListener('load', renderVersion);
    } else {
      renderVersion();
    }
  })();

  // ==========================================================
  // Actions map
  // ==========================================================
  const actionsMap = {
    guide() {
      try {
        if (window.Guide && typeof window.Guide.open === 'function') {
          window.Guide.open();
        } else if (window.App && App.Guide && typeof App.Guide.open === 'function') {
          App.Guide.open();
        } else {
          console.warn('Guide module not found');
        }
      } catch (e) {
        console.warn('guide open error', e);
      }
      try { closeMenu(); } catch (_) {}
    },

    pro() {
      // NO-OP
      // PRO-активация временно отключена.
      // Точка сохранена для будущей интеграции Google Play Billing.
      return;
    },

    donate() {
      if (!window.Donate) {
        const s = document.createElement('script');
        s.src = './js/donate.js';
        s.onload = () =>
          window.Donate && window.Donate.open && window.Donate.open();
        document.head.appendChild(s);
      } else {
        window.Donate.open();
      }
    },

    share() {
      const data = { title: 'MOYAMOVA', url: location.href };
      try {
        if (navigator.share) navigator.share(data);
        else {
          navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText(location.href);
        }
      } catch(_) {}
      try { closeMenu(); } catch (_) {}
    },

    // ✅ ИСПРАВЛЕНИЕ: добавлен обработчик юридических страниц
    legal() {
      try {
        // js/legal.js подключён как module и выставляет window.Legal
        if (window.Legal && typeof window.Legal.open === 'function') {
          window.Legal.open('terms'); // стартуем с "Условия"
        } else {
          console.warn('Legal module not ready (window.Legal отсутствует)');
          alert('Юридические страницы ещё не готовы. Обновите страницу.');
        }
      } catch (e) {
        console.warn('legal open error', e);
      }
      try { closeMenu(); } catch (_) {}
    },

    contact() {
      location.href = 'mailto:peiko.oleh@gmail.com';
      try { closeMenu(); } catch (_) {}
    }
  };

  // Делегирование кликов внутри панели (меню + быстрые кнопки)
  if (ocPanel) {
    ocPanel.addEventListener('click', function(e){
      const btn = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (!action) return;
      if (actionsMap[action]) actionsMap[action]();
    });
  }

  // На всякий случай: быстрые кнопки снизу тоже напрямую (если структура изменится)
  document
    .querySelectorAll('.actions-row-bottom .action-btn')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.action;
        (actionsMap[act] || function () {})();
      });
    });

})();
