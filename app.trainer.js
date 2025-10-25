/* ==========================================================
 * Project: MOYAMOVA
 * File: app.trainer.js
 * Purpose: Логика приложения (JS)
 * Version: 1.0
 * Last modified: 2025-10-19
*/


/* ==========================================================
 * TRAINER CONFIG (MOYAMOVA)
 * ----------------------------------------------------------
 * Настройка частоты показа уже выученных слов.
 *
 * Возможные режимы:
 *   'never'  → 0       — выученные слова не повторяются вовсе
 *   'ultra'  → 0.001   — крайне редко, ~0.1%
 *   'rare'   → 0.01    — редко, ~1%
 *   'normal' → 0.05    — умеренно часто, ~5%
 *
 * Можно также задать числом от 0 до 0.2.
 *   Чем БОЛЬШЕ значение → тем ЧАЩЕ тренер подмешивает выученные слова.
 *   Чем МЕНЬШЕ значение → тем РЕЖЕ (до полного отключения при 0).
 *
 * Чтобы изменить поведение — просто поменяй строку ниже.
 * Например:
 *   const TRAINER_DEFAULT_LEARNED_REPEAT = 'rare';
 *   или
 *   const TRAINER_DEFAULT_LEARNED_REPEAT = 0.002;
 * ========================================================== */
const TRAINER_DEFAULT_LEARNED_REPEAT = 'never'; // ← переключай режим здесь
(function(){
  const App = window.App || (window.App = {});

  function starsMax(){ return 5; }
  // Использует App.settings.learnedRepeat, если задано; иначе — TRAINER_DEFAULT_LEARNED_REPEAT
  function getLearnedEpsilon(){
    try{
      var pref = (window.App && App.settings && (App.settings.learnedRepeat!=null))
        ? App.settings.learnedRepeat
        : (typeof TRAINER_DEFAULT_LEARNED_REPEAT!=='undefined' ? TRAINER_DEFAULT_LEARNED_REPEAT : 'never');
      if (typeof pref === 'number') return Math.max(0, Math.min(0.2, pref));
      switch(String(pref||'never').toLowerCase()){
        case 'normal': return 0.05;
        case 'rare':   return 0.01;
        case 'ultra':  return 0.001;
        case 'never':
        default:       return 0;
      }
    }catch(_){ return 0; }
  }
  function unlockThreshold(){ try{ return (App.Config && App.Config.reverseThreshold) || 2.5; }catch(_){ return 2.5; } }
  function isLearned(w){
    try{
      const sMax = starsMax();
      const key = (App && typeof App.starKey==='function') ? App.starKey(w.id) : String(w.id);
      const s = Math.max(0, Math.min(sMax, (App.state && App.state.stars && App.state.stars[key]) || 0));
      return s >= sMax;
    }catch(_){ return false; }
  }

  function weightForWord(w){
    try{
      const sMax = starsMax();
      const key = (App && typeof App.starKey==='function') ? App.starKey(w.id) : String(w.id);
      const s = Math.max(0, Math.min(sMax, (App.state && App.state.stars && App.state.stars[key]) || 0));
      const last = (App.state && App.state.lastSeen && App.state.lastSeen[key]) || 0;
      const elapsedMin = Math.max(0, (Date.now() - last)/60000);
      const recency = Math.min(elapsedMin/3, 5);

      if (s >= sMax) {
        const eps = getLearnedEpsilon();
        return eps > 0 ? (eps * (1 + recency*0.2)) : 0;
      }

      const deficit = (sMax - s);
      let wgt = Math.max(0.1, 1 + 2*deficit + recency);

      if (App.Penalties && typeof App.Penalties.weightFor === 'function') {
        try { wgt *= Math.max(1, App.Penalties.weightFor(w.id)); } catch(_){}
      }
      return wgt;
    }catch(_){ return 1; }
  }

  function sampleNextIndexWeighted(deck){
    if (!deck || !deck.length) return 0;
    const forbidden = (App.state && App.state.lastIndex);
    let total = 0;
    const weights = new Array(deck.length);
    let eligibleCount = 0;
    for (let i=0;i<deck.length;i++){
      const w = deck[i];
      let base = weightForWord(w);
      if (base > 0) eligibleCount++;
      if (forbidden === i) base *= 0.0001;
      weights[i] = base;
      total += base;
    }
    if (eligibleCount === 0 || total <= 0) { return 0; }
    let r = Math.random()*total;
    for (let i=0;i<deck.length;i++){
      r -= weights[i];
      if (r <= 0) return i;
    }
    return Math.floor(Math.random()*deck.length);
  }

  function getSetSize(/*deckKey*/){
    try{ return (App.Config && App.Config.setSizeDefault) || 50; }catch(_){ return 50; }
  }
  function activeKey(){
    try { return (App.dictRegistry && App.dictRegistry.activeKey) || null; } catch(_){ return null; }
  }
  function resolveDeckByKey(key){
    try{
      return (App.Decks && App.Decks.resolveDeckByKey)
        ? (App.Decks.resolveDeckByKey(key) || [])
        : [];
    }catch(_){ return []; }
  }

  function getBatchIndex(deckKey, totalOpt){
    const key = deckKey || activeKey();
    const setSize = getSetSize();
    let total = totalOpt;
    if (!Number.isFinite(total)) {
      const deck = resolveDeckByKey(key);
      total = Math.max(1, Math.ceil(deck.length / setSize));
    }
    App.state = App.state || {};
    App.state.setByDeck = App.state.setByDeck || {};
    let idx = App.state.setByDeck[key] | 0;
    if (idx < 0) idx = 0;
    if (total > 0 && idx >= total) idx = total - 1;
    return idx;
  }

  function setBatchIndex(i, deckKey){
    const key = deckKey || activeKey();
    const setSize = getSetSize();
    const deck = resolveDeckByKey(key);
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    let idx = (i|0);
    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;
    App.state = App.state || {};
    App.state.setByDeck = App.state.setByDeck || {};
    App.state.setByDeck[key] = idx;
    if (typeof App.saveState === 'function') App.saveState();
    return idx;
  }

  function getBatchesMeta(deckKey){
    const key = deckKey || activeKey();
    const deck = resolveDeckByKey(key);
    const setSize = getSetSize();
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    const active = getBatchIndex(key, total);
    const completed = new Array(total).fill(false);
    const stars = (App && App.state && App.state.stars) || {};
    const repeats = starsMax();
    for (let i=0;i<total;i++){
      const start = i * setSize;
      const end = Math.min(deck.length, start + setSize);
      let done = (end > start);
      for (let j=start; j<end; j++){
        const w = deck[j];
        if (!w) { done = false; break; }
        try {
          const key = (App && typeof App.starKey==='function') ? App.starKey(w.id, key) : String(w.id);
          const s = Math.max(0, Math.min(repeats, stars[key] || 0));
          if (s < repeats){ done = false; break; }
        } catch(_){ done = false; break; }const s = stars[w.id] || 0;
        if (s < repeats) { done = false; break; }
      }
      completed[i] = done;
    }
    return { total, active, completed };
  }

  function getDeckSlice(deckKey){
    const key = deckKey || activeKey();
    const deck = resolveDeckByKey(key);
    const setSize = getSetSize();
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    const idx = getBatchIndex(key, total);
    const start = idx * setSize;
    const end = Math.min(deck.length, start + setSize);
    const slice = deck.slice(start, end);
    const eligible = slice.filter(w => !isLearned(w));
    return (eligible.length ? eligible : slice.length ? slice : deck);
  }

  var _recentShown = []; var _K = 5;
  function rememberShown(id){
    try{
      if (id==null) return;
      id = String(id);
      var i = _recentShown.indexOf(id);
      if (i>=0) _recentShown.splice(i,1);
      _recentShown.push(id);
      while(_recentShown.length>_K) _recentShown.shift();
    }catch(_){}
  }

  App.Trainer = Object.assign({}, App.Trainer || {}, {
    starsMax,
    unlockThreshold,
    sampleNextIndexWeighted,
    getSetSize,
    getBatchIndex,
    setBatchIndex,
    getBatchesMeta,
    getDeckSlice,
    rememberShown: rememberShown,
    _recentShown: _recentShown
  });
})();

/* ====================== End of file =======================
 * File: app.trainer.js • Version: 1.0 • 2025-10-19
*/
