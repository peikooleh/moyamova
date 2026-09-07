/* ==========================================================
 * MOYAMOVA 1.11.0 — Mobile viewport bridge
 * Reads VisualViewport only on <900px screens and exposes stable CSS vars.
 * No desktop layout/style changes.
 * ========================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const mq = window.matchMedia('(max-width: 899px)');
  let raf = 0;
  const standalone = !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true);

  function clearMobileVars() {
    root.removeAttribute('data-mobile-viewport');
    root.style.removeProperty('--mobile-vv-height');
    root.style.removeProperty('--mobile-vv-width');
    root.style.removeProperty('--mobile-vv-offset-top');
    root.style.removeProperty('--mobile-vv-offset-left');
    root.style.removeProperty('--mobile-keyboard-inset');
  }

  function writeMobileVars() {
    raf = 0;
    if (!mq.matches) {
      clearMobileVars();
      return;
    }

    // Installed iOS PWAs animate VisualViewport geometry while their native
    // window is being presented. Feeding those transient values into the root
    // layout makes the whole app appear to shrink/slide. In standalone mode
    // keep CSS on its stable dvh/svh foundation instead.
    if (standalone) {
      clearMobileVars();
      return;
    }

    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const width = vv ? vv.width : window.innerWidth;
    const top = vv ? vv.offsetTop : 0;
    const left = vv ? vv.offsetLeft : 0;
    const layoutHeight = window.innerHeight || height;
    const keyboardInset = Math.max(0, layoutHeight - height - top);

    root.setAttribute('data-mobile-viewport', '1');
    root.style.setProperty('--mobile-vv-height', height + 'px');
    root.style.setProperty('--mobile-vv-width', width + 'px');
    root.style.setProperty('--mobile-vv-offset-top', top + 'px');
    root.style.setProperty('--mobile-vv-offset-left', left + 'px');
    root.style.setProperty('--mobile-keyboard-inset', keyboardInset + 'px');
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(writeMobileVars);
  }

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  if (window.visualViewport && !standalone) {
    window.visualViewport.addEventListener('resize', schedule, { passive: true });
    // Do not write root CSS variables on every VisualViewport scroll frame.
    // iOS Safari toolbar/keyboard geometry changes are covered by resize.
  }

  try { mq.addEventListener('change', schedule); }
  catch (_) { if (mq.addListener) mq.addListener(schedule); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
})();
