/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: home.js
 * Назначение: Стартовый экран приложения и выбор активного словаря
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function () {
  'use strict';
  const A = (window.App = window.App || {});

  /* ----------------------------- Константы ----------------------------- */
  const ACTIVE_KEY_FALLBACK = 'de_verbs';
  // IMPORTANT:
  // Set size is not global: Lernpunkt must be split by 10, base dictionaries by 40.
  // Home screen previously used a single fixed set size, which caused incorrect
  // set counts, stats, and "done" marking for *_lernpunkt decks.
  const SET_SIZE_DEFAULT = (A.Config && A.Config.setSizeDefault) || 40;

  function getSetSizeForKey(key){
    const k = String(key || '').toLowerCase();
    try {
      if (isPrepositionsModeForKey(key)) return 30;
    } catch(_){ }

    try {
      // Prefer canonical logic from the trainer (it already supports virtual keys).
      if (A.Trainer && typeof A.Trainer.getSetSize === 'function') {
        const n = Number(A.Trainer.getSetSize(key));
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch(_){ }

    // Fallback for early boot / safe usage.
    if (k.endsWith('_lernpunkt')) return 10;
    return SET_SIZE_DEFAULT;
  }

  /* ---------------------------- Вспомогательное ожидание ---------------------------- */
  function waitForDecksReady(maxWaitMs = 2000) {
    return new Promise(resolve => {
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      (function tick(){
        try{
          if (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') {
            const decks = (window.decks && typeof window.decks === 'object') ? window.decks : {};
            const ok = Object.keys(decks).some(k => Array.isArray(decks[k]) && decks[k].length > 0);
            if (ok) return resolve(true);
          }
        }catch(_){}
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now - t0 > maxWaitMs) return resolve(false);
        (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(tick, 16);
      })();
    });
  }

  /* ---------------------------- Язык/строки ---------------------------- */
  function getUiLang() {
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || null;
    const attr = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const v = (s || attr || 'ru').toLowerCase();
    return (v === 'uk') ? 'uk' : 'ru';
  }

  // Показываем фильтры только в установленном режиме (PWA/TWA).
  // В браузере места меньше, и UX становится хрупким.
  function isPwaOrTwaRunmode(){
    try {
      const rm = String(document.documentElement.getAttribute('data-runmode') || document.documentElement.dataset.runmode || '').toLowerCase();
      if (rm === 'pwa') return true;
    } catch(_){ }
    try {
      // Android TWA: start_url adds ?twa=1
      if (/(?:\?|&)twa=1(?:&|$)/.test(String(window.location.search || ''))) return true;
    } catch(_){ }
    return false;
  }

  
  // Подсчет "выученности" в режиме артиклей: считаем отдельно, не смешивая со словами.
  function countLearnedArticles(words, deckKey){
    try{
      if (!words || !words.length) return 0;
      const P = A.ArticlesProgress;
      if (!P || typeof P.getStars !== 'function') return 0;
      const max = (typeof P.starsMax === 'function') ? P.starsMax() : 5;
      let learned = 0;
      for (let i=0;i<words.length;i++){
        const w = words[i];
        const have = Number(P.getStars(deckKey, w.id) || 0) || 0;
        if (have >= max) learned++;
      }
      return learned;
    }catch(_){
      return 0;
    }
  }

  // Обновляет строку статистики под карточкой (1:1 с обычным тренером по месту/формату),
  // но источник цифр зависит от режима: words vs articles.
function setUiLang(code){
    const lang = (code === 'uk') ? 'uk' : 'ru';
    A.settings = A.settings || {};
    A.settings.lang = lang;
    if (typeof A.saveSettings === 'function') { try { A.saveSettings(A.settings); } catch(_){} }
    document.documentElement.dataset.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    const ev = new Event('lexitron:ui-lang-changed');
    try { document.dispatchEvent(ev); } catch(_){}
    try { window.dispatchEvent(ev); } catch(_){}
  }


  // Текущий язык интерфейса для аналитики
  function getCurrentUiLang() {
    try {
      return getUiLang();
    } catch (_){
      return 'ru';
    }
  }

  // Текущий язык обучения (de/en/...) для аналитики
  function getCurrentLearnLang() {
    try {
      if (A.Decks && typeof A.Decks.langOfKey === 'function') {
        let dk = null;

        if (A.Trainer && typeof A.Trainer.getDeckKey === 'function') {
          dk = A.Trainer.getDeckKey();
        } else if (A.settings && A.settings.lastDeckKey) {
          dk = A.settings.lastDeckKey;
        }

        if (!dk && typeof firstAvailableBaseDeckKey === 'function') {
          dk = firstAvailableBaseDeckKey();
        }

        if (dk) {
          return A.Decks.langOfKey(dk) || null;
        }
      }
    } catch (_){}

    return null;
  }

  function tUI() {
    const uk = getUiLang() === 'uk';
    return uk
      ? { hints: 'Підказки', choose: 'Оберіть переклад', idk: 'Не знаю', fav: 'У вибране' }
      : { hints: 'Подсказки', choose: 'Выберите перевод', idk: 'Не знаю', fav: 'В избранное' };
  }

  // ----------------------------- Filters helpers -----------------------------
  // Batch index helpers (use trainer API directly; keep names stable for home.js).
  function getActiveBatchIndex(){
    try { return (A.Trainer && typeof A.Trainer.getBatchIndex === 'function') ? (A.Trainer.getBatchIndex(activeDeckKey()) || 0) : 0; } catch(_){ return 0; }
  }
  function setActiveBatchIndex(i){
    try { if (A.Trainer && typeof A.Trainer.setBatchIndex === 'function') A.Trainer.setBatchIndex(Number(i||0), activeDeckKey()); } catch(_){ }
  }

  function getStudyLangForKey(deckKey){
    try {
      if (A.Filters && typeof A.Filters.getStudyLangFromDeckKey === 'function') {
        return A.Filters.getStudyLangFromDeckKey(deckKey) || null;
      }
    } catch(_){}
    try {
      if (A.Decks && typeof A.Decks.langOfKey === 'function') return A.Decks.langOfKey(deckKey) || null;
    } catch(_){}
    try {
      const s = localStorage.getItem('lexitron.studyLang');
      if (s) return String(s).trim().toLowerCase();
    } catch(_){}
    return null;
  }

  function isArticlesModeForKey(deckKey){
    try {
      const base = extractBaseFromVirtual(deckKey) || deckKey;
      return !!(A.settings && A.settings.trainerKind === 'articles')
        && String(base || '').toLowerCase().startsWith('de_nouns');
    } catch(_){}
    return false;
  }


  function isPrepositionsModeForKey(deckKey){
    try {
      const base = extractBaseFromVirtual(deckKey) || deckKey;
      return !!(A.settings && A.settings.trainerKind === 'prepositions')
        && /^([a-z]{2})_prepositions$/i.test(String(base || '').trim());
    } catch(_){}
    return false;
  }

  function getTrainableDeckForKey(deckKey){
    const isPrep = isPrepositionsModeForKey(deckKey);
    const mode = isPrep ? 'prepositions' : (isArticlesModeForKey(deckKey) ? 'articles' : 'words');

    // MOYAMOVA: virtual decks → ignore filters completely
    if (isVirtualDeckKey(deckKey)) {
      try {
        return (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') ? (A.Decks.resolveDeckByKey(deckKey) || []) : [];
      } catch(_){}
      return [];
    }

    try {
      if (A.Filters && typeof A.Filters.getTrainableDeck === 'function') {
        return A.Filters.getTrainableDeck(deckKey, { mode }) || [];
      }
    } catch(_){}
    try {
      return (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') ? (A.Decks.resolveDeckByKey(deckKey) || []) : [];
    } catch(_){}
    return [];
  }

  // ------------------------ Guards: filters vs trainer options ------------------------
  // Prevent cases where applying filters during training leaves too few options:
  // - Word trainer requires 4 answer buttons (1 correct + 3 distractors)
  // - Articles trainer requires presence of der/die/das in the filtered pool
  const __lastValidFilterStateByStudyLang = Object.create(null);

  function __normLabel(s){
    return String(s || '').trim().replace(/\s+/g,' ').toLowerCase();
  }

  function __getAnswerLabelForOption(w){
    // Same source as buttons: tWord(w) -> ru/uk translation shown to user
    try { return String(tWord(w) || '').trim(); } catch(_){ return ''; }
  }

  function __parseArticleFromWord(w){
    let raw = '';
    try { raw = (w && (w.word || w.term || w.de || '')) || ''; } catch(_){ raw = ''; }
    raw = String(raw || '').trim().toLowerCase();
    const first = raw.split(/\s+/)[0] || '';
    if (first === 'der' || first === 'die' || first === 'das') return first;
    return '';
  }

  function __eligibleWordCountForOptions(deck){
    // We can disambiguate duplicate labels (adding (term) / (#n)), so we only need
    // enough distinct WORDS with non-empty base label.
    try{
      const seen = new Set();
      let n = 0;
      for (const w of (deck || [])){
        if (!w || w.id == null) continue;
        const id = String(w.id);
        if (seen.has(id)) continue;
        const base = __getAnswerLabelForOption(w);
        if (!base) continue;
        seen.add(id);
        n++;
        if (n >= 4) break;
      }
      return n;
    }catch(_){
      return 0;
    }
  }

  function __validateTrainingFeasibilityForKey(deckKey){
    const key = deckKey;
    const isArticles = isArticlesModeForKey(key);
    const deck = getTrainableDeckForKey(key) || [];
    const ui = (typeof getUiLang === 'function') ? getUiLang() : 'ru';

    if (isArticles) {
      const s = new Set();
      for (const w of deck){
        const a = __parseArticleFromWord(w);
        if (a) s.add(a);
        if (s.size >= 3) break;
      }
      if (s.size >= 3) return { ok:true };

      const msg = (ui === 'uk')
        ? 'Недостатньо слів з різними артиклями для тренування (потрібно der/die/das). Оберіть інші фільтри.'
        : 'Недостаточно слов с разными артиклями для тренировки (нужно der/die/das). Выберите другие фильтры.';
      return { ok:false, reason:'articles', msg };
    }

    const eligible = __eligibleWordCountForOptions(deck);
    if (eligible >= 4) return { ok:true };

    const msg = (ui === 'uk')
      ? `Недостатньо слів для тренування: потрібно мінімум 4 варіанти відповіді (зараз ${eligible}). Оберіть інші фільтри.`
      : `Недостаточно слов для тренировки: нужно минимум 4 варианта ответа (сейчас ${eligible}). Выберите другие фильтры.`;
    return { ok:false, reason:'words', msg, count: eligible };
  }

  function __rememberLastValidFilterState(studyLang){
    try {
      if (A.Filters && typeof A.Filters.getState === 'function') {
        const st = A.Filters.getState(studyLang || 'xx');
        __lastValidFilterStateByStudyLang[String(studyLang||'xx').toLowerCase()] = {
          enabled: !!(st && st.enabled),
          selected: (st && st.selected) ? st.selected.slice() : []
        };
      }
    } catch(_){}
  }

  function __restoreFilterState(studyLang, st){
    try {
      if (!A.Filters || typeof A.Filters.setLevels !== 'function') return;
      const sel = (st && st.selected) ? st.selected.slice() : [];
      A.Filters.setLevels(studyLang, sel);
    } catch(_){}
  }

  function __syncFiltersSheetCheckboxes(studyLang){
    const list = document.getElementById('filtersLevelsList');
    if (!list) return;
    let st = null;
    try { st = (A.Filters && A.Filters.getState) ? A.Filters.getState(studyLang || 'xx') : null; } catch(_){ st = null; }
    const selected = new Set((st && st.selected) ? st.selected : []);
    const cbs = Array.from(list.querySelectorAll('input[type="checkbox"][data-level]'));
    for (const cb of cbs){
      const lv = String(cb.getAttribute('data-level') || '').trim();
      if (!lv) continue;
      cb.checked = selected.has(lv);
    }
  }


  function getTrainableSliceForKey(deckKey){
    const deck = getTrainableDeckForKey(deckKey);
    const SZ = getSetSizeForKey(deckKey);
    const isArticles = isArticlesModeForKey(deckKey);
    let idx = 0;
    try {
      if (isArticles && A.ArticlesTrainer && typeof A.ArticlesTrainer.getSetIndex === 'function') idx = Number(A.ArticlesTrainer.getSetIndex(deckKey) || 0);
      else idx = Number(getActiveBatchIndex() || 0);
    } catch(_){}
    if (!Number.isFinite(idx) || idx < 0) idx = 0;
    const totalSets = Math.max(1, Math.ceil(deck.length / SZ));
    if (idx >= totalSets) idx = totalSets - 1;
    const from = idx * SZ;
    const to = Math.min(deck.length, (idx + 1) * SZ);
    return deck.slice(from, to);
  }

  function updateFiltersSummary(){
    const key = activeDeckKey();
    const studyLang = getStudyLangForKey(key) || 'xx';
    const sumEl = document.getElementById('filtersSummary');
    if (!sumEl) return;
    try {
      const st = (A.Filters && A.Filters.getState) ? A.Filters.getState(studyLang) : { enabled:false, selected:[] };
      if (!st || !st.enabled || !st.selected || !st.selected.length) {
        sumEl.textContent = (window.I18N_t ? window.I18N_t('filtersNoFilter') : 'Без фильтра');
      } else {
        sumEl.textContent = st.selected.join(', ');
      }
    } catch(_){
      sumEl.textContent = (window.I18N_t ? window.I18N_t('filtersNoFilter') : 'Без фильтра');
    }
  }

  /* ---------------------------- Filters: scroll lock ---------------------------- */
  let __filtersScrollY = 0;
  let __filtersTouchMoveBound = false;

  /* ---------------------------- iOS PWA/TWA: global rubber-band lock ---------------------------- */
  // iOS PWA/TWA may render a small "bounce" area at the bottom after the first pull gesture.
  // This is not a normal layout bug: it's iOS overscroll (rubber-band) on the root scroll context.
  // We emulate native tabbar apps by preventing default touchmove on the HOME screen,
  // while still allowing scroll inside explicit scrollable panels (burger, sheets, etc.).
  let __globalRubberLockBound = false;
  let __globalRubberLockEnabled = false;

  function __isStandaloneRunmode(){
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch(_){ }
    try {
      const rm = String(document.documentElement.getAttribute('data-runmode') || document.documentElement.dataset.runmode || '').toLowerCase();
      if (rm === 'pwa') return true;
    } catch(_){ }
    try {
      if (/(?:\?|&)twa=1(?:&|$)/.test(String(window.location.search || ''))) return true;
    } catch(_){ }
    return false;
  }

  function __bindGlobalRubberLock(){
    if (__globalRubberLockBound) return;
    __globalRubberLockBound = true;
    document.addEventListener('touchmove', function(e){
      try {
        if (!__globalRubberLockEnabled) return;

        // Allow scrolling inside explicit scroll containers.
        const t = e && e.target;
        if (t && t.closest) {
          const allow = t.closest(
            '.oc-body,' +
            '#setsViewport,' +
            '#hintsBody,' +
            '.sets-viewport,' +
            '.hints-body,' +
            '.dicts-scroll,' +
            '#filtersSheet,' +
            '#filtersOverlay,' +
            '.sheet,' +
            '.modal,' +
            '.legal-sheet,' +
            '.donate-sheet'
          );
          if (allow) return;
        }

        // If menu is open, we still lock the background; .oc-body scroll is allowed above.
        e.preventDefault();
      } catch(_){ }
    }, { passive:false, capture:true });
  }

  function setHomeRubberBandLock(enabled){
    try { __bindGlobalRubberLock(); } catch(_){ }
    __globalRubberLockEnabled = !!enabled;
  }

  function lockBodyScrollForFilters(sheetEl){
    try {
      __filtersScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add('mm-modal-open');
      document.body.style.top = `-${__filtersScrollY}px`;
    } catch(_){ }

    // Prevent iOS "rubber-band" from scrolling the page behind the sheet.
    if (!__filtersTouchMoveBound) {
      __filtersTouchMoveBound = true;
      document.addEventListener('touchmove', function(e){
        try {
          if (!document.body.classList.contains('mm-modal-open')) return;
          const t = e.target;
          if (sheetEl && t && (t === sheetEl || (sheetEl.contains && sheetEl.contains(t)))) {
            // Allow scrolling inside sheet.
            return;
          }
          e.preventDefault();
        } catch(_){ }
      }, { passive: false, capture: true });
    }
  }

  function unlockBodyScrollForFilters(){
    try {
      document.body.classList.remove('mm-modal-open');
      const top = document.body.style.top;
      document.body.style.top = '';
      const y = top ? Math.abs(parseInt(top, 10)) : __filtersScrollY;
      window.scrollTo(0, y);
    } catch(_){ }
  }

  function openFiltersSheet(){
    const overlay = document.getElementById('filtersOverlay');
    const sheet = document.getElementById('filtersSheet');
    const list = document.getElementById('filtersLevelsList');
    if (!overlay || !sheet || !list) return;

    // Prepositions trainer: filters are not available, but the sheet should still open.
    try {
      if (isPrepositionsModeForKey(activeDeckKey())) {
        // hide levels list
        try { list.style.display = 'none'; } catch(_){}
        // disable controls
        try {
          const applyBtn = document.getElementById('filtersApply');
          const resetBtn = document.getElementById('filtersReset');
          if (applyBtn) applyBtn.disabled = true;
          if (resetBtn) resetBtn.disabled = true;
        } catch(_){}
        // hint text
        try {
          const uk = getUiLang() === 'uk';
          __setFiltersHint(uk
            ? 'Для цього тренера фільтрація недоступна.'
            : 'Для этого тренера фильтрация недоступна.');
        } catch(_){}
      } else {
        try { list.style.display = ''; } catch(_){}
        try {
          const resetBtn = document.getElementById('filtersReset');
          if (resetBtn) resetBtn.disabled = false;
        } catch(_){}
      }
    } catch(_){}



    // Keep the sheet above the fixed bottom navigation (tabbar/footer).
    // We do it here (on open) to support dynamic layouts and both themes.
    try {
      const h = (function(){
        const candidates = [
          '#bottomNav', '#bottomBar', '#tabbar', '#tabs',
          '.bottom-nav', '.bottomBar', '.tabbar', '.tabs',
          '.app-footer', '.footer-nav', '.footerBar',
          'footer'
        ];
        let best = 0;
        for (const sel of candidates){
          const el = document.querySelector(sel);
          if (!el) continue;
          const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
          const hh = r ? Math.round(r.height) : (el.offsetHeight || 0);
          if (hh <= 0) continue;

          // Heuristic: we only want fixed/sticky bottom bars.
          let pos = '';
          try { pos = String(getComputedStyle(el).position || '').toLowerCase(); } catch(_){ pos = ''; }
          if (pos && pos !== 'fixed' && pos !== 'sticky') continue;

          // Another heuristic: it must be close to the viewport bottom.
          try {
            if (r && r.bottom < (window.innerHeight - 8)) continue;
          } catch(_){ }

          best = Math.max(best, hh);
        }
        return best;
      })();
      // If not found, keep the CSS default.
      if (h && Number.isFinite(h) && h > 0) {
        document.documentElement.style.setProperty('--mm-filters-bottom-offset', `${h}px`);
      }
    } catch(_){ }

    const key = activeDeckKey();
    const studyLang = getStudyLangForKey(key) || 'xx';

    // MOYAMOVA: virtual decks → filters unavailable (read-only info state)
    try {
      const applyBtn = document.getElementById('filtersApply');
      const resetBtn = document.getElementById('filtersReset');
      // reset to defaults for normal decks; virtual decks will disable below
      if (applyBtn) applyBtn.disabled = false;
      if (resetBtn) resetBtn.disabled = false;
    } catch(_){}

    if (isVirtualDeckKey(key)) {
      // Replace pills with an informational block (RU/UK only)
      // Also hide any previous feasibility hint to avoid duplicated messages in the sheet.
      try { __setFiltersHint(''); } catch(_){ }
      const title = (window.I18N_t ? window.I18N_t('filtersVirtualTitle') : 'Фильтры недоступны');
      const text  = (window.I18N_t ? window.I18N_t('filtersVirtualText')  : 'В Избранном и Моих ошибках тренируются все сохранённые слова. Дополнительные фильтры не применяются.');
      list.innerHTML = `
        <div class="filters-virtual-note">
          <div class="title">${title}</div>
          <div class="text">${text}</div>
        </div>
      `;

      try {
        const applyBtn = document.getElementById('filtersApply');
        const resetBtn = document.getElementById('filtersReset');
        if (applyBtn) applyBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
      } catch(_){}

      try { overlay.classList.remove('filters-hidden'); } catch(_){}
      try { sheet.classList.remove('filters-hidden'); } catch(_){}
      try { overlay.setAttribute('aria-hidden', 'false'); } catch(_){ }
      try { sheet.setAttribute('aria-hidden', 'false'); } catch(_){ }
      try { lockBodyScrollForFilters(sheet); } catch(_){ }

      return;
    }

    // MOYAMOVA: Prepositions trainer → filters unavailable (read-only info state)
    if (isPrepositionsModeForKey(key)) {
      // Also hide any previous feasibility hint to avoid duplicated messages in the sheet.
      try { __setFiltersHint(''); } catch(_){ }
      const title = (window.I18N_t ? window.I18N_t('filtersPrepsTitle') : 'Фильтры недоступны');
      const textMsg  = (window.I18N_t ? window.I18N_t('filtersPrepsText') : 'Для упражнения «Предлоги» фильтрация недоступна.');
      list.innerHTML = `
        <div class="filters-virtual-note">
          <div class="title">${title}</div>
          <div class="text">${textMsg}</div>
        </div>
      `;
      try {
        const applyBtn = document.getElementById('filtersApply');
        const resetBtn = document.getElementById('filtersReset');
        if (applyBtn) applyBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
      } catch(_){ }

      try { overlay.classList.remove('filters-hidden'); } catch(_){ }
      try { sheet.classList.remove('filters-hidden'); } catch(_){ }
      try { overlay.setAttribute('aria-hidden', 'false'); } catch(_){ }
      try { sheet.setAttribute('aria-hidden', 'false'); } catch(_){ }
      try { lockBodyScrollForFilters(sheet); } catch(_){ }
      return;
    }

    const st = (A.Filters && A.Filters.getState) ? A.Filters.getState(studyLang) : { enabled:false, selected:[] };
    const selected = new Set((st && st.selected) ? st.selected : []);

    // Available levels (prefer global per studyLang, fallback to current deck)
    let levels = [];
    try {
      if (A.Filters && typeof A.Filters.collectLevelsForStudyLang === 'function') levels = A.Filters.collectLevelsForStudyLang(studyLang) || [];
    } catch(_){}
    if (!levels.length){
      try { levels = (A.Filters && A.Filters.collectLevels) ? (A.Filters.collectLevels(getTrainableDeckForKey(key)) || []) : []; } catch(_){}
    }

    list.innerHTML = '';
    for (const lv of levels) {
      const id = 'flv_' + String(lv).replace(/[^a-z0-9]/gi,'_');
      const row = document.createElement('label');
      row.className = 'filters-item';
      row.innerHTML = '<input type="checkbox" id="'+id+'" data-level="'+lv+'"><span>'+lv+'</span>';
      const cb = row.querySelector('input');
      if (cb) cb.checked = selected.has(lv);
      list.appendChild(row);
    }

    overlay.classList.remove('filters-hidden');
    sheet.classList.remove('filters-hidden');

    try { overlay.setAttribute('aria-hidden', 'false'); } catch(_){ }
    try { sheet.setAttribute('aria-hidden', 'false'); } catch(_){ }
    try { lockBodyScrollForFilters(sheet); } catch(_){ }

    // Focus Apply for accessibility (best-effort)
    try {
      const applyBtn = document.getElementById('filtersApply');
      if (applyBtn && applyBtn.focus) applyBtn.focus();
    } catch(_){ }
  }

  function closeFiltersSheet(){
    const overlay = document.getElementById('filtersOverlay');
    const sheet = document.getElementById('filtersSheet');
    if (overlay) overlay.classList.add('filters-hidden');
    if (sheet) sheet.classList.add('filters-hidden');

    try { if (overlay) overlay.setAttribute('aria-hidden', 'true'); } catch(_){ }
    try { if (sheet) sheet.setAttribute('aria-hidden', 'true'); } catch(_){ }
    try { unlockBodyScrollForFilters(); } catch(_){ }
  }

  function __readDraftLevelsFromSheet(){
    const list = document.getElementById('filtersLevelsList');
    if (!list) return [];
    return Array.from(list.querySelectorAll('input[type="checkbox"][data-level]'))
      .filter(cb => cb && cb.checked)
      .map(cb => String(cb.getAttribute('data-level') || '').trim())
      .filter(Boolean);
  }

  function __setFiltersHint(payload){
    const el = document.getElementById('filtersHint');
    if (!el) return;

    // Backward compatible:
    // - string => one-line plain hint
    // - { title, body } => structured hint (no HTML required)
    const isObj = payload && typeof payload === 'object' && !Array.isArray(payload);
    const title = isObj ? String(payload.title || '').trim() : '';
    const body  = isObj ? String(payload.body  || '').trim() : '';
    const text  = !isObj ? String(payload || '').trim() : '';

    if (isObj) {
      if (!title && !body) {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
      }
      el.innerHTML = '';
      if (title) {
        const h = document.createElement('div');
        h.className = 'mm-filters-hint-title';
        h.textContent = title;
        el.appendChild(h);
      }
      if (body) {
        const p = document.createElement('div');
        p.className = 'mm-filters-hint-body';
        p.textContent = body;
        el.appendChild(p);
      }
      el.style.display = 'block';
      return;
    }

    if (!text) {
      el.textContent = '';
      el.style.display = 'none';
      return;
    }
    // Legacy cleanup: some callers used inline HTML like <b>...</b><br>...
    // This hint is displayed as plain text, so strip tags and map <br> to new lines.
    let clean = text;
    if (clean.indexOf('<') !== -1) {
      clean = clean
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+>/g, '')
        .trim();
    }
    el.textContent = clean;
    el.style.display = 'block';
  }

  function __setApplyEnabled(enabled){
    const btn = document.getElementById('filtersApply');
    if (!btn) return;
    btn.disabled = !enabled;
  }

  function __validateDraftSelectionForKey(key, draftLevels){
    const studyLang = getStudyLangForKey(key) || 'xx';
    let prevState = null;
    try {
      if (A.Filters && typeof A.Filters.getState === 'function') {
        prevState = A.Filters.getState(studyLang);
      }
    } catch(_){ prevState = null; }

    // Temporarily apply draft levels to evaluate feasibility, then restore.
    try {
      if (A.Filters && typeof A.Filters.setLevels === 'function') {
        A.Filters.setLevels(studyLang, draftLevels || []);
      }
    } catch(_){}

    let v = null;
    try {
      v = __validateTrainingFeasibilityForKey(key);
    } catch(_){ v = null; }

    try {
      if (prevState) __restoreFilterState(studyLang, prevState);
      else if (A.Filters && typeof A.Filters.reset === 'function') A.Filters.reset(studyLang);
    } catch(_){}

    return v;
  }


  function applyFiltersFromSheet(){
    const key = activeDeckKey();
    const studyLang = getStudyLangForKey(key) || 'xx';

    const draftLevels = __readDraftLevelsFromSheet();

    // Validate without committing: if invalid, keep the sheet open and allow user to adjust.
    const v = __validateDraftSelectionForKey(key, draftLevels);
    if (v && v.ok === false) {
      try { __setFiltersHint(v.msg || 'Недостаточно слов для тренировки. Добавьте ещё уровни.'); } catch(_){}
      try { __setApplyEnabled(false); } catch(_){}
      try { if (A.Msg && typeof A.Msg.toast === 'function') A.Msg.toast(v.msg || 'Недостаточно слов для тренировки. Добавьте ещё уровни.', 2800); } catch(_){}
      return;
    }

    // Commit selected levels
    try {
      if (A.Filters && typeof A.Filters.setLevels === 'function') {
        A.Filters.setLevels(studyLang, draftLevels);
      }
    } catch(_){}

    try { __rememberLastValidFilterState(studyLang); } catch(_){}

    // Re-normalize set index to avoid empty sets
    try {
      const deck = getTrainableDeckForKey(key);
      const SZ = getSetSizeForKey(key);
      const totalSets = Math.max(1, Math.ceil(deck.length / SZ));
      const isArticles = isArticlesModeForKey(key);
      if (isArticles && A.ArticlesTrainer && typeof A.ArticlesTrainer.getSetIndex === 'function' && typeof A.ArticlesTrainer.setSetIndex === 'function'){
        let idx = Number(A.ArticlesTrainer.getSetIndex(key) || 0);
        if (!Number.isFinite(idx) || idx < 0) idx = 0;
        if (idx >= totalSets) idx = totalSets - 1;
        A.ArticlesTrainer.setSetIndex(idx, key);
      } else {
        let idx = Number(getActiveBatchIndex() || 0);
        if (!Number.isFinite(idx) || idx < 0) idx = 0;
        if (idx >= totalSets) idx = totalSets - 1;
        setActiveBatchIndex(idx);
      }
    } catch(_){}

    try { __setFiltersHint(''); } catch(_){}
    try { __setApplyEnabled(true); } catch(_){}

    try { window.dispatchEvent(new CustomEvent('lexitron:filters:changed')); } catch(_){}
    try { closeFiltersSheet(); } catch(_){}
  }




  function bindLangToggle() {
    const t = document.getElementById('langToggle');
    if (!t) return;
    t.checked = (getUiLang() === 'uk');
    t.addEventListener('change', () => {
      setUiLang(t.checked ? 'uk' : 'ru');
      try {
        if (A.Router && typeof A.Router.routeTo === 'function') {
          A.Router.routeTo(A.Router.current || 'home');
        } else {
          mountMarkup(); renderSets();
        if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === "function" && A.ArticlesTrainer.isActive()) {
          try { if (A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (_){}
        } else {
          renderTrainer();
        }
        }
        try { if (typeof updateFiltersSummary === 'function') updateFiltersSummary(); } catch(_){}
      } catch(_){}
    });
  }

  function bindFiltersUI(){
    // Делегирование кликов: DOM фильтров может монтироваться/перемонтироваться,
    // поэтому прямые onclick легко теряются.
    if (A.__filtersDelegationBound) return;
    A.__filtersDelegationBound = true;

    let __draftT = null;
    function scheduleDraftValidation(){
      try { if (__draftT) clearTimeout(__draftT); } catch(_){}
      __draftT = setTimeout(function(){
        try {
          const key = activeDeckKey();
          const draftLevels = __readDraftLevelsFromSheet();

          // Prepositions trainer: filtering is not supported.
          if (isPrepositionsModeForKey(key)) {
            __setApplyEnabled(false);
            __setFiltersHint({
              title: (window.I18N_t ? window.I18N_t('filtersPrepsTitle') : 'Фильтры недоступны'),
              body: (window.I18N_t ? window.I18N_t('filtersPrepsText') : 'Для упражнения «Предлоги» фильтрация недоступна.')
            });
            return;
          }

          const v = __validateDraftSelectionForKey(key, draftLevels);
          if (v && v.ok === false) {
            __setApplyEnabled(false);
            __setFiltersHint(v.msg || 'Недостаточно слов для тренировки. Добавьте ещё уровни.');
          } else {
            __setApplyEnabled(true);
            __setFiltersHint('');
          }
        } catch(_){}
      }, 60);
    }

    document.addEventListener('click', function(e){
      try {
        const t = e.target;
        if (!t) return;

        // If filters sheet is open, any click outside the sheet closes it.
        // This prevents the backdrop from "stealing" clicks on the footer/navigation.
        try {
          const ov = document.getElementById('filtersOverlay');
          const sh = document.getElementById('filtersSheet');
          const isOpen = !!(ov && !ov.classList.contains('filters-hidden'));
          if (isOpen) {
            const insideSheet = !!(t.closest && sh && t.closest('#filtersSheet'));
            if (!insideSheet) { closeFiltersSheet(); return; }
          }
        } catch(_){}

        if (t.closest && t.closest('#filtersBtn')) { openFiltersSheet(); scheduleDraftValidation(); return; }
        if (t.closest && t.closest('#filtersOverlay')) { closeFiltersSheet(); return; }

        if (t.closest && t.closest('#filtersApply')) {
          try { applyFiltersFromSheet(); } catch(_){}
          return;
        }

        if (t.closest && t.closest('#filtersReset')) {
          // Reset draft only (no apply until user taps Apply)
          try {
            const list = document.getElementById('filtersLevelsList');
            if (list) list.querySelectorAll('input[type="checkbox"][data-level]').forEach(cb => { cb.checked = false; });
          } catch(_){}
          scheduleDraftValidation();
          return;
        }

        if (t.closest && t.closest('#filtersOpenFromEmpty')) { openFiltersSheet(); scheduleDraftValidation(); return; }
      } catch(_){}
    }, true);

    document.addEventListener('change', function(e){
      try {
        const t = e.target;
        if (!t) return;
        if (t.matches && t.matches('#filtersLevelsList input[type="checkbox"][data-level]')) {
          scheduleDraftValidation();
        }
      } catch(_){}
    }, true);

    try {
      window.addEventListener('lexitron:filters:changed', () => {
        try { updateFiltersSummary(); } catch(_){}
        try { renderSets(); } catch(_){}
        try { renderTrainer(); } catch(_){}
      });
    } catch(_){}
  }



  /* ---------------------------- Сложность (глобально) ---------------------------- */
  function getMode() {
    try {
      const fromSettings = (A.settings && (A.settings.level || A.settings.mode));
      if (fromSettings) return String(fromSettings).toLowerCase() === 'hard' ? 'hard' : 'normal';
    } catch(_) {}
    const dl = (document.documentElement.dataset.level || '').toLowerCase();
    return dl === 'hard' ? 'hard' : 'normal';
  }
  if (typeof A.getMode !== 'function') {
    A.getMode = function(){ return getMode(); };
  }
  if (typeof A.getStarStep !== 'function') {
    A.getStarStep = function(){ return (getMode() === 'normal') ? 1 : 0.5; };
  }

  // Кастомный диалог подтверждения
  function i18nConfirmTexts() {
    const uk = getUiLang() === 'uk';
    return uk
      ? { title:'Змінити режим?', textSet:'Перемикання режиму очистить прогрес поточного набору. Продовжити?', cancel:'Скасувати', ok:'Продовжити' }
      : { title:'Сменить режим?', textSet:'Переключение режима очистит прогресс текущего набора. Продолжить?', cancel:'Отмена', ok:'Продолжить' };
  }
  function confirmModeChangeSet() {
    const T = i18nConfirmTexts();
    document.querySelectorAll('.mm-modal-backdrop').forEach(n => n.remove());
    return new Promise(resolve => {
      const root = document.createElement('div');
      root.className = 'mm-modal-backdrop';
      root.innerHTML = `
        <div class="mm-modal" role="dialog" aria-modal="true" aria-labelledby="mmModalTitle" aria-describedby="mmModalText" tabindex="-1">
          <div class="mm-modal__icon" aria-hidden="true">⚙️</div>
          <div class="mm-modal__title" id="mmModalTitle">${T.title}</div>
          <div class="mm-modal__text" id="mmModalText">${T.textSet}</div>
          <div class="mm-modal__btns">
            <button type="button" class="mm-btn mm-btn--ghost" data-mm="cancel">${T.cancel}</button>
            <button type="button" class="mm-btn mm-btn--primary" data-mm="ok">${T.ok}</button>
          </div>
        </div>`;
      document.body.appendChild(root);
      document.body.classList.add('mm-modal-open');
      const btnOk = root.querySelector('[data-mm="ok"]');
      const btnCancel = root.querySelector('[data-mm="cancel"]');
      const close = (val) => {
        root.classList.add('hide');
        setTimeout(() => { root.remove(); document.body.classList.remove('mm-modal-open'); resolve(val); }, 180);
      };
      btnOk.addEventListener('click', () => close(true));
      btnCancel.addEventListener('click', () => close(false));
      root.addEventListener('click', e => { if (e.target === root) close(false); });
      document.addEventListener('keydown', function onKey(e){
        if (!document.body.contains(root)) { document.removeEventListener('keydown', onKey); return; }
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        if (e.key === 'Enter')  { e.preventDefault(); close(true); }
      });
      setTimeout(()=>{ try{ btnOk.focus(); }catch(_){} },0);
    });
  }

  /* ------------------------------ Утилиты выбора ключа ------------------------------ */

  function isValidDeckKey(key){
    try {
      if (!key) return false;
      if (!A.Decks || typeof A.Decks.resolveDeckByKey !== 'function') return false;
      const arr = A.Decks.resolveDeckByKey(key) || [];
      return Array.isArray(arr) && arr.length > 0;
    } catch(_){ return false; }
  }

  function firstAvailableBaseDeckKey(){
    try {
      const decks = (window.decks && typeof window.decks === 'object') ? window.decks : {};
      const keys = Object.keys(decks).filter(k =>
        Array.isArray(decks[k]) &&
        decks[k].length > 0 &&
        !/^favorites:|^mistakes:/i.test(k)
      );
      return keys[0] || ACTIVE_KEY_FALLBACK;
    } catch(_){
      return ACTIVE_KEY_FALLBACK;
    }
  }

  function firstAvailableBaseDeckKeyByGroup(group){
    try{
      const g = String(group||'base').toLowerCase();
      const decks = (window.decks && typeof window.decks === 'object') ? window.decks : {};
      const keys = Object.keys(decks).filter(k =>
        Array.isArray(decks[k]) &&
        decks[k].length > 0 &&
        !/^favorites:|^mistakes:/i.test(k)
      ).filter(k => g==='lernpunkt' ? /_lernpunkt$/i.test(k) : !/_lernpunkt$/i.test(k));
      return keys[0] || firstAvailableBaseDeckKey();
    }catch(_){
      return firstAvailableBaseDeckKey();
    }
  }


  function pickDefaultKeyLikeRef() {
    try {
      if (A.Decks && typeof A.Decks.pickDefaultKey === 'function') {
        const k = A.Decks.pickDefaultKey();
        if (k) return k;
      }
    } catch(_){}
    // резерв: первый реально непустой базовый словарь
    const decks = (window.decks && typeof window.decks === 'object') ? window.decks : {};
    const base = Object.keys(decks).find(k => Array.isArray(decks[k]) && decks[k].length >= 4 && !/^favorites:|^mistakes:/i.test(k));
    return base || firstAvailableBaseDeckKey();
  }

  // favorites:<TL>:<baseKey>  |  mistakes:<baseKey>  -> вернуть baseKey
  function extractBaseFromVirtual(key){
    try {
      if (!key) return null;
      if (/^favorites:/i.test(key)) {
        const parts = String(key).split(':'); // ["favorites", "<tl>", "<tail>"]
        const tail = parts.slice(2).join(':') || null;
        if (!tail) return null;
        if (/^(base|lernpunkt)$/i.test(tail)) return firstAvailableBaseDeckKeyByGroup(tail);
        return tail;
      }
      if (/^mistakes:/i.test(key)) {
        const parts = String(key).split(':'); // ["mistakes", "<tl>", "<tail>"]
        const tail = parts.slice(2).join(':') || null;
        if (!tail) return null;
        if (/^(base|lernpunkt)$/i.test(tail)) return firstAvailableBaseDeckKeyByGroup(tail);
        return tail;
      }
      return null;
    } catch(_) { return null; }
  }

  // starKey (единственное определение)
  const starKey = (typeof A.starKey === 'function') ? A.starKey : (id, key) => `${key}:${id}`;

  // MOYAMOVA: virtual decks (favorites / mistakes)
  function isVirtualDeckKey(key){
    return /^(favorites|mistakes):(ru|uk):/i.test(String(key||''));
  }


  function setDictStatsText(statsEl, deckKey){
    try{
      if (!statsEl) return;
      const full = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') ? (A.Decks.resolveDeckByKey(deckKey) || []) : [];
      const starsMax = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;

      const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');
      const isPreps = !!(A.settings && A.settings.trainerKind === 'prepositions');

      const learnedWords = full.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id, deckKey)]) || 0) >= starsMax).length;
      const uk = getUiLang() === 'uk';
      if (isArticles) {
        const learnedA = countLearnedArticles(full, deckKey);
        statsEl.style.display = '';
        statsEl.textContent = uk ? `Всього слів: ${full.length} / Вивчено: ${learnedA}`
                               : `Всего слов: ${full.length} / Выучено: ${learnedA}`;
      } else {
        statsEl.style.display = '';
        statsEl.textContent = isPreps
          ? (uk ? `Всього патернів: ${full.length} / Вивчено: ${learnedWords}`
                : `Всего паттернов: ${full.length} / Выучено: ${learnedWords}`)
          : (uk ? `Всього слів: ${full.length} / Вивчено: ${learnedWords}`
                : `Всего слов: ${full.length} / Выучено: ${learnedWords}`);
      }
    }catch(_){}
  }


// Выбор активного словаря
function activeDeckKey() {
  var A = window.App || {};

  try {
    // 1) последний реально использованный словарь — главный источник истины
    var last = (A.settings && A.settings.lastDeckKey) || null;
    if (isValidDeckKey(last)) return last;

    // 2) "предпочитаемый возврат" при выходе из избранного/ошибок
    //    используется только когда lastDeckKey ещё не задан
    var prefer = (A.settings && A.settings.preferredReturnKey) || null;
    if (isValidDeckKey(prefer)) return prefer;

    // 3) стартовый ключ из мастера (StartupManager) — только для первого запуска
    if (window.StartupManager && typeof StartupManager.readSettings === 'function') {
      var s = StartupManager.readSettings();
      if (s && s.deckKey && isValidDeckKey(s.deckKey)) {
        return s.deckKey;
      }
    }

    // 4) референсный дефолт (как в старой логике)
    var ref = (typeof pickDefaultKeyLikeRef === 'function')
      ? pickDefaultKeyLikeRef()
      : null;
    if (isValidDeckKey(ref)) return ref;

    // 5) самый крайний фолбэк
    return ACTIVE_KEY_FALLBACK;
  } catch (_) {
    return ACTIVE_KEY_FALLBACK;
  }
}
  // Идшники слов текущего сета
  function getActiveBatchIndex() {
    try { return (A.Trainer && typeof A.Trainer.getBatchIndex === 'function') ? A.Trainer.getBatchIndex(activeDeckKey()) : 0; }
    catch (_) { return 0; }
  }
  function getCurrentSliceWordIds(key){
    try {
      if (A.Trainer && typeof A.Trainer.getDeckSlice === 'function') {
        const slice = A.Trainer.getDeckSlice(key) || [];
        const ids = slice.map(w => w && w.id).filter(Boolean);
        if (ids.length) return ids;
      }
    } catch(_){}
    const deck = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function')
      ? (A.Decks.resolveDeckByKey(key) || [])
      : [];
    const idx  = getActiveBatchIndex();
    const SZ   = getSetSizeForKey(key);
    const from = idx * SZ;
    const to   = Math.min(deck.length, (idx + 1) * SZ);
    return deck.slice(from, to).map(w => w && w.id).filter(Boolean);
  }

  function tWord(w) {
    const lang = getUiLang();
    if (!w) return '';
    return (lang === 'uk'
      ? (w.uk || w.translation_uk || w.trans_uk || w.ua)
      : (w.ru || w.translation_ru || w.trans_ru))
      || w.translation || w.trans || w.meaning || '';
  }

  /* ----------------------- Режим обратного перевода ----------------------- */
  // По умолчанию (checkbox отсутствует или снят) тренер работает как раньше:
  // показываем терм (DE), а на кнопках — перевод (RU/UK).
  // При включении "Обратный" показываем перевод как вопрос, а на кнопках — терм.
  function isReverseTraining() {
    try {
      if (isPrepositionsModeForKey(activeDeckKey())) return false;
      const el = document.getElementById('trainReverse');
      return !!(el && el.checked);
    } catch (_) {
      return false;
    }
  }

  function termOf(w){
    return String(w && (w.word || w.term || w.de || w.src || '')) .trim();
  }

  function reversePromptText() {
    const uk = getUiLang() === 'uk';
    return uk ? 'Оберіть слово' : 'Выберите слово';
  }

  function forwardPromptText() {
    const uk = getUiLang() === 'uk';
    if (isPrepositionsModeForKey(activeDeckKey())) {
      return uk ? 'Оберіть правильний прийменник' : 'Выберите правильный предлог';
    }
    return uk ? 'Оберіть переклад' : 'Выберите перевод';
  }

    function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  function uniqueById(arr) { const s = new Set(); return arr.filter(x => { const id = String(x.id); if (s.has(id)) return false; s.add(id); return true; }); }

  /* --------------------------- Избранное (сердце) --------------------------- */
  function isFav(key, id) {
    try { if (typeof App.isFavorite === 'function') return !!App.isFavorite(key, id); } catch(_) {}
    try { if (A.Favorites && typeof A.Favorites.has === 'function') return !!A.Favorites.has(key, id); } catch(_) {}
    return false;
  }
  function toggleFav(key, id) {
    try { if (typeof App.toggleFavorite === 'function') return App.toggleFavorite(key, id); } catch(_) {}
    try { if (A.Favorites && typeof A.Favorites.toggle === 'function') return A.Favorites.toggle(key, id); } catch(_) {}
  }

  /* ------------------------- DOM-шаблон главной ------------------------- */
  function resolveDeckTitle(key) {
    const lang = getUiLang();
    try {
      if (A.Decks && typeof A.Decks.resolveNameByKeyLang === 'function') return A.Decks.resolveNameByKeyLang(key, lang);
      if (A.Decks && typeof A.Decks.resolveNameByKey === 'function') {
        const n = A.Decks.resolveNameByKey(key);
        if (n && typeof n === 'object') {
          return (lang === 'uk') ? (n.uk || n.name_uk || n.title_uk || n.name || n.title)
                                 : (n.ru || n.name_ru || n.title_ru || n.name || n.title);
        }
        if (typeof n === 'string') return n;
      }
      if (A.Dicts && A.Dicts[key]) {
        const d = A.Dicts[key];
        return (lang === 'uk') ? (d.name_uk || d.title_uk || d.uk || d.name || d.title)
                               : (d.name_ru || d.title_ru || d.ru || d.name || d.title);
      }
    } catch (_) {}
    return (lang === 'uk') ? 'Дієслова' : 'Глаголы';
  }

  function mountMarkup() {
    const app = document.getElementById('app');
    if (!app) return;

    const key   = activeDeckKey();

    // мягкая синхронизация Trainer/lastDeckKey ТОЛЬКО на главной
    try {
      const cur = (A.Trainer && typeof A.Trainer.getDeckKey === 'function') ? A.Trainer.getDeckKey() : null;
      if (key && key !== cur && A.Trainer && typeof A.Trainer.setDeckKey === 'function') {
        A.Trainer.setDeckKey(key);
      }
      A.settings = A.settings || {};
      if (A.settings.lastDeckKey !== key) {
        A.settings.lastDeckKey = key;
        A.saveSettings && A.saveSettings(A.settings);
      }
    } catch(_){}

    const flag  = (A.Decks && A.Decks.flagForKey) ? (A.Decks.flagForKey(key) || '🇩🇪') : '🇩🇪';
    const title = resolveDeckTitle(key);
    const T = tUI();

    const showFilters = isPwaOrTwaRunmode();

    app.innerHTML = `
      <div class="home">
        <!-- ЗОНА 1: Сеты -->
        <section class="card home-sets">
          <header class="sets-header">
  <h2 class="sets-title">${title}</h2>
  <span class="flag" aria-hidden="true">${flag}</span>
</header>
          <div class="sets-viewport" id="setsViewport">
            <div class="sets-grid" id="setsBar"></div>
          </div>
          <p class="sets-stats" id="setStats"></p>
        </section>

        ${isPrepositionsModeForKey(key) ? `
        <!-- ЗОНА 2: Плейсхолдер (контекст скрыт для предлогов) -->
        <div class="mm-context-gap" aria-hidden="true"></div>
        ` : `
        <!-- ЗОНА 2: Подсказки -->
        <section class="card home-hints">
          <div class="hints-body" id="hintsBody"></div>
        </section>
        `}

        <!-- ЗОНА 3: Тренер -->
        <section class="card home-trainer">
          <div class="trainer-top">
            <div class="trainer-stars" aria-hidden="true"></div>
            <button aria-label="${T.fav}" class="heart" data-title-key="tt_favorites" id="favBtn">♡</button>
          </div>
          <h3 class="trainer-word"></h3>
          <p class="trainer-subtitle">${T.choose}</p>
          <div class="answers-grid"></div>
          <button class="btn-ghost idk-btn">${T.idk}</button>
          <span class="trainer-mode-indicator" id="trainerModeIndicator" aria-hidden="true"></span>
          <p class="dict-stats" id="dictStats"></p>
        </section>

        ${showFilters ? `
        <!-- ЗОНА 4: Фильтры (только PWA/TWA) -->
        <section class="home-filters" aria-label="filters">
          <button class="filters-btn" id="filtersBtn" type="button">
            <span class="ico" aria-hidden="true">▾</span>
            <span class="lbl">${(window.I18N_t ? window.I18N_t('filtersBtn') : 'Фильтры')}</span>
          </button>
          <div class="filters-summary" id="filtersSummary"></div>
        </section>

        <div class="filters-overlay filters-hidden" id="filtersOverlay" aria-hidden="true"></div>

        <div class="filters-sheet filters-hidden" id="filtersSheet" role="dialog" aria-modal="true" aria-label="filtersSheet">
          <div class="filters-head">
            <div class="filters-title">${(window.I18N_t ? window.I18N_t('filtersTitle') : 'Фильтры')}</div>
            <div class="filters-head-actions">
              <button class="filters-reset" id="filtersReset" type="button">${(window.I18N_t ? window.I18N_t('filtersReset') : 'Сбросить')}</button>
              <button class="filters-apply" id="filtersApply" type="button" disabled>${(window.I18N_t ? window.I18N_t('filtersApply') : 'Применить')}</button>
            </div>
          </div>

          <div class="filters-section">
            <h4>${(window.I18N_t ? window.I18N_t('filtersLevels') : 'Уровни')}</h4>
            <div class="filters-list" id="filtersLevelsList"></div>
            <div class="filters-hint" id="filtersHint" aria-live="polite"></div>
          </div>

        <!--  <div class="filters-section" aria-disabled="true" style="opacity:.55;pointer-events:none;">
            <h4>${(window.I18N_t ? window.I18N_t('filtersTopics') : 'Темы')}</h4>
            <div class="filters-list" id="filtersTopicsList"></div>
              </div>  -->

        </div>
        ` : ''}
      </div>`;

    // Инициализация summary после отрисовки (если фильтры показаны)
    try { if (showFilters) updateFiltersSummary(); } catch(_){ }
  }

  /* ------------------------------- Сеты ------------------------------- */
  function renderSets() {
    const key  = activeDeckKey();
    const deck = getTrainableDeckForKey(key);

    const grid    = document.getElementById('setsBar');
    const statsEl = document.getElementById('setStats');
    if (!grid) return;

    const SZ = getSetSizeForKey(key);
    const totalSets = Math.max(1, Math.ceil(deck.length / SZ));
    const activeIdx = (isArticlesModeForKey(key) && A.ArticlesTrainer && typeof A.ArticlesTrainer.getSetIndex === 'function')
      ? Number(A.ArticlesTrainer.getSetIndex(key) || 0)
      : Number(getActiveBatchIndex() || 0);
    grid.innerHTML = '';

    const starsMax = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;

    const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');

    for (let i = 0; i < totalSets; i++) {
      const from = i * SZ;
      const to   = Math.min(deck.length, (i + 1) * SZ);
      const sub  = deck.slice(from, to);
      const done = sub.length > 0 && sub.every(w => {
        if (isArticles) {
          try {
            const maxA = (A.ArticlesProgress && typeof A.ArticlesProgress.starsMax === 'function') ? A.ArticlesProgress.starsMax() : starsMax;
            const haveA = (A.ArticlesProgress && typeof A.ArticlesProgress.getStars === 'function') ? (A.ArticlesProgress.getStars(key, w.id) || 0) : 0;
            return Number(haveA || 0) >= Number(maxA || 5);
          } catch(_) { return false; }
        }
        return (((A.state && A.state.stars && A.state.stars[starKey(w.id, key)]) || 0) >= starsMax);
      });

      const btn = document.createElement('button');
      btn.className = 'set-pill' + (i === activeIdx ? ' is-active' : '') + (done ? ' is-done' : '');
      btn.textContent = i + 1;
      btn.onclick = () => {
        try {
          if (isArticlesModeForKey(key) && A.ArticlesTrainer && typeof A.ArticlesTrainer.setSetIndex === 'function') {
            A.ArticlesTrainer.setSetIndex(i, key);
          } else if (A.Trainer && typeof A.Trainer.setBatchIndex === 'function') {
            A.Trainer.setBatchIndex(i, key);
          }
        } catch (_){}
        renderSets();
        if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === "function" && A.ArticlesTrainer.isActive()) {
          try { if (A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (_){}
        } else {
          renderTrainer();
        }
        try { A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender(); } catch(_){}
      };
      grid.appendChild(btn);
    }

    const i = (isArticlesModeForKey(key) && A.ArticlesTrainer && typeof A.ArticlesTrainer.getSetIndex === 'function')
      ? Number(A.ArticlesTrainer.getSetIndex(key) || 0)
      : Number(getActiveBatchIndex() || 0);
    const from = i * SZ, to = Math.min(deck.length, (i + 1) * SZ);
    const words = deck.slice(from, to);

    const starsMax2 = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;
    const learned = words.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id, key)]) || 0) >= starsMax2).length;

    if (statsEl) {
      const uk = getUiLang() === 'uk';
      // В режиме тренера артиклей статистику по словам в сете скрываем.
      const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');
      if (isArticles) {
        const learnedA = countLearnedArticles(words, key);
        statsEl.style.display = '';
        statsEl.textContent = uk
          ? `Слів у наборі: ${words.length} / Вивчено: ${learnedA}`
          : `Слов в наборе: ${words.length} / Выучено: ${learnedA}`;
      } else {
        statsEl.style.display = '';
        statsEl.textContent = uk
          ? `${isPrepositionsModeForKey(key) ? 'Патернів' : 'Слів'} у наборі: ${words.length} / Вивчено: ${learned}`
          : `${isPrepositionsModeForKey(key) ? 'Паттернов' : 'Слов'} в наборе: ${words.length} / Выучено: ${learned}`;
      }
    }
  }

  /* ------------------------------ Звёзды ------------------------------- */
  function getStars(wordId) {
    const key = activeDeckKey();
    const v = (A.state && A.state.stars && A.state.stars[starKey(wordId, key)]) || 0;
    return Number(v) || 0;
  }

  function drawStarsTwoPhase(box, score, max) {
    if (!box) return;
    const EPS = 1e-6;
    const kids = box.querySelectorAll('.star');
    if (kids.length !== max) {
      let html = '';
      for (let i = 0; i < max; i++) html += '<span class="star" aria-hidden="true">★</span>';
      box.innerHTML = html;
    }
    const stars = box.querySelectorAll('.star');
    stars.forEach(el => { el.classList.remove('full','half'); });

    const filled = Math.floor(score + EPS);
    for (let i = 0; i < Math.min(filled, max); i++) {
      stars[i].classList.add('full');
    }
    const frac = score - filled;
    if (frac + EPS >= 0.5 && filled < max) {
      stars[filled].classList.add('half');
    }
  }

  function renderStarsFor(word) {
    const box = document.querySelector('.trainer-stars');
    if (!box || !word) return;
    const max  = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;
    const have = getStars(word.id);
    drawStarsTwoPhase(box, have, max);
  }

  /* ------------------------------ Варианты ------------------------------ */
  function buildOptions(word) {
    const key = activeDeckKey();
    const reverse = isReverseTraining();
    const isPrep = isPrepositionsModeForKey(key);
    if (isPrep) {
      // Options are prepositions only: 1 correct + 3 distractors.
      const SIZEP = 4;
      const correct = String(word && word._prepCorrect || '').trim();
      const lang = String(word && word._prepLang || 'en').toLowerCase();
      const pool = (A.Prepositions && typeof A.Prepositions.getDistractorPool === 'function')
        ? (A.Prepositions.getDistractorPool(lang) || [])
        : [];
      // build unique distractors
      const seen = {};
      seen[correct.toLowerCase()] = true;

      const distractors = [];
      for (let i=0; i<pool.length && distractors.length < (SIZEP-1); i++){
        const p = String(pool[i] || '').trim();
        if (!p) continue;
        const k = p.toLowerCase();
        if (seen[k]) continue;
        seen[k] = true;
        distractors.push(p);
      }

      // Fallback if pool is short
      const fallback = ['at','on','in','to','from','for','with','by','about','of','under','over','before','after'];
      for (let j=0; j<fallback.length && distractors.length < (SIZEP-1); j++){
        const p = fallback[j];
        const k = p.toLowerCase();
        if (seen[k]) continue;
        seen[k] = true;
        distractors.push(p);
      }

      const out = [];
      // correct option uses the same id to satisfy core equality checks
      out.push({ id: String(word.id), _optLabel: correct });
      for (let d=0; d<distractors.length; d++){
        out.push({ id: String(word.id) + '__d' + (d+1), _optLabel: distractors[d] });
      }

      // shuffle without changing ids
      return shuffle(out).slice(0, SIZEP);
    }



    // Требование UX: НИКОГДА не показывать одинаковые подписи на кнопках.
    // Причина дублей: разные слова (id) могут иметь одинаковый перевод (ru/uk).
    // Решение: собираем 4 опции по id, затем гарантируем уникальность отображаемых текстов
    // (при коллизии добавляем уточнение по исходному термину).
    const SIZE = 4;

    const deck = getTrainableDeckForKey(key);

    // Пул отвлекающих: сначала ошибки (если есть), затем вся колода
    let pool = [];
    try {
      if (A.Mistakes && typeof A.Mistakes.getDistractors === 'function') {
        pool = A.Mistakes.getDistractors(key, word.id) || [];
      }
    } catch (_){}
    if (pool.length < (SIZE - 1)) {
      pool = pool.concat(deck);
    }

    function norm(s){
      return String(s || '').trim().replace(/\s+/g,' ').toLowerCase();
    }

    function baseLabel(w){
      return String((reverse ? termOf(w) : tWord(w)) || '').trim();
    }

    // Собираем кандидатов без текущего слова и без дублей по id
    const candidates = shuffle(uniqueById(pool))
      .filter(w => w && String(w.id) !== String(word.id));

    // Базовый набор: правильный + 3 отвлекающих (по id)
    const picked = [word];
    for (let i=0; i<candidates.length && picked.length < SIZE; i++){
      const c = candidates[i];
      if (!picked.some(p => String(p.id) === String(c.id))) picked.push(c);
    }
    // Добор из колоды, если вдруг не хватает.
    // IMPORTANT: never use an unbounded `while` here.
    // If the deck is too small (e.g. 1-3 words) and all candidates are filtered out,
    // the old loop could run forever and freeze the UI.
    if (picked.length < SIZE && deck.length) {
      const MAX_TRIES = Math.max(20, deck.length * 5);
      for (let tries = 0; tries < MAX_TRIES && picked.length < SIZE; tries++) {
        const r = deck[Math.floor(Math.random() * deck.length)];
        if (!r) continue;
        if (String(r.id) === String(word.id)) continue;
        if (picked.some(p => String(p.id) === String(r.id))) continue;
        picked.push(r);
      }
    }

    // Теперь делаем копии объектов и гарантируем уникальность отображаемых подписей
    const used = new Set();
    const out = [];

    for (let i=0; i<picked.length; i++){
      const w = picked[i];
      const copy = Object.assign({}, w);

      const base = baseLabel(copy);
      let label = base;

      // Если текст пустой — не добавляем (попробуем заменить позже)
      if (!label) continue;

      // Коллизия: добавляем уточнение по исходному термину (DE/term),
      // чтобы подписи гарантированно отличались.
      if (used.has(norm(label))) {
        // Коллизия: добавляем уточнение второй стороной
        // forward: перевод коллизит -> добавляем терм
        // reverse: терм коллизит -> добавляем перевод
        const hint = reverse ? String(tWord(copy) || '').trim() : termOf(copy);
        if (hint) label = `${base} (${hint})`;
      }
      // Если всё ещё коллизия — добавляем безопасный суффикс
      let n = 2;
      while (used.has(norm(label))) {
        label = `${base} (#${n++})`;
      }

      copy._optLabel = label;
      used.add(norm(label));
      out.push(copy);
    }

    // Если из-за пустых переводов/редких коллизий не набрали 4 —
    // добираем из колоды, применяя те же правила уникальности.
    if (out.length < SIZE && deck.length) {
      const extra = shuffle(deck.slice());
      for (let j=0; j<extra.length && out.length < SIZE; j++){
        const w = extra[j];
        if (!w) continue;
        if (String(w.id) === String(word.id)) continue;
        if (out.some(o => String(o.id) === String(w.id))) continue;

        const copy = Object.assign({}, w);
        const base = baseLabel(copy);
        if (!base) continue;

        let label = base;
        if (used.has(norm(label))) {
          const hint = reverse ? String(tWord(copy) || '').trim() : termOf(copy);
          if (hint) label = `${base} (${hint})`;
        }
        let n = 2;
        while (used.has(norm(label))) label = `${base} (#${n++})`;

        copy._optLabel = label;
        used.add(norm(label));
        out.push(copy);
      }
    }

    // Финальный shuffle, чтобы правильный ответ не был всегда первым
    return shuffle(out).slice(0, SIZE);
  }


  
  function __escapeHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function __fillPrepBlank(sentence, answer){
    const s = String(sentence||'');
    const a = String(answer||'').trim();
    if (!a) return __escapeHtml(s);

    // Prefer underscore placeholders like ___
    const reUnd = /_{2,}/;
    if (reUnd.test(s)) {
      const parts = s.split(reUnd);
      const before = parts.shift() || '';
      const after = parts.join('___');
      return __escapeHtml(before) + `<span class="mm-prep-filled">${__escapeHtml(a)}</span>` + __escapeHtml(after);
    }

    // Fallback: three dots / ellipsis
    const reDots = /\.\.\.|…/;
    if (reDots.test(s)) {
      const m = s.match(reDots);
      if (m) {
        const i = s.indexOf(m[0]);
        const before = s.slice(0, i);
        const after = s.slice(i + m[0].length);
        return __escapeHtml(before) + `<span class="mm-prep-filled">${__escapeHtml(a)}</span>` + __escapeHtml(after);
      }
    }

    // Last resort: append
    return __escapeHtml(s) + ' ' + `<span class="mm-prep-filled">${__escapeHtml(a)}</span>`;
  }
/* ------------------------------- Тренер ------------------------------- */

  // Reverse-translation toggle is meaningful only for the word trainer.
  // When the Articles trainer is active we silently disable the checkbox
  // (no toasts / messages) to avoid confusion.
  function syncReverseToggleAvailability(disabled){
    try {
      const el = document.getElementById('trainReverse');
      if (!el) return;
      el.disabled = !!disabled;
      // Keep the user's choice intact; just prevent interaction while articles trainer is active.
    } catch (_){ }
  }
  
  // Context toggle is not applicable for the prepositions trainer (the context card is hidden).
  // Keep the user's choice intact; just prevent interaction while the prepositions trainer is active.
  function syncContextToggleAvailability(disabled){
    try {
      const el = document.getElementById('focusContext');
      if (!el) return;
      el.disabled = !!disabled;
    } catch(_){ }
  }
function renderTrainer() {
    const key   = activeDeckKey();

    // Trainer variant switching (words vs articles).
    // We must NOT fall back to the default trainer when the user interacts with
    // sets, language toggle, or other UI elements while the articles trainer is active.
    // Switching is allowed only via the dedicated buttons on selection screens.
    const baseKeyForArticles = extractBaseFromVirtual(key) || key;
    const wantArticles = !!(A.settings && A.settings.trainerKind === 'articles')
      && String(baseKeyForArticles || '').toLowerCase().startsWith('de_nouns')
      && (A.ArticlesTrainer && A.ArticlesCard);

    const baseKeyForPreps = extractBaseFromVirtual(key) || key;

    const __mPreps = String(baseKeyForPreps || '').trim().match(/^([a-z]{2})_prepositions$/i);
    const __prepsLang = __mPreps ? String(__mPreps[1] || '').toLowerCase() : null;
    const __prepsSrc = (__prepsLang && typeof window !== 'undefined') ? (window.prepositionsTrainer && window.prepositionsTrainer[__prepsLang]) : null;
    const __hasPrepsDataset = !!(__prepsSrc && (Array.isArray(__prepsSrc.patterns) ? __prepsSrc.patterns.length : (Array.isArray(__prepsSrc) ? __prepsSrc.length : (typeof __prepsSrc === 'object' ? Object.keys(__prepsSrc).length : 0))));

    const wantPrepositions = !!(A.settings && A.settings.trainerKind === 'prepositions')
      && !!__mPreps
      && __hasPrepsDataset
      && (A.Prepositions && typeof A.Prepositions.getDeckForKey === 'function');


    // UI: Reverse toggle is not applicable to articles.
    syncReverseToggleAvailability(wantArticles || wantPrepositions);
    syncContextToggleAvailability(wantPrepositions);
    // Prepositions: mark trainer card to allow stable layout (reserve space for 2-line pattern)
    try {
      const __trainerCard = document.querySelector('.home-trainer');
      if (__trainerCard) __trainerCard.classList.toggle('home-trainer--preps', !!wantPrepositions);
    } catch(_){ }


if (wantArticles) {
  // Safety guard: prevent articles training when filters leave fewer than der/die/das in the pool.
  // Virtual decks (favorites/mistakes) ignore filters and must not be blocked by this guard.
  if (!isVirtualDeckKey(key)) {
    try {
    const studyLang = getStudyLangForKey(key) || 'xx';
    const v = __validateTrainingFeasibilityForKey(key);
    if (v && v.ok === false) {
      const last = __lastValidFilterStateByStudyLang[String(studyLang||'xx').toLowerCase()] || null;
      if (last) __restoreFilterState(studyLang, last);
      else if (A.Filters && typeof A.Filters.reset === 'function') A.Filters.reset(studyLang);
      try { if (A.Msg && typeof A.Msg.toast === 'function') A.Msg.toast(v.msg, 3400); } catch(_){}
      try { window.dispatchEvent(new CustomEvent('lexitron:filters:changed')); } catch(_){}
      return;
    }
    } catch(_){ }
  }

  // Ensure the articles card is mounted into the standard home trainer container.
      try { if (A.ArticlesCard && typeof A.ArticlesCard.mount === 'function') A.ArticlesCard.mount(document.querySelector('.home-trainer')); } catch (_){ }

      // Start if needed (mode mirrors the default trainer's difficulty).
      try {
        const mode = (typeof getMode === 'function') ? getMode() : 'normal';
        if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === 'function') {
          let needStart = !A.ArticlesTrainer.isActive();
          if (!needStart && typeof A.ArticlesTrainer.getViewModel === 'function') {
            try {
              const vm = A.ArticlesTrainer.getViewModel();
              const curKey = vm ? String(vm.deckKey || '') : '';
              if (curKey !== String(key || '')) needStart = true;
            } catch (_e) {}
          }
          // IMPORTANT: when navigating from Favorites/Mistakes, the articles trainer can already be active.
          // In that case we must re-start it with the new virtual key to keep stats and guards consistent.
          if (needStart) A.ArticlesTrainer.start(key, mode);
        }
      } catch (_){ }

      // Force a render for the current viewModel (in addition to bus updates).
      try { if (A.ArticlesCard && typeof A.ArticlesCard.render === 'function' && A.ArticlesTrainer && typeof A.ArticlesTrainer.getViewModel === 'function') A.ArticlesCard.render(A.ArticlesTrainer.getViewModel()); } catch (_){ }

      // Mode indicator must be visible on first render (same as default trainer).
      try { if (A.Trainer && typeof A.Trainer.updateModeIndicator === 'function') A.Trainer.updateModeIndicator(); } catch (_){ }
      return;
    }

    // If we are NOT in articles mode, make sure the articles plugin is stopped/unmounted.
    try { if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === 'function' && A.ArticlesTrainer.isActive()) A.ArticlesTrainer.stop(); } catch (_){ }
    try { if (A.ArticlesCard && typeof A.ArticlesCard.unmount === 'function') A.ArticlesCard.unmount(); } catch (_){ }

    const slice = (A.Trainer && typeof A.Trainer.getDeckSlice === 'function') ? (A.Trainer.getDeckSlice(key) || []) : [];
    if (!slice.length) return;

    // UX: for tiny / non-full sets (e.g. last Lernpunkt batch with 1 word),
    // the default trainer will keep drilling the same word until it is fully learned.
    // That is correct logically, but feels "stuck". To keep training fluid and symmetric
    // with the articles trainer, we extend the selection pool with spillover words from
    // the next batches *without* changing the UI counters, which are still based on `slice`.
    function buildSpilloverPool(deckKey, baseSlice) {
      const MIN_POOL = 6;
      const A = window.App || {};
      const T = A.Trainer || {};
      const D = A.Decks || {};

      const setSize = (T && typeof T.getSetSize === 'function') ? (T.getSetSize(deckKey) || 0) : 0;
      const target = Math.max(1, Math.min(setSize || MIN_POOL, MIN_POOL));
      if (!baseSlice || baseSlice.length >= target) return baseSlice || [];

      const meta = (T && typeof T.getBatchesMeta === 'function') ? (T.getBatchesMeta(deckKey) || null) : null;
      const total = meta && typeof meta.total === 'number' ? meta.total : 1;
      const active = meta && typeof meta.active === 'number' ? meta.active : 0;
      const deck = (D && typeof D.resolveDeckByKey === 'function') ? (D.resolveDeckByKey(deckKey) || []) : [];
      if (!deck.length || !setSize || total <= 1) return baseSlice;

      const seen = new Set();
      const pool = [];
      for (let i = 0; i < baseSlice.length; i++) {
        const w = baseSlice[i];
        if (!w) continue;
        const id = String(w.id);
        if (seen.has(id)) continue;
        seen.add(id);
        pool.push(w);
      }

      // Add next batches in a circular manner until we reach the target size.
      for (let step = 1; step < total && pool.length < target; step++) {
        const bi = (active + step) % total;
        const start = bi * setSize;
        const end = Math.min(deck.length, start + setSize);
        for (let j = start; j < end && pool.length < target; j++) {
          const w = deck[j];
          if (!w) continue;
          const id = String(w.id);
          if (seen.has(id)) continue;
          seen.add(id);
          pool.push(w);
        }
      }
      return pool.length ? pool : baseSlice;
    }

    const pool = buildSpilloverPool(key, slice);

    const idx = (A.Trainer && typeof A.Trainer.sampleNextIndexWeighted === 'function')
      ? A.Trainer.sampleNextIndexWeighted(pool)
      : Math.floor(Math.random() * pool.length);
    const word = pool[idx];

    A.__currentWord = word;

    const answers = document.querySelector('.answers-grid');
    const wordEl  = document.querySelector('.trainer-word');
    const subEl   = document.querySelector('.trainer-subtitle');
    const favBtn  = document.getElementById('favBtn');
    const idkBtn  = document.querySelector('.idk-btn');
    const stats   = document.getElementById('dictStats');
    const modeEl  = document.getElementById('trainerModeIndicator');

    if (favBtn) {
      const favNow = isFav(key, word.id);
      favBtn.textContent = favNow ? '♥' : '♡';
      favBtn.classList.toggle('is-fav', favNow);
      favBtn.setAttribute('aria-pressed', String(favNow));
      try {
        const uk = getUiLang() === 'uk';
        const title = uk ? 'У вибране' : 'В избранное';
        favBtn.title = title; favBtn.ariaLabel = title;
      } catch (_){}
      favBtn.onclick = function () {
        // NEW: запрет добавления избранного во время тренировки ОШИБОК
        try {
          var __curKey2 = String(key||'');
          var isMistDeck2 = false;
          if (A.Mistakes && typeof A.Mistakes.isMistakesDeckKey === 'function') {
            isMistDeck2 = !!A.Mistakes.isMistakesDeckKey(__curKey2);
          } else {
            isMistDeck2 = (__curKey2.indexOf('mistakes:')===0) || (__curKey2==='mistakes');
          }
          if (isMistDeck2) {
            var uk2 = (getUiLang && getUiLang()==='uk');
            var msg2 = uk2
              ? 'Під час тренування помилок додавання заборонено'
              : 'Во время тренировки ошибок добавление запрещено';
            try { (A.toast&&A.toast.show) ? A.toast.show(msg2) : alert(msg2); } catch(__e){}
            favBtn.classList.add('shake'); setTimeout(function(){ favBtn.classList.remove('shake'); }, 300);
            return;
          }
        } catch(__e) {}

        // Guard: блок добавления в избранное при тренировке "избранного"
        try {
          var __curKey = String(key||'');
          var isFavoritesDeck = (__curKey.indexOf('favorites:')===0) || (__curKey==='fav') || (__curKey==='favorites');
          if (isFavoritesDeck) {
            var uk = (getUiLang && getUiLang()==='uk');
            var msg = uk ? 'Під час тренування обраного додавання заборонено' : 'Во время тренировки избранного добавление запрещено';
            try { (A.toast&&A.toast.show) ? A.toast.show(msg) : alert(msg); } catch(__e){}
            favBtn.classList.add('shake'); setTimeout(function(){ favBtn.classList.remove('shake'); }, 300);
            return;
          }
        } catch(__e) {}

        try { toggleFav(key, word.id); } catch (_){}
        const now = isFav(key, word.id);
        favBtn.textContent = now ? '♥' : '♡';
        favBtn.classList.toggle('is-fav', now);
        favBtn.setAttribute('aria-pressed', String(now));
        favBtn.style.transform = 'scale(1.2)';
        setTimeout(() => { favBtn.style.transform = 'scale(1)'; }, 140);
      };
    }

    const reverse = isReverseTraining();

    // Вопрос (верхняя строка):
    // - forward: терм (DE)
    // - reverse: перевод (RU/UK)
    const term = termOf(word);
    const trans = String(tWord(word) || '').trim();
    wordEl.textContent = reverse ? (trans || term) : (term || trans);

    // Подзаголовок
    if (subEl) {
      subEl.textContent = reverse ? reversePromptText() : forwardPromptText();
    }
    renderStarsFor(word);

    // Нижняя статистика в карточке тренера
    try {
      if (stats) {
        const uk = getUiLang() === 'uk';
        if (isPrepositionsModeForKey(key)) {
          // Всего паттернов считаем по уникальным id в data (30), а "выучено" — по звёздам.
          const deckAll = getTrainableDeckForKey(key) || [];
          const uniq = {};
          for (let i=0; i<deckAll.length; i++){
            const w = deckAll[i];
            if (!w || w.id == null) continue;
            uniq[String(w.id)] = true;
          }
          const total = Object.keys(uniq).length;
          let learned = 0;
          for (const pid in uniq){
            try {
              if (isLearned({ id: pid }, key)) learned++;
            } catch(_){}
          }
          stats.textContent = uk
            ? `Усього патернів: ${total} / Вивчено: ${learned}`
            : `Всего паттернов: ${total} / Выучено: ${learned}`;
        } else {
          // WORDS/ARTICLES: вернуть стандартную нижнюю статистику (как было до prepositions)
          try { setDictStatsText(stats, key); } catch(_){}
        }
      }
    } catch(_){}

const opts = buildOptions(word);

// Safety guard: if options cannot reach required size (4), revert invalid filters (e.g. after reload)
if (!opts || opts.length < 4) {
  try {
    const studyLang = getStudyLangForKey(key) || 'xx';
    const v = __validateTrainingFeasibilityForKey(key);
    if (v && v.ok === false) {
      const last = __lastValidFilterStateByStudyLang[String(studyLang||'xx').toLowerCase()] || null;
      if (last) __restoreFilterState(studyLang, last);
      else if (A.Filters && typeof A.Filters.reset === 'function') A.Filters.reset(studyLang);
      try { if (A.Msg && typeof A.Msg.toast === 'function') A.Msg.toast(v.msg, 3400); } catch(_){}
      try { window.dispatchEvent(new CustomEvent('lexitron:filters:changed')); } catch(_){}
      return;
    }
  } catch(_){}
}

answers.innerHTML = '';

    let penalized = false;
    let solved = false;
    const ADV_DELAY = 1000;

    function afterAnswer() {
      try { A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender(); } catch(_){}
    }

    function lockAll(correctId) {
      const btns = answers.querySelectorAll('.answer-btn');
      btns.forEach(btn => {
        btn.disabled = true;
        const id = btn.getAttribute('data-id');
        if (id && String(id) === String(correctId)) btn.classList.add('is-correct');
        else btn.classList.add('is-dim');
      });
    }

    opts.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'answer-btn';
      b.textContent = (opt && opt._optLabel) ? opt._optLabel : tWord(opt);
      b.setAttribute('data-id', String(opt.id));
      b.onclick = () => {
        if (solved) return;
        const ok = String(opt.id) === String(word.id);

        if (ok) {
          solved = true;
          try { A.Trainer && A.Trainer.handleAnswer && A.Trainer.handleAnswer(key, word.id, true); } catch (_){}
          try { renderStarsFor(word); } catch(_){}

          // Prepositions trainer: reveal the correct answer inside the sentence placeholder.
          try {
            if (isPrepositionsModeForKey(key) && wordEl) {
              const correct = String(word && word._prepCorrect || '').trim();
              const currentQ = String(wordEl.textContent || '');
              wordEl.innerHTML = __fillPrepBlank(currentQ, correct);
            }
          } catch(_){ }

          // TTS: in reverse mode auto-speaks after correct answer (manual speaks always)
          let __ttsAfterCorrectPromise = null;
          try {
            if (!(A.settings && A.settings.trainerKind==='articles') && A.AudioTTS && A.AudioTTS.onCorrect) {
              __ttsAfterCorrectPromise = A.AudioTTS.onCorrect();
            }
          } catch(_eTTS) { __ttsAfterCorrectPromise = null; }


          // аналитика: ответ в тренере
          try {
            if (A.Analytics && typeof A.Analytics.trainingAnswer === 'function') {
              A.Analytics.trainingAnswer({ result: 'correct', applied: true });
            } else if (A.Analytics && typeof A.Analytics.trainingPing === 'function') {
              A.Analytics.trainingPing({ reason: 'answer_correct' });
            }
          } catch (_) {}

          b.classList.add('is-correct');
          answers.querySelectorAll('.answer-btn').forEach(btn => {
            if (btn !== b) btn.classList.add('is-dim');
            btn.disabled = true;
          });
          afterAnswer(true);

          // Переход к следующему слову (word-trainer, forward):
          // после верного ответа — озвучить пример целиком, дождаться окончания, пауза 250мс, затем смена слова.
          // В reverse-режиме поведение НЕ меняем.
          function _proceedNext() {
            renderSets();
            if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === "function" && A.ArticlesTrainer.isActive()) {
              try { if (A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (_) {}
            } else {
              renderTrainer();
            }
          }

          try {
            const isReverse = (typeof isReverseMode === 'function') ? !!isReverseMode() : false;
            const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');
            const isPrepsKey = !!isPrepositionsModeForKey(key);

            // 1) Prepositions: always wait for TTS (from onCorrect) before advancing.
            if (isPrepsKey) {
              if (__ttsAfterCorrectPromise && typeof __ttsAfterCorrectPromise.then === 'function') {
                __ttsAfterCorrectPromise.then(function () {
                  setTimeout(_proceedNext, ADV_DELAY);
                }).catch(function () {
                  setTimeout(_proceedNext, ADV_DELAY);
                });
              } else {
                setTimeout(_proceedNext, ADV_DELAY);
              }
              return;
            }

            // 2) Word-trainer (forward): after correct answer, speak example, wait end, pause, then advance.
            // Reverse mode behavior remains unchanged.
            // On "cold" start trainerKind may be uninitialized, so we treat words as "not articles".
            if (!isArticles && !isReverse) {
              const ex = (word && word.examples && word.examples[0] && (word.examples[0].L2 || word.examples[0].de || word.examples[0].en || word.examples[0].text)) || '';
              const exText = String(ex || '').trim();
              if (exText && A.AudioTTS && typeof A.AudioTTS.speakText === 'function') {
                const p = A.AudioTTS.speakText(exText, false, { noVoice: true, isExample: true });
                if (p && typeof p.then === 'function') {
                  p.then(function () {
                    setTimeout(_proceedNext, ADV_DELAY);
                  }).catch(function () {
                    setTimeout(_proceedNext, ADV_DELAY);
                  });
                  return;
                }
              }
            }
          } catch (_eExTTS) {}

          setTimeout(_proceedNext, ADV_DELAY);
          return;
        }

        b.classList.add('is-wrong');
        b.disabled = true;

        if (!penalized) {
          penalized = true;
          try { A.Trainer && A.Trainer.handleAnswer && A.Trainer.handleAnswer(key, word.id, false); } catch (_){}
          try { renderStarsFor(word); } catch(_){}

          // аналитика: ответ в тренере (штраф/зачёт только 1 раз)
          try {
            if (A.Analytics && typeof A.Analytics.trainingAnswer === 'function') {
              A.Analytics.trainingAnswer({ result: 'wrong', applied: true });
            } else if (A.Analytics && typeof A.Analytics.trainingPing === 'function') {
              A.Analytics.trainingPing({ reason: 'answer_wrong' });
            }
          } catch (_) {}

          try {
            const isMistDeck = !!(A.Mistakes  && A.Mistakes.isMistakesDeckKey   && A.Mistakes.isMistakesDeckKey(key));
            const isFavDeck  = !!(A.Favorites && A.Favorites.isFavoritesDeckKey && A.Favorites.isFavoritesDeckKey(key))
                               || (String(key).indexOf('favorites:')===0) || (key==='fav') || (key==='favorites');
            // во время тренировки "ошибок" и "избранного" — НЕ копим ошибки
            if (!isMistDeck && !isFavDeck && A.Mistakes && typeof A.Mistakes.push === 'function') {
              A.Mistakes.push(key, word.id);
            }
          } catch (_){}
          afterAnswer(false);
        }
      };
      answers.appendChild(b);
    });

    if (idkBtn) {
      idkBtn.onclick = () => {
        if (solved) return;
        solved = true;
        const correctBtn = answers.querySelector('.answer-btn[data-id="' + String(word.id) + '"]');
        if (correctBtn) correctBtn.classList.add('is-correct');
        lockAll(word.id);

        // аналитика: "не знаю" (как клик, но без штрафа/начисления)
        try {
          if (A.Analytics && typeof A.Analytics.trainingAnswer === 'function') {
            A.Analytics.trainingAnswer({ result: 'dont_know', applied: false });
          } else if (A.Analytics && typeof A.Analytics.trainingPing === 'function') {
            A.Analytics.trainingPing({ reason: 'answer_idk' });
          }
        } catch (_) {}

        setTimeout(() => { renderSets();
        if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === "function" && A.ArticlesTrainer.isActive()) {
          try { if (A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (_){}
        } else {
          renderTrainer();
        } }, ADV_DELAY);
      };
    }

    const full = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') ? (A.Decks.resolveDeckByKey(key) || []) : [];
    const starsMax = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;

    const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');
    const learned = full.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id, key)]) || 0) >= starsMax).length;
    if (stats) {
      setDictStatsText(stats, key);
    }
    if (modeEl && A.Trainer && typeof A.Trainer.updateModeIndicator === 'function') {
      A.Trainer.updateModeIndicator();
    }
  }

  // Мягкая перерисовка звёзд при смене режима (без смены слова/ответов)
  function repaintStarsOnly(){
    try {
      const word = A.__currentWord;
      if (!word) return;
      const box = document.querySelector('.trainer-stars');
      if (!box) return;
      const max  = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;
      const have = getStars(word.id);
      drawStarsTwoPhase(box, have, max);
    } catch(_){}
  }

  // Переключатель "Перевод: Прямой/Обратный" — только для word-trainer.
  // При смене режима перерисовываем текущую карточку и варианты,
  // НЕ затрагивая articles-trainer.
  function hookReverseToggle(){
    try {
      document.addEventListener('change', function(e){
        const t = e && e.target;
        if (!t || t.id !== 'trainReverse') return;

        // If articles trainer is active / requested — ignore (reverse doesn't apply).
        try {
          const key = activeDeckKey();
          const baseKeyForArticles = extractBaseFromVirtual(key) || key;
          const wantArticles = !!(A.settings && A.settings.trainerKind === 'articles')
            && String(baseKeyForArticles || '').toLowerCase().startsWith('de_nouns')
            && (A.ArticlesTrainer && A.ArticlesCard);
          if (wantArticles) return;
        } catch (_){ }

        // Re-render question/options in-place.
        try { renderTrainer(); } catch (_){ }
      }, { passive: true });
    } catch (_){ }
  }
  hookReverseToggle();

  /* ------------------------ Роутер и старт ------------------------ */
  const Router = {
    current: 'home',
    routeTo(action) {
      const prev = this.current || 'home';
      this.current = action;
      const app = document.getElementById('app');
      if (!app) return;

      // iOS PWA/TWA: prevent rubber-band overscroll on HOME (native-like behavior).
      // Keep other screens scrollable (dicts, favorites, etc.).
      try {
        const wantLock = __isStandaloneRunmode() && String(action || 'home') === 'home';
        setHomeRubberBandLock(wantLock);
      } catch(_){ }

      // аналитика: виртуальные экраны (вся навигация идёт через Router)
      try {
        if (A.Analytics && typeof A.Analytics.screen === 'function') {
          A.Analytics.screen(String(action || 'home'), {
            prev_screen: String(prev || 'home'),
            ui_lang: getCurrentUiLang(),
            learn_lang: getCurrentLearnLang(),
            mode: (typeof getMode === 'function') ? getMode() : null,
            trainer_kind: (A.settings && A.settings.trainerKind) ? String(A.settings.trainerKind) : null
          });
        }
      } catch(_){ }

      // аналитика: если уходим с главного экрана — завершаем тренировку
      if (prev === 'home' && action !== 'home') {
        try {
          if (A.Analytics && typeof A.Analytics.trainingEnd === 'function') {
            A.Analytics.trainingEnd({ reason: 'route_change:' + action });
          }
        } catch(_) {}
      }

      if (action === 'home') {
        mountMarkup();
        renderSets();
        renderTrainer();
        const hb = document.getElementById('hintsBody');
        if (hb) hb.textContent = ' ';

        // аналитика: старт тренировки
        try {
          if (A.Analytics && typeof A.Analytics.trainingStart === 'function') {
            const learnLang = getCurrentLearnLang();
            const uiLang = getCurrentUiLang();

            let deckKey = null;
            try {
              if (A.Trainer && typeof A.Trainer.getDeckKey === 'function') {
                deckKey = A.Trainer.getDeckKey();
              } else if (A.settings && A.settings.lastDeckKey) {
                deckKey = A.settings.lastDeckKey;
              }
            } catch (_){}

            A.Analytics.trainingStart({
              learnLang: learnLang,
              uiLang: uiLang,
              deckKey: deckKey
            });
          }
        } catch(_){}

        return;
      }
      if (action === 'dicts') { A.ViewDicts && A.ViewDicts.mount && A.ViewDicts.mount(); return; }

      if (action === 'mistakes') {
        // запоминаем "путь назад" из текущего ключа тренера (базовый, если виртуальный)
        try {
          const curKey = (A.Trainer && typeof A.Trainer.getDeckKey === 'function') ? A.Trainer.getDeckKey()
                        : ((A.settings && A.settings.lastDeckKey) || null);
          const prefer = extractBaseFromVirtual(curKey) || curKey || firstAvailableBaseDeckKey();
          A.settings = A.settings || {};
          A.settings.preferredReturnKey = prefer;
          A.saveSettings && A.saveSettings(A.settings);
        } catch(_){}
        A.ViewMistakes && A.ViewMistakes.mount && A.ViewMistakes.mount();
        return;
      }
      if (action === 'fav' || action === 'favorites') {
        try {
          const curKey = (A.Trainer && typeof A.Trainer.getDeckKey === 'function') ? A.Trainer.getDeckKey()
                        : ((A.settings && A.settings.lastDeckKey) || null);
          const prefer = extractBaseFromVirtual(curKey) || curKey || firstAvailableBaseDeckKey();
          A.settings = A.settings || {};
          A.settings.preferredReturnKey = prefer;
          A.saveSettings && A.saveSettings(A.settings);
        } catch(_){}
        A.ViewFavorites && A.ViewFavorites.mount && A.ViewFavorites.mount();
        return;
      }
    if (action === 'stats') {
      if (App.ViewStats && typeof App.ViewStats.mount === 'function') {
        App.ViewStats.mount();
      } else {
        console.warn('ViewStats не загружен, показываю заглушку');
        app.innerHTML = '<div class="home"><section class="card"><h3>Статистика</h3><p>Контент скоро появится.</p></section></div>';
      }
      return;
    }
      const uk = getUiLang() === 'uk';
      const titles = { dicts: uk ? 'Словники' : 'Словари', fav: uk ? 'Вибране' : 'Избранное', mistakes: uk ? 'Мої помилки' : 'Мои ошибки', stats: uk ? 'Статистика' : 'Статистика' };
      const name = titles[action] || (uk ? 'Екран' : 'Экран');

      app.innerHTML = `
        <div class="home">
          <section class="card">
            <h3 style="margin:0 0 6px;">${name}</h3>
            <p style="opacity:.7; margin:0;">${uk ? 'Контент скоро з’явиться.' : 'Контент скоро появится.'}</p>
          </section>
        </div>`;
    }
  };
  A.Router = A.Router || Router;

  function bindFooterNav() {
    document.querySelectorAll('.app-footer .nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.getAttribute('data-action');
        if (!act) return;
        Router.routeTo(act);
      });
    });
  }

  function bindLevelToggle() {
    const t = document.getElementById('levelToggle');
    if (!t) return;

    t.checked = (getMode() === 'hard'); // checked => hard

    t.addEventListener('change', async () => {
      const A = window.App || {};
      const before = (A.settings && A.settings.level) ? String(A.settings.level) : 'normal';
      const want   = t.checked ? 'hard' : 'normal';
      if (before === want) return;

      // дождаться готовности словарей (важно на «чистом старте»)
      await waitForDecksReady();

            // === корректно определяем прогресс в ТЕКУЩЕМ СЕТЕ без побочных эффектов ===
      // Важно:
      //  - setSize зависит от деки (например, *_lernpunkt => 10)
      //  - deckKey может быть виртуальным (favorites/mistakes/group), поэтому для storage нужен нормализованный key
      let hasProgress = false;
      let deckKeyRaw = null;
      let deckKeyStorage = null;
      let slice = [];

      const isLernpunktKey = (k) => {
        try { return String(k || '').toLowerCase().endsWith('_lernpunkt'); } catch (_) { return false; }
      };

      const getSetSizeLocal = (k) => {
        try {
          const kk = String(k || '').toLowerCase();
          if (kk.endsWith('_lernpunkt')) return 10;
          return (A.Config && Number.isFinite(A.Config.setSizeDefault)) ? A.Config.setSizeDefault : 50;
        } catch (_) { return 50; }
      };

      const normalizeProgressKey = (k) => {
        const s = String(k || '').trim();
        if (!s) return s;

        // favorites:xx:base | favorites:xx:lernpunkt | mistakes:xx:base | mistakes:xx:lernpunkt
        const mGroup = s.match(/^(favorites|mistakes):[a-z]{2}:(base|lernpunkt)$/i);
        if (mGroup) {
          const group = String(mGroup[2]).toLowerCase();
          const last = (A.settings && A.settings.lastDeckKey) ? String(A.settings.lastDeckKey) : '';
          if (last) {
            if (group === 'lernpunkt' && isLernpunktKey(last)) return last;
            if (group === 'base' && !isLernpunktKey(last)) return last;
          }
          const keys = Object.keys(window.decks || {});
          if (group === 'lernpunkt') return keys.find(x => isLernpunktKey(x)) || last || pickDefaultKeyLikeRef();
          return keys.find(x => !!x && !isLernpunktKey(x)) || last || pickDefaultKeyLikeRef();
        }

        // favorites:xx:<baseDeckKey> | mistakes:xx:<baseDeckKey>
        const m = s.match(/^(favorites|mistakes):[a-z]{2}:(.+)$/i);
        if (m) return String(m[2]);

        return s;
      };

      try {
        deckKeyRaw =
          (A.Trainer && typeof A.Trainer.getDeckKey === 'function' && A.Trainer.getDeckKey())
          || ((A.settings && A.settings.lastDeckKey) || null)
          || pickDefaultKeyLikeRef();

        deckKeyStorage = normalizeProgressKey(deckKeyRaw);

        // Пытаемся взять slice у тренера (он лучше знает setSize и batchIndex). Если не удалось — делаем fallback.
        if (A.Trainer && typeof A.Trainer.getDeckSlice === 'function') {
          slice = A.Trainer.getDeckSlice(deckKeyRaw) || A.Trainer.getDeckSlice(deckKeyStorage) || [];
        } else {
          const full = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function')
            ? (A.Decks.resolveDeckByKey(deckKeyStorage) || [])
            : [];
          const idx = (A.Trainer && typeof A.Trainer.getBatchIndex === 'function')
            ? (A.Trainer.getBatchIndex(deckKeyStorage) || 0)
            : 0;
          const setSize = getSetSizeLocal(deckKeyStorage);
          const from = idx * setSize;
          const to   = Math.min(full.length, (idx + 1) * setSize);
          slice = full.slice(from, to);
        }

        const st = (A.state && A.state.stars) ? A.state.stars : {};
        const su = (A.state && A.state.successes) ? A.state.successes : {};
        const ls = (A.state && A.state.lastSeen) ? A.state.lastSeen : {};

        for (let i = 0; i < slice.length; i++) {
          const id = slice[i] && slice[i].id;
          if (!id) continue;
          const k = starKey(id, deckKeyStorage);
          const v1 = Number(st[k] || 0);
          const v2 = Number(su[k] || 0);
          const v3 = Number(ls[k] || 0);
          if (v1 > 0 || v2 > 0 || v3 > 0) { hasProgress = true; break; }
        }
      } catch(_) {}
if (hasProgress) {
        const ok = await confirmModeChangeSet();
        if (!ok) { t.checked = (before === 'hard'); return; }

        // Очистка ТЕКУЩЕГО СЕТА — по нормализованному ключу deckKeyStorage
        try {
          const ids = (slice || []).map(w => w && w.id).filter(Boolean);
          if (ids.length && A.state) {
            A.state.stars = A.state.stars || {};
            A.state.successes = A.state.successes || {};
            A.state.lastSeen = A.state.lastSeen || {};
            ids.forEach(id => {
              const k = starKey(id, deckKeyStorage);
              A.state.stars[k] = 0;
              A.state.successes[k] = 0;
              A.state.lastSeen[k] = 0;
            });
            A.saveState && A.saveState(A.state);
          }
        } catch(_){}
      }

      // Переключаем режим (глобально)
      A.settings = A.settings || {};
      A.settings.level = want;
      try { A.saveSettings && A.saveSettings(A.settings); } catch(_){}
      document.documentElement.dataset.level = want;

      // Мягкая перерисовка
      try {
        repaintStarsOnly();
        renderSets();
        A.Stats && A.Stats.recomputeAndRender && A.Stats.recomputeAndRender();
        if (A.Trainer && typeof A.Trainer.updateModeIndicator === 'function') { A.Trainer.updateModeIndicator(); }
      } catch(_){}
    });
  }

  async function mountApp() {
    document.documentElement.dataset.level = getMode();
    setUiLang(getUiLang());

    bindLangToggle();
    bindLevelToggle();
    try { bindFiltersUI(); } catch(_){ }

    // синхронизация UI при обновлении тренера артиклей: обновляем сеты и строки статистики 1:1
    try {
      if (window.UIBus && typeof window.UIBus.on === 'function' && !A.__articlesHomeSyncBound) {
        A.__articlesHomeSyncBound = true;
        window.UIBus.on('articles:update', function(){
          try { renderSets(); } catch(_) {}
          try { renderTrainer(); } catch(_) {}
        });
      }
    } catch(_) {}
    bindFooterNav();

    // ждём словари, потом грузим главную (важно для корректного дефолтного ключа и слайса)
    await waitForDecksReady();

    // базовые user properties для GA4
    try {
      if (A.Analytics && typeof A.Analytics.setUserProps === 'function') {
        const learnLang = getCurrentLearnLang();
        const uiLang = getCurrentUiLang();
        const appMode =
          (A.Analytics && typeof A.Analytics.detectAppMode === 'function')
            ? A.Analytics.detectAppMode()
            : 'web';

        A.Analytics.setUserProps({
          learn_lang: learnLang,
          ui_lang: uiLang,
          app_mode: appMode
        });
      }
    } catch (_){}

    Router.routeTo('home');
  }

  A.Home = { mount: mountApp };

  if (document.readyState !== 'loading') mountApp();
  else document.addEventListener('DOMContentLoaded', mountApp);
})();
/* ========================= Конец файла: home.js ========================= */
    // Prepositions trainer: filters are not available (virtual exercise deck).