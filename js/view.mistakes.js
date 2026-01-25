/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: view.mistakes.js
 * Назначение: Экран ошибок
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function(){
  'use strict';
  const A = (window.App = window.App || {});

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
    const ok = isArticlesMode()
      ? (uk ? 'Вивчати артиклі' : 'Учить артикли')
      : (uk ? 'Вчити слова' : 'Учить слова');
    return uk
      ? { title:'Мої помилки', lang:'Мова словника', name:'Назва', words:'Слів', preview:'Перегляд', empty:'На данний момент помилок немає', ok: ok }
      : { title:'Мои ошибки',  lang:'Язык словаря',  name:'Название', words:'Слов', preview:'Предпросмотр', empty:'В данный момент ошибок нет', ok: ok };
  }

  const FLAG = { en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷', es:'🇪🇸', it:'🇮🇹', ru:'🇷🇺', uk:'🇺🇦', pl:'🇵🇱', sr:'🇷🇸' };

  function currentTrainLang(){
    try{
      const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
      return (String(s).toLowerCase()==='uk') ? 'uk' : 'ru';
    }catch(_){ return 'ru'; }
  }

  function gatherMistakeDecks(){
    const TL = currentTrainLang();

    // В режиме артиклей показываем ошибки артиклей (изолированный контур),
    // визуально так же, как обычные ошибки.
    if (isArticlesMode()){
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
          const mKey = `mistakes:${TL}:${baseKey}`;
          const deck = (A.Decks && A.Decks.resolveDeckByKey) ? (A.Decks.resolveDeckByKey(mKey) || []) : [];
          if (!deck.length) continue;
          const name = (A.Decks && A.Decks.resolveNameByKey) ? A.Decks.resolveNameByKey(mKey) : mKey;
          const baseLang = (A.Decks && (A.Decks.langOfMistakesKey||A.Decks.langOfKey))
            ? (A.Decks.langOfMistakesKey ? A.Decks.langOfMistakesKey(mKey) : A.Decks.langOfKey(mKey))
            : '';
          const flag = (A.Decks && A.Decks.flagForKey) ? (A.Decks.flagForKey(mKey) || '🧩') : '🧩';
          out.push({ key: mKey, baseKey: baseKey, trainLang: TL, name, count: deck.length, baseLang, flag });
        }
      }catch(_){ }
      return out;
    }

    // Стандартные ошибки слов
    const rows = (A.Mistakes && A.Mistakes.listSummary ? A.Mistakes.listSummary() : []);
    return rows.map(r=>{
      const mKey = r.mistakesKey;
      const name = (A.Decks && A.Decks.resolveNameByKey) ? A.Decks.resolveNameByKey(mKey) : mKey;
      const deck = (A.Decks && A.Decks.resolveDeckByKey) ? (A.Decks.resolveDeckByKey(mKey) || []) : [];
      const baseLang = (A.Decks && (A.Decks.langOfMistakesKey||A.Decks.langOfKey)) ? (A.Decks.langOfMistakesKey ? A.Decks.langOfMistakesKey(mKey) : A.Decks.langOfKey(mKey)) : '';
      const flag = (A.Decks && A.Decks.flagForKey) ? (A.Decks.flagForKey(mKey) || '🧩') : '🧩';
      return { key: mKey, baseKey: r.baseKey, trainLang: r.trainLang, name, count: deck.length, baseLang, flag };
    });
  }

  function render(){
    const app = document.getElementById('app');
    if (!app) return;
    const T = t();

    const all = gatherMistakeDecks();
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

    // группируем по языку базового словаря (как на экране словарей)
    const byLang = all.reduce((acc, row)=>{
      const lg = row.baseLang || 'xx';
      (acc[lg] || (acc[lg]=[])).push(row);
      return acc;
    }, {});
    const langs = Object.keys(byLang);

    // активный язык-фильтр (помним между заходами)
    let activeLang = (function load(){
      try {
        const s = (A.settings && A.settings.mistakesLang);
        if (s && byLang[s] && byLang[s].length) return s;
      } catch(_){}
      return langs[0];
    })();

    let selectedKey = (function loadSel(){
      try {
        const saved = (A.settings && A.settings.lastMistakesKey) || '';
        if (saved && byLang[activeLang]?.some(r=>r.key===saved)) return saved;
      } catch(_){}
      return (byLang[activeLang] && byLang[activeLang][0]?.key) || '';
    })();

    function saveActive(lang){
      try { A.settings = A.settings || {}; A.settings.mistakesLang = lang; if (typeof A.saveSettings==='function') A.saveSettings(A.settings); } catch(_){}
    }
    function saveSelected(key){
      try { A.settings = A.settings || {}; A.settings.lastMistakesKey = key; if (typeof A.saveSettings==='function') A.saveSettings(A.settings); } catch(_){}
    }

    function renderFlags(){
      const box = app.querySelector('#mistakes-flags');
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
          if (lang===activeLang) return;
          activeLang = lang; saveActive(lang);
          selectedKey = (byLang[activeLang] && byLang[activeLang][0]?.key) || '';
          renderTable();
        };
        box.appendChild(btn);
      });
    }

    function renderTable(){
      const data = byLang[activeLang] || [];
      if (!data.length){
        app.innerHTML = `
          <div class="home home--fixed-card">
            <section class="card dicts-card dicts-card--fixed">
              <div class="dicts-header">
                <h3>${T.title}</h3>
              </div>
              <div class="dicts-scroll">
                <p style="opacity:.7;margin:0;">${T.empty}</p>
              </div>
            </section>
          </div>`;
        return;
      }

      const rows = data.map(r=>{
        const sel = (r.key === selectedKey) ? ' is-selected' : '';
        const canTrain = (r.count|0) >= 4;
        // эмодзи: 👁️ preview, 🗑️ delete
        return `
          <tr class="dict-row${sel}" data-key="${r.key}" data-base="${r.baseKey}" data-train-lang="${r.trainLang}" data-count="${r.count|0}">
            <td class="t-center">${r.flag}</td>
            <td>${r.name}</td>
            <td class="t-center">${r.count|0}</td>
            <td class="t-center">
              <span class="mistakes-preview" title="${T.preview}" role="button" aria-label="${T.preview}">👁️</span>
              <span class="mistakes-delete" title="Delete" role="button" aria-label="Delete" style="margin-left:10px;">🗑️</span>
            </td>
          </tr>`;
      }).join('');

      app.innerHTML = `
        <div class="home home--fixed-card">
          <section class="card dicts-card dicts-card--fixed">
            <div class="dicts-header">
              <h3>${T.title}</h3>
              <div id="mistakes-flags" class="dicts-flags"></div>
            </div>
            <div class="dicts-scroll">
              <table class="dicts-table">
                <tbody>${rows}</tbody>
              </table>
            </div>
            <div class="dicts-footer">
              <div class="dicts-actions">
                <button type="button" class="btn-primary" id="mistakes-apply">${T.ok}</button>
              </div>
            </div>
          </section>
        </div>`;

      renderFlags();

      const tbody = app.querySelector('.dicts-table tbody');
      if (tbody){
        tbody.addEventListener('click', (e)=>{
          const eye = e.target.closest('.mistakes-preview');
          if (eye){
            e.stopPropagation();
            const tr = eye.closest('tr');
            if (!tr) return;
            openPreview(tr.dataset.key);
            return;
          }
          const del = e.target.closest('.mistakes-delete');
          if (del){
            e.stopPropagation();
            const tr = del.closest('tr');
            if (!tr) return;
            const mKey = tr.dataset.key;
            const Mist = isArticlesMode() ? (A.ArticlesMistakes || null) : (A.Mistakes || null);
            const p = Mist && Mist.parseKey ? Mist.parseKey(mKey) : null;
            if (p){
              try{
                if (isArticlesMode()){
                  // Только ручная очистка
                  if (Mist && typeof Mist.clearForDeck === 'function') Mist.clearForDeck(p.trainLang, p.baseDeckKey);
                } else {
                  if (A.Mistakes && typeof A.Mistakes.removeDeck === 'function') A.Mistakes.removeDeck(p.trainLang, p.baseDeckKey);
                }
              }catch(_){ }
              // пересчитать и перерисовать заново
              render();
            }
            return;
          }
          const row = e.target.closest('.dict-row');
          if (!row) return;
          selectedKey = row.dataset.key || selectedKey;
          app.querySelectorAll('.dict-row').forEach(r=> r.classList.remove('is-selected'));
          row.classList.add('is-selected');
        }, { passive:true });
      }

      // Кнопка ОК — запуск тренировки на mistakes-словаре (если >=4 слов)
      const ok = document.getElementById('mistakes-apply');
      if (ok){
        ok.onclick = ()=>{
          const row = app.querySelector('.dict-row.is-selected');
          if (!row) return;
          const key = row.getAttribute('data-key');
          const count = row.getAttribute('data-count')|0;
          if (count < 4) {
            // просто превью, тренировка недоступна
            openPreview(key);
            return;
          }
          saveSelected(key);
          // Запуск тренировки: в режиме артиклей остаёмся в articles-контуре.
          if (isArticlesMode()) {
            try { A.settings = A.settings || {}; A.settings.trainerKind = "articles"; } catch(_){ }
            try {
              A.settings = A.settings || {};
              A.settings.lastDeckKey = key;
              if (typeof A.saveSettings === 'function') A.saveSettings(A.settings);
            } catch(_){ }
            try { document.dispatchEvent(new CustomEvent('lexitron:deck-selected', { detail:{ key: key } })); } catch(_){ }
            try { A.Router && A.Router.routeTo && A.Router.routeTo('home'); } catch(_){ }
            return;
          }

          // Detect prepositions decks (incl. virtual mistakes:* keys) and route to the correct trainer.
          try{
            const s0 = String(key||'');
            let baseKey = s0;
            const vm = s0.match(/^(mistakes):(ru|uk):(.+)$/i);
            if (vm){
              const tail = String(vm[3]||'');
              if (tail && !/^(base|lernpunkt)$/i.test(tail)) baseKey = tail;
            }
            if (A.Prepositions && typeof A.Prepositions.isAnyPrepositionsKey === 'function' && A.Prepositions.isAnyPrepositionsKey(baseKey)){
              A.settings = A.settings || {};
              A.settings.trainerKind = "prepositions";
            } else {
              // Default words trainer
              A.settings = A.settings || {}; A.settings.trainerKind = "words";
            }
          } catch(_){ try { A.settings = A.settings || {}; A.settings.trainerKind = "words"; } catch(__){} }
          try {
            A.settings = A.settings || {};
            // Auto-grouping: base vs LearnPunkt для words mistakes
            try{
              if (!isArticlesMode()){
                const s = String(key||'');
                const m = s.match(/^(mistakes):(ru|uk):(.+)$/i);
                if (m){
                  const tl = String(m[2]).toLowerCase()==='uk' ? 'uk' : 'ru';
                  const tail = String(m[3]||'');
                  if (!/^(base|lernpunkt)$/i.test(tail)){
                    const grp = /_lernpunkt$/i.test(tail) ? 'lernpunkt' : 'base';
                    key = `mistakes:${tl}:${grp}`;
                  }
                }
              }
            }catch(_){}

            A.settings.lastDeckKey = key;
            if (typeof A.saveSettings === 'function') A.saveSettings(A.settings);
          } catch(_){ }
          try { document.dispatchEvent(new CustomEvent('lexitron:deck-selected', { detail:{ key: key } })); } catch(_){ }
          try { A.Trainer && A.Trainer.setDeckKey && A.Trainer.setDeckKey(key); } catch(_){ }
          try { A.Router && A.Router.routeTo && A.Router.routeTo('home'); } catch(_){ }
        };
      }
    }

    renderTable();
  }

  function tWord(w){
    const uk = getUiLang()==='uk';
    if (!w) return '';
    return uk ? (w.uk || w.translation_uk || w.trans_uk || w.ua || '')
              : (w.ru || w.translation_ru || w.trans_ru || '');
  }

  function openPreview(key){
    const deck = (A.Decks && A.Decks.resolveDeckByKey) ? (A.Decks.resolveDeckByKey(key) || []) : [];
    const name = (A.Decks && A.Decks.resolveNameByKey) ? A.Decks.resolveNameByKey(key) : key;
    const flag = (A.Decks && A.Decks.flagForKey) ? A.Decks.flagForKey(key) : '🧩';
    const T = t();

    const isPreps = deck.some(w => w && (w._prepCorrect || w.prepCorrect));
    const ui = getUiLang();
    const LBL_WORD = ui === 'uk' ? 'Слово' : 'Слово';
    const LBL_TRANS = ui === 'uk' ? 'Переклад' : 'Перевод';
    const LBL_PATTERN = ui === 'uk' ? 'Патерн' : 'Паттерн';
    const LBL_PREP = ui === 'uk' ? 'Прийменник' : 'Предлог';

    const seen = new Set();
    const list = isPreps
      ? deck.filter(w => {
          const id = (w && (w.id || w._id || w.patternId)) || '';
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        }).slice(0,5)
      : deck;

    const rows = list.map((w,i)=>{
      const left = isPreps ? (w.de || w.pattern || '') : (w.word || w.term || '');
      const right = isPreps ? (w._prepCorrect || w.prepCorrect || '') : tWord(w);
      return `
        <tr>
          <td>${i+1}</td>
          <td>${left}</td>
          <td>${right}</td>
        </tr>`;
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay"></div>
      <div class="mmodal__panel" role="dialog" aria-modal="true">
        <div class="mmodal__header">
          <h3>${flag} ${name}</h3>
          <button class="mmodal__close" aria-label="×">✕</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead><tr><th>#</th><th>${isPreps ? LBL_PATTERN : LBL_WORD}</th><th>${isPreps ? LBL_PREP : LBL_TRANS}</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" style="opacity:.6">${T.empty}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = ()=>wrap.remove();
    wrap.querySelector('.mmodal__overlay').onclick = close;
    wrap.querySelector('.mmodal__close').onclick = close;
  }

  A.ViewMistakes = { mount: function(){ try{ if (A.stopAllTrainers) A.stopAllTrainers('view:mistakes'); }catch(_){} return render(); } };
})();
/* ========================= Конец файла: view.mistakes.js ========================= */
