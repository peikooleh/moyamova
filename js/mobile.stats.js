/* MOYAMOVA 1.12.53 — Mobile Statistics shell
 * Adds the same compact Home / title / menu bar used by other mobile pages.
 * Statistics rendering and routing logic remain untouched.
 */
(function(){
  'use strict';

  const mq=window.matchMedia?window.matchMedia('(max-width:899px)'):null;

  function mobile(){return !!(mq&&mq.matches)}
  function active(){
    const app=document.getElementById('app');
    return !!(mobile()&&app&&app.querySelector('.stats-card'));
  }
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

    document.documentElement.dataset.mobileShell='stats';
    const app=document.getElementById('app');
    const view=app.querySelector('.stats-card')&&app.querySelector('.stats-card').closest('.home');
    if(!app||!view)return;

    let bar=app.querySelector(':scope > .mobile-stats-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.className='mobile-stats-bar';
      app.insertBefore(bar,view);
    }

    const U=uk();
    const html=
      '<button type="button" class="mobile-stats-back" data-mobile-stats-home aria-label="'+(U?'На головну':'На главную')+'">'+
        '<span class="mobile-stats-back__arrow" aria-hidden="true">‹</span><span>'+(U?'Головна':'Главная')+'</span>'+
      '</button>'+
      '<span class="mobile-stats-bar__spacer" aria-hidden="true"></span>'+
      '<button type="button" class="mobile-stats-menu" data-mobile-stats-menu aria-label="'+(U?'Відкрити меню':'Открыть меню')+'">•••</button>';

    if(bar.innerHTML!==html)bar.innerHTML=html;

    try{
      if(window.MOYAMOVA_MobileNav&&typeof window.MOYAMOVA_MobileNav.sync==='function'){
        window.MOYAMOVA_MobileNav.sync();
      }
    }catch(_){}
  }

  document.addEventListener('click',function(e){
    const h=e.target&&e.target.closest?e.target.closest('[data-mobile-stats-home]'):null;
    if(h&&mobile()){e.preventDefault();goHome();return}

    const m=e.target&&e.target.closest?e.target.closest('[data-mobile-stats-menu]'):null;
    if(m&&mobile()){e.preventDefault();openMenu()}
  });

  const app=document.getElementById('app');
  function schedule(){[0,60,180,420].forEach(function(ms){setTimeout(mount,ms)})}

  // Public hook for the Statistics view. This makes the mobile shell mount
  // deterministic immediately after the stats DOM is rendered.
  window.MOYAMOVA_MobileStats={mount:mount,schedule:schedule};

  if(app&&window.MutationObserver){
    new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
  }
  document.addEventListener('DOMContentLoaded',schedule);
  document.addEventListener('lexitron:ui-lang-changed',schedule);
  window.addEventListener('pageshow',schedule);
  if(mq){
    if(typeof mq.addEventListener==='function')mq.addEventListener('change',schedule);
    else if(typeof mq.addListener==='function')mq.addListener(schedule);
  }
  schedule();
})();
