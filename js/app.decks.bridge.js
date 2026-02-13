/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: app.decks.bridge.js
 * Назначение: Связка между словарями и UI
 * Версия: 1.0
 * Обновлено: 2025-11-17
 * ========================================================== */

(function(){
  'use strict';
  const A = (window.App = window.App || {});
  A.Decks = A.Decks || {};

  // Сохраняем оригинальные резолверы
  const _resolve = A.Decks.resolveDeckByKey ? A.Decks.resolveDeckByKey.bind(A.Decks) : null;
  const _name    = A.Decks.resolveNameByKey ? A.Decks.resolveNameByKey.bind(A.Decks) : null;
  const _flag    = A.Decks.flagForKey       ? A.Decks.flagForKey.bind(A.Decks)       : null;
  const _langOf  = A.Decks.langOfKey        ? A.Decks.langOfKey.bind(A.Decks)        : null;

  // -------- Виртуальные ключи
  function parseVirtualKey(key){
    const s = String(key||'');

    // Новый формат групп:
    // favorites:<TL>:base | favorites:<TL>:lernpunkt
    // mistakes:<TL>:base  | mistakes:<TL>:lernpunkt
    // Старый формат (совместимость):
    // favorites:<TL>:<baseDeckKey>
    // mistakes:<TL>:<baseDeckKey>
    let m = s.match(/^(mistakes):(ru|uk):(base|lernpunkt)$/i);
    if (m) return { kind:'mistakes', trainLang:m[2], group:String(m[3]).toLowerCase() };

    m = s.match(/^(favorites):(ru|uk):(base|lernpunkt)$/i);
    if (m) return { kind:'favorites', trainLang:m[2], group:String(m[3]).toLowerCase() };

    // baseDeckKey может содержать суффиксы (например: de_nouns_lernpunkt),
    // поэтому разрешаем дополнительные сегменты после части речи.
    m = s.match(/^(mistakes):(ru|uk):([a-z]{2}_[a-z]+[\w.-]*)$/i);
    if (m) return { kind:'mistakes', trainLang:m[2], baseDeckKey:m[3] };

    m = s.match(/^(favorites):(ru|uk):([a-z]{2}_[a-z]+[\w.-]*)$/i);
    if (m) return { kind:'favorites', trainLang:m[2], baseDeckKey:m[3] };

    return null;
  }
  function isVirtual(key){ return !!parseVirtualKey(key); }

  // -------- Резолв набора слов для виртуальных ключей
  function resolveVirtualDeck(key){
    const p = parseVirtualKey(key);
    if (!p) return [];
    const isArticles = !!(A.settings && A.settings.trainerKind === 'articles');

    // Групповой режим (base / lernpunkt): собираем избранное/ошибки по всем базовым декам группы
    if (p.group){
      try{
        const group = String(p.group).toLowerCase();
        const TL = p.trainLang;
        const decksObj = (window.decks && typeof window.decks==='object') ? window.decks : {};
        const baseKeys = Object.keys(decksObj)
          .filter(k => Array.isArray(decksObj[k]) && !/^favorites:|^mistakes:/i.test(k))
          .filter(k => group==='lernpunkt' ? /_lernpunkt$/i.test(k) : !/_lernpunkt$/i.test(k));

        // В articles-режиме используем изолированные контуры.
        const Mist = isArticles ? (A.ArticlesMistakes || null) : (A.Mistakes || null);
        const Fav  = isArticles ? (A.ArticlesFavorites || null) : (A.Favorites || null);

        const out = [];
        if (p.kind === 'mistakes'){
          for (const baseKey of baseKeys){
            // если есть специализированный резолвер — используем его
            if (Mist && Mist.resolveDeckForMistakesKey){
              try{
                const partKey = `mistakes:${TL}:${baseKey}`;
                const part = Mist.resolveDeckForMistakesKey(partKey) || [];
                if (part.length) out.push(...part);
                continue;
              }catch(_){ /* fallback ниже */ }
            }
            try{
              const full = _resolve ? (_resolve(baseKey) || []) : [];
              const ids = new Set((Mist && Mist.getIds ? (Mist.getIds(TL, baseKey) || []) : []).map(String));
              if (!ids.size) continue;
              for (const w of full){
                if (ids.has(String(w.id))) out.push(w);
              }
            }catch(_){}
          }
          return out;
        }

        if (p.kind === 'favorites'){
          for (const baseKey of baseKeys){
            if (Fav && Fav.resolveDeckForFavoritesKey){
              try{
                const partKey = `favorites:${TL}:${baseKey}`;
                const part = Fav.resolveDeckForFavoritesKey(partKey) || [];
                if (part.length) out.push(...part);
                continue;
              }catch(_){ /* fallback ниже */ }
            }
            try{
              const full = _resolve ? (_resolve(baseKey) || []) : [];
              const ids = new Set((Fav && Fav.getIds ? (Fav.getIds(TL, baseKey) || []) : []).map(String));
              if (!ids.size) continue;
              for (const w of full){
                if (ids.has(String(w.id))) out.push(w);
              }
            }catch(_){}
          }
          return out;
        }
      }catch(_){}
      return [];
    }

    const base = p.baseDeckKey;

    // Базовый словарь целиком
    const full = _resolve ? (_resolve(base) || []) : [];


    if (p.kind === 'mistakes'){
      // Articles mode uses isolated mistakes storage.
      const Mist = isArticles ? (A.ArticlesMistakes || null) : (A.Mistakes || null);
      // If there is an API to resolve the virtual deck directly — use it.
      if (Mist && Mist.resolveDeckForMistakesKey){
        try { return Mist.resolveDeckForMistakesKey(key) || []; } catch(_){ }
      }
      // Fallback: filter the base deck by ids.
      try {
        const ids = new Set((Mist && Mist.getIds ? (Mist.getIds(p.trainLang, base) || []) : []).map(String));
        if (ids.size) return full.filter(w => ids.has(String(w.id)));
      } catch(_){ }
      return [];
    }

    if (p.kind === 'favorites'){
      // Articles mode uses isolated favorites storage.
      const Fav = isArticles ? (A.ArticlesFavorites || null) : (A.Favorites || null);
      if (Fav && Fav.resolveDeckForFavoritesKey){
        try { return Fav.resolveDeckForFavoritesKey(key) || []; } catch(_){ }
      }
      // Fallback: filter the base deck by ids.
      try {
        const ids = new Set((Fav && Fav.getIds ? (Fav.getIds(p.trainLang, base) || []) : []).map(String));
        if (ids.size) return full.filter(w => ids.has(String(w.id)));
      } catch(_){ }
      return [];
    }

    return [];
  }

  // -------- Переопределяем Decks API

  A.Decks.resolveDeckByKey = function(key){
    try{
      if (isVirtual(key)) return resolveVirtualDeck(key) || [];
    }catch(_){}

    // Prepositions trainer: for keys like "en_prepositions"
    // IMPORTANT: in "words" mode the deck must behave as a normal dictionary deck.
    // Only in prepositions-trainer mode we swap the deck to the expanded patterns deck.
    try{
      const kind = (A.settings && A.settings.trainerKind) ? String(A.settings.trainerKind) : 'words';
      const isPrepsKey = (() => {
        try {
          if (A.Prepositions && typeof A.Prepositions.isAnyPrepositionsKey === 'function') return !!A.Prepositions.isAnyPrepositionsKey(key);
          if (A.Prepositions && typeof A.Prepositions.isPrepositionsDeckKey === 'function' && A.Prepositions.isPrepositionsDeckKey(key)) return true;
          return /^([a-z]{2})_prepositions$/i.test(String(key||'').trim());
        } catch(_){ return false; }
      })();

      if (kind === 'prepositions'
        && A.Prepositions
        && isPrepsKey
        && typeof A.Prepositions.getDeckForKey === 'function') {
        return A.Prepositions.getDeckForKey(key) || [];
      }
    }catch(_){}

    return _resolve ? (_resolve(key) || []) : [];
  };

  A.Decks.resolveNameByKey = function(key){
    try{
      // Prepositions trainer decks
      if (A.Prepositions && typeof A.Prepositions.isPrepositionsDeckKey === 'function' && A.Prepositions.isPrepositionsDeckKey(key)) {
        return 'Prepositions';
      }

      const p = parseVirtualKey(key);
      if (p){
        // Групповые ключи: показываем понятное имя
        if (p.group){
          const uk = (A.settings && (A.settings.lang || A.settings.uiLang)) === 'uk';
          const g = String(p.group).toLowerCase()==='lernpunkt' ? (uk ? 'LearnPunkt' : 'LearnPunkt') : (uk ? 'База' : 'База');
          if (p.kind === 'favorites') return uk ? `Обране (${g})` : `Избранное (${g})`;
          if (p.kind === 'mistakes')  return uk ? `Мої помилки (${g})` : `Мои ошибки (${g})`;
        }
        // Старый формат: имя как у базового словаря
        return _name ? _name(p.baseDeckKey) : p.baseDeckKey;
      }
    }catch(_){}
    return _name ? _name(key) : String(key||'');
  };

  A.Decks.flagForKey = function(key){
    try{
      // Prepositions trainer decks
      if (A.Prepositions && typeof A.Prepositions.isPrepositionsDeckKey === 'function' && A.Prepositions.isPrepositionsDeckKey(key)) {
        return '🧩';
      }

      const p = parseVirtualKey(key);
      if (p){
        if (p.group){
          return (p.kind === 'favorites') ? '⭐' : '⚠️';
        }
        return _flag ? (_flag(p.baseDeckKey) || '🧩') : '🧩';
      }
    }catch(_){}
    return _flag ? _flag(key) : '🏷️';
  };

    A.Decks.langOfKey = function(key){
    try{
      if (A.Prepositions && typeof A.Prepositions.isPrepositionsDeckKey === 'function' && A.Prepositions.isPrepositionsDeckKey(key)) {
        if (typeof A.Prepositions.langOfPrepositionsKey === 'function') return A.Prepositions.langOfPrepositionsKey(key);
        var m = String(key||'').trim().match(/^([a-z]{2})_prepositions$/i);
        return m ? m[1].toLowerCase() : null;
      }
    }catch(_){ }
    return _langOf ? _langOf(key) : null;
  };

// Язык базового словаря — удобно для группировки на экранах
  A.Decks.langOfMistakesKey = function(key){
    try { const p = parseVirtualKey(key); if (!p || p.kind!=='mistakes') return null; return _langOf ? _langOf(p.baseDeckKey) : null; } catch(_){ return null; }
  };
  A.Decks.langOfFavoritesKey = function(key){
    try { const p = parseVirtualKey(key); if (!p || p.kind!=='favorites') return null; return _langOf ? _langOf(p.baseDeckKey) : null; } catch(_){ return null; }
  };
})();
/* ========================= Конец файла: app.decks.bridge.js ========================= */
