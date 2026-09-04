/* MOYAMOVA 1.12.8 — Mobile Favorites + Mistakes shell */
(function(){
  'use strict';

  const mq=window.matchMedia?window.matchMedia('(max-width:899px)'):null;

  function mobile(){return !!(mq&&mq.matches)}
  function uiUk(){
    try{
      const v=String((window.App&&App.settings&&(App.settings.uiLang||App.settings.lang))||document.documentElement.lang||'ru').toLowerCase();
      return v.startsWith('uk');
    }catch(_){return false}
  }

  function screen(){
    const app=document.getElementById('app');
    if(!app||!mobile())return '';
    if(app.querySelector('.home--favorites'))return 'favorites';
    if(app.querySelector('.home--mistakes'))return 'mistakes';
    return '';
  }

  function home(){
    try{
      if(window.App&&App.Router&&typeof App.Router.routeTo==='function')App.Router.routeTo('home');
    }catch(_){}
  }

  function menu(){
    try{
      document.body.classList.add('menu-open');
      const oc=document.querySelector('.oc-root');
      if(oc)oc.setAttribute('aria-hidden','false');
    }catch(_){}
  }

  function mount(){
    const kind=screen();
    if(!kind)return;

    document.documentElement.dataset.mobileShell=kind;

    const app=document.getElementById('app');
    const view=app.querySelector(kind==='favorites'?'.home--favorites':'.home--mistakes');
    if(!view)return;

    let bar=app.querySelector(':scope > .mobile-collection-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.className='mobile-collection-bar';
      app.insertBefore(bar,view);
    }

    const U=uiUk();
    const title=kind==='favorites'
      ? (U?'Обране':'Избранное')
      : (U?'Помилки':'Ошибки');

    const html=
      '<button type="button" class="mobile-collection-back" data-mobile-collection-home aria-label="'+(U?'На головну':'На главную')+'">'+
        '<span class="mobile-collection-back__arrow" aria-hidden="true">‹</span><span>'+(U?'Головна':'Главная')+'</span>'+
      '</button>'+
      '<strong class="mobile-collection-title">'+title+'</strong>'+
      '<button type="button" class="mobile-collection-menu" data-mobile-collection-menu aria-label="'+(U?'Відкрити меню':'Открыть меню')+'">•••</button>';

    if(bar.innerHTML!==html)bar.innerHTML=html;

    try{
      if(window.MOYAMOVA_MobileNav&&typeof window.MOYAMOVA_MobileNav.sync==='function'){
        window.MOYAMOVA_MobileNav.sync();
      }
    }catch(_){}
  }

  document.addEventListener('click',function(e){
    const h=e.target&&e.target.closest?e.target.closest('[data-mobile-collection-home]'):null;
    if(h&&mobile()){e.preventDefault();home();return}
    const m=e.target&&e.target.closest?e.target.closest('[data-mobile-collection-menu]'):null;
    if(m&&mobile()){e.preventDefault();menu()}
  });

  const app=document.getElementById('app');
  function schedule(){[0,60,180,420].forEach(function(ms){setTimeout(mount,ms)})}
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
