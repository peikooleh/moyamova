/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: app.shell.logic.js
 * Назначение: Логика оболочки приложения и переходов между экранами
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function () {
  'use strict';


  // TWA mode flag (set via start_url like /?twa=1)
  const IS_TWA = /(?:\?|&)twa=1(?:&|$)/.test(window.location.search);

  /**
   * Best-effort opener for external links across Browser / PWA / TWA.
   *
   * Rationale:
   * - Some Android WebView/TWA environments dispatch deep links (and invite links)
   *   more reliably when we attempt to open a new browsing context first.
   * - If popups are blocked or the context cannot be created, we fall back to a
   *   direct navigation.
   */
  function openExternalUrl(url) {
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) window.location.href = url;
    } catch (e) {
      window.location.href = url;
    }
  }

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

  // Клик по бургеру
  if (burger){
    burger.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
    }, { passive:false });
  }

  // Закрытие меню по кнопкам с data-close
  document.addEventListener('click', (e) => {
    const t = e.target;
    const closeAttr = t.getAttribute && t.getAttribute('data-close');
    if (closeAttr){
      e.preventDefault();
      closeMenu();
    }
  });
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Свайп вправо — закрыть меню
  (function(){
    let startX = null;
    if (!ocPanel) return;
    ocPanel.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
    ocPanel.addEventListener('touchend', (e)=>{
      if (startX == null) return;
      const endX = (e.changedTouches[0]||{}).clientX || 0;
      if (endX - startX > 30) closeMenu();
      startX = null;
    });
  })();

  // Edge-свайп от правого края — открыть меню
  (function(){
    let startX = null, startedAtEdge = false;
    const EDGE = 16;
    document.addEventListener('touchstart', (e)=>{
      if (document.body.classList.contains('menu-open')) return;
      startX = e.touches[0].clientX;
      const vw = window.innerWidth;
      startedAtEdge = (vw - startX) <= EDGE;
    }, {passive:true});
    document.addEventListener('touchend', (e)=>{
      if (!startedAtEdge) return;
      const endX = (e.changedTouches[0]||{}).clientX || 0;
      if (startX - endX > 30) openMenu();
      startedAtEdge = false;
      startX = null;
    }, {passive:true});
  })();

  // Навигация футера — SPA-роутинг через App.Router
  document.querySelectorAll('.app-footer .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-action');

      // Переключаем активную кнопку
      document.querySelectorAll('.app-footer .nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      try {
        if (window.App && App.Router && typeof App.Router.routeTo === 'function') {
          App.Router.routeTo(act);
        } else if (act === 'home') {
          // Запасной вариант, если роутер ещё не инициализирован
          if (window.App && App.Home && typeof App.Home.mount === 'function') {
            App.Home.mount();
          } else {
            location.assign('./');
          }
        }
      } catch(e){
        console.warn('nav error', e);
      }
    });
  });

  // 100vh fix + portrait-only guard for mobile phones.
  // Applies both to normal mobile browsers and installed PWA/TWA.
  // Desktop/tablet-sized layouts remain allowed in landscape.
  (function(){
    const standalonePwa = !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true);
    function setVhUnit(){
      // In an installed iOS PWA, innerHeight can pass through transient values
      // while the native window opens. Modern mobile CSS already uses dvh/svh,
      // so avoid rewriting the legacy --vh bridge during that presentation.
      if (standalonePwa) {
        document.documentElement.style.removeProperty('--vh');
        return;
      }
      document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    }

    const mqLandscape = window.matchMedia('(orientation: landscape)');

    function isMobilePhoneLayout(){
      try {
        const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const shortSide = Math.min(window.innerWidth || 9999, window.innerHeight || 9999);
        const mobileUa = /Android|iPhone|iPod|Mobile/i.test(String(navigator.userAgent || ''));

        // Keep desktop and large/tablet layouts untouched. A real phone may report
        // pointer:coarse or a mobile UA; short-side threshold keeps the guard scoped
        // to the same <900px mobile layout used by the application.
        return shortSide < 900 && (coarse || mobileUa);
      } catch(_) {
        return false;
      }
    }

    function applyOrientation(){
      const shouldLock = isMobilePhoneLayout() && mqLandscape.matches;
      document.body.classList.toggle('landscape', shouldLock);
      const app = document.getElementById('app');
      if (app) app.setAttribute('aria-hidden', shouldLock ? 'true' : 'false');
      try {
        if (shouldLock && window.App && App.applyI18nTitles) {
          App.applyI18nTitles(document.querySelector('.rotate-lock'));
        }
      } catch (_) {}
    }

    try { mqLandscape.addEventListener('change', applyOrientation); }
    catch(_) { mqLandscape.addListener && mqLandscape.addListener(applyOrientation); }

    window.addEventListener('resize', function(){
      setVhUnit();
      applyOrientation();
    });

    window.addEventListener('orientationchange', function(){
      setVhUnit();
      applyOrientation();
    });

    setVhUnit();
    applyOrientation();
  })();

  // Тема / язык / сложность (локальные data-* для CSS)
  const themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    themeToggle.addEventListener('change', e=>{
      document.documentElement.dataset.theme = e.target.checked ? 'dark' : 'light';
    });
  }
  const langToggle = document.getElementById('langToggle');
  if(langToggle){
    langToggle.addEventListener('change', e=>{
      document.documentElement.dataset.lang = e.target.checked ? 'uk' : 'ru';
    });
  }
  const levelToggle = document.getElementById('levelToggle');
  if(levelToggle){
    // Difficulty is committed by the canonical handler in home.js only after
    // any required confirmation succeeds. Do not mirror the checkbox into
    // <html data-level> here: on Cancel that would leave the visual mode
    // indicator out of sync with the actually saved setting.
  }

  // ------------------------------------------------------------
  // PWA/TWA: компактные настройки в бургер-меню
  // ------------------------------------------------------------
  // Эти элементы добавляются в DOM только в standalone режиме.
  // В браузере они отсутствуют и логика не активируется.
  (function initPwaMenuPrefs(){
    const elFocusSets    = document.getElementById('focusSets');
    const elFocusContext = document.getElementById('focusContext');
    const elTrainReverse = document.getElementById('trainReverse');
    const elTrainAutostep= document.getElementById('trainAutostep');
    const elAnswerSounds = document.getElementById('answerSoundsToggle');
    const elTtsOff      = document.getElementById('ttsOff');
    const elTtsWords    = document.getElementById('ttsWords');
    const elTtsExamples = document.getElementById('ttsExamples');

    // Ничего не делаем, если секция не отрисована.
    if (!elFocusSets && !elFocusContext && !elTrainReverse && !elTrainAutostep && !elAnswerSounds) return;

    const LS = {
      focusSets: 'mm.focus.hideSets',
      focusContext: 'mm.focus.hideContext',
      trainReverse: 'mm.train.reverse',
      trainAutostep: 'mm.train.autostep',
      ttsWords: 'mm.tts.words',
      ttsExamples: 'mm.tts.examples',
      ttsLegacy: 'mm.audioEnabled.v2',
      answerSounds: 'mm.answerSounds.enabled'
    };

    function readBool(key, fallback){
      try {
        const v = window.localStorage.getItem(key);
        if (v === null || v === undefined || v === '') return (fallback===null? null : !!fallback);
        return v === '1' || v === 'true';
      } catch(_) {
        return (fallback===null? null : !!fallback);
      }
    }
    function writeBool(key, val){
      try { window.localStorage.setItem(key, val ? '1' : '0'); } catch(_) {}
    }

    // Инициализация (дефолт: блоки "Сеты" и "Контекст" видимы).
    // Важно: чекбоксы отражают состояние "ПОКАЗЫВАТЬ" (checked = показывать),
    // а в localStorage храним hide-флаги для обратной совместимости.
    const sHideSets    = readBool(LS.focusSets, false);
    const sHideContext = readBool(LS.focusContext, false);
    const sReverse     = readBool(LS.trainReverse, false);
    const sAutostep    = readBool(LS.trainAutostep, true);
    const sAnswerSounds = readBool(LS.answerSounds, true);

    // TTS pills (default: OFF/OFF).
    // Legacy migration: if mm.audioEnabled.v2 == 1 → words=ON, examples=OFF
    let ttsWords = readBool(LS.ttsWords, null);
    let ttsExamples = readBool(LS.ttsExamples, null);
    let legacy = null;
    try { legacy = window.localStorage.getItem(LS.ttsLegacy); } catch(_) { legacy = null; }
    if (ttsWords === null || ttsExamples === null) {
      if (legacy === '1') { ttsWords = true; ttsExamples = false; }
      else {
        if (ttsWords === null) ttsWords = false;
        if (ttsExamples === null) ttsExamples = false;
      }
      writeBool(LS.ttsWords, !!ttsWords);
      writeBool(LS.ttsExamples, !!ttsExamples);
    }


    // UI семантика: checked = показывать (hide = !checked)
    if (elFocusSets)    elFocusSets.checked    = !sHideSets;
    if (elFocusContext) elFocusContext.checked = !sHideContext;
    if (elTrainReverse) elTrainReverse.checked = sReverse;
    if (elTrainAutostep)elTrainAutostep.checked= sAutostep;
    if (elAnswerSounds) elAnswerSounds.checked = sAnswerSounds;

    function applyTtsUi(){
      const any = !!ttsWords || !!ttsExamples;
      if (elTtsOff) {
        elTtsOff.classList.toggle('is-active', !any);
        elTtsOff.setAttribute('aria-pressed', (!any).toString());
      }
      if (elTtsWords) {
        elTtsWords.classList.toggle('is-active', !!ttsWords);
        elTtsWords.setAttribute('aria-pressed', (!!ttsWords).toString());
      }
      if (elTtsExamples) {
        elTtsExamples.classList.toggle('is-active', !!ttsExamples);
        elTtsExamples.setAttribute('aria-pressed', (!!ttsExamples).toString());
      }
      try { if (window.App && App.AudioTTS && typeof App.AudioTTS.refreshIndicators==='function') App.AudioTTS.refreshIndicators();
            else if (window.App && App.AudioTTS && typeof App.AudioTTS.refresh==='function') App.AudioTTS.refresh(); } catch(_) {}
    }

    applyTtsUi();

    document.body.classList.toggle('mm-focus-hide-sets', sHideSets);
    document.body.classList.toggle('mm-focus-hide-context', sHideContext);

    // Реакция на изменения
    if (elFocusSets) {
      elFocusSets.addEventListener('change', (e)=>{
        const show = !!e.target.checked;
        const hide = !show;
        writeBool(LS.focusSets, hide);
        document.body.classList.toggle('mm-focus-hide-sets', hide);
      });
    }
    if (elFocusContext) {
      elFocusContext.addEventListener('change', (e)=>{
        const show = !!e.target.checked;
        const hide = !show;
        writeBool(LS.focusContext, hide);
        document.body.classList.toggle('mm-focus-hide-context', hide);
      });
    }
    if (elTrainReverse) {
      elTrainReverse.addEventListener('change', (e)=>{
        writeBool(LS.trainReverse, !!e.target.checked);
      });
    }
    if (elTrainAutostep) {
      elTrainAutostep.addEventListener('change', (e)=>{
        writeBool(LS.trainAutostep, !!e.target.checked);
      });
    }
    if (elAnswerSounds) {
      elAnswerSounds.addEventListener('change', (e)=>{
        writeBool(LS.answerSounds, !!e.target.checked);
      });
    }

    function setTts(words, examples){
      ttsWords = !!words;
      ttsExamples = !!examples;
      writeBool(LS.ttsWords, ttsWords);
      writeBool(LS.ttsExamples, ttsExamples);
      applyTtsUi();
    }

    if (elTtsOff) elTtsOff.addEventListener('click', function(e){ e.preventDefault(); setTts(false,false); });
    if (elTtsWords) elTtsWords.addEventListener('click', function(e){ e.preventDefault(); setTts(!ttsWords, ttsExamples); });
    if (elTtsExamples) elTtsExamples.addEventListener('click', function(e){ e.preventDefault(); setTts(ttsWords, !ttsExamples); });
  })();

  
  // Поддержка проекта — обычное добровольное пожертвование; paywall отсутствует.

// Версия приложения (app.core.js → App.APP_VER)
  (function(){
    function renderVersion(){
      var el = document.getElementById('appVersion');
      if (el) {
        var v = (window.App && App.APP_VER) || null;
        if (v) el.textContent = v;
      }
    }
    if (!(window.App && App.APP_VER)) {
      var s = document.createElement('script');
      s.src = './js/app.core.js';
      s.onload = renderVersion;
      s.onerror = function(){};
      document.head.appendChild(s);
    } else {
      renderVersion();
    }
  })();

  
  // Hidden dictionaries toggle (7 taps on app version):
  // OFF -> SR -> LP -> SR+LP -> OFF
  (function(){
    function getFlag(name){ try { return localStorage.getItem(name) === '1'; } catch(_) { return false; } }
    function setFlag(name,val){ try { localStorage.setItem(name, val ? '1' : '0'); } catch(_) {} }

    function nextState(){
      var sr = getFlag('mm_sr');
      var lp = getFlag('mm_lp');
      // OFF -> SR
      if (!sr && !lp) { setFlag('mm_sr', true);  setFlag('mm_lp', false); return; }
      // SR -> LP
      if (sr && !lp)  { setFlag('mm_sr', false); setFlag('mm_lp', true);  return; }
      // LP -> SR+LP
      if (!sr && lp)  { setFlag('mm_sr', true);  setFlag('mm_lp', true);  return; }
      // SR+LP -> OFF
      setFlag('mm_sr', false); setFlag('mm_lp', false);
    }

    var taps = 0;
    var lastTs = 0;
    var RESET_MS = 2000;

    function onTap(){
      var now = Date.now();
      if (now - lastTs > RESET_MS) taps = 0;
      lastTs = now;
      taps++;
      if (taps >= 7){
        taps = 0;
        nextState();
        try { location.reload(); } catch(_) {}
      }
    }

    // Use event delegation because burger menu is re-rendered and DOM nodes are recreated.
    function onDocClick(e){
      try {
        // Only inside opened burger panel
        var panel = e.target && e.target.closest ? e.target.closest('.oc-panel') : null;
        if (!panel) return;

        var target = e.target.closest('.menu-item.app-version, #appVersion');
        if (!target) return;
        onTap();
      } catch(_) {}
    }

    document.addEventListener('click', onDocClick, false);
  })();

  const actionsMap = {
    guide() {
      // Экран "Инструкция" реализован в js/view.guide.js (объект Guide)
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
      // закрываем меню так же, как для остальных действий
      try { closeMenu(); } catch (_) {}
    },

    donate() {
      if (IS_TWA) return;
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
      if (navigator.share) {
        navigator.share(data).catch(() => {});
      } else {
        try {
          navigator.clipboard.writeText(location.href);
          alert('Ссылка скопирована');
        } catch {
          prompt('Скопируйте ссылку:', location.href);
        }
      }
    },

    legal() {
      // js/legal.js уже подключён как module и создаёт window.Legal
      try {
        if (window.Legal && typeof window.Legal.open === 'function') {
          window.Legal.open('terms');
        } else {
          console.warn('Legal module not ready');
        }
      } catch (e) {
        console.warn('legal open error', e);
      }
    },

    contact() {
      // Viber community invite (preferred over email for fast feedback)
      openExternalUrl(
        'https://invite.viber.com/?g2=AQAitGq4muZQCVW44K1Z4aR%2FP9VDM2%2Bso14cyg3Ec1e7mt%2BTaLbs5S1UdHZCU%2Fy5'
      );
    }
  };

  // навешивание обработчиков на кнопки
  document
    .querySelectorAll('.actions-row-bottom .action-btn')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.action;
        (actionsMap[act] || function () {})();
        // для guide меню мы уже закрыли внутри, остальные закрываем здесь
        if (act !== 'guide') {
          try {
            closeMenu();
          } catch (_) {}
        }
      });
    });

  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js')
        .then(function() {
          // Полный офлайн-кэш догреваем только ПОСЛЕ первого отображения страницы.
          // Это убирает конкуренцию install-cache с CSS/JS на холодном старте.
          setTimeout(function() {
            navigator.serviceWorker.ready.then(function(reg) {
              var worker = navigator.serviceWorker.controller || reg.active;
              if (worker) worker.postMessage({ type: 'WARM_OFFLINE_CACHE' });
            }).catch(function() {});
          }, 3000);
        })
        .catch(console.warn);
    });
  }
})();
/* ========================= Конец файла: app.shell.logic.js ========================= */
