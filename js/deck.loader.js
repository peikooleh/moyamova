/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: deck.loader.js
 * Назначение: JSON data layer для встроенных словарей
 * Версия: 1.5.2
 * Обновлено: 2026-08-31
 * ========================================================== */

(function(root){
  'use strict';

  var MANIFEST_URL = './dicts/decks.manifest.json';
  var decks = root.decks = root.decks || {};
  var manifest = null;
  var byKey = Object.create(null);

  function parseJson(text, url){
    try { return JSON.parse(text); }
    catch (e) { throw new Error('Invalid JSON in ' + url + ': ' + e.message); }
  }

  function getJsonSync(url){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    try { xhr.send(null); }
    catch (e) { throw new Error('Cannot load ' + url + ': ' + e.message); }

    // status === 0 is useful for a few local/dev environments; normal hosting returns 2xx.
    if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0)) {
      throw new Error('Cannot load ' + url + ': HTTP ' + xhr.status);
    }
    return parseJson(xhr.responseText, url);
  }

  function normalizeDeckPayload(payload, entry){
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.words)) {
      if (payload.key && entry && payload.key !== entry.key) {
        throw new Error('Deck key mismatch: expected ' + entry.key + ', got ' + payload.key);
      }
      return payload.words;
    }
    throw new Error('Invalid deck payload for ' + (entry ? entry.key : 'unknown deck'));
  }

  function indexManifest(m){
    manifest = m || {};
    byKey = Object.create(null);
    var list = Array.isArray(manifest.decks) ? manifest.decks : [];
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      if (entry && entry.key && entry.file) byKey[entry.key] = entry;
    }
    return list;
  }

  function preloadAllSync(){
    var m = getJsonSync(MANIFEST_URL);
    var list = indexManifest(m);

    // Keep insertion order identical to the 1.5.1 script loading order.
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      var payload = getJsonSync('./' + String(entry.file).replace(/^\.\//, ''));
      var words = normalizeDeckPayload(payload, entry);
      if (typeof entry.count === 'number' && words.length !== entry.count) {
        throw new Error('Deck count mismatch for ' + entry.key + ': expected ' + entry.count + ', got ' + words.length);
      }
      decks[entry.key] = words;
    }
    return decks;
  }

  async function ensureManifest(){
    if (manifest) return manifest;
    var res = await fetch(MANIFEST_URL, { cache: 'default' });
    if (!res.ok) throw new Error('Cannot load deck manifest: HTTP ' + res.status);
    var m = await res.json();
    indexManifest(m);
    return manifest;
  }

  async function load(key){
    if (Array.isArray(decks[key])) return decks[key];
    await ensureManifest();
    var entry = byKey[key];
    if (!entry) return [];
    var url = './' + String(entry.file).replace(/^\.\//, '');
    var res = await fetch(url, { cache: 'default' });
    if (!res.ok) throw new Error('Cannot load deck ' + key + ': HTTP ' + res.status);
    var payload = await res.json();
    var words = normalizeDeckPayload(payload, entry);
    if (typeof entry.count === 'number' && words.length !== entry.count) {
      throw new Error('Deck count mismatch for ' + key + ': expected ' + entry.count + ', got ' + words.length);
    }
    decks[key] = words;
    return words;
  }

  function has(key){ return Array.isArray(decks[key]); }
  function keys(){ return Object.keys(decks).filter(function(k){ return Array.isArray(decks[k]); }); }
  function getManifest(){ return manifest; }

  root.DeckLoader = {
    manifestUrl: MANIFEST_URL,
    preloadAllSync: preloadAllSync,
    load: load,
    has: has,
    keys: keys,
    getManifest: getManifest
  };

  // Compatibility bootstrap for the 1.5.x synchronous application lifecycle.
  // New screens may use DeckLoader.load(key) asynchronously; once all callers are
  // migrated, this preload can be removed to enable true on-demand loading.
  try {
    preloadAllSync();
    root.__MOYA_DECKS_READY = true;
  } catch (err) {
    root.__MOYA_DECKS_READY = false;
    root.__MOYA_DECKS_ERROR = err;
    console.error('[MOYAMOVA] JSON deck bootstrap failed:', err);
  }
})(window);
