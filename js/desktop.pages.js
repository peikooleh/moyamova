/* ==========================================================
 * MOYAMOVA 1.7.9 — shared Desktop Pages shell + real flags
 * Desktop only. Existing mobile views stay structurally intact.
 * ========================================================== */
(function(){
  'use strict';

  function boot(){
    const A = window.App || (window.App={});
    const app = document.getElementById('app');
    if(!app){
      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', boot, {once:true});
      }else{
        setTimeout(boot, 0);
      }
      return;
    }

  const FLAGS = {de:'de',en:'en',sr:'sr',ru:'ru',uk:'uk',ua:'uk',es:'es',fr:'fr'};
  const NAMES = {de:'Deutsch',en:'English',sr:'Srpski',es:'Español',fr:'Français'};

  function uiUk(){
    try { return String((A.settings&&(A.settings.uiLang||A.settings.lang))||'ru').toLowerCase()==='uk'; }
    catch(_){ return false; }
  }
  function navText(){
    return uiUk()
      ? {home:'Головна',trainer:'Тренажер',dicts:'Словники',mistakes:'Помилки',fav:'Обране',stats:'Статистика'}
      : {home:'Главная',trainer:'Тренажёр',dicts:'Словари',mistakes:'Ошибки',fav:'Избранное',stats:'Статистика'};
  }
  function currentLearnLang(){
    try{
      const k=(A.Trainer&&A.Trainer.getDeckKey&&A.Trainer.getDeckKey())||(A.settings&&A.settings.lastDeckKey)||'de';
      if(A.Decks&&A.Decks.langOfKey) return A.Decks.langOfKey(k)||'de';
      const m=String(k).match(/(?:^|:)(de|en|sr|es|fr)(?:_|:|$)/i);
      return m?m[1].toLowerCase():'de';
    }catch(_){ return 'de'; }
  }

  function navCounts(lg){
    let mistakes=0, favs=0;
    try {
      const xs=(A.Mistakes&&A.Mistakes.listSummary?A.Mistakes.listSummary():[])||[];
      mistakes=xs.filter(x=>{
        try { return (A.Decks&&A.Decks.langOfKey?A.Decks.langOfKey(x.baseKey):String(x.baseKey||'').split('_')[0])===lg; } catch(_){ return false; }
      }).reduce((n,x)=>n+Number(x.count||0),0);
    } catch(_){}
    try {
      const xs=(A.Favorites&&A.Favorites.list?A.Favorites.list():[])||[];
      favs=xs.filter(x=>{
        try { return (A.Decks&&A.Decks.langOfKey?A.Decks.langOfKey(x.dictKey):String(x.dictKey||'').split('_')[0])===lg; } catch(_){ return false; }
      }).length;
    } catch(_){}
    return {mistakes, favs};
  }

  function flagLangFromKey(key){
    const x=String(key||'').toLowerCase();
    const m=x.match(/(?:^|:)(de|en|sr|es|fr)(?:_|:|$)/);
    return m ? m[1] : '';
  }
  function flagHtml(lang, cls){
    lang=FLAGS[String(lang||'').toLowerCase()]||'';
    if(!lang) return '';
    return '<img class="'+(cls||'asset-flag')+'" src="./img/flags/'+lang+'.svg" alt="">';
  }
  A.flagAsset = function(lang){ return flagHtml(lang,'asset-flag'); };

  function route(action){
    try {
      if(A.Router && typeof A.Router.routeTo==='function') return A.Router.routeTo(action);
      if(window.Router && typeof window.Router.routeTo==='function') return window.Router.routeTo(action);
    } catch(_){}
    const old=document.querySelector('.app-footer .nav-btn[data-action="'+action+'"]');
    if(old) old.click();
  }

  function kind(){
    if(app.querySelector('.stats-card')) return 'stats';
    if(app.querySelector('#mistakes-flags,#mistakes-apply,.mistakes-preview,.mistakes-delete')) return 'mistakes';
    if(app.querySelector('#fav-flags,#fav-apply,.favorites-card,.dicts-delete')) return 'fav';

    // On empty views there may be no unique inner control. The old footer still knows the active route.
    const active=document.querySelector('.app-footer .nav-btn.active');
    const a=active && active.dataset.action;
    if(['dicts','mistakes','fav','stats'].includes(a)) return a;

    if(app.querySelector('.dicts-card')) return 'dicts';
    return '';
  }

  function decorateFlags(root){
    root = root || document;

    root.querySelectorAll('.dict-flag[data-lang]').forEach(btn=>{
      const lang=FLAGS[String(btn.dataset.lang||'').toLowerCase()];
      if(lang && !btn.querySelector('img.asset-flag')){
        btn.innerHTML=flagHtml(lang,'asset-flag');
      }
    });

    root.querySelectorAll('.dicts-table tr').forEach(row=>{
      const cell=row.querySelector('td:first-child');
      if(!cell || cell.querySelector('img.asset-flag')) return;
      let lang=flagLangFromKey(row.dataset.key||row.dataset.base||'');
      if(!lang){
        const raw=cell.textContent||'';
        const map={'🇩🇪':'de','🇬🇧':'en','🇷🇸':'sr','🇪🇸':'es','🇫🇷':'fr','🇷🇺':'ru','🇺🇦':'uk'};
        lang=map[raw.trim()]||'';
      }
      if(lang) cell.innerHTML=flagHtml(lang,'asset-flag asset-flag--row');
    });
  }

  function makeSide(active){
    const T=navText(), lg=currentLearnLang();
    const counts=navCounts(lg);
    const side=document.createElement('aside');
    side.className='dash-side desktop-pages-side';
    side.innerHTML=
      '<div class="dash-brand"><img src="./img/logo_64.png" alt=""><div><strong>MOYAMOVA</strong><span>'+(NAMES[lg]||String(lg).toUpperCase())+'</span></div></div>'+
      '<nav>'+
        '<button data-desktop-route="home">⌂ <span>'+T.home+'</span></button>'+
        '<button data-desktop-route="trainer">▶ <span>'+T.trainer+'</span></button>'+
        '<button data-desktop-route="dicts">▤ <span>'+T.dicts+'</span></button>'+
        '<button data-desktop-route="mistakes">△ <span>'+T.mistakes+'</span><b class="desktop-nav-count"'+(counts.mistakes?'>'+counts.mistakes+'</b>':' hidden></b>')+'</button>'+
        '<button data-desktop-route="fav">♡ <span>'+T.fav+'</span><b class="desktop-nav-count"'+(counts.favs?'>'+counts.favs+'</b>':' hidden></b>')+'</button>'+
        '<button data-desktop-route="stats">▥ <span>'+T.stats+'</span></button>'+
      '</nav>'+
      '<div class="dash-side-foot">v'+(A.APP_VER||'1.7.9')+' · Offline <i></i></div>';
    const b=side.querySelector('[data-desktop-route="'+active+'"]');
    if(b) b.classList.add('is-active');
    side.addEventListener('click',e=>{
      const btn=e.target.closest('[data-desktop-route]');
      if(btn) route(btn.dataset.desktopRoute);
    });
    return side;
  }

  let busy=false;
  function upgrade(){
    if(busy) return;
    decorateFlags(document);

    if(!window.matchMedia || !window.matchMedia('(min-width:900px)').matches) return;
    if(app.querySelector('.dashboard,.trainer-desktop-shell,.desktop-pages-shell')) return;

    const k=kind();
    if(!k) return;
    const home=app.querySelector('.home.home--fixed-card:not(.desktop-page-home)');
    if(!home) return;

    busy=true;
    try{
      const shell=document.createElement('div');
      shell.className='desktop-pages-shell desktop-pages-shell--'+k;
      const main=document.createElement('main');
      main.className='desktop-pages-main desktop-pages-main--'+k;
      app.insertBefore(shell,home);
      shell.appendChild(makeSide(k));
      shell.appendChild(main);
      main.appendChild(home);
      home.classList.add('desktop-page-home');
      decorateFlags(shell);
      try{ if(A.PageTips&&A.PageTips.mount) requestAnimationFrame(()=>A.PageTips.mount()); }catch(_){}
    } finally { busy=false; }
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(upgrade));
  observer.observe(app,{childList:true,subtree:true});
  document.addEventListener('lexitron:ui-lang-changed',()=>requestAnimationFrame(upgrade));
  window.addEventListener('resize',()=>requestAnimationFrame(upgrade));
  requestAnimationFrame(upgrade);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
