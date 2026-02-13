/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: articles.favorites.js
 * Назначение: Избранное для тренера артиклей (изолированное)
 * Версия: 1.0
 * Обновлено: 2026-01-04
 * ========================================================== */

(function(){
  'use strict';
  var A = (window.App = window.App || {});

  function _uiTrainLang(){
    try{
      var s = (A.settings && (A.settings.lang || A.settings.uiLang)) || 'ru';
      s = String(s).toLowerCase();
      return (s === 'uk') ? 'uk' : 'ru';
    }catch(_){ return 'ru'; }
  }

  function _ensure(){
    A.state = A.state || {};
    if (!A.state.articlesFavorites) A.state.articlesFavorites = { ru:{}, uk:{} };
    if (!A.state.articlesFavorites.ru) A.state.articlesFavorites.ru = {};
    if (!A.state.articlesFavorites.uk) A.state.articlesFavorites.uk = {};
    return A.state.articlesFavorites;
  }

  function _baseOf(key){
    try{
      var s = String(key||'');
      if (/^favorites:/i.test(s)) return s.split(':').slice(2).join(':') || '';
      if (/^mistakes:/i.test(s)) return s.split(':').slice(2).join(':') || '';
      return s;
    }catch(_){ return String(key||''); }
  }

  function _parseFavoritesKey(key){
    var m = String(key||'').match(/^favorites:(ru|uk):([\w.-]+)$/i);
    return m ? { kind:'favorites', trainLang:m[1].toLowerCase(), baseDeckKey:m[2] } : null;
  }

  function _getMap(trainLang, baseDeckKey){
    var db = _ensure();
    var tl = (String(trainLang||'').toLowerCase()==='uk') ? 'uk' : 'ru';
    db[tl][baseDeckKey] = db[tl][baseDeckKey] || {};
    return db[tl][baseDeckKey];
  }

  function _save(){
    try{ if (typeof A.saveState === 'function') A.saveState(); }catch(_){ }
  }

  function _dispatch(){
    try{ document.dispatchEvent(new CustomEvent('articles:favorites:changed')); }catch(_){ }
  }

  A.ArticlesFavorites = {
    has: function(baseDeckKey, wordId){
      try{
        var tl = _uiTrainLang();
        var base = _baseOf(baseDeckKey);
        var map = _getMap(tl, base);
        return !!map[String(wordId)];
      }catch(_){ return false; }
    },

    toggle: function(baseDeckKey, wordId){
      try{
        var tl = _uiTrainLang();
        var base = _baseOf(baseDeckKey);
        var map = _getMap(tl, base);
        var id = String(wordId);
        map[id] = !map[id];
        if (!map[id]) delete map[id];
        _save();
        _dispatch();
      }catch(_){ }
    },

    getIds: function(trainLang, baseDeckKey){
      try{
        var tl = (String(trainLang||'').toLowerCase()==='uk') ? 'uk' : 'ru';
        var base = _baseOf(baseDeckKey);
        var db = _ensure();
        var map = (db[tl] && db[tl][base]) ? db[tl][base] : {};
        return Object.keys(map).filter(function(id){ return !!map[id]; });
      }catch(_){ return []; }
    },

    clearForDeck: function(trainLang, baseDeckKey){
      try{
        var tl = (String(trainLang||'').toLowerCase()==='uk') ? 'uk' : 'ru';
        var base = _baseOf(baseDeckKey);
        var db = _ensure();
        if (db[tl] && db[tl][base]) delete db[tl][base];
        _save();
        _dispatch();
      }catch(_){ }
    },

    count: function(trainLang, baseDeckKey){
      return (A.ArticlesFavorites.getIds(trainLang, baseDeckKey) || []).length;
    },

    // Resolve deck array for a favorites virtual key: favorites:<trainLang>:<baseDeckKey>
    resolveDeckForFavoritesKey: function(key){
      try{
        var p = _parseFavoritesKey(key);
        if (!p) return [];
        var full = (A.Decks && A.Decks.resolveDeckByKey) ? (A.Decks.resolveDeckByKey(p.baseDeckKey) || []) : [];
        var ids = new Set((A.ArticlesFavorites.getIds(p.trainLang, p.baseDeckKey) || []).map(String));
        if (!ids.size) return [];
        return full.filter(function(w){ return ids.has(String(w.id)); });
      }catch(_){ return []; }
    },

    isFavoritesDeckKey: function(key){
      return /^favorites:(ru|uk):/i.test(String(key||''));
    },

    export: function(){
      try{
        var db = _ensure();
        return JSON.parse(JSON.stringify(db));
      }catch(_){ return { ru:{}, uk:{} }; }
    },

    import: function(payload){
      try{
        var st = A.state || (A.state = {});
        if (!payload || typeof payload !== 'object') return;
        st.articlesFavorites = payload;
        _ensure();
        _save();
        _dispatch();
      }catch(_){ }
    }
  };
})();
