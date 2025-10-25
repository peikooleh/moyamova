function t(k){
  try{
    if (typeof T === 'function') return T(k);
    var ui = (window.App && App.settings && (App.settings.uiLang||App.settings.lang)) || 'ru';
    var pack = (window.I18N && (I18N[ui] || I18N.ru)) || {};
    return pack[k] || k;
  }catch(_){ return k; }
}

/* ==========================================================
 * Project: MOYAMOVA
 * File: app.backup.js
 * Purpose: Импорт/экспорт/резервные копии (фикс нижней статистики и «готовых» наборов)
 * Version: 1.7
 * Last modified: 2025-10-23
*/

(function(){
  'use strict';

  var App = window.App || (window.App = {});

  var LS_SETTINGS = 'k_settings_v1_3_1';
  var LS_STATE    = 'k_state_v1_3_1';
  var LS_DICTS    = 'k_dicts_v1_3_1';

  var LS_UI_LANG  = 'lexitron.uiLang';
  var LS_DECK_KEY = 'lexitron.deckKey';
  var LS_ACTIVE   = 'lexitron.activeKey';

  function safeParse(json){ try{ return JSON.parse(json); }catch(_){ return null; } }
  function isObj(x){ return !!x && typeof x === 'object' && !Array.isArray(x); }
  function copyShallow(src){
    var out = {};
    if (!isObj(src)) return out;
    Object.keys(src).forEach(function(k){ out[k] = src[k]; });
    return out;
  }
  function downloadString(filename, text){
    var blob = new Blob([text], {type: 'application/json;charset=utf-8'});
    var a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(blob);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function stampName(){
    var d = new Date();
    var pad = function(n){ return (n<10?'0':'') + n; };
    return 'lexitron-backup-' +
      d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '-' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.json';
  }

  // ====== EXPORT ======
  function buildExportObject(){
    var settings = isObj(App.settings) ? copyShallow(App.settings) : {};
    var state    = isObj(App.state)    ? copyShallow(App.state)    : {};
    var dicts    = isObj(App.dictRegistry) ? copyShallow(App.dictRegistry) : {};
    return {
      version: String(App.APP_VER || '1.x'),
      timestamp: new Date().toISOString(),
      settings: settings,
      state: state,
      dicts: dicts
    };
  }
  function exportToFile(){
    try{
      var data = buildExportObject();
      downloadString(stampName(), JSON.stringify(data, null, 2));
      if (App.UI && App.UI.toast) App.UI.toast({ title:t('backupExport'), message:t('backupExportOk') });
    }catch(e){
      console.error('Export error:', e);
      alert(t('backupExportFail') + ': ' + (e && e.message ? e.message : e));
    }
  }

  // ====== IMPORT ======
  function applyImportedData(d){
    if (!isObj(d)) throw new Error('Некорректный файл: ожидается объект JSON');

    // --- Основные структуры ---
    if (isObj(d.settings)){
      App.settings = d.settings;
      try {
        if (typeof App.saveSettings === 'function') App.saveSettings(App.settings);
        if (App.settings && App.settings.lang) {
          localStorage.setItem(LS_UI_LANG, String(App.settings.lang).toLowerCase());
        }
      } catch(_){}
    }
    if (isObj(d.state)){
      App.state = d.state;
      try {
        if (typeof App._saveStateNow === 'function') App._saveStateNow();
        else localStorage.setItem(LS_STATE, JSON.stringify(App.state));
      } catch(_){}
    }
    if (isObj(d.dicts)){
      App.dictRegistry = d.dicts;
      try {
        if (typeof App.saveDictRegistry === 'function') App.saveDictRegistry();
        else localStorage.setItem(LS_DICTS, JSON.stringify(App.dictRegistry));
      } catch(_){}
    }

    // --- Активный ключ наборов ---
    try {
      var key = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      if (key){
        localStorage.setItem(LS_DECK_KEY, String(key));
        localStorage.setItem(LS_ACTIVE,   String(key));
      }
    } catch(_){}

    // --- Применение темы и заголовков ---
    try { if (typeof App.applyTheme === 'function') App.applyTheme(); } catch(_){}
    try { if (typeof App.applyI18nTitles === 'function') App.applyI18nTitles(); } catch(_){}

    // --- Синхронизация активного набора и state ---
    try {
      var activeKey = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      if (activeKey) {
        if (typeof App.setActiveDeckKey === 'function'){
          App.setActiveDeckKey(activeKey);
        } else {
          App.dictRegistry.activeKey = activeKey;
          if (typeof App.saveDictRegistry === 'function') App.saveDictRegistry();
          if (App.state){
            App.state.index = 0;
            try{
              if (typeof App.getStarStep==='function') App.state.lastIndex = - App.getStarStep();
              else App.state.lastIndex = 0;
            }catch(_){ App.state.lastIndex = 0; }
          }
        }
      }
    } catch(_){}

    // --- Очистка хранилищ прогресса и «готовых» наборов ---
    try {
      localStorage.removeItem('progress.v2');  // прокси прогресса
      localStorage.removeItem('sets.done.v1'); // флаги «готово» для плиток наборов
      if (App.state && App.state.stars && App.state.stars.__isProxy) {
        delete App.state.stars;
        delete App.state.successes;
        delete App.state.lastSeen;
      }
    } catch(e) { console.warn('Failed to reset local progress stores:', e); }

    // --- Инвалидизация и полная перерисовка ---
    try {
      if (App.cache) App.cache = {};
      try { localStorage.removeItem('k_stats_cache'); } catch(_){}
      try { localStorage.removeItem('k_footer_stats'); } catch(_){}

      // Сброс вычисленных полей у наборов
      if (App.dictRegistry && App.dictRegistry.items) {
        Object.keys(App.dictRegistry.items).forEach(function(id){
          var deck = App.dictRegistry.items[id];
          if (deck && typeof deck === 'object') {
            delete deck.isReady;
            delete deck.learnedTotal;
            delete deck.starsTotal;
          }
        });
      }

      // События для подписчиков
      if (App.Bus && typeof App.Bus.emit === 'function') {
        App.Bus.emit('dicts:changed');
        App.Bus.emit('state:changed');
        App.Bus.emit('data:imported');
        App.Bus.emit('data:imported:full');
      }

      // Пересчёт и ререндер UI
      if (App.Stats && typeof App.Stats.invalidateCache === 'function') {
        App.Stats.invalidateCache();
      }
      if (App.Stats && typeof App.Stats.recomputeAndRender === 'function') {
        App.Stats.recomputeAndRender({ full: true });
      }

      // ВАЖНО: реальный рендер плиток наборов
      if (typeof App.renderSetsBar === 'function') {
        App.renderSetsBar();
      }

      if (App.UI && typeof App.UI.refreshAll === 'function') {
        App.UI.refreshAll();
      }
    } catch(e){
      console.warn('Post-import invalidate/repaint warning:', e);
    }

    // --- Сохранение, если есть внутренние сторы ---
    try { if (App.Decks && typeof App.Decks._save === 'function') App.Decks._save(); } catch(_){}

    // --- Перезапуск приложения ---
    try { setTimeout(function(){ location.reload(); }, 120); } catch(_){}
  }

  function importFromJSON(jsonText){
    var data = safeParse(jsonText);
    if (!isObj(data)) throw new Error('Не удаётся разобрать JSON-файл');
    applyImportedData(data);
  }
  function importFromFile(file){
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      try{
        importFromJSON(String(ev.target.result||''));
        if (App.UI && App.UI.toast) {
          App.UI.toast({ title:t('backupImport'), message:t('backupImportOk') });
        } else {
          alert(t('backupImportOk'));
        }
      }catch(e){
        console.error('Import error:', e);
        alert(t('backupImportFail') + ': ' + (e && e.message ? e.message : e));
      }
    };
    reader.onerror = function(){ alert(t('backupImportFail')); };
    reader.readAsText(file, 'utf-8');
  }

  // ===== Публичное API =====
  App.Backup = App.Backup || {};
  App.Backup.buildPayload   = buildExportObject;
  App.Backup.importFromJSON = importFromJSON;
  App.Backup.importFromFile = importFromFile;
  App.Backup.exportToFile   = exportToFile;

  App.Backup.export = function(){ exportToFile(); };
  App.Backup.import = function(){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function(ev){
      var f = ev && ev.target && ev.target.files && ev.target.files[0];
      if (f) importFromFile(f);
      setTimeout(function(){ input.remove(); }, 0);
    });
    input.click();
  };

})();

/* ====================== End of file =======================
 * File: app.backup.js • Version: 1.7 • 2025-10-23
*/
