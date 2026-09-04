/* MOYAMOVA 1.12.5 — Mobile Dictionaries shell */
(function(){
  'use strict';

  const mq=window.matchMedia?window.matchMedia('(max-width:899px)'):null;

  function mobile(){return !!(mq&&mq.matches)}

  function findView(){
    const app=document.getElementById('app');
    if(!app)return null;
    return app.querySelector('.home--dicts');
  }

  function active(){return !!(mobile()&&findView())}

  function uk(){
    try{
      const v=String((window.App&&App.settings&&(App.settings.uiLang||App.settings.lang))||document.documentElement.lang||'ru').toLowerCase();
      return v.startsWith('uk');
    }catch(_){return false}
  }

  function goHome(){
    try{
      if(window.App&&App.Router&&typeof App.Router.routeTo==='function')App.Router.routeTo('home');
    }catch(_){}
  }

  function openMenu(){
    try{
      document.body.classList.add('menu-open');
      const oc=document.querySelector('.oc-root');
      if(oc)oc.setAttribute('aria-hidden','false');
    }catch(_){}
  }

  function mount(){
    if(!active())return;

    document.documentElement.dataset.mobileShell='dicts';

    const app=document.getElementById('app');
    const view=findView();
    if(!app||!view)return;

    let bar=app.querySelector(':scope > .mobile-dicts-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.className='mobile-dicts-bar';
      app.insertBefore(bar,view);
    }

    const U=uk();
    const html=
      '<button type="button" class="mobile-dicts-back" data-mobile-dicts-home aria-label="'+(U?'На головну':'На главную')+'">'+
        '<span class="mobile-dicts-back__arrow" aria-hidden="true">‹</span><span>'+(U?'Головна':'Главная')+'</span>'+
      '</button>'+
      '<strong class="mobile-dicts-title">'+(U?'Словники':'Словари')+'</strong>'+
      '<button type="button" class="mobile-dicts-menu" data-mobile-dicts-menu aria-label="'+(U?'Відкрити меню':'Открыть меню')+'">•••</button>';

    if(bar.innerHTML!==html)bar.innerHTML=html;

    try{
      if(window.MOYAMOVA_MobileNav&&typeof window.MOYAMOVA_MobileNav.sync==='function'){
        window.MOYAMOVA_MobileNav.sync();
      }
    }catch(_){}
  }

  document.addEventListener('click',function(e){
    const h=e.target&&e.target.closest?e.target.closest('[data-mobile-dicts-home]'):null;
    if(h&&mobile()){e.preventDefault();goHome();return}

    const m=e.target&&e.target.closest?e.target.closest('[data-mobile-dicts-menu]'):null;
    if(m&&mobile()){e.preventDefault();openMenu()}
  });

  const app=document.getElementById('app');
  function schedule(){
    [0,60,180,420].forEach(function(ms){setTimeout(mount,ms)});
  }

  if(app&&window.MutationObserver){
    new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
  }

  document.addEventListener('DOMContentLoaded',schedule);
  window.addEventListener('pageshow',schedule);

  if(mq){
    if(typeof mq.addEventListener==='function')mq.addEventListener('change',schedule);
    else if(typeof mq.addListener==='function')mq.addListener(schedule);
  }

  schedule();
})();
