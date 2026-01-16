/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: view.favorites.js
 * Назначение: Экран избранных слов
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function(){
  'use strict';
  const A = (window.App = window.App || {});

  /* ---------------- i18n ---------------- */
  function isArticlesMode(){
    try { return !!(A.settings && A.settings.trainerKind === 'articles'); } catch(_){ return false; }
  }

  function currentArticlesGroup(){
    // Hard filter for articles favorites/mistakes: base vs LearnPunkt
    // Group is inferred from the last selected deck key (works for both baseKey and virtual keys).
    try{
      let k = (A.settings && (A.settings.lastDeckKey || A.settings.lastDeck || A.settings.lastArticlesDeckKey)) || '';
      k = String(k || '');
      const m = k.match(/^(favorites|mistakes):(ru|uk):(.+)$/i);
      if (m) k = String(m[3] || '');
      return /_lernpunkt$/i.test(k) ? 'lernpunkt' : 'base';
    }catch(_){
      return 'base';
    }
  }

  function getUiLang(){
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return (String(s).toLowerCase()==='uk') ? 'uk' : 'ru';
  }
  function t(){
    const uk = getUiLang()==='uk';
    return {
      title   : uk ? 'Обране' : 'Избранное',
      ok      : isArticlesMode() ? (uk ? 'Вивчати артиклі' : 'Учить артикли') : (uk ? 'Вчити слова' : 'Учить слова'),
      preview : uk ? 'Перегляд' : 'Предпросмотр',
      empty   : uk ? 'На данний момент вибраних слів немає.' : 'В данный момент избранных слов нет.',
      cnt     : uk ? 'К-сть' : 'Кол-во',
      act     : uk ? 'Дії' : 'Действия'
    };
  }

  /* ---------------- helpers ---------------- */
  const FLAG = { de:'🇩🇪', en:'🇬🇧', es:'🇪🇸', fr:'🇫🇷', sr:'🇷🇸' };

  function currentTrainLang(){
    try{
      const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
      return (String(s).toLowerCase()==='uk') ? 'uk' : 'ru';
    }catch(_){ return 'ru'; }
  }

  // Собираем «виртуальные» деки избранного по всем базовым словарям
  function gatherFavoriteDecks(){
    const TL = currentTrainLang();
    const out = [];
    try{
      const decks = (window.decks && typeof window.decks==='object') ? window.decks : {};
      let baseKeys = Object.keys(decks)
        .filter(k => Array.isArray(decks[k]) && !/^favorites:|^mistakes:/i.test(k));

      // Articles mode: do NOT mix base and LearnPunkt decks in lists (prevents "leak" illusion)
      if (isArticlesMode()){
        const grp = currentArticlesGroup();
        baseKeys = baseKeys.filter(k => grp==='lernpunkt' ? /_lernpunkt$/i.test(k) : !/_lernpunkt$/i.test(k));
      }

      for (const baseKey of baseKeys){
        const favKey = `favorites:${TL}:${baseKey}`;
        const name = (A.Decks && A.Decks.resolveNameByKey) ? A.Decks.resolveNameByKey(favKey) : favKey;
        const deck = (A.Decks && A.Decks.resolveDeckByKey) ? (A.Decks.resolveDeckByKey(favKey) || []) : [];
        if (!deck.length) continue;

        const baseLang = (A.Decks && (A.Decks.langOfFavoritesKey||A.Decks.langOfKey))
          ? (A.Decks.langOfFavoritesKey ? A.Decks.langOfFavoritesKey(favKey) : A.Decks.langOfKey(favKey))
          : '';
        const flag = (A.Decks && A.Decks.flagForKey) ? (A.Decks.flagForKey(favKey) || '🧩') : '🧩';
        out.push({ key:favKey, baseKey, trainLang:TL, name, count:deck.length, baseLang, flag });
      }
    }catch(_){}
    return out;
  }

  function render(){
    const app = document.getElementById('app');
    if (!app) return;
    const T = t();

    // (v3) Ранее было ограничение PRO — сейчас весь функционал бесплатный
    if (!A.isPro || !A.isPro()) {
      const lang = getUiLang();
      const title = T.title;
      const body = (lang === 'uk')
        ? 'Список обраних слів тимчасово недоступний.'
        : 'Список избранных слов временно недоступен.';

      app.innerHTML =
        `<div class="home home--fixed-card">
          <section class="card dicts-card favorites-card dicts-card--fixed">
            <div class="dicts-header">
              <h3>${title}</h3>
            </div>
            <div class="dicts-scroll" style="padding:16px 12px 18px;text-align:center;font-size:14px;opacity:.9;">
              <p style="margin:0;">${body}</p>
            </div>
          </section>
        </div>`;
      return;
    }

    const all = gatherFavoriteDecks();
    if (!all.length){
      app.innerHTML = `
        <div class="home home--fixed-card">
          <section class="card dicts-card dicts-card--fixed">
            <div class="dicts-header">
              <h3 style="margin:0;">${T.title}</h3>
            </div>
            <div class="dicts-scroll">
              <p style="opacity:.7;margin:0;">${T.empty}</p>
            </div>
          </section>
        </div>`;
      return;
    }

    // группировка по языку базового словаря
    const byLang = all.reduce((acc,row)=>{
      const lg = row.baseLang || 'xx';
      (acc[lg]||(acc[lg]=[])).push(row);
      return acc;
    }, {});
    const langs = Object.keys(byLang);

    // фильтр флажками
    let activeLang = (A.settings && A.settings.dictsLangFilter) || null;
    if (activeLang && !byLang[activeLang]) activeLang = null;

    function saveFilter(){
      try{
        A.settings = A.settings || {};
        A.settings.dictsLangFilter = activeLang;
        if (typeof A.saveSettings==='function') A.saveSettings(A.settings);
      }catch(_){}
    }

    function renderFlags(){
      const box = app.querySelector('#fav-flags');
      if (!box) return;
      box.innerHTML = '';
      langs.forEach(lang=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dict-flag' + (lang===activeLang ? ' active' : '');
        btn.dataset.lang = lang;
        btn.title = String(lang).toUpperCase();
        btn.textContent = FLAG[lang] || lang.toUpperCase();
        btn.onclick = ()=>{
          activeLang = (activeLang===lang) ? null : lang;
          saveFilter(); render();
        };
        box.appendChild(btn);
      });
    }

    const rows = (activeLang ? byLang[activeLang] : all).map(r=>`
      <tr data-key="${r.key}" data-base="${r.baseKey}">
        <td class="t-center">${r.flag}</td>
        <td>${r.name}</td>
        <td class="t-center">${r.count|0}</td>
        <td class="t-center">
          <span class="dicts-preview" title="${T.preview}" role="button">👁️</span>
          <span class="dicts-delete" title="Delete" role="button" style="margin-left:10px;">🗑️</span>
        </td>
      </tr>`).join('');

    app.innerHTML = `
      <div class="home home--fixed-card">
        <section class="card dicts-card dicts-card--fixed">
          <div class="dicts-header">
            <h3>${T.title}</h3>
            <div id="fav-flags" class="dicts-flags"></div>
          </div>
          <div class="dicts-scroll">
            <table class="dicts-table"><tbody>${rows}</tbody></table>
          </div>
          <div class="dicts-footer">
            <div class="dicts-actions">
              <button type="button" class="btn-primary" id="fav-apply" disabled>${T.ok}</button>
            </div>
          </div>
        </section>
      </div>`;

    renderFlags();

    const tbody = app.querySelector('.dicts-table tbody');

    // ---- делегаты таблицы
    if (tbody){
      tbody.addEventListener('click', (e)=>{
        // 👁️ предпросмотр
        const eye = e.target.closest('.dicts-preview');
        if (eye){
          e.stopPropagation();
          const tr = eye.closest('tr'); if (!tr) return;
          openPreview(tr.dataset.key);
          return;
        }

        
// 🗑️ удаление набора избранного (одной базовой деки)
const del = e.target.closest('.dicts-delete');
if (del){
  e.stopPropagation();
  const tr = del.closest('tr'); if (!tr) return;

  const baseKey = tr.dataset.base;   // напр. "de_nouns"
  const favKey  = tr.dataset.key;    // "favorites:<TL>:<baseKey>"
  const TL      = currentTrainLang();
  const isArticles = isArticlesMode();

  // 1) Получаем id избранных слов в этой базе
  let ids = [];
  try {
    // Самый надёжный путь: взять ids из виртуальной деки (bridge уже выберет правильный storage)
    if (A.Decks && typeof A.Decks.resolveDeckByKey === 'function'){
      const deck = A.Decks.resolveDeckByKey(favKey) || [];
      ids = deck.map(w => w && w.id).filter(v => v != null);
    }
    // Fallback для words: если есть быстрый getter
    if (!ids.length && !isArticles && A.Favorites && typeof A.Favorites.getIds === 'function'){
      ids = A.Favorites.getIds(TL, baseKey) || [];
    }
  } catch(_){ ids = []; }

  // 2) Снимаем «избранное» для каждого слова этой базы
  try {
    if (isArticles && A.ArticlesFavorites){
      // API ArticlesFavorites: toggle(baseDeckKey, id) + clearForDeck(trainLang, baseDeckKey)
      if (typeof A.ArticlesFavorites.clearForDeck === 'function'){
        A.ArticlesFavorites.clearForDeck(TL, baseKey);
      } else if (typeof A.ArticlesFavorites.toggle === 'function'){
        for (const id of ids){
          A.ArticlesFavorites.toggle(baseKey, id);
        }
      }
    } else if (!isArticles && A.Favorites && typeof A.Favorites.toggle === 'function'){
      for (const id of ids){
        A.Favorites.toggle(baseKey, id);
      }
    }
  } catch(_){}

  // 3) Перерисуем экран
  render();
  return;
}

// выбор строки
        const tr = e.target.closest('tr');
        if (tr){
          selectRow(tr);
        }
      });
    }

    // ---- автоселект как в "Моих ошибках"
    autoSelectInitialRow();

    // === кнопка ОК: как в "Моих ошибках" ===
    const btnApply = app.querySelector('#fav-apply');
    if (btnApply){
      btnApply.onclick = ()=>{
        // если почему-то нет выделенной — берём первую
        let sel = app.querySelector('.dicts-table tbody tr.is-selected');
        if (!sel) sel = app.querySelector('.dicts-table tbody tr');
        if (!sel) return;

        const key = sel.dataset.key;
        const cnt = parseInt(sel.children[2]?.textContent || '0', 10) || 0;

        // <4 — только предпросмотр
        if (cnt < 4){
          openPreview(key);
          return;
        }

        // запомним и универсально запустим тренировку
        try {
          A.settings = A.settings || {};
          A.settings.lastFavoritesKey = key;
          if (typeof A.saveSettings === 'function') A.saveSettings(A.settings);
        } catch(_){}

        // Важно: в режиме articles не форсим words
        try { A.settings = A.settings || {}; if (isArticlesMode()) A.settings.trainerKind = 'articles'; } catch(_){}
        launchTraining(key);
      };
    }

    // ---------- helpers (внутри render) ----------
    function setOkEnabled(enabled){
      const ok = app.querySelector('#fav-apply');
      if (ok) ok.disabled = !enabled;
    }

    function selectRow(tr){
  const cnt = parseInt(tr.children[2]?.textContent || '0', 10) || 0;
  tbody.querySelectorAll('tr').forEach(x=>x.classList.remove('is-selected'));
  tr.classList.add('is-selected');
  // кнопку не отключаем — пусть всегда активна, а проверку <4 обрабатывает сам onClick
  setOkEnabled(true);
}

    function autoSelectInitialRow(){
      // 1) если есть сохранённый ключ и он присутствует в таблице — выбираем его
      let key = null;
      try { key = A.settings && A.settings.lastFavoritesKey; } catch(_){}
      let tr = key ? tbody.querySelector(`tr[data-key="${CSS.escape(key)}"]`) : null;

      // 2) иначе — первая строка
      if (!tr) tr = tbody.querySelector('tr');
      if (!tr) return;

      selectRow(tr);
    }

    function launchTraining(key){
      // Switch to the default word trainer
      try { A.settings = A.settings || {}; /* keep current mode; default to words */ if (!A.settings.trainerKind) A.settings.trainerKind = 'words'; } catch(_){ }
      // Auto-grouping: base vs LearnPunkt для words favorites
      try{
        if (!isArticlesMode()){
          const s = String(key||'');
          const m = s.match(/^(favorites):(ru|uk):(.+)$/i);
          if (m){
            const tl = String(m[2]).toLowerCase()==='uk' ? 'uk' : 'ru';
            const tail = String(m[3]||'');
            if (!/^(base|lernpunkt)$/i.test(tail)){
              const grp = /_lernpunkt$/i.test(tail) ? 'lernpunkt' : 'base';
              key = `favorites:${tl}:${grp}`;
            }
          }
        }
      }catch(_){}

      // 1) как в других вью: общий стартер, если есть
      if (A.UI && typeof A.UI.startTrainingWithKey === 'function'){
        A.UI.startTrainingWithKey(key);
        return;
      }
      if (A.Home && typeof A.Home.startTrainingWithKey === 'function'){
        A.Home.startTrainingWithKey(key);
        return;
      }
      // 2) фоллбэк: проставить ключ тренеру и уйти на home
      if (A.Trainer && typeof A.Trainer.setDeckKey === 'function'){
        A.Trainer.setDeckKey(key);
      }
      if (A.Router && typeof A.Router.routeTo === 'function'){
        A.Router.routeTo('home');
      } else if (A.UI && typeof A.UI.goHome === 'function'){
        A.UI.goHome();
      } else {
        location.hash = '';
      }
    }
  }

  /* -------- модальное превью -------- */
  function openPreview(favKey){
    const T = t();
    const deck = (A.Decks && A.Decks.resolveDeckByKey)
      ? (A.Decks.resolveDeckByKey(favKey) || [])
      : [];
    const ui = getUiLang();
    const rows = deck.slice(0,150).map((w,i)=>{
      const tr = (ui==='uk') ? (w.uk || w.ru || '') : (w.ru || w.uk || '');
      return `<tr><td class="t-center">${i+1}</td><td>${w.word||''}</td><td>${tr}</td></tr>`;
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay" role="button" aria-label="Close"></div>
      <div class="mmodal__panel" role="dialog" aria-modal="true" aria-labelledby="mmodalTitle">
        <div class="mmodal__header">
          <h3 id="mmodalTitle" class="mmodal__title">👁️ ${T.title}</h3>
          <button class="mmodal__close" aria-label="Close">×</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead><tr><th>#</th><th>Word</th><th>Translation</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" style="opacity:.6">${T.empty}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = ()=>wrap.remove();
    wrap.querySelector('.mmodal__overlay').onclick = close;
    wrap.querySelector('.mmodal__close').onclick = close;
  }

  // Публичный mount
  A.ViewFavorites = { mount: function(){ try{ if (A.stopAllTrainers) A.stopAllTrainers('view:favorites'); }catch(_){} return render(); } };
})();
/* ========================= Конец файла: view.favorites.js ========================= */
