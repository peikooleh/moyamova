/* ==========================================================
 * MOYAMOVA — Daily Session / «Сегодня»
 * Adaptive short session over the existing trainer/progress model.
 * Daily completion is intentionally separate from global 5-star mastery:
 *   NEW      -> 2 spaced correct contacts today
 *   REVIEW   -> 1 correct contact today
 *   MISTAKE  -> 2 spaced correct contacts today
 * Any wrong / "don't know" forces the card to return later.
 * ========================================================== */
(function(){
  'use strict';
  const A = window.App || (window.App = {});

  const MAX_UNIQUE = 25;
  const TARGET_CONTACTS = 35;
  const COMPLETED_DATE_KEY = 'mm.daily.completedDate';

  function localDateKey(){
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  }
  function isCompletedToday(){
    try{ return localStorage.getItem(COMPLETED_DATE_KEY)===localDateKey(); }catch(_){ return false; }
  }
  function markCompletedToday(){
    try{ localStorage.setItem(COMPLETED_DATE_KEY,localDateKey()); }catch(_){}
  }
  const MAX_CONTACTS = 42;
  let active = null;

  function uiLang(){
    try { return String((A.settings && (A.settings.uiLang || A.settings.lang)) || 'ru').toLowerCase()==='uk' ? 'uk' : 'ru'; }
    catch(_){ return 'ru'; }
  }
  function langOfKey(k){
    try { return (A.Decks && A.Decks.langOfKey && A.Decks.langOfKey(k)) || String(k||'').split('_')[0] || 'de'; }
    catch(_){ return String(k||'').split('_')[0] || 'de'; }
  }
  function currentLang(){
    try {
      const k=(A.settings&&A.settings.lastDeckKey)||'';
      const lg=langOfKey(k);
      if(lg) return lg;
    } catch(_){}
    return 'de';
  }
  function baseKeys(lg){
    try{
      const all=(window.DeckLoader&&DeckLoader.availableKeys)?DeckLoader.availableKeys():[];
      return all.filter(k=>langOfKey(k)===lg && !/_lernpunkt$/i.test(k) && !/^favorites:|^mistakes:|_trainer$/i.test(k));
    }catch(_){ return []; }
  }
  function starKey(id,key){ return A.starKey ? A.starKey(id,key) : `${key}:${id}`; }
  function starsMax(){
    try { return (A.Trainer&&A.Trainer.starsMax)?Number(A.Trainer.starsMax()||5):5; }
    catch(_){ return 5; }
  }
  function starOf(key,w){
    try { return Number((A.state&&A.state.stars&&A.state.stars[starKey(w.id,key)])||0)||0; }
    catch(_){ return 0; }
  }
  function seenOf(key,w){
    try { return Number((A.state&&A.state.lastSeen&&A.state.lastSeen[starKey(w.id,key)])||0)||0; }
    catch(_){ return 0; }
  }
  function mistakeInfo(trainLang,key,id){
    try{
      const b=A.mistakes&&A.mistakes.buckets&&A.mistakes.buckets[trainLang]&&A.mistakes.buckets[trainLang][key];
      if(!b||!b.ids||!b.ids.has(String(id))) return null;
      return (b.meta&&b.meta.get&&b.meta.get(String(id))) || {count:1,last:0};
    }catch(_){ return null; }
  }
  function cloneForDaily(w,key,type){
    const c=Object.assign({},w);
    c._dailySourceKey=key;
    c._dailySourceType=type;
    c._dailyOriginalId=w.id;
    c._dailyInitialStars=starOf(key,w);
    // Daily mixes several source decks; make UI ids collision-proof while
    // keeping the canonical id for progress/mistakes/favorites.
    c.id=key+'::'+String(w.id);
    return c;
  }
  function tokenOf(w){
    return String((w&&w._dailySourceKey)||'')+'::'+String((w&&w.id)||'');
  }
  function uniquePush(out,seen,item){
    if(!item) return false;
    const k=tokenOf(item);
    if(seen.has(k)) return false;
    seen.add(k); out.push(item); return true;
  }
  function shuffle(arr){
    const a=arr.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i];a[i]=a[j];a[j]=t; }
    return a;
  }
  function randomGap(min,max){
    min=Math.max(1,Number(min||1)); max=Math.max(min,Number(max||min));
    return min+Math.floor(Math.random()*(max-min+1));
  }
  function targetForType(type){ return type==='review' ? 1 : 2; }
  function expectedContacts(plan){
    return (Number(plan.review||0)) + 2*(Number(plan.newWords||0)+Number(plan.mistakes||0));
  }

  /*
   * Daily quota is based on expected answer contacts rather than only unique
   * cards. This keeps the session short after NEW/MISTAKE cards began requiring
   * a second spaced success.
   */
  function preview(lg){
    lg=lg||currentLang();
    const tl=uiLang();
    const keys=baseKeys(lg);
    let started=0, learned=0, mistakes=0, total=0;
    const mx=starsMax();

    keys.forEach(key=>{
      try{
        const e=window.DeckLoader&&DeckLoader.getEntry?DeckLoader.getEntry(key):null;
        total+=e?Number(e.count||0):0;
      }catch(_){}
      try{
        const prefix=key+':';
        Object.keys((A.state&&A.state.stars)||{}).forEach(sk=>{
          if(String(sk).indexOf(prefix)!==0) return;
          const s=Number(A.state.stars[sk]||0)||0;
          if(s>0) started++;
          if(s>=mx) learned++;
        });
      }catch(_){}
      try{
        const b=A.mistakes&&A.mistakes.buckets&&A.mistakes.buckets[tl]&&A.mistakes.buckets[tl][key];
        mistakes+=b&&b.ids?b.ids.size:0;
      }catch(_){}
    });

    const newAvail=Math.max(0,total-started);
    // 5-star words remain valid review material (oldest first in build()).
    // This prevents Daily Session from shrinking to zero after a deck is mastered.
    const reviewAvail=Math.max(0,started);

    let m=Math.min(5,mistakes);
    let n=0;
    if(newAvail>0){
      // Daily should feel like a real short lesson, not a 10-click checklist.
      // Established learners get 7–8 fresh words; a brand-new learner gets 15.
      n=Math.min(newAvail, started===0 ? 15 : 8);
      if(started>0) n=Math.max(Math.min(7,newAvail),n);
    }

    let contacts=2*(m+n);
    let room=Math.max(0,MAX_UNIQUE-m-n);
    let r=Math.min(reviewAvail,room,Math.max(0,TARGET_CONTACTS-contacts));
    contacts+=r;

    // If review is scarce, add a couple more fresh words (still capped at 10).
    while(contacts<TARGET_CONTACTS && n<newAvail && n<10 && (m+n+r)<MAX_UNIQUE && (contacts+2)<=MAX_CONTACTS){
      n++; contacts+=2;
    }
    // Then use any remaining unique-card slots for reviews.
    while(contacts<TARGET_CONTACTS && r<reviewAvail && (m+n+r)<MAX_UNIQUE){
      r++; contacts++;
    }

    // Brand-new/small dictionaries should not be padded artificially.
    if(started===0 && mistakes===0 && newAvail>0){
      m=0; r=0; n=Math.min(15,newAvail); contacts=2*n;
    }

    let unique=Math.min(MAX_UNIQUE,m+n+r);
    if(unique===0 && total>0){ n=Math.min(15,total); unique=n; contacts=2*n; }
    const minutes=Math.max(3,Math.round(contacts*0.17));
    return {
      lang:lg,review:r,newWords:n,mistakes:m,total:unique,
      expectedContacts:contacts,minutes,learned
    };
  }

  async function loadDeck(key){
    try{
      if(window.DeckLoader&&typeof DeckLoader.load==='function') return await DeckLoader.load(key);
      return (A.Decks&&A.Decks.resolveDeckByKey)?(A.Decks.resolveDeckByKey(key)||[]):[];
    }catch(_){ return []; }
  }

  async function build(lg){
    lg=lg||currentLang();
    const tl=uiLang();
    const plan=preview(lg);
    const keys=baseKeys(lg);
    const last=(A.settings&&A.settings.lastDeckKey)||'';
    const mx=starsMax();
    keys.sort((a,b)=>(a===last?-1:b===last?1:0));

    const mistakes=[]; const reviews=[]; const fresh=[];
    for(const key of keys){
      const deck=await loadDeck(key);
      for(const w of deck){
        if(!w||w.id==null) continue;
        const mi=mistakeInfo(tl,key,w.id);
        const s=starOf(key,w);
        if(mi){ mistakes.push({w,key,count:Number(mi.count||1),last:Number(mi.last||0),s}); continue; }
        if(s>0) reviews.push({w,key,s,last:seenOf(key,w),mastered:s>=mx});
        else fresh.push({w,key,last:seenOf(key,w)});
      }
    }

    mistakes.sort((a,b)=>(b.count-a.count)||(b.last-a.last));
    // First strengthen unfinished words, then recycle mastered words by oldest lastSeen.
    reviews.sort((a,b)=>(Number(a.mastered)-Number(b.mastered))||(a.last-b.last)||(a.s-b.s));
    fresh.sort((a,b)=>((a.key===last?-1:0)-(b.key===last?-1:0))||(a.last-b.last));

    const out=[]; const seen=new Set();
    shuffle(mistakes.slice(0,Math.max(plan.mistakes,8))).slice(0,plan.mistakes).forEach(x=>uniquePush(out,seen,cloneForDaily(x.w,x.key,'mistake')));
    reviews.slice(0,plan.review).forEach(x=>uniquePush(out,seen,cloneForDaily(x.w,x.key,'review')));
    fresh.slice(0,plan.newWords).forEach(x=>uniquePush(out,seen,cloneForDaily(x.w,x.key,'new')));

    // Fill only if metadata under-estimated availability; respect the compact ceiling.
    const fill=[...reviews.slice(plan.review),...fresh.slice(plan.newWords),...mistakes.slice(plan.mistakes)];
    const wanted=Math.min(MAX_UNIQUE,Math.max(out.length,plan.total));
    for(const x of fill){
      if(out.length>=wanted) break;
      uniquePush(out,seen,cloneForDaily(x.w,x.key,x.s!=null?'review':(x.count!=null?'mistake':'new')));
    }

    // Interleave categories so fresh words do not appear as one solid block.
    const groups={mistake:[],review:[],new:[]};
    out.forEach(w=>(groups[w._dailySourceType]||groups.review).push(w));
    groups.mistake=shuffle(groups.mistake); groups.review=shuffle(groups.review); groups.new=shuffle(groups.new);
    const mixed=[];
    while(mixed.length<out.length){
      if(groups.review.length) mixed.push(groups.review.shift());
      if(groups.new.length) mixed.push(groups.new.shift());
      if(groups.review.length) mixed.push(groups.review.shift());
      if(groups.mistake.length) mixed.push(groups.mistake.shift());
      if(groups.new.length) mixed.push(groups.new.shift());
    }

    const finalQueue=mixed.slice(0,MAX_UNIQUE);
    const finalPlan={
      lang:lg,
      review:finalQueue.filter(w=>w._dailySourceType==='review').length,
      newWords:finalQueue.filter(w=>w._dailySourceType==='new').length,
      mistakes:finalQueue.filter(w=>w._dailySourceType==='mistake').length,
      total:finalQueue.length
    };
    finalPlan.expectedContacts=expectedContacts(finalPlan);
    finalPlan.minutes=Math.max(3,Math.round(finalPlan.expectedContacts*0.17));
    return {queue:finalQueue,plan:finalPlan};
  }

  function initItemState(queue){
    const items=new Map();
    queue.forEach((w,idx)=>{
      const token=tokenOf(w);
      const type=w._dailySourceType||'review';
      items.set(token,{
        token,type,index:idx,target:targetForType(type),credit:0,
        complete:false,dueAt:0,wrongThisTurn:false,wrongCount:0,
        lastAnswered:-1
      });
    });
    return items;
  }

  async function start(lg){
    if(active&&active.queue&&active.queue.length) return false;
    const built=await build(lg||currentLang());
    if(!built.queue.length) return false;
    const returnKey=(A.settings&&A.settings.lastDeckKey)||built.queue[0]._dailySourceKey;
    active={
      key:'daily:'+built.plan.lang,
      queue:built.queue,
      done:new Set(),
      items:initItemState(built.queue),
      returnKey,plan:built.plan,startedAt:Date.now(),
      turn:0,lastToken:null,cursor:0
    };
    try{
      A.settings=A.settings||{}; A.settings.trainerKind='words';
      if(typeof A.saveSettings==='function') A.saveSettings(A.settings);
    }catch(_){}
    if(A.Trainer&&typeof A.Trainer.setCustomDeck==='function') A.Trainer.setCustomDeck(active.key,active.queue,{silent:true});
    try{ document.dispatchEvent(new CustomEvent('lexitron:daily-start',{detail:built.plan})); }catch(_){}
    return true;
  }

  function isDailyKey(k){ return /^daily:[a-z]{2}$/i.test(String(k||'')); }
  function resolve(k){ return active&&String(k)===active.key ? active.queue : []; }
  function sourceKey(word,fallback){ return (word&&word._dailySourceKey)||fallback; }
  function sourceId(word,fallback){ return (word&&word._dailyOriginalId!=null)?word._dailyOriginalId:fallback; }

  function stateFor(word){
    if(!active||!word) return null;
    return active.items.get(tokenOf(word))||null;
  }

  function sampleNextIndex(deck){
    if(!active||!deck||!deck.length) return 0;
    const turn=active.turn|0;
    const n=deck.length;
    const start=Math.max(0,active.cursor|0)%n;
    let fallback=-1, fallbackDue=Infinity;

    for(let off=0;off<n;off++){
      const i=(start+off)%n;
      const w=deck[i]; const st=stateFor(w);
      if(!st||st.complete) continue;
      if(st.dueAt<fallbackDue){ fallback=i; fallbackDue=st.dueAt; }
      if(st.dueAt<=turn && st.token!==active.lastToken){
        active.cursor=(i+1)%n;
        return i;
      }
    }
    // If only one card remains, or every pending card is intentionally delayed,
    // choose the earliest-due item instead of stalling the trainer.
    if(fallback>=0){ active.cursor=(fallback+1)%n; return fallback; }
    return 0;
  }

  function schedule(st,min,max){
    if(!active||!st) return;
    st.dueAt=(active.turn|0)+randomGap(min,max);
  }

  function markWrong(word){
    const st=stateFor(word);
    if(!st||st.complete) return;
    st.credit=0;
    st.wrongThisTurn=true;
    st.wrongCount++;
    active.done.delete(st.token);
  }

  function markCorrect(word){
    const st=stateFor(word);
    if(!st||st.complete) return;
    active.turn++;
    active.lastToken=st.token;
    st.lastAnswered=active.turn;

    if(st.wrongThisTurn){
      // The immediate correction on the same card is useful feedback but is not
      // counted as a spaced successful contact. The word must return later.
      st.wrongThisTurn=false;
      st.credit=0;
      schedule(st,3,6);
      return;
    }

    st.credit++;
    if(st.credit>=st.target){
      st.complete=true;
      active.done.add(st.token);
      return;
    }
    // NEW/MISTAKE require another correct contact, separated by other cards.
    schedule(st,2,4);
  }

  function markDontKnow(word){
    const st=stateFor(word);
    if(!st||st.complete) return;
    active.turn++;
    active.lastToken=st.token;
    st.lastAnswered=active.turn;
    st.credit=0;
    st.wrongThisTurn=false;
    st.wrongCount++;
    active.done.delete(st.token);
    schedule(st,3,6);
  }

  // Backward-compatible alias: older UI patches called markDone() on a correct answer.
  function markDone(word){ markCorrect(word); }

  function progress(){
    if(!active) return null;
    let contactsDone=0,contactsTarget=0;
    active.items.forEach(st=>{ contactsDone+=Math.min(st.credit,st.target); contactsTarget+=st.target; });
    return {done:active.done.size,total:active.queue.length,plan:active.plan,contactsDone,contactsTarget};
  }
  function isComplete(){ return !!(active&&active.queue.length&&active.done.size>=active.queue.length); }
  function finish(){
    if(!active) return null;
    const old=active; active=null;
    const result=Object.assign({},old.plan,{
      elapsedMinutes:Math.max(1,Math.ceil(Math.max(0,Date.now()-Number(old.startedAt||Date.now()))/60000))
    });
    markCompletedToday();
    try{ if(A.Trainer&&typeof A.Trainer.setDeckKey==='function'&&old.returnKey) A.Trainer.setDeckKey(old.returnKey,{silent:true}); }catch(_){}
    try{ document.dispatchEvent(new CustomEvent('lexitron:daily-finish',{detail:result})); }catch(_){}
    return result;
  }
  function current(){ return active; }

  A.DailySession={
    preview,build,start,isDailyKey,resolve,sourceKey,sourceId,sampleNextIndex,
    markDone,markCorrect,markWrong,markDontKnow,progress,isComplete,finish,current,isCompletedToday
  };
})();
