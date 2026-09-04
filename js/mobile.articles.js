/* MOYAMOVA 1.11.6 — Mobile Articles Trainer shell */
(function(){
  'use strict';
  const mq=window.matchMedia?window.matchMedia('(max-width:899px)'):null;

  function mobile(){return !!(mq&&mq.matches)}
  function active(){const app=document.getElementById('app');return !!(app&&app.querySelector('.home-trainer.is-articles'))}
  function uk(){
    try{
      const v=String((window.App&&App.settings&&(App.settings.uiLang||App.settings.lang))||document.documentElement.lang||'ru').toLowerCase();
      return v.startsWith('uk');
    }catch(_){return false}
  }
  function goHome(){
    try{if(window.App&&App.Router&&typeof App.Router.routeTo==='function')App.Router.routeTo('home')}catch(_){}
  }
  function openMenu(){
    try{
      document.body.classList.add('menu-open');
      const oc=document.querySelector('.oc-root');if(oc)oc.setAttribute('aria-hidden','false')
    }catch(_){}
  }

  function syncTtsButton(){
    const btn=document.querySelector('.articles-mobile-tools [data-articles-tool="tts"]');
    if(!btn)return;
    let on=false;
    try{on=localStorage.getItem('mm.tts.words')==='1'}catch(_){}
    btn.classList.toggle('is-active',on);
    btn.setAttribute('aria-pressed',String(on));
  }

  function ensureTools(home){
    if(!home)return;
    let tools=home.querySelector('.articles-mobile-tools');
    if(!tools){
      tools=document.createElement('section');
      tools.className='articles-mobile-tools trainer-quickbar';
      const card=home.querySelector('.home-trainer.is-articles');
      if(card&&card.nextSibling)home.insertBefore(tools,card.nextSibling);
      else if(card)home.appendChild(tools);
    }
    const U=uk();
    let tts=false;try{tts=localStorage.getItem('mm.tts.words')==='1'}catch(_){}
    tools.innerHTML=
      '<button type="button" class="trainer-qbtn'+(tts?' is-active':'')+'" data-articles-tool="tts" aria-pressed="'+String(tts)+'" title="'+(U?'Увімкнути або вимкнути озвучення слів':'Включить или выключить озвучку слов')+'"><span class="trainer-qico qico-word" aria-hidden="true">🔊</span><span class="trainer-qlabel">'+(U?'Озвучення':'Озвучка')+'</span></button>'+
      '<button type="button" class="trainer-qbtn" data-articles-tool="skip" title="'+(U?'Перейти до наступного слова':'Перейти к следующему слову')+'"><span class="trainer-qico qico-reverse" aria-hidden="true">⇄</span><span class="trainer-qlabel">'+(U?'Пропустити':'Пропустить')+'</span></button>'+
      '<button type="button" class="trainer-qbtn" data-articles-tool="reveal" title="'+(U?'Показати правильний артикль':'Показать правильный артикль')+'"><span class="trainer-qico qico-focus" aria-hidden="true">?</span><span class="trainer-qlabel">'+(U?'Показати':'Показать')+'</span></button>';
  }
  function mount(){
    if(!mobile()||!active())return;
    document.documentElement.dataset.mobileShell='articles';
    const main=document.querySelector('.trainer-desktop-main');
    if(!main)return;
    let bar=main.querySelector('.mobile-articles-bar');
    if(!bar){
      bar=document.createElement('div');bar.className='mobile-articles-bar';main.insertBefore(bar,main.firstChild);
    }
    const U=uk();
    const barHtml=
      '<button type="button" class="mobile-articles-back" data-mobile-articles-home aria-label="'+(U?'На головну':'На главную')+'">'+
      '<span class="mobile-articles-back__arrow" aria-hidden="true">‹</span><span>'+(U?'Головна':'Главная')+'</span></button>'+
      '<strong class="mobile-articles-title">'+(U?'Тренажер артиклів':'Тренажёр артиклей')+'</strong>'+
      '<button type="button" class="mobile-articles-menu" data-mobile-articles-menu aria-label="'+(U?'Відкрити меню':'Открыть меню')+'">•••</button>';
    if(bar.innerHTML!==barHtml)bar.innerHTML=barHtml;
    const home=main.querySelector('.home');
    if(home && !home.querySelector('.articles-mobile-tools')) ensureTools(home);
    syncTtsButton();
    try{if(window.MOYAMOVA_MobileNav&&typeof window.MOYAMOVA_MobileNav.sync==='function')window.MOYAMOVA_MobileNav.sync()}catch(_){}
  }

  document.addEventListener('click',function(e){
    const h=e.target&&e.target.closest?e.target.closest('[data-mobile-articles-home]'):null;
    if(h&&mobile()){e.preventDefault();goHome();return}
    const m=e.target&&e.target.closest?e.target.closest('[data-mobile-articles-menu]'):null;
    if(m&&mobile()){e.preventDefault();openMenu()}
    const t=e.target&&e.target.closest?e.target.closest('[data-articles-tool="tts"]'):null;
    if(t&&mobile())setTimeout(syncTtsButton,0);
  });

  const app=document.getElementById('app');
  function scheduleMount(){
    [0,60,180,420].forEach(function(ms){setTimeout(mount,ms)});
  }
  if(app&&window.MutationObserver){
    new MutationObserver(scheduleMount).observe(app,{childList:true,subtree:false});
  }
  document.addEventListener('DOMContentLoaded',scheduleMount);
  window.addEventListener('pageshow',scheduleMount);
  if(mq){
    if(typeof mq.addEventListener==='function')mq.addEventListener('change',scheduleMount);
    else if(typeof mq.addListener==='function')mq.addListener(scheduleMount)
  }
  scheduleMount();
})();
