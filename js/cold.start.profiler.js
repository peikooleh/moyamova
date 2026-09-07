/* ==========================================================
 * MOYAMOVA temporary cold-start profiler (QA only)
 * Enabled with ?perf=1 (or localStorage moya_perf=1)
 * ========================================================== */
(function(){
  'use strict';

  var params;
  try { params = new URLSearchParams(location.search); } catch (_) { params = { get:function(){return null;} }; }
  var enabled = params.get('perf') === '1';
  try {
    if (params.get('perf') === '0') localStorage.removeItem('moya_perf');
    if (enabled) localStorage.setItem('moya_perf','1');
    enabled = enabled || localStorage.getItem('moya_perf') === '1';
  } catch (_) {}
  if (!enabled) return;

  var navStart = 0; // all PerformanceEntry start times are relative to navigation start
  var marks = Object.create(null);
  var shellObserved = false;
  var homeObserved = false;
  var deckObserved = false;
  var manifestObserved = false;
  var panel = null;
  var deckTrace = [];
  var refreshTimer = null;

  function ms(v){ return (typeof v === 'number' && isFinite(v)) ? Math.round(v) + ' ms' : '—'; }
  function mark(name){ if (marks[name] == null) marks[name] = performance.now() - navStart; scheduleRefresh(); }

  window.__MOYA_COLD_START_REPORT__ = function(){ return buildReport(); };
  window.__MOYA_COLD_START_MARK__ = mark;
  window.__MOYA_COLD_START_DECK__ = function(key, phase){
    try {
      deckTrace.push({ key:String(key||''), phase:String(phase||'resolve'), t:Math.round(performance.now()), stack:(new Error()).stack||'' });
      if (deckTrace.length > 100) deckTrace.shift();
    } catch(_){}
  };
  mark('profiler');

  try {
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){
        if (e.name === 'first-paint') marks.firstPaint = e.startTime;
        if (e.name === 'first-contentful-paint') marks.fcp = e.startTime;
      });
      scheduleRefresh();
    }).observe({type:'paint', buffered:true});
  } catch (_) {
    try {
      performance.getEntriesByType('paint').forEach(function(e){
        if (e.name === 'first-paint') marks.firstPaint = e.startTime;
        if (e.name === 'first-contentful-paint') marks.fcp = e.startTime;
      });
    } catch(__){}
  }

  try {
    var longTotal = 0, longMax = 0, longCount = 0;
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){ longCount++; longTotal += e.duration; longMax = Math.max(longMax,e.duration); });
      marks.longCount = longCount; marks.longTotal = longTotal; marks.longMax = longMax; scheduleRefresh();
    }).observe({type:'longtask', buffered:true});
  } catch (_) {}

  document.addEventListener('DOMContentLoaded', function(){ mark('domContentLoaded'); attachShellObserver(); });
  window.addEventListener('load', function(){ mark('load'); setTimeout(scanResources,0); setTimeout(scanResources,250); setTimeout(scanResources,1000); });

  function attachShellObserver(){
    var root = document.getElementById('moya-shell-root');
    if (!root) return;
    function inspect(){
      if (!shellObserved && root.childElementCount > 0 && (root.textContent || '').trim().length > 5) {
        shellObserved = true; mark('shellContent');
      }
      var route = '';
      try { route = document.body.getAttribute('data-route') || (window.App && App.Router && App.Router.current) || ''; } catch(_){}
      var text = (root.textContent || '').trim();
      if (!homeObserved && (route === 'home' || /Готовы учиться|Готові вчитися|What.*learn|Что будем учить|Що будемо вчити/i.test(text))) {
        homeObserved = true; mark('homeReady');
      }
    }
    inspect();
    try { new MutationObserver(inspect).observe(root,{childList:true,subtree:true,characterData:true}); } catch(_){}
    var n=0, t=setInterval(function(){ inspect(); if(++n>80 || homeObserved) clearInterval(t); },50);
  }

  function scanResources(){
    var res=[];
    try { res=performance.getEntriesByType('resource') || []; } catch(_){}
    var css=[], js=[], decks=[], manifests=[];
    res.forEach(function(e){
      var name=e.name || '';
      if (/\.css(?:\?|$)/i.test(name)) css.push(e);
      if (/\.js(?:\?|$)/i.test(name)) js.push(e);
      if (/dicts\/data\/.*\.json(?:\?|$)/i.test(name)) decks.push(e);
      if (/dicts\/decks\.manifest\.json(?:\?|$)/i.test(name)) manifests.push(e);
    });
    if (manifests.length) {
      marks.manifestEnd = Math.max.apply(null,manifests.map(function(e){return e.responseEnd;}));
      manifestObserved=true;
    }
    if (decks.length) {
      marks.firstDeckEnd = Math.min.apply(null,decks.map(function(e){return e.responseEnd;}));
      marks.lastDeckEnd = Math.max.apply(null,decks.map(function(e){return e.responseEnd;}));
      marks.deckCount = decks.length;
      deckObserved=true;
    } else marks.deckCount = 0;
    marks.cssCount=css.length;
    marks.jsCount=js.length;
    if(css.length) marks.cssLastEnd=Math.max.apply(null,css.map(function(e){return e.responseEnd;}));
    if(js.length) marks.jsLastEnd=Math.max.apply(null,js.map(function(e){return e.responseEnd;}));
    marks.transferKB=Math.round(res.reduce(function(s,e){return s+(e.transferSize||0);},0)/1024);
    scheduleRefresh();
  }

  function navInfo(){
    try { return performance.getEntriesByType('navigation')[0] || null; } catch(_) { return null; }
  }

  function buildReport(){
    scanResourcesNoRefresh();
    var n=navInfo();
    var sw='no-controller';
    try { if(n && n.workerStart>0) sw='controlled'; else if(navigator.serviceWorker && navigator.serviceWorker.controller) sw='controller-present'; } catch(_){}
    return {
      url: location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      serviceWorker: sw,
      navigation: n ? {
        responseStart: Math.round(n.responseStart), responseEnd: Math.round(n.responseEnd),
        domInteractive: Math.round(n.domInteractive), domContentLoaded: Math.round(n.domContentLoadedEventEnd),
        loadEventEnd: Math.round(n.loadEventEnd), workerStart: Math.round(n.workerStart||0)
      } : null,
      marks: Object.assign({},marks),
      deckTrace: deckTrace.slice()
    };
  }

  function scanResourcesNoRefresh(){
    var old=refreshTimer; refreshTimer='blocked'; scanResourcesCore(); refreshTimer=old;
  }
  function scanResourcesCore(){
    var res=[]; try{res=performance.getEntriesByType('resource')||[];}catch(_){}
    var css=res.filter(function(e){return /\.css(?:\?|$)/i.test(e.name||'');});
    var js=res.filter(function(e){return /\.js(?:\?|$)/i.test(e.name||'');});
    var decks=res.filter(function(e){return /dicts\/data\/.*\.json(?:\?|$)/i.test(e.name||'');});
    var manifests=res.filter(function(e){return /dicts\/decks\.manifest\.json(?:\?|$)/i.test(e.name||'');});
    if(manifests.length) marks.manifestEnd=Math.max.apply(null,manifests.map(function(e){return e.responseEnd;}));
    if(decks.length){marks.firstDeckEnd=Math.min.apply(null,decks.map(function(e){return e.responseEnd;}));marks.lastDeckEnd=Math.max.apply(null,decks.map(function(e){return e.responseEnd;}));}
    marks.deckCount=decks.length; marks.cssCount=css.length; marks.jsCount=js.length;
    if(css.length)marks.cssLastEnd=Math.max.apply(null,css.map(function(e){return e.responseEnd;}));
    if(js.length)marks.jsLastEnd=Math.max.apply(null,js.map(function(e){return e.responseEnd;}));
    marks.transferKB=Math.round(res.reduce(function(s,e){return s+(e.transferSize||0);},0)/1024);
  }

  function scheduleRefresh(){
    if(refreshTimer==='blocked') return;
    clearTimeout(refreshTimer); refreshTimer=setTimeout(render,50);
  }

  function row(label,val){return '<div style="display:flex;justify-content:space-between;gap:12px"><span>'+label+'</span><b>'+val+'</b></div>';}
  function render(){
    scanResourcesCore();
    if(!panel){
      panel=document.createElement('div'); panel.id='moya-perf-panel';
      panel.style.cssText='position:fixed;z-index:2147483647;left:8px;right:8px;bottom:8px;max-width:520px;margin:auto;padding:10px 12px;border-radius:12px;background:rgba(10,14,22,.94);color:#fff;font:12px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 6px 30px rgba(0,0,0,.35);max-height:48vh;overflow:auto';
      document.documentElement.appendChild(panel);
    }
    var n=navInfo();
    var html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b>MOYAMOVA Cold Start</b><span>QA</span></div>';
    html+=row('Server response',ms(n&&n.responseEnd));
    html+=row('First paint',ms(marks.firstPaint));
    html+=row('FCP',ms(marks.fcp));
    html+=row('CSS ready (last response)',ms(marks.cssLastEnd)+' · '+(marks.cssCount||0));
    html+=row('JS ready (last response)',ms(marks.jsLastEnd)+' · '+(marks.jsCount||0));
    html+=row('Manifest',ms(marks.manifestEnd));
    html+=row('Shell content',ms(marks.shellContent));
    html+=row('Home ready',ms(marks.homeReady));
    html+=row('First deck',ms(marks.firstDeckEnd)+' · decks '+(marks.deckCount||0));
    html+=row('Load event',ms(marks.load));
    if(marks.longCount!=null) html+=row('Long tasks',marks.longCount+' · '+ms(marks.longTotal)+' total');
    html+=row('Transferred',String(marks.transferKB||0)+' KB');
    html+='<div style="display:flex;gap:8px;margin-top:8px"><button id="moya-perf-copy" style="flex:1;padding:7px;border:0;border-radius:8px;font-weight:700">Копировать отчёт</button><button id="moya-perf-close" style="padding:7px 10px;border:0;border-radius:8px">×</button></div>';
    panel.innerHTML=html;
    panel.querySelector('#moya-perf-close').onclick=function(){panel.style.display='none';};
    panel.querySelector('#moya-perf-copy').onclick=function(){
      var txt=JSON.stringify(buildReport(),null,2);
      try{navigator.clipboard.writeText(txt).then(function(){panel.querySelector('#moya-perf-copy').textContent='Скопировано';});}
      catch(_){prompt('Скопируйте отчёт',txt);}
    };
  }

  // Make sure body/root exist before attaching UI/observer.
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){attachShellObserver();render();});
  else {attachShellObserver();render();}
  setTimeout(scanResources,1500);
  setTimeout(scanResources,3000);
})();
