/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: donate.js
 * Назначение: Логика приложения
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function (root) {
  const PAYPAL_BUTTON_ID = 'KFBR8BW5ZZTQ4';
  const URL_PAYPAL = `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_BUTTON_ID}`;

  let sheet, scroller, styleTag;
  let __backRoute = 'home';
  let __swX0=0, __swY0=0, __swMoved=false;

  function gaEvent(action, label){
    try { window.gtag && window.gtag('event', action, { event_category:'donate', event_label: label }); } catch(_){}
  }

  function __getCurrentRoute(){
    try { return (window.App && App.Router && App.Router.current) || document.body.getAttribute('data-route') || 'home'; }
    catch(_){ return 'home'; }
  }

  function __routeBack(){
    const t = __backRoute || 'home';
    try {
      if (window.Router && typeof Router.routeTo === 'function') Router.routeTo(t);
      else if (window.App && App.Router && typeof App.Router.routeTo === 'function') App.Router.routeTo(t);
    } catch(_){}
  }

  // 👉 роутинг на конкретный раздел (для кликов по футеру)
  function __routeTo(name){
    try {
      if (window.Router && typeof Router.routeTo === 'function') Router.routeTo(name);
      else if (window.App && App.Router && typeof App.Router.routeTo === 'function') App.Router.routeTo(name);
    } catch(_){}
  }

  // Глобальный перехват кликов по футеру:
  // если открыт лист доната — закрываем и переходим на выбранную страницу
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.app-footer .nav-btn');
    if (!btn) return;
    // если донат не открыт — ничего не делаем
    if (!sheet || sheet.style.display === 'none') return;

    const target = btn.getAttribute('data-action');
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();
    try { close(); } catch(_){}
    __routeTo(target);
  }, true); // capture: чтобы отработать раньше прочих обработчиков

  function ensureSheet(){
    if (sheet) return;

    const css = `
      .donate-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200;
        display:flex; flex-direction:column;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      .donate-top{
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 12px; border-bottom:1px solid #e5e7eb;
      }
      .donate-title{ font-weight:700; font-size:18px; }
    
      /* центральная часть листа */
      .donate-content{
        position:relative; flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch;
        padding:14px 12px 20px; color:#111;
        display:flex; flex-direction:column;
      }

      /* юр-сноска (вверху, спокойная) */
      .donate-note{
        flex:0 0 auto;
        border-bottom:1px solid #e5e7eb;
        padding:12px 10px;
        color:#555; line-height:1.5; font-size:13px; font-weight:500; opacity:.95;
        display:flex; align-items:center; justify-content:center; gap:8px;
        text-align:center; background:#fff;
        max-width:480px; margin:0 auto 14px;
      }
      .donate-note .emoji{ font-size:18px; line-height:1; }

      /* карточки донатов — мягкий фон секции, явная иерархия */
      .donate-section{
        background:#fafbfc;
        border-radius:12px;
        padding:16px;
        margin:16px 0;
        border:1px solid #eef1f4;
      }
      .donate-section h3{
        margin:0 0 12px; font-size:16px; line-height:1.35; text-align:center; font-weight:700;
      }
      .donate-cta-wrap{ text-align:center; }
      .donate-cta{
        display:inline-flex; align-items:center; justify-content:center;
        padding:12px 16px; border-radius:12px; font-weight:600; cursor:pointer;
        background:#fff; color:#111; text-decoration:none; border:2px solid;
        min-width:240px;
      }
      .donate-cta--paypal { border-color:#0b57d0; }  /* синий контур */
      .donate-cta:active{ transform:scale(.98); }

      /* благодарность — завершение экрана */
      .donate-message{
        background:#f9fcff; border:1px solid #e2f2ff;
        border-radius:10px;
        padding:14px 16px;
        margin:20px auto 0;
        max-width:520px;
        text-align:center;
        color:#333; font-size:14px; line-height:1.5;
      }
      .donate-message::before{
        content:"✨"; display:block; font-size:20px; margin-bottom:6px;
      }

      @media (max-width:899px){
        .donate-sheet{
          inset:0!important;
          width:100%!important;
          height:var(--mobile-viewport-height,100dvh)!important;
          background:#f6f8fc!important;
          z-index:2500!important;
          padding:max(8px,var(--mobile-safe-top,0px)) max(10px,var(--mobile-safe-right,0px)) calc(12px + var(--mobile-safe-bottom,0px)) max(10px,var(--mobile-safe-left,0px))!important;
          box-sizing:border-box!important;
          gap:8px!important;
        }
        .donate-top{
          flex:0 0 auto!important;
          display:grid!important;
          grid-template-columns:44px minmax(0,1fr) 44px!important;
          align-items:center!important;
          width:100%!important;
          min-height:52px!important;
          margin:0!important;
          padding:4px!important;
          border:1px solid #dfe7f0!important;
          border-radius:16px!important;
          background:rgba(255,255,255,.92)!important;
          box-shadow:0 6px 22px rgba(34,48,94,.055)!important;
          box-sizing:border-box!important;
        }
        .donate-back{
          grid-column:1!important;
          width:40px!important;height:40px!important;
          display:grid!important;place-items:center!important;
          border:0!important;border-radius:12px!important;
          background:transparent!important;color:#26364e!important;
          font:800 26px/1 system-ui,sans-serif!important;
        }
        .donate-title{
          grid-column:2!important;
          text-align:center!important;
          color:#17243a!important;
          font-size:14px!important;
          font-weight:850!important;
        }
        .donate-content{
          flex:1 1 auto!important;
          min-height:0!important;
          width:100%!important;
          margin:0!important;
          padding:14px!important;
          overflow:auto!important;
          border:1px solid #dfe7f0!important;
          border-radius:18px!important;
          background:#fff!important;
          box-shadow:0 8px 26px rgba(34,48,94,.055)!important;
          box-sizing:border-box!important;
        }
        .donate-note{
          max-width:none!important;
          margin:0 0 12px!important;
          padding:10px 8px 14px!important;
          border-bottom:1px solid #e8edf4!important;
          background:transparent!important;
          color:#65758b!important;
          font-size:12px!important;
        }
        .donate-section{
          margin:0!important;
          padding:22px 14px!important;
          border:1px solid #dfe7f0!important;
          border-radius:16px!important;
          background:#f8faff!important;
        }
        .donate-section h3{
          margin:0 0 14px!important;
          color:#23334b!important;
          font-size:15px!important;
        }
        .donate-cta{
          width:100%!important;
          min-width:0!important;
          min-height:50px!important;
          box-sizing:border-box!important;
          border:0!important;
          border-radius:14px!important;
          background:#1677e8!important;
          color:#fff!important;
          font-size:14px!important;
          font-weight:800!important;
          box-shadow:0 8px 20px rgba(22,119,232,.18)!important;
        }
        .donate-message{
          max-width:none!important;
          margin:12px 0 0!important;
          padding:14px!important;
          border:1px solid #e1eaf5!important;
          border-radius:14px!important;
          background:#fbfdff!important;
          color:#526278!important;
          font-size:12px!important;
        }
        html[data-theme="dark"] .donate-sheet,
        html.dark .donate-sheet{background:#101a27!important}
        html[data-theme="dark"] .donate-top,
        html[data-theme="dark"] .donate-content,
        html.dark .donate-top,
        html.dark .donate-content{background:#182536!important;border-color:#2a3d53!important;box-shadow:none!important}
        html[data-theme="dark"] .donate-title,
        html[data-theme="dark"] .donate-back,
        html.dark .donate-title,
        html.dark .donate-back{color:#f0f5fb!important}
        html[data-theme="dark"] .donate-note,
        html.dark .donate-note{color:#9fb0c4!important;border-color:#2c4056!important}
        html[data-theme="dark"] .donate-section,
        html.dark .donate-section{background:#1d2d40!important;border-color:#30465e!important}
        html[data-theme="dark"] .donate-section h3,
        html.dark .donate-section h3{color:#edf3fa!important}
        html[data-theme="dark"] .donate-message,
        html.dark .donate-message{background:#1b2a3c!important;border-color:#2d4259!important;color:#adbbcb!important}
      }

    `;
    styleTag = document.createElement('style');
    styleTag.id = 'donate-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
    // donate-lang-changed
    try {
      document.addEventListener('lexitron:ui-lang-changed', function(){ try{ window.applyI18n && window.applyI18n(sheet); }catch(_){ } });
      window.addEventListener('lexitron:ui-lang-changed', function(){ try{ window.applyI18n && window.applyI18n(sheet); }catch(_){ } });
    } catch(_){ }


    sheet = document.createElement('section');
    sheet.className = 'donate-sheet';
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label',''); sheet.setAttribute('data-i18n-aria','donateTitle');
    sheet.style.display = 'none';

    const top = document.createElement('div');
    top.className = 'donate-top';
    top.innerHTML = `
      <button type="button" class="donate-back" data-donate-back aria-label="Назад">‹</button>
      <div class="donate-title" data-i18n="donateTitle">Поддержать проект</div>
    `;
    
    scroller = document.createElement('div');
    scroller.className = 'donate-content';
    scroller.innerHTML = `
      <div class="donate-note">
        <div class="emoji">⚖️</div>
        <div data-i18n="donateLegalNote">Ваше пожертвование является добровольным и не является оплатой товаров или услуг.</div>
      </div><section class="donate-section">
        <h3 data-i18n="donatePaypalTitle">Поддержать через PayPal</h3>
        <div class="donate-cta-wrap">
          <a class="donate-cta donate-cta--paypal" href="${URL_PAYPAL}" target="_blank" rel="noopener" data-dc="paypal" data-i18n="donatePaypalOpen" data-i18n="donatePaypalOpen">
            Открыть PayPal
          </a>
        </div>
      </section>

      <div class="donate-message" data-i18n="donateThanks">
        Каждый донат помогает нам развивать MOYAMOVA — добавлять новые функции и словари,
        улучшать обучение и сохранять приложение свободным от рекламы. Спасибо за вашу поддержку!
      </div>
    `;

    sheet.appendChild(top);
    sheet.appendChild(scroller);
    document.body.appendChild(sheet);

    const backBtn = sheet.querySelector('[data-donate-back]');
    if (backBtn) backBtn.addEventListener('click', closeAndBack);

    // swipe RIGHT (слева направо) → закрыть и вернуться на предыдущую страницу
    sheet.addEventListener('touchstart', function(e){
      if (e.touches.length!==1) return;
      __swX0 = e.touches[0].clientX;
      __swY0 = e.touches[0].clientY;
      __swMoved = false;
    }, {passive:true});
    sheet.addEventListener('touchmove', function(e){
      if (e.touches.length!==1) return;
      const dx = e.touches[0].clientX - __swX0;
      const dy = e.touches[0].clientY - __swY0;
      if (Math.abs(dx)>6 || Math.abs(dy)>6) __swMoved = true;
    }, {passive:true});
    sheet.addEventListener('touchend', function(e){
      if (!__swMoved) return;
      const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
      if (!t) return;
      const dx = t.clientX - __swX0;
      const dy = t.clientY - __swY0;
      const ady = Math.abs(dy);
      const MIN_RIGHT = 90, MAX_UPDOWN = 48;
      if (dx > MIN_RIGHT && ady <= MAX_UPDOWN) {
        try { e.preventDefault(); } catch(_){}
        closeAndBack();
      }
    }, {passive:false});


    // GA4 трекинг кликов
    scroller.addEventListener('click', (e)=>{
      const link = e.target.closest('[data-dc]');
      if (link){
        const kind = link.getAttribute('data-dc');
        gaEvent('click', kind);
      }
    });

    document.addEventListener('keydown', (e)=>{
      if (sheet.style.display !== 'none' && e.key === 'Escape') close();
    }, {capture:true});
  }

  function open(){
    __backRoute = __getCurrentRoute();
    ensureSheet();
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }
    sheet.style.display = 'flex';
    document.body.classList.add('donate-open'); // флаг на body
    try{ window.applyI18n && window.applyI18n(sheet); }catch(_){ }
    gaEvent('open','sheet');
  }

  function close(){
    if (!sheet) return;
    sheet.style.display = 'none';
    document.body.classList.remove('donate-open'); // снять флаг
    gaEvent('close','sheet');
  }

  function closeAndBack(){ try{ close(); }catch(_){} __routeBack(); }

  root.Donate = { open, close, closeAndBack };

})(window);
/* ========================= Конец файла: donate.js ========================= */
