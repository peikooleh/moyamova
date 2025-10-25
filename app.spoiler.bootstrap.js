/* ==========================================================
 * Project: MOYAMOVA
 * File: app.spoiler.bootstrap.js
 * Purpose: Бутстрап спойлеров/подсказок
 * Version: 1.0
 * Last modified: 2025-10-19
*/

(function(){
  function init(){
    if (window.App && App.renderSetsBar){
      try { App.renderSetsBar(); } catch(e){}
      try { window.updateSpoilerHeader && window.updateSpoilerHeader(); } catch(e){}
    }
    if (window.App && App.applyLang && !App.__singleSpoilerLangHook){
      var orig = App.applyLang.bind(App);
      App.applyLang = function(){
        var r = orig();
        try { App.renderSetsBar && App.renderSetsBar(); } catch(e){}
        if (App.refreshTooltips) App.refreshTooltips();
        return r;
      };
      App.__singleSpoilerLangHook = true;
    }
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* ====================== End of file =======================
 * File: app.spoiler.bootstrap.js • Version: 1.0 • 2025-10-19
*/
