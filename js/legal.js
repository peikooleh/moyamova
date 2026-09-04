/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: legal.js
 * Назначение: Помощники для юридических страниц
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

const Legal = (() => {
  // -------------------- Язык интерфейса --------------------
  function currentLang(){
    try{
      const dom = document.documentElement.getAttribute('lang');
      const app = (window.App && App.settings && (App.settings.uiLang || App.settings.lang));
      const raw = String(dom || app || 'ru').toLowerCase();
      return (raw === 'uk' || raw === 'ua' || raw.startsWith('uk-')) ? 'uk' : 'ru';
    }catch(_){ return 'ru'; }
  }
  function legalUrl(section){
    const lang = currentLang();
    return `./legal/${section}.${lang}.html`;
  }

  // -------------------- Внутреннее состояние --------------------
  let sheet, content, tabs, styleTag;

  // 🔧 для возврата "куда были", и жеста влево→вправо
  let __backRoute = 'home';
  let __swX0 = 0, __swY0 = 0, __swMoved = false;

  // -------------------- Хелперы маршрута --------------------
  function getCurrentRoute(){
    try {
      return (window.App && App.Router && App.Router.current) || document.body.getAttribute('data-route') || 'home';
    } catch(_){
      return 'home';
    }
  }
  function routeBack(){
    const to = __backRoute || 'home';
    try{
      if (window.Router && typeof Router.routeTo === 'function') Router.routeTo(to);
      else if (window.App && App.Router && typeof App.Router.routeTo === 'function') App.Router.routeTo(to);
    }catch(_){}
  }
  function routeTo(name){
    const to = name || 'home';
    try{
      if (window.Router && typeof Router.routeTo === 'function') Router.routeTo(to);
      else if (window.App && App.Router && typeof App.Router.routeTo === 'function') App.Router.routeTo(to);
    }catch(_){}
  }

  // ✅ Перехват кликов по футеру, когда открыт Legal:
  // закрываем лист и сразу роутим на выбранную страницу
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.app-footer .nav-btn');
    if (!btn) return;

    // Legal не открыт — ничего не делаем
    if (!document.body.classList.contains('legal-open') || !sheet || sheet.style.display === 'none') return;

    const target = btn.getAttribute('data-action');
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();
    try { close(); } catch(_){}
    routeTo(target);
  }, true); // capture, чтобы сработать раньше других обработчиков

  // -------------------- Создание UI --------------------
  function ensureSheet(){
    if (sheet) return;

    const css = `
      .legal-sheet{
        position:fixed; left:0; right:0;
        top:var(--header-h-actual); bottom:var(--footer-h-actual);
        background:#fff; z-index:1200; display:none;
        box-shadow:none; border:0;
        display:flex; flex-direction:column;
      }
      .legal-top{
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 12px; border-bottom:1px solid #e5e7eb;
        font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
      }
      .legal-tabs{ display:flex; gap:8px; align-items:center; }
      .legal-tab{
        padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px;
        background:#fff; cursor:pointer; font-size:14px;
      }
      .legal-tab[aria-selected="true"]{
        border-color: var(--burger);
        outline:0; box-shadow:0 0 0 3px color-mix(in srgb, var(--burger) 20%, transparent);
      }
      .legal-content{
        position:relative; flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch;
        padding:12px;
        font:16px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:#111;
      }
      .legal-content h1{ margin:0 0 12px; font-size:22px; }
      .legal-content h2{ margin:20px 0 8px; font-size:18px; }
      .legal-content a{ color:#0b57d0; text-decoration:none; }
      .legal-content a:hover{ text-decoration:underline; }
      .legal-content :target{ scroll-margin-top: 72px; }


      @media (max-width:899px){
        .legal-sheet{
          inset:0!important;
          width:100%!important;
          height:var(--mobile-viewport-height,100dvh)!important;
          background:#f6f8fc!important;
          color:#1d2a3d!important;
          z-index:2500!important;
          padding:max(8px,var(--mobile-safe-top,0px)) max(10px,var(--mobile-safe-right,0px)) calc(12px + var(--mobile-safe-bottom,0px)) max(10px,var(--mobile-safe-left,0px))!important;
          box-sizing:border-box!important;
          gap:8px!important;
        }
        .legal-top{
          flex:0 0 auto!important;
          display:grid!important;
          grid-template-columns:minmax(0,1fr) auto!important;
          gap:8px!important;
          width:100%!important;
          margin:0!important;
          padding:8px!important;
          border:1px solid #dfe7f0!important;
          border-radius:16px!important;
          background:rgba(255,255,255,.92)!important;
          box-shadow:0 6px 22px rgba(34,48,94,.055)!important;
          box-sizing:border-box!important;
        }
        .legal-top>.legal-tabs{
          min-width:0!important;
          display:flex!important;
          gap:5px!important;
          overflow-x:auto!important;
          scrollbar-width:none!important;
          -webkit-overflow-scrolling:touch;
        }
        .legal-top>.legal-tabs::-webkit-scrollbar{display:none!important}
        .legal-tab{
          flex:0 0 auto!important;
          min-height:36px!important;
          padding:0 10px!important;
          border:1px solid #e1e7f0!important;
          border-radius:11px!important;
          background:#fff!important;
          color:#65758b!important;
          font-size:10.5px!important;
          font-weight:750!important;
          white-space:nowrap!important;
          box-shadow:none!important;
        }
        .legal-tab[aria-selected="true"]{
          border-color:#b8c6ff!important;
          background:#eef2ff!important;
          color:#566dd7!important;
          box-shadow:none!important;
        }
        .legal-close-desktop{
          min-width:42px!important;
          height:36px!important;
          padding:0 9px!important;
          border:1px solid #e1e7f0!important;
          border-radius:11px!important;
          background:#fff!important;
          color:#42516a!important;
          font-size:0!important;
          font-weight:800!important;
        }
        .legal-close-desktop::before{
          content:"‹"!important;
          font-size:24px!important;
          line-height:1!important;
        }
        .legal-content{
          flex:1 1 auto!important;
          min-height:0!important;
          width:100%!important;
          margin:0!important;
          padding:18px 16px calc(24px + var(--mobile-safe-bottom,0px))!important;
          overflow:auto!important;
          border:1px solid #dfe7f0!important;
          border-radius:18px!important;
          background:#fff!important;
          box-shadow:0 8px 26px rgba(34,48,94,.055)!important;
          box-sizing:border-box!important;
          color:#334258!important;
          font-size:13.5px!important;
          line-height:1.62!important;
        }
        .legal-content h1{
          margin:0 0 16px!important;
          color:#17243a!important;
          font-size:22px!important;
          line-height:1.18!important;
          font-weight:850!important;
        }
        .legal-content h2{
          margin:22px 0 7px!important;
          color:#24344c!important;
          font-size:15px!important;
          line-height:1.3!important;
          font-weight:800!important;
        }
        .legal-content p{margin:0 0 11px!important}
        .legal-content>.legal-tabs{
          display:flex!important;
          flex-wrap:wrap!important;
          gap:6px!important;
          margin:24px 0 0!important;
          padding-top:16px!important;
          border-top:1px solid #e8edf4!important;
        }
        .legal-consent{
          margin:20px 0 2px!important;
          padding:14px!important;
          border:1px solid #dfe7f0!important;
          border-radius:14px!important;
          background:#f8faff!important;
        }
        html[data-theme="dark"] .legal-sheet,
        html.dark .legal-sheet{background:#101a27!important}
        html[data-theme="dark"] .legal-top,
        html[data-theme="dark"] .legal-content,
        html.dark .legal-top,
        html.dark .legal-content{background:#182536!important;border-color:#2a3d53!important;color:#c9d5e3!important;box-shadow:none!important}
        html[data-theme="dark"] .legal-tab,
        html[data-theme="dark"] .legal-close-desktop,
        html.dark .legal-tab,
        html.dark .legal-close-desktop{background:#213247!important;border-color:#334960!important;color:#b9c7d8!important}
        html[data-theme="dark"] .legal-tab[aria-selected="true"],
        html.dark .legal-tab[aria-selected="true"]{background:#30436a!important;border-color:#6176d8!important;color:#e1e6ff!important}
        html[data-theme="dark"] .legal-content h1,
        html[data-theme="dark"] .legal-content h2,
        html.dark .legal-content h1,
        html.dark .legal-content h2{color:#f2f6fb!important}
        html[data-theme="dark"] .legal-consent,
        html.dark .legal-consent{background:#1d2d40!important;border-color:#30465e!important}
      }

      @media (min-width:900px){
        .legal-sheet{
          inset:0;
          background:#f5f7fc;
          color:#1d2a3d;
          z-index:2500;
        }
        .legal-top{
          width:min(100% - 48px,900px);
          margin:22px auto 0;
          padding:13px 16px;
          border:1px solid #e1e7f0;
          border-radius:14px 14px 0 0;
          background:#fff;
          box-shadow:0 8px 28px rgba(30,48,82,.055);
        }
        .legal-tabs{gap:6px;flex-wrap:wrap}
        .legal-tab{
          padding:8px 12px;
          border-color:#e1e7f0;
          border-radius:9px;
          color:#58667a;
          font-size:12px;
          font-weight:700;
        }
        .legal-tab[aria-selected="true"]{
          border-color:#b6c0ff;
          background:#eef2ff;
          color:#5e6fd8;
          box-shadow:none;
        }
        .legal-close-desktop{
          border:0;background:transparent;color:#6676dd;font-weight:800;
          font-size:12px;cursor:pointer;white-space:nowrap
        }
        .legal-content{
          width:min(100% - 48px,900px);
          margin:0 auto 22px;
          padding:30px 54px 40px;
          background:#fff;
          border:1px solid #e1e7f0;
          border-top:0;
          border-radius:0 0 14px 14px;
          box-shadow:0 8px 28px rgba(30,48,82,.055);
          color:#27364b;
          font-size:15px;
          line-height:1.72;
        }
        .legal-content h1{
          margin:0 0 22px;
          color:#17243a;
          font:700 28px/1.15 Montserrat,system-ui,sans-serif;
        }
        .legal-content h2{
          margin:26px 0 8px;
          color:#26364d;
          font:700 16px/1.3 Montserrat,system-ui,sans-serif;
        }
        .legal-content p{margin:0 0 13px}
        .legal-content em{color:#77859a}
        .legal-content>.legal-tabs{
          margin-top:32px!important;padding-top:18px!important;border-top-color:#e6ebf2!important
        }
        html[data-theme="dark"] .legal-sheet{background:#1f2c3d;color:#e5ebf4}
        html[data-theme="dark"] .legal-top,
        html[data-theme="dark"] .legal-content{
          background:#263548;border-color:#3b4d63;color:#cdd7e4
        }
        html[data-theme="dark"] .legal-content h1,
        html[data-theme="dark"] .legal-content h2{color:#f3f6fb}
        html[data-theme="dark"] .legal-tab{background:#2c3d52;border-color:#42556d;color:#b9c5d5}
        html[data-theme="dark"] .legal-tab[aria-selected="true"]{background:#35466a;border-color:#687bd6;color:#d8deff}
        html[data-theme="dark"] .legal-close-desktop{color:#aab7ff}
      }
    `;
    styleTag = document.createElement('style');
    styleTag.id = 'legal-sheet-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    // реакция на смену языка
    try {
      document.addEventListener('lexitron:ui-lang-changed', function(){ try{ window.applyI18n && window.applyI18n(sheet); }catch(_){ } });
      window.addEventListener('lexitron:ui-lang-changed', function(){ try{ window.applyI18n && window.applyI18n(sheet); }catch(_){ } });
    } catch(_){ }

    sheet = document.createElement('section');
    sheet.className = 'legal-sheet';
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-label','');
    sheet.setAttribute('data-i18n-aria','legalTitle');

    const top = document.createElement('div');
    top.className = 'legal-top';

    tabs = document.createElement('div');
    tabs.className = 'legal-tabs';
    tabs.innerHTML = `
      <button class="legal-tab" data-section="terms" aria-label="" data-i18n="legalTerms" data-i18n-aria="legalTerms">Условия</button>
      <button class="legal-tab" data-section="privacy" aria-label="" data-i18n="legalPrivacy" data-i18n-aria="legalPrivacy">Конфиденциальность</button>
      <button class="legal-tab" data-section="impressum" aria-label="" data-i18n="legalImpressum" data-i18n-aria="legalImpressum">Юридическая информация</button>
    `;

    top.appendChild(tabs);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'legal-close-desktop';
    closeBtn.setAttribute('data-legal-close','1');
    closeBtn.textContent = currentLang()==='uk' ? '← Налаштування' : '← Настройки';
    closeBtn.addEventListener('click', close);
    top.appendChild(closeBtn);

    content = document.createElement('div');
    content.className = 'legal-content';

    sheet.appendChild(top);
    sheet.appendChild(content);
    document.body.appendChild(sheet);

    // свайп слева направо → закрыть и вернуться туда, откуда пришли
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
      // если движение вправо (dx > MIN_RIGHT) и нет большого вертикального отклонения
      if (dx > MIN_RIGHT && ady <= MAX_UPDOWN) {
        try { e.preventDefault(); } catch(_){}
        closeAndBack();
      }
    }, {passive:false});

    // клики по табам
    sheet.addEventListener('click', (e)=>{
      const btn = e.target.closest('.legal-tab');
      if (btn) open(btn.dataset.section);
    });
    document.addEventListener('keydown', (e)=>{
      if (sheet.style.display !== 'none' && e.key === 'Escape') close();
    }, {capture:true});

    // Перезагрузка при смене языка (тогл шлёт это событие)
    const reload = ()=>{
      if (!sheet || sheet.style.display === 'none') return;
      const active = sheet.querySelector('.legal-tab[aria-selected="true"]')?.dataset.section || 'impressum';
      load(active);
    };
    window.addEventListener('lexitron:ui-lang-changed', reload, { passive:true });
    document.addEventListener('lexitron:ui-lang-changed', reload, { passive:true });
  }

  function setActiveTab(section){
    sheet.querySelectorAll('.legal-tab').forEach(b=>{
      b.setAttribute('aria-selected', String(b.dataset.section === section));
    });
  }

  function extractMain(html){
    try{
      const el = document.createElement('div');
      el.innerHTML = html;
      const main = el.querySelector('main');
      return main ? main.innerHTML : html;
    }catch{
      return html;
    }
  }

    async function load(section){
    const url = legalUrl(section);
    const res = await fetch(url, { credentials: 'same-origin' });
    const text = await res.text();

    // основной контент + табы
    content.innerHTML = extractMain(text) + 
  `<div class="legal-tabs" style="margin:24px 0 0; border-top:1px solid #eee; padding-top:16px; justify-content:center;">
     <button class="legal-tab" data-section="terms" data-i18n="legalTerms">Условия</button>
     <button class="legal-tab" data-section="privacy" data-i18n="legalPrivacy">Конфиденциальность</button>
     <button class="legal-tab" data-section="impressum" data-i18n="legalImpressum">Юридическая информация</button>
   </div>`;

    // ------------------ Блок согласия под Условиями ------------------
    if (section === 'terms') {
      try {
        const lang = currentLang();
        const accepted = (window.localStorage.getItem('mm.tosAccepted') === '1');

        const labelText = (lang === 'uk')
          ? 'Я приймаю умови використання застосунку'
          : 'Я принимаю условия использования приложения';

        const noteText = (lang === 'uk')
          ? 'Зняття позначки видалить ваші дані і прогрес та поверне застосунок до початкового налаштування.'
          : 'Снятие галочки удалит ваши данные и прогресс и вернёт приложение к первичной настройке.';

        const wrapper = document.createElement('div');
        wrapper.className = 'legal-consent';
        wrapper.innerHTML = [
          '<label class="legal-consent__label">',
            '<input type="checkbox" data-legal-tos>',
            '<span class="legal-consent__box"></span>',
            '<span class="legal-consent__text">', labelText, '</span>',
          '</label>',
          '<p class="legal-consent__note">', noteText, '</p>'
        ].join('');

        content.appendChild(wrapper);

        const cb = wrapper.querySelector('[data-legal-tos]');
        if (!cb) return;

        // начальное состояние чекбокса
        cb.checked = accepted;

        cb.addEventListener('change', async function () {
          // Пользователь ставит галочку → просто считаем условия принятыми
          if (cb.checked) {
            try { window.localStorage.setItem('mm.tosAccepted', '1'); } catch(_){}
            return;
          }

                    // Пользователь снимает галочку → подтверждаем сброс через модалку
          let ok = false;

          if (window.App && App.Msg && typeof App.Msg.openConfirmModal === 'function') {
            try {
              const title = App.Msg.text('legal.reset_confirm');
              const text  = App.Msg.text('legal.reset_warning');
              ok = await App.Msg.openConfirmModal({ title: title, text: text, type: 'warning' });
            } catch(_) {}
          } else {
            const fallbackMsg = (lang === 'uk')
                          ? 'Якщо ви відхилите умови, усі дані (прогрес, налаштування, обране) будуть видалені, а застосунок повернеться до початкового налаштування. Продовжити?'
                          : 'Если вы откажетесь от условий, все данные (прогресс, настройки, избранное) будут удалены, а приложение вернётся к первичной настройке. Продолжить?';
                        ok = window.confirm(fallbackMsg);
          }

          if (!ok) {
            // отмена → возвращаем чекбокс обратно
            cb.checked = true;
            return;
          }

// подтверждённый отказ:
          // централизованный "factory reset" + перезапуск
          try {
            if (window.App && typeof window.App.factoryReset === 'function') {
              window.App.factoryReset();
            } else {
              // запасной вариант — если по какой-то причине reset не объявлен
              try { window.localStorage.clear(); } catch(_) {}
            }
          } catch(_) {}

          try { window.location.reload(); } catch(_){}
        });
      } catch(_){}
    }
  }

  function open(section='impressum'){
    __backRoute = getCurrentRoute(); // запоминаем маршрут
    ensureSheet();
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      document.querySelector('.oc-root')?.setAttribute('aria-hidden','true');
    }
    setActiveTab(section);
    const backBtn=sheet.querySelector('[data-legal-close]');
    if(backBtn) backBtn.textContent=currentLang()==='uk' ? '← Налаштування' : '← Настройки';
    sheet.style.display = 'flex';
    try{ window.applyI18n && window.applyI18n(sheet); }catch(_){}
    document.body.classList.add('legal-open');
    load(section).catch(console.warn);
  }

  function close(){
    if (!sheet) return;
    sheet.style.display = 'none';
    document.body.classList.remove('legal-open');
  }

  function closeAndBack(){
    try { close(); } catch(_){}
    routeBack();
  }

  return { open, close, closeAndBack };
})();

// Экспорт для ESM и доступ на window для старых обработчиков
try { window.Legal = Legal; } catch(_) {}
export default Legal;
export { Legal };
/* ========================= Конец файла: legal.js ========================= */