/* ==========================================================
 * MOYAMOVA — ui.scroll.guard.js
 * iOS PWA/TWA: блокировка rubber-band overscroll ("белая полоса")
 * при сохранении прокрутки только внутри разрешённых скролл-контейнеров.
 * ========================================================== */

(function(){
  'use strict';

  var CFG = {
    allowSelectors: [
      '[data-scroll-allow="1"]',
      '.dicts-scroll',
      '.oc-body',
      '.legal-modal-body',
      '.setup-modal-body',
      '.mm-modal-body',
      '.page-scroll',
      '.guide-scroll',
      '.donate-scroll'
    ].join(','),
    deltaThresholdPx: 2,
    edgeEpsilon: 1
  };

  function isIOS(){
    // iPadOS may spoof Mac; we keep your current scope (iPhone focus)
    // and also handle iPadOS "MacIntel" + touch.
    var ua = navigator.userAgent || '';
    var isiDevice = /iP(hone|od|ad)/.test(ua);
    var isIpadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isiDevice || isIpadOS;
  }

  function isStandalone(){
    try {
      var dm = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      var ns = (navigator.standalone === true);
      var rm = '';
      try { rm = (document.documentElement && (document.documentElement.getAttribute('data-runmode') || '')) || ''; } catch(_){ rm=''; }
      rm = String(rm || '').toLowerCase();
      var rmOk = (rm === 'pwa' || rm === 'twa' || rm === 'standalone' || rm === 'app');
      return dm || ns || rmOk;
    } catch(e){
      return false;
    }
  }

  function shouldEnable(){
    if (!isIOS()) return false;
    if (!isStandalone()) return false;
    // touch capable
    if (!('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return false;
    return true;
  }

  function hasScrollableOverflow(el){
    if (!el || el === document || el === document.documentElement || el === document.body) return false;
    var cs;
    try { cs = window.getComputedStyle(el); } catch(e){ cs = null; }
    if (!cs) return false;
    var oy = (cs.overflowY || cs.overflow || '');
    // treat "overlay" as scroll as well (legacy)
    return (oy === 'auto' || oy === 'scroll' || oy === 'overlay');
  }

  /**
   * Determine which element should be treated as the active scroll container.
   * Priority:
   *  1) explicitly allowed containers (data-scroll-allow or known classes)
   *  2) nearest ancestor that is actually scrollable (overflow-y auto/scroll + scrollHeight>clientHeight)
   */
  function getActiveScroller(startEl){
    if (!startEl) return null;

    // 1) explicit allow list
    try {
      if (startEl.closest) {
        var hit = startEl.closest(CFG.allowSelectors);
        if (hit) return hit;
      }
    } catch(_){ }

    // 2) dynamic scrollable ancestor discovery
    var el = startEl;
    while (el && el !== document.documentElement && el !== document.body) {
      if (hasScrollableOverflow(el) && (el.scrollHeight - el.clientHeight) > 1) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function getMaxTop(el){
    return Math.max(0, (el.scrollHeight - el.clientHeight));
  }

  function isScrollable(el){
    return !!el && getMaxTop(el) > 0;
  }

  function nudgeFromEdges(el){
    if (!el) return;
    if (!isScrollable(el)) return;
    var maxTop = getMaxTop(el);
    if (el.scrollTop <= 0) {
      el.scrollTop = CFG.edgeEpsilon;
    } else if (el.scrollTop >= maxTop) {
      el.scrollTop = Math.max(0, maxTop - CFG.edgeEpsilon);
    }
  }

  function canScrollInDirection(el, deltaY){
    if (!el) return false;
    var maxTop = getMaxTop(el);
    if (maxTop <= 0) return false;

    var top = el.scrollTop;

    // deltaY > 0: палец вниз => контент вверх => top должен убывать => нужен top>0
    if (deltaY > 0) return top > 0;
    // deltaY < 0: палец вверх => контент вниз => top должен расти => нужен top<max
    if (deltaY < 0) return top < maxTop;
    return false;
  }

  var touchStartY = 0;
  var touchActive = false;
  var activeScroller = null;

  function onTouchStart(e){
    if (!e || !e.touches || e.touches.length !== 1) {
      touchActive = false;
      activeScroller = null;
      return;
    }
    touchActive = true;
    touchStartY = e.touches[0].clientY;
    activeScroller = getActiveScroller(e.target);

    // Nudge early to avoid iOS entering overscroll mode at edges.
    if (activeScroller) {
      nudgeFromEdges(activeScroller);
    }
  }

  function onTouchMove(e){
    if (!touchActive) return;
    if (!e || !e.touches || e.touches.length !== 1) return;

    var y = e.touches[0].clientY;
    var deltaY = y - touchStartY;
    if (Math.abs(deltaY) < CFG.deltaThresholdPx) return;

    var scroller = activeScroller || getActiveScroller(e.target);

    // Вне разрешённых зон — блокируем всегда.
    if (!scroller) {
      e.preventDefault();
      return;
    }

    // Если скролл невозможен — блокируем, чтобы не было bounce.
    if (!isScrollable(scroller)) {
      e.preventDefault();
      return;
    }

    // На границах — блокируем, чтобы не было rubber-band.
    if (!canScrollInDirection(scroller, deltaY)) {
      e.preventDefault();
      return;
    }

    // Иначе — даём нативно скроллить внутри scroller.
  }

  function onTouchEnd(){
    touchActive = false;
    activeScroller = null;
  }

  function init(){
    if (!shouldEnable()) return;

    // capture=true важно, чтобы попасть до нативного старта скролла.
    document.addEventListener('touchstart', onTouchStart, { passive: true,  capture: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true,  capture: true });
    document.addEventListener('touchcancel',onTouchEnd,   { passive: true,  capture: true });

    // Маркер для быстрого самопроверочного CSS (не виден пользователю).
    try { document.documentElement.setAttribute('data-scroll-guard', 'on'); } catch(_){ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MMScrollGuard = {
    init: init,
    cfg: CFG
  };
})();
