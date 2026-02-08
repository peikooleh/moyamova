/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: view.dicts.js
 * Назначение: Экран словарей
 * Версия: 1.2
 * Обновлено: 2025-11-17
 * ========================================================== */

(function(){
  'use strict';
  const A = (window.App = window.App || {});

  /* ---------------------- helpers ---------------------- */
  function getUiLang(){
    const s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
    return (String(s).toLowerCase() === 'uk') ? 'uk' : 'ru';
  }

  function t(){
    const uk = getUiLang() === 'uk';
    return {
      title:   uk ? 'Словники' : 'Словари',
      preview: uk ? 'Переглянути' : 'Предпросмотр',
      empty:   uk ? 'Словників не знайдено' : 'Словари не найдены',
      word:    uk ? 'Слово' : 'Слово',
      trans:   uk ? 'Переклад' : 'Перевод',
      pattern: uk ? 'Патерн' : 'Паттерн',
      prep:    uk ? 'Прийменник' : 'Предлог',
      close:   uk ? 'Закрити' : 'Закрыть',
      // This button starts the default word trainer
      ok:      uk ? 'Вчити слова' : 'Учить слова',
      articles: uk ? 'Вчити артиклі' : 'Учить артикли',
      preps:   uk ? 'Вчити прийменники' : 'Учить предлоги'
    };
  }

  // подсветка активной кнопки в футере
  function setFooterActive(name){
    try{
      const footer = document.querySelector('footer.app-footer');
      if (!footer) return;
      footer.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      const btn = footer.querySelector(`.nav-btn[data-action="${name}"]`);
      if (btn) btn.classList.add('active');
    }catch(_){}
  }

  /* ---------------------- render list ---------------------- */
  function renderDictList(){
    const app = document.getElementById('app');
    if (!app) return;
    const T = t();

    
    function isSrEnabled(){ try { return localStorage.getItem('mm_sr') === '1'; } catch(_) { return false; } }
    function isLpEnabled(){ try { return localStorage.getItem('mm_lp') === '1'; } catch(_) { return false; } }
    function isLpKey(k){ return String(k||'').toLowerCase().endsWith('_lernpunkt'); }
const allKeys = (A.Decks?.builtinKeys?.() || []);
    if (!allKeys.length){
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

    // Группировка по языку
    const byLang = allKeys.reduce((acc, key)=>{
      const lang = (A.Decks.langOfKey && A.Decks.langOfKey(key)) || '';
      if (!lang) return acc;
      (acc[lang] || (acc[lang] = [])).push(key);
      return acc;
    }, {});
    // Hide SR language unless enabled
    if (!isSrEnabled()) { delete byLang.sr; }
    // Hide Lernpunkt decks from DE unless enabled (page will be removed below)
    if (!isLpEnabled() && byLang.de) { byLang.de = byLang.de.filter(k=>!isLpKey(k)); }

    const langs = Object.keys(byLang);
    if (!langs.length){
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

    // Активный язык для фильтра
    function loadActiveLang(){
      try {
        const s = (A.settings && A.settings.dictsLang);
        if (s && byLang[s] && byLang[s].length) return s;
      } catch(_){}
      return langs[0];
    }
    function saveActiveLang(lang){
      try { if (A.settings) A.settings.dictsLang = lang; } catch(_){}
    }
    let activeLang = loadActiveLang();

    // Выбранная строка (кандидат)
    function loadSelectedKey(){
      const saved = (A.settings && A.settings.lastDeckKey) || '';
      if (saved && byLang[activeLang]?.includes(saved)) return saved;
      return (byLang[activeLang] && byLang[activeLang][0]) || '';
    }
    let selectedKey = loadSelectedKey();

    // Надёжный переход «домой»
    function goHome(){
      // выставим активную кнопку сразу
      setFooterActive('home');
      try {
        if (window.Router && typeof Router.routeTo === 'function') { Router.routeTo('home'); return; }
        if (A.Router && typeof A.Router.routeTo === 'function')      { A.Router.routeTo('home'); return; }
      } catch(_){}
      const homeBtn = document.querySelector('footer .nav-btn[data-action="home"]');
      if (homeBtn) { homeBtn.click(); return; }
      document.body.setAttribute('data-route','home');
      try { document.dispatchEvent(new Event('lexitron:route-changed')); } catch(_){}
      try { window.dispatchEvent(new Event('lexitron:route-changed')); } catch(_){}
    }

    function renderTableForLang(lang){
      const keysAll = byLang[lang] || [];

      // --- helpers for LearnPunkt split (only for DE) ---
      const isLP = isLpKey;
      const lpEnabled = isLpEnabled();
      const mainKeys = (lang === 'de') ? keysAll.filter(k=>!isLP(k)) : keysAll;
      const lpKeys   = (lang === 'de' && lpEnabled) ? keysAll.filter(isLP) : [];

      // selections
      function loadSelectedKeyScoped(scopeKeys, scopeName){
        const saved =
          (A.settings && (
            scopeName === 'de-main' ? A.settings.dictsSelectedKeyDeMain :
            scopeName === 'de-lp'   ? A.settings.dictsSelectedKeyDeLP   :
            A.settings.lastDeckKey
          )) || '';
        if (saved && scopeKeys.includes(saved)) return saved;
        return scopeKeys[0] || '';
      }
      let selectedMain = (lang === 'de') ? loadSelectedKeyScoped(mainKeys, 'de-main') : '';
      let selectedLP   = (lang === 'de') ? loadSelectedKeyScoped(lpKeys,   'de-lp')   : '';

      function saveSelectedKeyScoped(key, scopeName){
        try{
          A.settings = A.settings || {};
          if (scopeName === 'de-main') A.settings.dictsSelectedKeyDeMain = key;
          else if (scopeName === 'de-lp') A.settings.dictsSelectedKeyDeLP = key;
          else A.settings.lastDeckKey = key;
          if (typeof A.saveSettings === 'function') A.saveSettings(A.settings);
        }catch(_){}
      }

      // active page only for DE
      let activePage = 0;
      if (lang === 'de'){
        try {
          const p = (A.settings && A.settings.dictsDePage);
          activePage = (p === 1) ? 1 : 0;
        } catch(_){}
        // If LearnPunkt is disabled, force page 0
        if (!lpEnabled) {
          activePage = 0;
          try { if (A.settings) A.settings.dictsDePage = 0; } catch(_){}
        }
      }

      // selectedKey is what будет применяться кнопками
      let selectedKey = (lang === 'de')
        ? ((activePage === 1 ? selectedLP : selectedMain) || (mainKeys[0] || lpKeys[0] || ''))
        : (loadSelectedKey() || '');

      // ensure selection is valid for non-DE
      if (lang !== 'de'){
        if (!keysAll.includes(selectedKey)) selectedKey = keysAll[0] || '';
      }

      function rowsFor(keys, currentSel){
        return keys.map(key=>{
          const deck = A.Decks.resolveDeckByKey(key) || [];
          const flag = A.Decks.flagForKey(key);
          const name = A.Decks.resolveNameByKey(key);
          const isSel = (key === currentSel);
          return `
            <tr class="dict-row${isSel ? ' is-selected' : ''}" data-key="${key}">
              <td class="t-center">${flag}</td>
              <td>${name}</td>
              <td class="t-center">${deck.length}</td>
              <td class="t-center">
                <span class="dicts-preview" title="${T.preview}" data-key="${key}" role="button" aria-label="${T.preview}">👁‍🗨</span>
              </td>
            </tr>`;
        }).join('');
      }

      // --- render ---
      if (lang !== 'de'){
        // 1:1 старое поведение для не-DE
        if (!keysAll.includes(selectedKey)) selectedKey = keysAll[0] || '';

        const rows = rowsFor(keysAll, selectedKey);
        app.innerHTML = `
          <div class="home home--fixed-card">
            <section class="card dicts-card dicts-card--fixed">
              <div class="dicts-header">
                <h3>${T.title}</h3>
                <div id="dicts-flags" class="dicts-flags"></div>
              </div>

              <div class="dicts-scroll">
                <table class="dicts-table">
                  <tbody>${rows}</tbody>
                </table>
              </div>

              <div class="dicts-footer">
                <div class="dicts-actions">
                  <button type="button" class="btn-primary" id="dicts-apply">${T.ok}</button>
                  <button type="button" class="btn-primary" id="dicts-articles" style="display:none">${T.articles}</button>
                  <button type="button" class="btn-primary" id="dicts-prepositions" style="display:none">${T.preps}</button>
                </div>
              </div>
            </section>
          </div>`;

      } else {
        // DE: две страницы (обычные деки + LearnPunkt)
        if (!lpEnabled){
          const rows0 = mainKeys.length ? rowsFor(mainKeys, selectedMain) : '';
          app.innerHTML = `
            <div class="home home--fixed-card">
              <section class="card dicts-card dicts-card--fixed">
                <div class="dicts-header">
                  <h3>${T.title}</h3>
                  <div id="dicts-flags" class="dicts-flags"></div>
                </div>

                <div class="dicts-scroll">
                  <table class="dicts-table" data-scope="de-main">
                    <tbody>${rows0 || ''}</tbody>
                  </table>
                  ${mainKeys.length ? '' : `<p style="opacity:.85;margin:10px 0 0;">${T.empty}</p>`}
                </div>

                <div class="dicts-footer">
                  <div class="dicts-actions">
                    <button type="button" class="btn-primary" id="dicts-apply">${T.ok}</button>
                    <button type="button" class="btn-primary" id="dicts-articles" style="display:none">${T.articles}</button>
                    <button type="button" class="btn-primary" id="dicts-prepositions" style="display:none">${T.preps}</button>
                  </div>
                </div>
              </section>
            </div>`;
        } else {
        const rows0 = mainKeys.length ? rowsFor(mainKeys, selectedMain) : '';
        const rows1 = lpKeys.length   ? rowsFor(lpKeys,   selectedLP)   : '';

        app.innerHTML = `
          <div class="home home--fixed-card">
            <section class="card dicts-card dicts-card--fixed">
              <div class="dicts-header">
                <h3>${T.title}</h3>
                <div id="dicts-flags" class="dicts-flags"></div>
              </div>

              <div class="dicts-scroll">
              <div class="stats-pages">
                <div class="stats-page${activePage===0?' is-active':''}" data-page="0">
                  <table class="dicts-table" data-scope="de-main">
                    <tbody>${rows0 || ''}</tbody>
                  </table>
                  ${mainKeys.length ? '' : `<p style="opacity:.85;margin:10px 0 0;">${T.empty}</p>`}
                </div>

                <div class="stats-page${activePage===1?' is-active':''}" data-page="1">
                  <div style="display:flex;align-items:center;gap:10px;margin:6px 2px 10px;">
                    <h3 style="margin:0;font-size:18px;">LearnPunkt</h3>
                  </div>
                  <table class="dicts-table" data-scope="de-lp">
                    <tbody>${rows1 || ''}</tbody>
                  </table>
                  ${lpKeys.length ? '' : `<p style="opacity:.85;margin:10px 0 0;">${T.empty}</p>`}
                </div>
              </div>

              </div>

              <div class="dicts-footer">
                <div class="stats-pages-dots">
                  <button type="button" class="stats-page-dot${activePage===0?' is-active':''}" data-page="0" aria-label="Page 1"></button>
                  <button type="button" class="stats-page-dot${activePage===1?' is-active':''}" data-page="1" aria-label="Page 2"></button>
                </div>

                <div class="dicts-actions">
                  <button type="button" class="btn-primary" id="dicts-apply">${T.ok}</button>
                  <button type="button" class="btn-primary" id="dicts-articles" style="display:none">${T.articles}</button>
                  <button type="button" class="btn-primary" id="dicts-prepositions" style="display:none">${T.preps}</button>
                </div>
              </div>
            </section>
          </div>`;
      }
      }

      // --- handlers ---
      const card = app.querySelector('.dicts-card');
      if (!card) return;

      // preview + row selection (delegation per table)
      card.querySelectorAll('.dicts-table tbody').forEach(tbody=>{
        tbody.addEventListener('click', (e)=>{
          const eye = e.target.closest('.dicts-preview');
          if (eye){
            e.stopPropagation();
            openPreview(eye.dataset.key);
            return;
          }
          const row = e.target.closest('.dict-row');
          if (!row) return;
          const key = row.dataset.key;
          if (!key) return;

          // determine scope
          const table = row.closest('.dicts-table');
          const scope = table ? table.getAttribute('data-scope') : null;

          if (lang === 'de' && scope === 'de-lp'){
            selectedLP = key;
            saveSelectedKeyScoped(key, 'de-lp');
            // update selection styles in that table only
            table.querySelectorAll('.dict-row').forEach(r=>r.classList.remove('is-selected'));
            row.classList.add('is-selected');
            if (activePage === 1) selectedKey = key;
          } else if (lang === 'de' && scope === 'de-main'){
            selectedMain = key;
            saveSelectedKeyScoped(key, 'de-main');
            table.querySelectorAll('.dict-row').forEach(r=>r.classList.remove('is-selected'));
            row.classList.add('is-selected');
            if (activePage === 0) selectedKey = key;
          } else {
            selectedKey = key;
            saveSelectedKeyScoped(key, 'any');
            card.querySelectorAll('.dict-row').forEach(r=> r.classList.remove('is-selected'));
            row.classList.add('is-selected');
          }

          // аналитика: выбор словаря
          try {
            if (A.Analytics && typeof A.Analytics.track === 'function') {
              A.Analytics.track('dict_select_deck', {
                deck_key: String(key || ''),
                scope: scope || null,
                ui_lang: getUiLang(),
                learn_lang: (A.Decks && typeof A.Decks.langOfKey === 'function') ? (A.Decks.langOfKey(key) || null) : null
              });
            }
          } catch(_){ }

          updateArticlesButton();


          updatePrepositionsButton();
        }, { passive:true });
      });

      // pager for DE
      if (lang === 'de'){
        const dots = card.querySelectorAll('.stats-page-dot');
        const pages = card.querySelectorAll('.stats-page');
        dots.forEach(d=>{
          d.addEventListener('click', ()=>{
            const p = (d.getAttribute('data-page')|0) ? 1 : 0;
            if (p === activePage) return;
            activePage = p;

            // аналитика: переключение страницы (DE / LearnPunkt)
            try {
              if (A.Analytics && typeof A.Analytics.track === 'function') {
                A.Analytics.track('dict_pager_change', {
                  lang: 'de',
                  page: activePage,
                  ui_lang: getUiLang(),
                  deck_key: String((activePage === 1 ? selectedLP : selectedMain) || selectedKey || '')
                });
              }
            } catch(_){ }
            try { A.settings = A.settings || {}; A.settings.dictsDePage = activePage; if (typeof A.saveSettings === 'function') A.saveSettings(A.settings); } catch(_){}
            pages.forEach(pg=>pg.classList.toggle('is-active', (pg.getAttribute('data-page')|0) === activePage));
            dots.forEach(dd=>dd.classList.toggle('is-active', (dd.getAttribute('data-page')|0) === activePage));
            selectedKey = (activePage === 1 ? selectedLP : selectedMain) || selectedKey;
            updateArticlesButton();

            updatePrepositionsButton();
          }, { passive:true });
        });
      }

      function updateArticlesButton(){
        try{
          const b = document.getElementById('dicts-articles');
          if (!b) return;
          const hasPlugin = !!(A.ArticlesTrainer && A.ArticlesCard);
          const show = hasPlugin && String(selectedKey || '').toLowerCase().startsWith('de_nouns');
          b.style.display = show ? '' : 'none';
        }catch(_){}
      }
      function updatePrepositionsButton(){
        try{
          const b = document.getElementById('dicts-prepositions');
          if (!b) return;

          function hasPrepsDataset(lang){
            try {
              const L = String(lang || '').toLowerCase();
              const src = (typeof window !== 'undefined') ? (window.prepositionsTrainer && window.prepositionsTrainer[L]) : null;
              if (!src) return false;
              // Expected structure: { lang:'de', patterns:[...] }
              if (Array.isArray(src.patterns)) return src.patterns.length > 0;
              // Fallbacks (in case old format is used)
              if (Array.isArray(src)) return src.length > 0;
              if (typeof src === 'object') return Object.keys(src).length > 0;
              return false;
            } catch(_){
              return false;
            }
          }

          // Показываем кнопку, когда выбрана дека предлогов для любого языка (EN/DE сейчас).
          // Ключ может быть как "реальный" xx_prepositions, так и "виртуальный" xx_prepositions_trainer.
          const isPrepsDeck = (A.Prepositions && typeof A.Prepositions.isAnyPrepositionsKey === 'function')
            ? !!A.Prepositions.isAnyPrepositionsKey(selectedKey)
            : /_prepositions(_trainer)?$/i.test(String(selectedKey||''));

          let lang = null;
          try {
            if (A.Prepositions && typeof A.Prepositions.langOfPrepositionsKey === 'function') lang = A.Prepositions.langOfPrepositionsKey(selectedKey);
          } catch(_){ }
          if (!lang) {
            try { if (A.Decks && typeof A.Decks.langOfKey === 'function') lang = A.Decks.langOfKey(selectedKey) || null; } catch(_){ }
          }
          lang = String(lang || '').toLowerCase();
          const ok = !!(lang && hasPrepsDataset(lang));

          b.style.display = (isPrepsDeck && ok) ? '' : 'none';
        }catch(_){ }
      }

// primary sync
      updateArticlesButton();

      updatePrepositionsButton();

      const ok = document.getElementById('dicts-apply');
      if (ok){
        ok.onclick = ()=>{
          // аналитика: запуск тренера слов из экрана словарей
          try {
            if (A.Analytics && typeof A.Analytics.track === 'function') {
              A.Analytics.track('dict_apply', {
                kind: 'words',
                deck_key: String(selectedKey || ''),
                ui_lang: getUiLang(),
                learn_lang: (A.Decks && typeof A.Decks.langOfKey === 'function') ? (A.Decks.langOfKey(selectedKey) || null) : null
              });
            }
          } catch(_){ }

          try { A.settings = A.settings || {}; A.settings.trainerKind = "words"; } catch(_){}
          try {
            A.settings = A.settings || {};
            A.settings.lastDeckKey = selectedKey;
            if (typeof A.saveSettings === 'function') { A.saveSettings(A.settings); }
          } catch(_){}
          try {
            document.dispatchEvent(new CustomEvent('lexitron:deck-selected', { detail:{ key: selectedKey } }));
          } catch(_){}
          goHome();
        };
      }

      const articlesBtn = document.getElementById('dicts-articles');
      if (articlesBtn){
        articlesBtn.onclick = ()=>{
          // аналитика: запуск тренера артиклей из экрана словарей
          try {
            if (A.Analytics && typeof A.Analytics.track === 'function') {
              A.Analytics.track('dict_apply', {
                kind: 'articles',
                deck_key: String(selectedKey || ''),
                ui_lang: getUiLang(),
                learn_lang: (A.Decks && typeof A.Decks.langOfKey === 'function') ? (A.Decks.langOfKey(selectedKey) || null) : null
              });
            }
          } catch(_){ }

          try { A.settings = A.settings || {}; A.settings.trainerKind = "articles"; } catch(_){}
          try {
            A.settings = A.settings || {};
            A.settings.lastDeckKey = selectedKey;
            if (typeof A.saveSettings === "function") { A.saveSettings(A.settings); }
          } catch(_){}
          try { document.dispatchEvent(new CustomEvent("lexitron:deck-selected", { detail:{ key: selectedKey } })); } catch(_){}
          goHome();
        };
      }

      const prepsBtn = document.getElementById('dicts-prepositions');
      if (prepsBtn){
        prepsBtn.onclick = ()=>{
          // аналитика: запуск тренера предлогов из экрана словарей
          try {
            if (A.Analytics && typeof A.Analytics.track === 'function') {
              A.Analytics.track('dict_apply', {
                kind: 'prepositions',
                deck_key: String(selectedKey || ''),
                ui_lang: getUiLang(),
                learn_lang: (A.Decks && typeof A.Decks.langOfKey === 'function') ? (A.Decks.langOfKey(selectedKey) || null) : null
              });
            }
          } catch(_){ }

          // Тренер предлогов: запускаем по языку выбранной деки (EN/DE).
          // Источник: ключ вида xx_prepositions. Внутри home.js режим определяется по этому baseKey.
          try { A.settings = A.settings || {}; A.settings.trainerKind = "prepositions"; } catch(_){ }
          try {
            A.settings = A.settings || {};
            // запоминаем реальный выбранный словарь для возврата/экрана словарей
            A.settings.preferredReturnKey = selectedKey;

            // активный ключ для тренера
            let prepLang = null;
            try {
              if (A.Prepositions && typeof A.Prepositions.langOfPrepositionsKey === 'function') prepLang = A.Prepositions.langOfPrepositionsKey(selectedKey);
            } catch(_){ }
            if (!prepLang) {
              try { if (A.Decks && typeof A.Decks.langOfKey === 'function') prepLang = A.Decks.langOfKey(selectedKey) || null; } catch(_){ }
            }
            prepLang = String(prepLang || 'en').toLowerCase();

            // Показываем/запускаем тренер только если для языка реально загружен датасет.
            // Сейчас в проде поддержаны EN и DE (и только те языки, для которых есть window.prepositionsTrainer[lang]).
            const __src = (typeof window !== 'undefined') ? (window.prepositionsTrainer && window.prepositionsTrainer[prepLang]) : null;
            const __has = !!(__src && (Array.isArray(__src.patterns) ? __src.patterns.length : (Array.isArray(__src) ? __src.length : (typeof __src === 'object' ? Object.keys(__src).length : 0))));
            if (!__has) {
              try { if (typeof A.toast === 'function') A.toast((getUiLang()==='uk') ? 'Немає датасету тренера прийменників для цієї мови.' : 'Нет датасета тренера предлогов для этого языка.'); } catch(_){ }
              return;
            }

            const prepKey = prepLang + '_prepositions';

            A.settings.lastDeckKey = prepKey;
            if (typeof A.saveSettings === "function") { A.saveSettings(A.settings); }

            // аналитика: какой preps key реально запустили
            try {
              if (A.Analytics && typeof A.Analytics.track === 'function') {
                A.Analytics.track('preps_launch', { ui_lang: getUiLang(), learn_lang: prepLang, deck_key: prepKey, source_key: String(selectedKey||'') });
              }
            } catch(_){ }
          } catch(_){ }
          try { document.dispatchEvent(new CustomEvent("lexitron:deck-selected", { detail:{ key: (String((A.settings&&A.settings.lastDeckKey)||'') || 'en_prepositions') } })); } catch(_){ }
          goHome();
        };
      }

      renderFlagsUI();
    }

    // Панель флагов (для фильтрации)
    const FLAG = { en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷', es:'🇪🇸', it:'🇮🇹', ru:'🇷🇺', uk:'🇺🇦', sr:'🇷🇸', pl:'🇵🇱' };
    function renderFlagsUI(){
      const box = app.querySelector('#dicts-flags');
      if (!box) return;
      box.innerHTML = '';
      langs.forEach(lang=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dict-flag' + (lang===activeLang ? ' active' : '');
        btn.dataset.lang = lang;
        btn.title = lang.toUpperCase();
        btn.textContent = FLAG[lang] || lang.toUpperCase();
        btn.addEventListener('click', ()=>{
          if (lang === activeLang) return;
          activeLang = lang;
          try { saveActiveLang(lang); } catch(_){}
          selectedKey = (byLang[activeLang] && byLang[activeLang][0]) || '';
          renderTableForLang(activeLang);
        });
        box.appendChild(btn);
      });
    }

    // Первая отрисовка
    renderTableForLang(activeLang);
  }

  /* ---------------------- modal preview ---------------------- */
  function openPreview(key){
    // аналитика: предпросмотр словаря
    try {
      if (A.Analytics && typeof A.Analytics.track === 'function') {
        A.Analytics.track('dict_preview', {
          deck_key: String(key || ''),
          ui_lang: getUiLang(),
          learn_lang: (A.Decks && typeof A.Decks.langOfKey === 'function') ? (A.Decks.langOfKey(key) || null) : null
        });
      }
    } catch(_){ }
    const T = t();
    const deck = A.Decks.resolveDeckByKey(key) || [];
    const name = A.Decks.resolveNameByKey(key);
    const flag = A.Decks.flagForKey(key);
    const lang = getUiLang();

    const isPreps = (deck || []).some(w => w && typeof w === 'object' && ('_prepCorrect' in w));

    // Для предлогов показываем 5 паттернов (1 пример на паттерн): «паттерн → верный предлог»
    const previewDeck = (() => {
      // For prepositions we want to show the whole expanded deck (all sentence variants),
      // because it feels "empty" otherwise and users may want to scroll it.
      if (isPreps) return deck || [];
      // For words/articles/etc keep the classic preview (first N items).
      return (deck || []).slice(0, 200);
    })();

    const rows = (previewDeck || []).map((w,i)=>{
      if (isPreps) {
        const pattern = (w && (w.de || w.pattern || w.sentence)) ? (w.de || w.pattern || w.sentence) : '';
        const prep = (w && (w._prepCorrect || w.prep || w.answer)) ? (w._prepCorrect || w.prep || w.answer) : '';
        return `
          <tr>
            <td>${i+1}</td>
            <td style="white-space:normal;word-break:break-word;">${pattern}</td>
            <td style="white-space:normal;word-break:break-word;">${prep}</td>
          </tr>`;
      }

      return `
        <tr>
          <td>${i+1}</td>
          <td>${w.word || w.term || ''}</td>
          <td>${lang === 'uk' ? (w.uk || w.translation_uk || '') 
                               : (w.ru || w.translation_ru || '')}</td>
        </tr>`;
    }).join('');

    const wrap = document.createElement('div');
    wrap.className = 'mmodal is-open';
    wrap.innerHTML = `
      <div class="mmodal__overlay"></div>
      <div class="mmodal__panel" role="dialog" aria-modal="true">
        <div class="mmodal__header">
          <h3>${flag} ${name}</h3>
          <button class="mmodal__close" aria-label="${T.close}">✕</button>
        </div>
        <div class="mmodal__body">
          <table class="dict-table">
            <thead><tr><th>#</th><th>${isPreps ? T.pattern : T.word}</th><th>${isPreps ? T.prep : T.trans}</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" style="opacity:.6">${T.empty}</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const close = ()=>wrap.remove();
    wrap.querySelector('.mmodal__overlay').onclick = close;
    wrap.querySelector('.mmodal__close').onclick = close;
  }

  /* ---------------------- export ---------------------- */
  A.ViewDicts = { mount: function(){ try{ if (A.stopAllTrainers) A.stopAllTrainers('view:dicts'); }catch(_){} return renderDictList(); } };

})();
/* ========================= Конец файла: view.dicts.js ========================= */
