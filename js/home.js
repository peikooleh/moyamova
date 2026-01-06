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
  const SET_SIZE = (A.Config && A.Config.setSizeDefault) || 40;

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
      } catch(_){}
    });
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

  function setDictStatsText(statsEl, deckKey){
    try{
      if (!statsEl) return;
      const full = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function') ? (A.Decks.resolveDeckByKey(deckKey) || []) : [];
      const starsMax = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;

      const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');

      const learnedWords = full.filter(w => ((A.state && A.state.stars && A.state.stars[starKey(w.id, deckKey)]) || 0) >= starsMax).length;
      const uk = getUiLang() === 'uk';
      if (isArticles) {
        const learnedA = countLearnedArticles(full, deckKey);
        statsEl.style.display = '';
        statsEl.textContent = uk ? `Всього слів: ${full.length} / Вивчено: ${learnedA}`
                               : `Всего слов: ${full.length} / Выучено: ${learnedA}`;
      } else {
        statsEl.style.display = '';
        statsEl.textContent = uk ? `Всього слів: ${full.length} / Вивчено: ${learnedWords}`
                               : `Всего слов: ${full.length} / Выучено: ${learnedWords}`;
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
    const from = idx * SET_SIZE;
    const to   = Math.min(deck.length, (idx + 1) * SET_SIZE);
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

        <!-- ЗОНА 2: Подсказки -->
        <section class="card home-hints">
          <div class="hints-body" id="hintsBody"></div>
        </section>

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
      </div>`;
  }

  /* ------------------------------- Сеты ------------------------------- */
  function renderSets() {
    const key  = activeDeckKey();
    const deck = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function')
      ? (A.Decks.resolveDeckByKey(key) || [])
      : [];

    const grid    = document.getElementById('setsBar');
    const statsEl = document.getElementById('setStats');
    if (!grid) return;

    const totalSets = Math.ceil(deck.length / SET_SIZE);
    const activeIdx = getActiveBatchIndex();
    grid.innerHTML = '';

    const starsMax = (A.Trainer && typeof A.Trainer.starsMax === 'function') ? A.Trainer.starsMax() : 5;

    const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');

    for (let i = 0; i < totalSets; i++) {
      const from = i * SET_SIZE;
      const to   = Math.min(deck.length, (i + 1) * SET_SIZE);
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
        try { if (A.Trainer && typeof A.Trainer.setBatchIndex === 'function') A.Trainer.setBatchIndex(i, key); } catch (_){}
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

    const i = getActiveBatchIndex();
    const from = i * SET_SIZE, to = Math.min(deck.length, (i + 1) * SET_SIZE);
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
          ? `Слів у наборі: ${words.length} / Вивчено: ${learned}`
          : `Слов в наборе: ${words.length} / Выучено: ${learned}`;
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

    // Требование UX: НИКОГДА не показывать одинаковые подписи на кнопках.
    // Причина дублей: разные слова (id) могут иметь одинаковый перевод (ru/uk).
    // Решение: собираем 4 опции по id, затем гарантируем уникальность отображаемых текстов
    // (при коллизии добавляем уточнение по исходному термину).
    const SIZE = 4;

    const deck = (A.Decks && typeof A.Decks.resolveDeckByKey === 'function')
      ? (A.Decks.resolveDeckByKey(key) || [])
      : [];

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
      return String(tWord(w) || '').trim();
    }

    function termOf(w){
      return String(w && (w.word || w.term || w.de || w.src || '')) .trim();
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
    // Добор из колоды, если вдруг не хватает
    while (picked.length < SIZE && deck.length) {
      const r = deck[Math.floor(Math.random() * deck.length)];
      if (r && String(r.id) !== String(word.id) && !picked.some(p => String(p.id) === String(r.id))) picked.push(r);
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
        const t = termOf(copy);
        if (t) label = `${base} (${t})`;
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
          const t = termOf(copy);
          if (t) label = `${base} (${t})`;
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


  /* ------------------------------- Тренер ------------------------------- */
  function renderTrainer() {
    const key   = activeDeckKey();
    const slice = (A.Trainer && typeof A.Trainer.getDeckSlice === 'function') ? (A.Trainer.getDeckSlice(key) || []) : [];
    if (!slice.length) return;

    // Trainer variant switching (words vs articles).
    // We must NOT fall back to the default trainer when the user interacts with
    // sets, language toggle, or other UI elements while the articles trainer is active.
    // Switching is allowed only via the dedicated buttons on selection screens.
    const baseKeyForArticles = extractBaseFromVirtual(key) || key;
    const wantArticles = !!(A.settings && A.settings.trainerKind === 'articles')
      && String(baseKeyForArticles || '').toLowerCase().startsWith('de_nouns')
      && (A.ArticlesTrainer && A.ArticlesCard);

    if (wantArticles) {
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

    const idx = (A.Trainer && typeof A.Trainer.sampleNextIndexWeighted === 'function')
      ? A.Trainer.sampleNextIndexWeighted(slice)
      : Math.floor(Math.random() * slice.length);
    const word = slice[idx];

    A.__currentWord = word;

    const answers = document.querySelector('.answers-grid');
    const wordEl  = document.querySelector('.trainer-word');
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

    const term = word.word || word.term || '';
    wordEl.textContent = term;
    renderStarsFor(word);

    const opts = buildOptions(word);
    answers.innerHTML = '';

    let penalized = false;
    let solved = false;
    const ADV_DELAY = 750;

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
          setTimeout(() => { renderSets();
        if (A.ArticlesTrainer && typeof A.ArticlesTrainer.isActive === "function" && A.ArticlesTrainer.isActive()) {
          try { if (A.ArticlesTrainer.next) A.ArticlesTrainer.next(); } catch (_){}
        } else {
          renderTrainer();
        } }, ADV_DELAY);
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

  /* ------------------------ Роутер и старт ------------------------ */
  const Router = {
    current: 'home',
    routeTo(action) {
      const prev = this.current || 'home';
      this.current = action;
      const app = document.getElementById('app');
      if (!app) return;

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
