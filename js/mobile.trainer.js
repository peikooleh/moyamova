/* MOYAMOVA 1.11.5 — Mobile Words Trainer shell */
(function () {
  'use strict';

  const mq = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;

  function isMobile(){ return !!(mq && mq.matches); }
  function isWords(){
    const app=document.getElementById('app');
    return !!(app && app.querySelector('.home.home--word-trainer'));
  }
  function uk(){
    try {
      const v=String((window.App && App.settings && (App.settings.uiLang || App.settings.lang)) || document.documentElement.lang || 'ru').toLowerCase();
      return v.startsWith('uk');
    } catch(_){ return false; }
  }

  function routeHome(){
    try {
      if (window.App && App.Router && typeof App.Router.routeTo === 'function') {
        App.Router.routeTo('home');
      }
    } catch(_){}
  }

  function openMenu(){
    try {
      document.body.classList.add('menu-open');
      const oc=document.querySelector('.oc-root');
      if (oc) oc.setAttribute('aria-hidden','false');
    } catch(_){}
  }

  function mountBar(){
    if (!isMobile() || !isWords()) return;
    const main=document.querySelector('.trainer-desktop-main');
    if (!main) return;

    let bar=main.querySelector('.mobile-trainer-bar');
    if (!bar) {
      bar=document.createElement('div');
      bar.className='mobile-trainer-bar';
      main.insertBefore(bar, main.firstChild);
    }

    const isUk=uk();
    bar.innerHTML =
      '<button type="button" class="mobile-trainer-back" data-mobile-trainer-home aria-label="'+(isUk?'На головну':'На главную')+'">' +
        '<span class="mobile-trainer-back__arrow" aria-hidden="true">‹</span><span>'+(isUk?'Головна':'Главная')+'</span>' +
      '</button>' +
      '<strong class="mobile-trainer-title">'+(isUk?'Тренажер слів':'Тренажёр слов')+'</strong>' +
      '<button type="button" class="mobile-trainer-menu" data-mobile-trainer-menu aria-label="'+(isUk?'Відкрити меню':'Открыть меню')+'">•••</button>';
  }

  document.addEventListener('click', function(e){
    const home=e.target && e.target.closest ? e.target.closest('[data-mobile-trainer-home]') : null;
    if (home && isMobile()) {
      e.preventDefault();
      routeHome();
      return;
    }
    const menu=e.target && e.target.closest ? e.target.closest('[data-mobile-trainer-menu]') : null;
    if (menu && isMobile()) {
      e.preventDefault();
      openMenu();
    }
  });

  const app=document.getElementById('app');
  if (app && window.MutationObserver) {
    new MutationObserver(mountBar).observe(app,{childList:true,subtree:false});
  }
  document.addEventListener('DOMContentLoaded',mountBar);
  window.addEventListener('pageshow',mountBar);
  if (mq) {
    if (typeof mq.addEventListener==='function') mq.addEventListener('change',mountBar);
    else if (typeof mq.addListener==='function') mq.addListener(mountBar);
  }
  setTimeout(mountBar,0);
})();
