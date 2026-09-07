/* MOYAMOVA 1.11.4 — Mobile Home navigation sheet.
 * Reuses the existing off-canvas menu controls/handlers, but on migrated Home
 * presents them as a bottom sheet and adds primary SPA navigation.
 */
(function () {
  'use strict';

  const mq = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  const docEl = document.documentElement;

  function isMobile() {
    return !!(mq && mq.matches);
  }

  function lang() {
    try {
      const v = String((window.App && App.settings && (App.settings.uiLang || App.settings.lang)) || document.documentElement.lang || 'ru').toLowerCase();
      return v.startsWith('uk') ? 'uk' : 'ru';
    } catch (_) {
      return 'ru';
    }
  }

  function currentMobileShell() {
    const app = document.getElementById('app');
    if (!app || !isMobile()) return '';
    if (app.querySelector('.dashboard')) return 'home';
    if (app.querySelector('.home--favorites')) return 'favorites';
    if (app.querySelector('.home--mistakes')) return 'mistakes';
    if (app.querySelector('.home--dicts')) return 'dicts';
    if (app.querySelector('.stats-card')) return 'stats';
    if (app.querySelector('.home-trainer.is-articles')) return 'articles';
    if (app.querySelector('.home-trainer.home-trainer--preps')) return 'prepositions';
    if (app.querySelector('.home.home--word-trainer')) return 'trainer';
    return '';
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    const root = document.querySelector('.oc-root');
    if (root) root.setAttribute('aria-hidden', 'true');
  }

  function routeTo(action) {
    closeMenu();
    try {
      if (window.App && App.Router && typeof App.Router.routeTo === 'function') {
        App.Router.routeTo(action);
      }
    } catch (_) {}
  }

  function labels() {
    return lang() === 'uk' ? {
      title:'Меню',
      open:'Відкрити меню',
      home:['Головна','Огляд навчання'],
      dicts:['Словники','Вибір матеріалу'],
      fav:['Обране','Збережені слова'],
      mistakes:['Помилки','Повторити складне'],
      stats:['Статистика','Ваш прогрес'],
      guide:['Інструкція','Як усе працює']
    } : {
      title:'Меню',
      open:'Открыть меню',
      home:['Главная','Обзор обучения'],
      dicts:['Словари','Выбор материала'],
      fav:['Избранное','Сохранённые слова'],
      mistakes:['Ошибки','Повторить сложное'],
      stats:['Статистика','Ваш прогресс'],
      guide:['Инструкция','Как всё работает']
    };
  }

  function ensureNavSheet() {
    const body = document.querySelector('.oc-body');
    if (!body) return;
    let sheet = body.querySelector('.mobile-nav-sheet');
    if (!sheet) {
      sheet = document.createElement('nav');
      sheet.className = 'mobile-nav-sheet';
      sheet.setAttribute('aria-label', 'Mobile navigation');
      body.insertBefore(sheet, body.firstChild);
    }

    const T = labels();
    const items = [
      ['home','⌂',T.home],
      ['dicts','▤',T.dicts],
      ['fav','♡',T.fav],
      ['mistakes','△',T.mistakes],
      ['stats','▥',T.stats],
      ['guide','?',T.guide]
    ];

    sheet.innerHTML = items.map(function (x) {
      return '<button type="button" class="mobile-nav-sheet__item" data-mobile-route="' + x[0] + '">' +
        '<span class="mobile-nav-sheet__icon" aria-hidden="true">' + x[1] + '</span>' +
        '<span class="mobile-nav-sheet__copy"><strong>' + x[2][0] + '</strong><small>' + x[2][1] + '</small></span>' +
      '</button>';
    }).join('');

    const title = document.querySelector('.oc-title');
    if (title) title.textContent = T.title;

    const button = document.getElementById('btnMenu');
    if (button && ['home','trainer','articles','prepositions','dicts','favorites','mistakes','stats'].includes(docEl.dataset.mobileShell || '')) {
      button.setAttribute('aria-label', T.open);
      button.setAttribute('title', T.open);
    }
  }

  function syncShell() {
    if (window.__MOYAMOVA_SETUP_PENDING__ === true || document.documentElement.classList.contains('setup-pending')) return;
    const shell = currentMobileShell();
    if (shell) {
      docEl.dataset.mobileShell = shell;
      ensureNavSheet();
    } else if (docEl.dataset.mobileShell) {
      delete docEl.dataset.mobileShell;
      closeMenu();
    }
  }

  // Route buttons are new; all existing settings/tools inside .oc-body keep
  // their authoritative legacy handlers untouched.
  document.addEventListener('click', function (e) {
    const btn = e.target && e.target.closest ? e.target.closest('[data-mobile-route]') : null;
    if (!btn || !isMobile() || !['home','trainer','articles','prepositions','dicts','favorites','mistakes','stats'].includes(docEl.dataset.mobileShell || '')) return;
    e.preventDefault();
    routeTo(btn.getAttribute('data-mobile-route'));
  });

  const app = document.getElementById('app');
  let shellRaf1 = 0, shellRaf2 = 0;
  function scheduleShellSync() {
    if (shellRaf1) cancelAnimationFrame(shellRaf1);
    if (shellRaf2) cancelAnimationFrame(shellRaf2);
    shellRaf1 = requestAnimationFrame(function () {
      shellRaf1 = 0;
      shellRaf2 = requestAnimationFrame(function () {
        shellRaf2 = 0;
        syncShell();
      });
    });
  }
  if (app && window.MutationObserver) {
    new MutationObserver(scheduleShellSync).observe(app, { childList:true, subtree:false });
  }

  if (mq) {
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', syncShell);
    else if (typeof mq.addListener === 'function') mq.addListener(syncShell);
  }

  document.addEventListener('DOMContentLoaded', syncShell);
  window.addEventListener('pageshow', scheduleShellSync);
  // Do not resync the shell on every viewport resize. iOS standalone PWAs
  // emit transient resize events while presenting the app window; routes and
  // DOM mutations already provide the authoritative shell sync points.
  window.MOYAMOVA_MobileNav = { sync: syncShell, ensure: ensureNavSheet, close: closeMenu };
  setTimeout(syncShell, 0);
})();
