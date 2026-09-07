/* ==========================================================
 * MOYAMOVA — Home Dashboard
 * Version: 1.7.3
 * ========================================================== */
(function(){
  'use strict';
  const A = window.App || (window.App = {});

  const POS_ORDER = ['nouns','verbs','adjectives','adverbs','pronouns','prepositions','conjunctions','particles','numbers'];
  const POS_ICON = {nouns:'●',verbs:'↗',adjectives:'✦',adverbs:'⚡',pronouns:'◉',prepositions:'⌖',conjunctions:'↗',particles:'·',numbers:'#'};
  const POS_RU = {nouns:'Существительные',verbs:'Глаголы',adjectives:'Прилагательные',adverbs:'Наречия',pronouns:'Местоимения',prepositions:'Предлоги',conjunctions:'Союзы',particles:'Частицы',numbers:'Числительные'};
  const POS_UK = {nouns:'Іменники',verbs:'Дієслова',adjectives:'Прикметники',adverbs:'Прислівники',pronouns:'Займенники',prepositions:'Прийменники',conjunctions:'Сполучники',particles:'Частки',numbers:'Числівники'};

  function uk(){ return String((A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru').toLowerCase() === 'uk'; }
  function esc(s){ return A.escapeHtml ? A.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function langOf(k){ try { return A.Decks && A.Decks.langOfKey ? A.Decks.langOfKey(k) : String(k||'').split('_')[0]; } catch(_){ return 'de'; } }
  function posOf(k){ const m=String(k||'').match(/^[a-z]{2}_([a-z]+)/i); return m ? m[1].toLowerCase() : ''; }
  function isLp(k){ return /_lernpunkt$/i.test(String(k||'')); }
  function baseKeys(){ try { return (A.Decks && A.Decks.builtinKeys ? A.Decks.builtinKeys() : []).filter(k=>!isLp(k)); } catch(_){ return []; } }
  function currentLang(){
    let k='';
    try { k=(A.Trainer&&A.Trainer.getDeckKey&&A.Trainer.getDeckKey()) || (A.settings&&A.settings.lastDeckKey) || ''; } catch(_){}
    const lg=langOf(k);
    if (lg && baseKeys().some(x=>langOf(x)===lg)) return lg;
    const saved=A.settings && (A.settings.dictsLang || A.settings.dictsLangFilter);
    if (saved && baseKeys().some(x=>langOf(x)===saved)) return saved;
    return baseKeys().some(x=>langOf(x)==='de') ? 'de' : (langOf(baseKeys()[0]) || 'de');
  }
  function languageName(lg){ const m={de:'Deutsch',en:'English',sr:'Srpski'}; return m[lg] || String(lg||'').toUpperCase(); }
  function starValue(key,w){ try { return Number((A.state&&A.state.stars&&A.state.stars[A.starKey(w.id,key)])||0); } catch(_){ return 0; } }

  // Home must not force every deck payload to load just to draw counters.
  // On a cold start the manifest already knows deck sizes, while learning
  // progress is persisted locally. Use those lightweight sources until a
  // deck has actually been opened; loaded decks still use the exact path.
  function manifestCount(key){
    try{
      const e=(window.DeckLoader&&typeof window.DeckLoader.getEntry==='function')?window.DeckLoader.getEntry(key):null;
      return e&&Number.isFinite(Number(e.count))?Math.max(0,Number(e.count)):0;
    }catch(_){ return 0; }
  }
  function persistedStarsForKey(key){
    const out=Object.create(null);
    const prefix=String(key||'')+':';
    const add=(rawId,rawVal)=>{
      let id=String(rawId==null?'':rawId);
      if(id.indexOf(prefix)===0) id=id.slice(prefix.length);
      if(!id) return;
      let v=Number(rawVal||0);
      if(!Number.isFinite(v)) v=0;
      if(out[id]==null||v>out[id]) out[id]=v;
    };
    try{
      const raw=localStorage.getItem('progress.v2');
      const st=raw?JSON.parse(raw):null;
      const byDeck=st&&st.stars&&st.stars[key];
      if(byDeck&&typeof byDeck==='object'){
        Object.keys(byDeck).forEach(setKey=>{
          const bucket=byDeck[setKey]||{};
          Object.keys(bucket).forEach(id=>add(id,bucket[id]));
        });
      }
    }catch(_){}
    try{
      const raw=localStorage.getItem('k_state_v1_3_1')||localStorage.getItem('k_state_v1_3_0');
      const st=raw?JSON.parse(raw):null;
      const map=st&&st.stars;
      if(map&&typeof map==='object'){
        Object.keys(map).forEach(id=>{ if(String(id).indexOf(prefix)===0) add(id,map[id]); });
      }
    }catch(_){}
    return out;
  }
  function statsForKey(key){
    const mx=(A.Trainer&&A.Trainer.starsMax) ? A.Trainer.starsMax() : 5;
    const loaded=!!(window.decks&&Array.isArray(window.decks[key])&&window.decks[key].length);
    if(loaded){
      const deck=window.decks[key];
      let learned=0, started=0, stars=0;
      deck.forEach(w=>{ const s=Math.max(0,Math.min(mx,starValue(key,w))); stars+=s; if(s>=mx) learned++; if(s>0) started++; });
      return {total:deck.length,learned,started,stars,maxStars:deck.length*mx,pct:deck.length?Math.round(learned*100/deck.length):0};
    }
    const total=manifestCount(key);
    const map=persistedStarsForKey(key);
    let learned=0,started=0,stars=0;
    Object.keys(map).forEach(id=>{ const s=Math.max(0,Math.min(mx,Number(map[id]||0))); stars+=s; if(s>=mx) learned++; if(s>0) started++; });
    learned=Math.min(learned,total); started=Math.min(started,total); stars=Math.min(stars,total*mx);
    return {total,learned,started,stars,maxStars:total*mx,pct:total?Math.round(learned*100/total):0};
  }
  function langStats(lg){
    const keys=baseKeys().filter(k=>langOf(k)===lg);
    return keys.reduce((a,k)=>{ const s=statsForKey(k); a.total+=s.total;a.learned+=s.learned;a.started+=s.started;a.stars+=s.stars;a.maxStars+=s.maxStars;return a;},{total:0,learned:0,started:0,stars:0,maxStars:0});
  }
  function mistakeCount(lg){
    try { return (A.Mistakes&&A.Mistakes.listSummary?A.Mistakes.listSummary():[]).filter(x=>langOf(x.baseKey)===lg).reduce((n,x)=>n+(x.count||0),0); } catch(_){ return 0; }
  }
  function favoriteCount(lg){
    // Home only needs a counter. Reading Favorites.list() validates every saved
    // id against its source deck and therefore may lazy-load dictionaries during
    // first paint. Count the persisted v3 buckets directly instead.
    try {
      const tl=(String((A.settings&&(A.settings.lang||A.settings.uiLang))||'ru').toLowerCase()==='uk')?'uk':'ru';
      const v3=A.ensureFavoritesV3?A.ensureFavoritesV3():((A.state&&A.state.favorites_v3)||{});
      const scoped=v3[tl]||{};
      return Object.keys(scoped).reduce((n,key)=>{
        if(langOf(key)!==lg) return n;
        const map=scoped[key]||{};
        return n+Object.keys(map).reduce((m,id)=>m+(map[id]?1:0),0);
      },0);
    } catch(_){ return 0; }
  }
  function lastKeyForLang(lg){
    let k=(A.settings&&A.settings.lastDeckKey)||'';
    if(k && langOf(k)===lg && !/^(favorites|mistakes):/.test(k)) return k;
    return baseKeys().find(x=>langOf(x)===lg) || baseKeys()[0] || '';
  }
  function posLabel(pos){ return (uk()?POS_UK:POS_RU)[pos] || pos; }
  function setFooterActive(action){ document.querySelectorAll('.app-footer .nav-btn').forEach(b=>b.classList.toggle('active',b.getAttribute('data-action')===action)); }
  function route(action){ try { if(A.Router&&A.Router.routeTo) A.Router.routeTo(action); } catch(_){} }
  function startDeck(key){
    if(!key) return;
    try { A.settings=A.settings||{}; A.settings.lastDeckKey=key; A.settings.trainerKind='words'; A.saveSettings&&A.saveSettings(A.settings); } catch(_){}
    try { A.Trainer&&A.Trainer.setDeckKey&&A.Trainer.setDeckKey(key); } catch(_){}
    try { document.dispatchEvent(new CustomEvent('lexitron:deck-selected',{detail:{key}})); } catch(_){}
    route('trainer');
  }

  function continueTraining(key, lang){
    if(!key) return;
    const kind=String((A.settings&&A.settings.trainerKind)||'words').toLowerCase();
    const lg=String(lang||langOf(key)||currentLang()||'de').toLowerCase();

    if(kind==='prepositions'){
      try{
        const base=String(key||'');
        if(A.Prepositions&&typeof A.Prepositions.isAnyPrepositionsKey==='function'&&A.Prepositions.isAnyPrepositionsKey(base)){
          A.settings=A.settings||{};
          A.settings.trainerKind='prepositions';
          A.settings.lastDeckKey=base;
          A.saveSettings&&A.saveSettings(A.settings);
          A.Trainer&&A.Trainer.setDeckKey&&A.Trainer.setDeckKey(base);
          document.dispatchEvent(new CustomEvent('lexitron:deck-selected',{detail:{key:base}}));
          route('trainer');
          return;
        }
      }catch(_){}
      startTrainingKind('prepositions',lg);
      return;
    }

    if(kind==='articles'){
      try{
        const base=String(key||'').toLowerCase();
        if(base.startsWith('de_nouns')&&A.ArticlesTrainer&&A.ArticlesCard){
          A.settings=A.settings||{};
          A.settings.trainerKind='articles';
          A.settings.lastDeckKey=key;
          A.saveSettings&&A.saveSettings(A.settings);
          A.Trainer&&A.Trainer.setDeckKey&&A.Trainer.setDeckKey(key);
          document.dispatchEvent(new CustomEvent('lexitron:deck-selected',{detail:{key:key}}));
          route('trainer');
          return;
        }
      }catch(_){}
      startTrainingKind('articles',lg);
      return;
    }

    startDeck(key);
  }

  function startTrainingKind(kind, lang){
    const lg=String(lang||currentLang()||'de').toLowerCase();
    if(kind==='words'){
      startDeck(lastKeyForLang(lg));
      return;
    }

    if(kind==='articles'){
      if(lg!=='de' || !(A.ArticlesTrainer && A.ArticlesCard)) return;
      const nounKey=baseKeys().find(k=>langOf(k)==='de' && String(k).toLowerCase().startsWith('de_nouns'));
      if(!nounKey) return;
      try{
        A.settings=A.settings||{};
        A.settings.trainerKind='articles';
        A.settings.lastDeckKey=nounKey;
        A.saveSettings&&A.saveSettings(A.settings);
      }catch(_){}
      try{ A.Trainer&&A.Trainer.setDeckKey&&A.Trainer.setDeckKey(nounKey); }catch(_){}
      try{ document.dispatchEvent(new CustomEvent('lexitron:deck-selected',{detail:{key:nounKey}})); }catch(_){}
      route('trainer');
      return;
    }

    if(kind==='prepositions'){
      const src=(window.prepositionsTrainer&&window.prepositionsTrainer[lg])||null;
      const has=!!(src && (Array.isArray(src.patterns)?src.patterns.length:(Array.isArray(src)?src.length:(typeof src==='object'?Object.keys(src).length:0))));
      if(!has) return;
      const prepKey=lg+'_prepositions';
      try{
        A.settings=A.settings||{};
        A.settings.trainerKind='prepositions';
        A.settings.preferredReturnKey=A.settings.lastDeckKey||lastKeyForLang(lg);
        A.settings.lastDeckKey=prepKey;
        A.saveSettings&&A.saveSettings(A.settings);
      }catch(_){}
      try{ A.Trainer&&A.Trainer.setDeckKey&&A.Trainer.setDeckKey(prepKey); }catch(_){}
      try{ document.dispatchEvent(new CustomEvent('lexitron:deck-selected',{detail:{key:prepKey}})); }catch(_){}
      route('trainer');
    }
  }

  function availableTrainingKinds(lang){
    const lg=String(lang||'').toLowerCase();
    const out=['words'];
    try{
      if(lg==='de' && A.ArticlesTrainer && A.ArticlesCard && baseKeys().some(k=>String(k).toLowerCase().startsWith('de_nouns'))) out.push('articles');
    }catch(_){}
    try{
      const src=window.prepositionsTrainer&&window.prepositionsTrainer[lg];
      const has=!!(src && (Array.isArray(src.patterns)?src.patterns.length:(Array.isArray(src)?src.length:(typeof src==='object'?Object.keys(src).length:0))));
      if(has) out.push('prepositions');
    }catch(_){}
    return out;
  }

  function quickMode(mode){
    try {
      const setChecked=(id,val)=>{
        const el=document.getElementById(id);
        if(el) el.checked=!!val;
      };

      if(mode==='auto'){
        localStorage.setItem('mm.train.autostep','1');
        setChecked('trainAutostep',true);
      }

      if(mode==='reverse'){
        localStorage.setItem('mm.train.reverse','1');
        setChecked('trainReverse',true);
      }

      if(mode==='focus'){
        // Focus means HIDE both auxiliary blocks.
        // Burger checkboxes use the inverse semantics: checked = SHOW.
        localStorage.setItem('mm.focus.hideSets','1');
        localStorage.setItem('mm.focus.hideContext','1');
        document.body.classList.add('mm-focus-hide-sets');
        document.body.classList.add('mm-focus-hide-context');
        setChecked('focusSets',false);
        setChecked('focusContext',false);
      }
    } catch(_){}
    startDeck(lastKeyForLang(currentLang()));
  }
  function circle(p){ return `<div class="dash-ring" style="--p:${Math.max(0,Math.min(100,p||0))}"><span>${p||0}%</span></div>`; }

  function mount(){
    const app=document.getElementById('app'); if(!app) return;
    const lg=currentLang(); const ls=langStats(lg); const last=lastKeyForLang(lg); const lastS=statsForKey(last);
    const started=Math.max(0,ls.started-ls.learned); const mistakes=mistakeCount(lg); const favs=favoriteCount(lg);
    const overall=ls.total?Math.round(ls.learned*100/ls.total):0;
    const keys=baseKeys().filter(k=>langOf(k)===lg).sort((a,b)=>POS_ORDER.indexOf(posOf(a))-POS_ORDER.indexOf(posOf(b)));
    const POS=uk()?POS_UK:POS_RU;
    const T=uk()?{
      hello:'Готові вчитися?',sub:'Послідовність важливіша за інтенсивність.',overall:'Загальний прогрес',mastered:'Освоєно',inprogress:'У процесі',stars:'Зірок зароблено',continue:'Продовжити навчання',quick:'Швидкий старт',auto:'Авто',reverse:'Зворотний',focus:'Фокус',decks:'Словники за частинами мови',all:'Усі словники',errors:'Помилки',favorites:'Вибране',stats:'Статистика',dicts:'Словники',home:'Головна',trainer:'Тренажер',settings:'Налаштування',words:'слів',continueBtn:'Продовжити',choose:'Що будемо вчити?',chooseSub:'Оберіть режим тренування',trainWords:'Слова',trainWordsSub:'Переклад і словниковий запас',trainArticles:'Артиклі',trainArticlesSub:'Рід німецьких іменників',trainPreps:'Прийменники',trainPrepsSub:'Прийменники в контексті',startBtn:'Почати',tip:'Порада: краще трохи щодня, ніж багато зрідка.'
    }:{
      hello:'Готовы учиться?',sub:'Регулярность важнее интенсивности.',overall:'Общий прогресс',mastered:'Освоено',inprogress:'В процессе',stars:'Звёзд заработано',continue:'Продолжить обучение',quick:'Быстрый старт',auto:'Авто',reverse:'Обратный',focus:'Фокус',decks:'Словари по частям речи',all:'Все словари',errors:'Ошибки',favorites:'Избранное',stats:'Статистика',dicts:'Словари',home:'Главная',trainer:'Тренажёр',settings:'Настройки',words:'слов',continueBtn:'Продолжить',choose:'Что будем учить?',chooseSub:'Выберите режим тренировки',trainWords:'Слова',trainWordsSub:'Перевод и словарный запас',trainArticles:'Артикли',trainArticlesSub:'Род немецких существительных',trainPreps:'Предлоги',trainPrepsSub:'Предлоги в контексте',startBtn:'Начать',tip:'Совет: лучше понемногу каждый день, чем много изредка.'
    };
    const cards=keys.map(k=>{ const s=statsForKey(k), p=posOf(k); return `<button class="dash-deck" data-deck="${esc(k)}"><div class="dash-deck-top"><span class="dash-pos-icon">${POS_ICON[p]||'•'}</span><strong>${esc(POS[p]||p)}</strong></div>${circle(s.pct)}<div class="dash-deck-count">${s.learned} / ${s.total}</div></button>`; }).join('');
    const kindMeta={
      words:{icon:'Aa',title:T.trainWords,sub:T.trainWordsSub},
      articles:{icon:'der',title:T.trainArticles,sub:T.trainArticlesSub},
      prepositions:{icon:'→',title:T.trainPreps,sub:T.trainPrepsSub}
    };
    const trainingKinds=availableTrainingKinds(lg);
    const trainingCards=trainingKinds.map(kind=>{ const m=kindMeta[kind]; return `<button class="dash-training-card dash-training-card--${kind}" data-training-kind="${kind}"><i>${m.icon}</i><span><b>${m.title}</b><small>${m.sub}</small></span><em>${T.startBtn} →</em></button>`; }).join('');

    app.innerHTML=`<div class="dashboard" data-lang="${esc(lg)}">
      <aside class="dash-side">
        <div class="dash-brand"><img src="./img/logo_64.png" alt=""><div><strong>MOYAMOVA</strong><span>${esc(languageName(lg))}</span></div></div>
        <nav>
          <button class="is-active" data-route="home">⌂ <span>${T.home}</span></button>
          <button data-route="trainer">▶ <span>${T.trainer}</span></button>
          <button data-route="dicts">▤ <span>${T.dicts}</span></button>
          <button data-route="mistakes">△ <span>${T.errors}</span><b>${mistakes||''}</b></button>
          <button data-route="fav">♡ <span>${T.favorites}</span><b>${favs||''}</b></button>
          <button data-route="stats">▥ <span>${T.stats}</span></button>
        </nav>
        <div class="dash-side-foot">v${esc(A.APP_VER||'1.7.0')} · Offline <i></i></div>
      </aside>
      <section class="dash-main">
        <header class="dash-head"><div><div class="dash-eyebrow">${esc(languageName(lg))}</div><h2>${T.hello} 👋</h2><p>${T.sub}</p></div></header>
        <div class="dash-metrics">
          <article><span>${T.overall}</span>${circle(overall)}<b>${ls.learned} / ${ls.total}</b></article>
          <article><span>${T.mastered}</span><div class="dash-big dash-green">✓</div><b>${ls.learned}</b><small>${T.words}</small></article>
          <article><span>${T.inprogress}</span><div class="dash-big dash-blue">◫</div><b>${started}</b><small>${T.words}</small></article>
          <article><span>${T.stars}</span><div class="dash-big dash-gold">★</div><b>${Math.round(ls.stars)}</b><small>${ls.maxStars?Math.round(ls.stars*100/ls.maxStars):0}%</small></article>
        </div>
        <article class="dash-continue">
          <div class="dash-continue-copy"><span class="dash-section-label">${T.continue}</span><h3>${esc(A.Decks&&A.Decks.resolveNameByKey?A.Decks.resolveNameByKey(last):last)}</h3><div class="dash-progress"><i style="width:${lastS.pct}%"></i></div><p>${lastS.learned} / ${lastS.total} ${T.words} · ${lastS.pct}%</p></div>
          <div class="dash-flashcards">${(()=>{ const __deck=A.Decks.resolveDeckByKey(last)||[]; const __word=__deck[0]||{}; const __mx=(A.Trainer&&A.Trainer.starsMax)?A.Trainer.starsMax():5; const __stars=Math.max(0,Math.min(__mx,starValue(last,__word))); return `<span>${esc(__word.word||'Wort')}</span><small>★ ${Math.round(__stars)} / ${__mx}</small>`; })()}</div>
          <button class="dash-primary" data-continue>${T.continueBtn} →</button>
        </article>
        <section class="dash-learning">
          <div class="dash-learning-head"><div><h3>${T.choose}</h3><p>${T.chooseSub}</p></div></div>
          <div class="dash-training-grid dash-training-grid--${trainingKinds.length}">${trainingCards}</div>
        </section>
        <section class="dash-block dash-block--decks"><div class="dash-title"><button type="button" class="dash-decks-toggle" data-mobile-decks-toggle aria-expanded="false"><span>${T.decks}</span><i aria-hidden="true">⌄</i></button><button data-route="dicts">${T.all} →</button></div><div class="dash-decks" data-mobile-decks-panel>${cards}</div></section>
        <div class="dash-bottom"><button data-route="mistakes"><span>△</span><div><b>${T.errors}</b><small>${mistakes} ${T.words}</small></div><em>→</em></button><button data-route="fav"><span>♡</span><div><b>${T.favorites}</b><small>${favs} ${T.words}</small></div><em>→</em></button></div>
      </section>
    </div>`;

    app.querySelector('[data-mobile-decks-toggle]')?.addEventListener('click',(e)=>{
      if(!(window.matchMedia&&window.matchMedia('(max-width:899px)').matches)) return;
      const btn=e.currentTarget;
      const block=btn.closest('.dash-block--decks');
      const open=!block.classList.contains('is-open');
      block.classList.toggle('is-open',open);
      btn.setAttribute('aria-expanded',String(open));
    });
    app.querySelectorAll('[data-route]').forEach(el=>el.addEventListener('click',()=>route(el.getAttribute('data-route'))));
    app.querySelector('[data-continue]')?.addEventListener('click',()=>continueTraining(last,lg));
    app.querySelectorAll('[data-training-kind]').forEach(el=>el.addEventListener('click',()=>startTrainingKind(el.getAttribute('data-training-kind'),lg)));
    app.querySelectorAll('[data-deck]').forEach(el=>el.addEventListener('click',()=>startDeck(el.getAttribute('data-deck'))));
    app.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>quickMode(el.getAttribute('data-mode'))));
    app.querySelector('[data-open-menu]')?.addEventListener('click',()=>document.getElementById('btnMenu')?.click());
    setFooterActive('home');
    try{ if(A.PageTips&&A.PageTips.mount) requestAnimationFrame(()=>A.PageTips.mount()); }catch(_){}
  }

  A.HomeDashboard={mount,startDeck};
})();
