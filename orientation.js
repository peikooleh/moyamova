
/*! orientation.lock.js — portrait-only enforcement + proper i18n hooks */
(function () {
  const isIOS = /iP(hone|od|ad)/.test(navigator.platform) ||
                (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  const $ = (s, d=document) => d.querySelector(s);

  function ensureStyles() {
    if ($('#orientation-lock-style')) return;
    const css = `
      .orientation-overlay {
        position: fixed; inset: 0; background: #fff; color: #111;
        display: none; align-items: center; justify-content: center;
        text-align: center; z-index: 99999; padding: 24px;
      }
      .orientation-overlay .card {
        max-width: 520px; margin: 0 auto; font: 16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;
      }
      .orientation-overlay h2 { margin: 0 0 8px; font-size: 18px; font-weight: 650; }
      .orientation-overlay p { margin: 0; font-size: 14px; color: #444; }
      body.orientation-blocked { overflow: hidden; }
      @media (prefers-color-scheme: dark){
        .orientation-overlay { background: #0f1115; color:#eaeaea }
        .orientation-overlay p { color:#c7c7c7 }
      }
    `;
    const style = document.createElement('style');
    style.id = 'orientation-lock-style';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if ($('#orientationOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'orientationOverlay';
    overlay.className = 'orientation-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-live', 'polite');
    // Use data-i18n to let app's hydrateI18N update texts
    overlay.innerHTML = `
      <div class="card">
        <h2 id="orientTitle" data-i18n="rotateToPortraitTitle">Поверніть пристрій</h2>
        <p id="orientText" data-i18n="rotateToPortraitText">Доступний лише портретний режим. Будь ласка, використовуйте застосунок вертикально.</p>
      </div>`;
    document.body.appendChild(overlay);
    try { if (window.hydrateI18N) window.hydrateI18N(); } catch(_) {}
  }

  function showOverlay(show) {
    const el = $('#orientationOverlay');
    if (!el) return;
    el.style.display = show ? 'flex' : 'none';
    document.body.classList.toggle('orientation-blocked', !!show);
    // Re-hydrate texts if needed
    try { if (window.hydrateI18N) window.hydrateI18N(); } catch(_) {}
  }

  function isLandscape() {
    const mql = window.matchMedia && window.matchMedia('(orientation: landscape)');
    return (mql && mql.matches) || (window.innerWidth > window.innerHeight);
  }

  async function tryLock() {
    if (isIOS) return; // iOS won't allow locking
    const api = screen.orientation && screen.orientation.lock;
    if (!api) return;
    try { await screen.orientation.lock('portrait'); } catch (e) { /* ignore */ }
  }

  function update() {
    const land = isLandscape();
    showOverlay(land);
    if (!land) tryLock();
  }

  function wireI18N() {
    // Listen to the app's actual event and generic ones
    document.addEventListener('i18n:lang-changed', () => { try { window.hydrateI18N && window.hydrateI18N(); } catch(_) {} }, false);
    window.addEventListener('lexi:lang-changed', () => { try { window.hydrateI18N && window.hydrateI18N(); } catch(_) {} }, false);
    window.addEventListener('languagechange', () => { try { window.hydrateI18N && window.hydrateI18N(); } catch(_) {} }, false);
    // Observe changes to <html lang="..">
    const htmlEl = document.documentElement;
    const mo = new MutationObserver((muts)=>{
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'lang') {
          try { window.hydrateI18N && window.hydrateI18N(); } catch(_) {}
          break;
        }
      }
    });
    mo.observe(htmlEl, { attributes: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles();
    ensureOverlay();
    wireI18N();
    update();
  });
  window.addEventListener('orientationchange', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });

  const once = () => { tryLock(); document.removeEventListener('click', once); document.removeEventListener('touchend', once); };
  document.addEventListener('click', once, { once: true });
  document.addEventListener('touchend', once, { once: true });
})();
