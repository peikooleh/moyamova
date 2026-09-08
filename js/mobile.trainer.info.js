/* ==========================================================
 * MOYAMOVA 1.12.12 — Shared Mobile Trainer Info
 * Presentation only. Uses read-only data from home.js.
 * ========================================================== */
(function(){
  'use strict';
  const A=(window.App=window.App||{});
  let timer=0, raf=0;

  function mobile(){ return window.innerWidth<=899; }
  function shell(){
    const v=document.documentElement.getAttribute('data-mobile-shell')||'';
    return /^(trainer|articles|prepositions)$/.test(v) ? v : '';
  }
  function home(){
    if(!mobile()||!shell()) return null;
    return document.querySelector('.trainer-desktop-main>.home');
  }
  function labels(){
    let uk=false; try{uk=String((A.settings&&(A.settings.lang||A.settings.uiLang))||'ru').toLowerCase()==='uk';}catch(_){}
    return uk
      ? {progress:'Прогрес',ok:'Правильно',bad:'Помилки',streak:'Серія',time:'Час',set:'Сет'}
      : {progress:'Прогресс',ok:'Правильно',bad:'Ошибки',streak:'Серия',time:'Время',set:'Сет'};
  }
  function timeText(ms){
    const mins=Math.max(0,Math.floor(Number(ms||0)/60000));
    return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');
  }
  function ensure(){
    const h=home(); if(!h)return null;
    let el=h.querySelector(':scope>.mobile-trainer-info');
    if(!el){
      el=document.createElement('section');
      el.className='mobile-trainer-info';
      el.setAttribute('aria-live','polite');
      h.insertBefore(el,h.firstChild);
    }
    return el;
  }
  function render(){
    raf=0;
    if(!mobile())return;
    const el=ensure(); if(!el)return;
    let d=null; try{d=A.MobileTrainerInfoData&&A.MobileTrainerInfoData();}catch(_){}
    if(!d){el.hidden=true;return;} el.hidden=false; el.classList.remove('mobile-trainer-info--boot'); el.removeAttribute('aria-hidden');
    const L=labels(), pct=Math.max(0,Math.min(100,Number(d.pct||0)));
    if(d.daily){
      const uk=String((A.settings&&(A.settings.lang||A.settings.uiLang))||'ru').toLowerCase()==='uk';
      const done=Math.max(0,Number(d.done||0)), total=Math.max(1,Number(d.total||1));
      el.classList.add('mobile-trainer-info--daily');
      el.innerHTML=
        '<div class="mti-head mti-head--daily"><div><span>◎</span><b>'+escapeHtml(d.title||'')+'</b></div><strong>'+done+' / '+total+'</strong></div>'+ 
        '<div class="mti-progress" aria-label="'+(uk?'Виконано ':'Выполнено ')+done+' / '+total+'"><i style="width:'+pct+'%"></i></div>'+ 
        '<div class="mti-kpis mti-kpis--daily">'+
          kpi('ok','✓',L.ok,d.correct)+kpi('bad','×',L.bad,d.wrong)+
          kpi('left','◫',uk?'Залишилось':'Осталось',d.left)+kpi('time','◷',L.time,timeText(d.elapsedMs))+
        '</div>';
      return;
    }
    el.classList.remove('mobile-trainer-info--daily');
    el.innerHTML=
      '<div class="mti-head"><div><span>◎</span><b>'+escapeHtml(d.title||'')+'</b></div><strong>'+pct+'%</strong></div>'+ 
      '<div class="mti-progress" aria-label="'+L.progress+' '+pct+'%"><i style="width:'+pct+'%"></i></div>'+ 
      '<div class="mti-kpis">'+
        kpi('ok','✓',L.ok,d.correct)+kpi('bad','×',L.bad,d.wrong)+kpi('streak','◎',L.streak,d.streak)+
        kpi('time','◷',L.time,timeText(d.elapsedMs))+kpi('set','☷',L.set,(Number(d.setIndex||0)+1)+'/'+Math.max(1,Number(d.totalSets||1)))+
      '</div>';
  }
  function kpi(cls,ico,label,value){
    return '<div class="mti-kpi '+cls+'"><i>'+ico+'</i><span>'+label+'</span><b>'+escapeHtml(String(value==null?'':value))+'</b></div>';
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function schedule(){ if(raf)return; raf=requestAnimationFrame(render); }

  document.addEventListener('click',function(e){
    if(!mobile()||!shell())return;
    if(e.target&&e.target.closest&&e.target.closest('.answer-btn,.idk-btn,[data-articles-tool],[data-preps-tool],.trainer-mode-indicator')){
      setTimeout(schedule,20); setTimeout(schedule,850);
    }
  },false);
  document.addEventListener('lexitron:ui-lang-changed',schedule);
  window.addEventListener('lexitron:ui-lang-changed',schedule);
  window.addEventListener('resize',schedule,{passive:true});

  const mo=new MutationObserver(function(){schedule();});
  function start(){
    render();
    try{mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});}catch(_){}
    schedule();
    timer=window.setInterval(schedule,30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  A.MobileTrainerInfo={refresh:schedule};
})();
