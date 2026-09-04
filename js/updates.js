/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: updates.js
 * Назначение: Логика миграции/обновления данных между версиями + обновление PWA
 * Версия: 1.1
 * Обновлено: 2025-12-01
 * ========================================================== */

(function(){
  'use strict';

  // ---- Language detection (dynamic) ----
  function resolveLang(){
    var l = (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.lang) || '';
    l = (l || '').toLowerCase();
    try {
      if (!l && window.App) {
        if (typeof App.getUiLang === 'function') l = (App.getUiLang() || '').toLowerCase();
        else if (App.UI_LANG) l = ('' + App.UI_LANG).toLowerCase();
        else if (App.uiLang) l = ('' + App.uiLang).toLowerCase();
      }
    } catch(_){}
    try {
      if (!l) l = (localStorage.getItem('ui_lang') || localStorage.getItem('uiLang') || '').toLowerCase();
    } catch(_){}
    if (!l) l = ((navigator.language || 'ru').slice(0, 2) || 'ru').toLowerCase();
    if (l === 'ua') l = 'uk';
    if (!/^(ru|uk|en)$/.test(l)) l = 'en';
    return l;
  }

  function dict(lang){
    var T = {
      ru: {
        checking: 'Проверяю обновления…',
        found: 'Найдена новая версия, обновляю…',
        upToDate: 'У тебя уже последняя версия',
        reloading: 'Перезапускаю…'
      },
      uk: {
        checking: 'Перевіряю оновлення…',
        found: 'Знайдено нову версію, оновлюю…',
        upToDate: 'У тебе вже актуальна версія',
        reloading: 'Перезапускаю…'
      },
      en: {
        checking: 'Checking for updates…',
        found: 'New version found, updating…',
        upToDate: 'You’re already on the latest version',
        reloading: 'Reloading…'
      }
    };
    return T[lang] || T.en;
  }

  function t(k){ return dict(resolveLang())[k] || k; }

  // ---- UI (single toast + overlay) ----
  var styleTag, toastRoot, toastEl, overlayEl, hideTimer;

  function ensureUI(){
    // Visual styles live in css/ui.toast.css.
    // Keep this compatibility placeholder so old runtimes can still call ensureUI safely.
    if (!styleTag){
      styleTag = true;
    }
    if (!toastRoot){
      toastRoot = document.createElement('div');
      toastRoot.className = 'toast-root';
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastRoot.appendChild(toastEl);
      document.body.appendChild(toastRoot);
    }
  }

  function setToast(text, showMs, type){
    ensureUI();
    if (hideTimer){ clearTimeout(hideTimer); hideTimer = null; }
    toastEl.textContent = text;
    toastEl.setAttribute('data-toast-type', type || 'info');
    // reveal
    requestAnimationFrame(function(){ toastEl.classList.add('show'); });
    if (showMs){
      hideTimer = setTimeout(hideToast, showMs);
    }
  }

  function hideToast(){
    if (!toastEl) return;
    toastEl.classList.remove('show');
  }

  function showOverlay(show){
    ensureUI();
    if (show && !overlayEl){
      overlayEl = document.createElement('div');
      overlayEl.className = 'update-scrim';
      document.body.appendChild(overlayEl);
      requestAnimationFrame(function(){ overlayEl.classList.add('show'); });
    } else if (!show && overlayEl){
      overlayEl.classList.remove('show');
      setTimeout(function(){
        if (overlayEl){
          overlayEl.remove();
          overlayEl = null;
        }
      }, 200);
    }
  }

  // ---- Helpers ----
  function waitForControllerChange(timeoutMs){
    return new Promise(function(resolve){
      var settled = false;
      function finish(reason){
        if (settled) return;
        settled = true;
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve(reason);
      }
      function onChange(){ finish('changed'); }

      navigator.serviceWorker.addEventListener('controllerchange', onChange);
      setTimeout(function(){ finish('timeout'); }, timeoutMs || 8000);
    });
  }

  async function activateAndReload(reg){
    setToast(t('found'), null, 'info');
    showOverlay(true);
    try {
      sessionStorage.setItem('moya_upgrading', '1');
    } catch(_){}
    if (reg.waiting){
      try {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch(_){}
    }
    // Ждём либо controllerchange, либо таймаут
    await waitForControllerChange(8000);
    setToast(t('reloading'), null, 'info');
    setTimeout(function(){ location.reload(); }, 200);
  }

  // ---- Update flow (single in-flight) ----
  var inFlight = false;

  async function checkForUpdates() {
    if (inFlight) return;
    inFlight = true;
    setToast(t('checking'), null, 'info'); // no auto-hide yet
    try{
      if (!('serviceWorker' in navigator)) { location.reload(); return; }
      var reg = await navigator.serviceWorker.getRegistration();
      if (!reg) { location.reload(); return; }

      try {
        await reg.update();
      } catch(_){}

      // Уже есть готовый новый SW
      if (reg.waiting) {
        await activateAndReload(reg);
        return;
      }

      // Если SW ещё устанавливается — ждём, пока появится waiting
      if (reg.installing) {
        await new Promise(function(res){
          reg.installing.addEventListener('statechange', function onsc(){
            if (reg.waiting){
              try { reg.installing.removeEventListener('statechange', onsc); } catch(_){}
              res();
            }
          });
        });
        if (reg.waiting){
          await activateAndReload(reg);
          return;
        }
      }

      // Обновлений нет
      setToast(t('upToDate'), 1400, 'success');
      setTimeout(hideToast, 1400);
    } finally {
      // Hide overlay if was shown (safety)
      showOverlay(false);
      inFlight = false;
    }
  }

  // ---- Bind once ----
  var btn = document.getElementById('btnCheckUpdates');
  if (btn && !btn.dataset.updatesBound){
    btn.dataset.updatesBound = '1';
    btn.addEventListener('click', function(){
      if (inFlight) return;
      var prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('checking');
      checkForUpdates().finally(function(){
        btn.disabled = false;
        setTimeout(function(){ btn.textContent = prev; }, 500);
      });
    }, { passive: true });
  }

  // Observe language changes (toasts pick up new lang automatically via t())
  try{
    var mo = new MutationObserver(function(){ /* no-op, мы каждый раз читаем язык через resolveLang() */ });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  }catch(_){}

  // Expose API
  window.MoyaUpdates = { check: checkForUpdates, setToast: setToast, hideToast: hideToast };
})();
/* ========================= Конец файла: updates.js ========================= */
