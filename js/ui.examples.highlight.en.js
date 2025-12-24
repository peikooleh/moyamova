/* ==========================================================================
 * Языковой модуль подсветки примеров — английский (en)
 * Контракт:
 *   App.ExampleHighlight.en(raw, wordObj, deckKey, lemma) -> { index, length } | null
 *
 * Здесь НЕТ работы с DOM: модуль только ищет позицию подсвечиваемого фрагмента.
 * Все грамматические правила для английского языка собраны в этом файле.
 *
 * Принципы:
 *  - Сначала общие правила (регулярные формы), затем исключения (нерегулярные карты).
 *  - Изменения аддитивные: можно расширять словари IRREG_* и правила генерации форм.
 * ========================================================================== */
(function (root) {
  'use strict';

  var A = root.App = root.App || {};
  A.ExampleHighlight = A.ExampleHighlight || {};

  /**
   * Главный обработчик подсветки для английского
   *
   * @param {string} raw     - исходное предложение (как есть из словаря)
   * @param {object} wordObj - объект слова из словаря
   * @param {string} deckKey - ключ активной деки (en_verbs, en_nouns, en_adjectives, ...)
   * @param {string} lemma   - базовая форма (как приходит из UI)
   * @returns {{index:number,length:number}|null}
   */
  A.ExampleHighlight.en = function (raw, wordObj, deckKey, lemma) {
    if (!raw || !wordObj) return null;

    var rawStr   = String(raw);
    var rawNorm  = normalizeNfc(rawStr);
    var rawLower = rawNorm.toLocaleLowerCase('en-US');

    // 1) Нормализуем лемму: "to X", "(sth)", "(smb)", артикли и т.п.
    var base = pickLemma(lemma, wordObj, deckKey);
    if (!base) return null;

    base = normalizeNfc(base);
    var deckType = detectDeckType(deckKey);

    // 2) Phrasal verb split: "look ... up" / "take ... off" / "go ... on" и т.п.
    //    Контракт подсвечивает один фрагмент => подсвечиваем VERB-часть.
    if (deckType === 'verb') {
      var ph = splitPhrasalVerb(base);
      if (ph && ph.verb && ph.particle) {
        var splitHit = findPhrasalSplit(rawLower, ph);
        if (splitHit) return splitHit;
      }
    }

    // 3) Спец-слой для многословных глагольных конструкций (до общих форм):
    //    - be + complement: "be allowed to", "be called", "be based on", "be worth it" -> подсвечиваем complement
    //    - get used to -> подсвечиваем used (в примерах часто "got used to")
    if (deckType === 'verb') {
      var focus = detectVerbPhraseFocus(base);
      if (focus && focus.mode === 'direct') {
        var fLower = focus.focus.toLocaleLowerCase('en-US');
        var fIdx = indexOfWord(rawLower, fLower);
        if (fIdx !== -1) return { index: fIdx, length: focus.focus.length };
      }
    }

    // 3) Обычный поиск (набор возможных форм)
    var forms = buildEnglishForms(base, wordObj, deckType);
    if (!forms || !forms.length) return null;

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (!form) continue;

      var fNorm  = normalizeNfc(String(form));
      var fLower = fNorm.toLocaleLowerCase('en-US');

      var idx = indexOfWord(rawLower, fLower);
      if (idx !== -1) {
        return { index: idx, length: fNorm.length };
      }
    }

    return null;
  };

  // =========================================================================
  // Helpers: normalization, deck detection, token boundaries
  // =========================================================================

  function normalizeNfc(s) {
    try {
      return String(s || '').normalize('NFC');
    } catch (e) {
      return String(s || '');
    }
  }

  function detectDeckType(deckKey) {
    var k = String(deckKey || '').toLowerCase();
    if (k.indexOf('verb') !== -1) return 'verb';
    if (k.indexOf('noun') !== -1) return 'noun';
    if (k.indexOf('adjective') !== -1) return 'adj';
    if (k.indexOf('adverb') !== -1) return 'adv';
    // pronouns / prepositions / conjunctions / particles / numbers
    return 'other';
  }

  // Английская "буква": латиница + апостроф для can't, don't, I'm и т.п.
  // (апостроф учитываем как "букву", чтобы "don't" не рвалось границами)
  function isWordChar(ch) {
    return /[A-Za-z']/i.test(ch);
  }

  // Ищем form как цельное "слово/фраза" внутри rawLower (оба — уже lowercased)
  // Для фраз с пробелами проверяем границы по первому и последнему символу фразы.
  function indexOfWord(rawLower, formLower) {
    var from = 0;
    while (from <= rawLower.length - formLower.length) {
      var idx = rawLower.indexOf(formLower, from);
      if (idx === -1) return -1;

      var before = idx - 1;
      var after  = idx + formLower.length;

      var beforeOk = (before < 0) || !isWordChar(rawLower.charAt(before));
      var afterOk  = (after >= rawLower.length) || !isWordChar(rawLower.charAt(after));

      if (beforeOk && afterOk) return idx;
      from = idx + 1;
    }
    return -1;
  }

  // =========================================================================
  // Lemma parsing
  // =========================================================================

  function pickLemma(lemma, wordObj, deckKey) {
    // UI может передавать lemma по-разному; опираемся на wordObj.word как источник истины.
    var w = (wordObj && wordObj.word != null) ? String(wordObj.word) : '';
    var base = String(lemma || '').trim();
    if (!base && w) base = w.trim();

    // Убираем "to " у глаголов (в словаре глаголы часто записаны как "to go", "to look up")
    // Также убираем маркеры в скобках: (sth), (smb), (something) — для подсветки не нужно.
    base = base.replace(/^\s*to\s+/i, '');
    base = base.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

    // Если это слово из деки глаголов и в конце есть частица (phrasal verb) — оставляем "verb particle".
    // Для остальных частей речи: если фраза многословная ("media coverage", "data set") — оставляем полностью.
    // Для одиночных токенов всё равно ок.

    // Если в базе есть артикль (a/an/the) — убираем (на случай ручного ввода)
    base = base.replace(/^(a|an|the)\s+/i, '');

    return base.trim();
  }

  // =========================================================================
  // Phrasal verbs: split search "verb ... particle"
  // =========================================================================

  function splitPhrasalVerb(base) {
    // base вида "look up", "take off", "go on", "bring about", "drop by"
    var s = String(base || '').trim();
    if (!s) return null;

    // допускаем 2+ слов; считаем последнюю часть particle, первую — verb
    var parts = s.split(/\s+/);
    if (parts.length < 2) return null;

    // heuristics: particle обычно короткая (1–5) и из списка частых
    var particle = parts[parts.length - 1].toLowerCase();
    var verb = parts[0].toLowerCase();

    if (!isLikelyParticle(particle)) return null;
    return { verb: verb, particle: particle, full: s };
  }

  function isLikelyParticle(p) {
    // расширяемый список
    var common = {
      'up':1,'down':1,'off':1,'on':1,'in':1,'out':1,'over':1,'away':1,'back':1,'about':1,'by':1,'into':1,'onto':1,
      'through':1,'around':1,'along':1,'across':1,'ahead':1,'apart':1,'aside':1,'together':1
    };
    return !!common[String(p || '').toLowerCase()];
  }

  function findPhrasalSplit(rawLower, ph) {
    // 1) если частица не встречается отдельным словом — нет смысла
    var pLower = String(ph.particle || '').toLowerCase();
    if (indexOfWord(rawLower, pLower) === -1) return null;

    // 2) формы глагольной базы
    var vForms = buildVerbForms(ph.verb);
    vForms = vForms.concat(extraVerbForms(ph.verb)); // нерегулярные и спец.кейсы

    // 3) ищем любую форму verb, после которой в окне встречается particle
    var windowMax = 80; // англ. предложения часто длиннее
    for (var i = 0; i < vForms.length; i++) {
      var f = String(vForms[i] || '').toLowerCase();
      if (!f) continue;

      var vIdx = indexOfWord(rawLower, f);
      if (vIdx === -1) continue;

      var searchFrom = vIdx + f.length;
      var slice = rawLower.slice(searchFrom, Math.min(rawLower.length, searchFrom + windowMax));
      var pInSlice = indexOfWord(slice, pLower);
      if (pInSlice !== -1) {
        return { index: vIdx, length: f.length };
      }
    }
    return null;
  }

  // =========================================================================
  // Verb-phrases focus (extendable, minimal heuristics)
  // =========================================================================

  function detectVerbPhraseFocus(base) {
    var s = String(base || '').trim();
    if (!s) return null;

    var lower = s.toLowerCase();

    // Normalize multiple spaces
    lower = lower.replace(/\s+/g, ' ');

    // 1) "be + X ..." — подсвечиваем X (вторая лексема), чтобы избегать подсветки инфинитива после "to".
    //    Примеры из словаря: be allowed to, be able to, be called, be based on, be worth it, ...
    if (lower.indexOf('be ') === 0) {
      var parts = s.split(/\s+/);
      if (parts.length >= 2) {
        return { mode: 'direct', focus: parts[1] };
      }
    }

    // 2) "get used to" — устойчивое выражение, где смысловой центр чаще "used".
    if (lower === 'get used to') {
      return { mode: 'direct', focus: 'used' };
    }

    // Можно добавлять другие конструкции по мере необходимости:
    // if (lower === 'be supposed to') return { mode: 'direct', focus: 'supposed' };

    return null;
  }


// =========================================================================
  // Forms builder
  // =========================================================================

  function buildEnglishForms(base, wordObj, deckType) {
    var forms = [];
    var s = String(base || '').trim();
    if (!s) return forms;

    // 0) Ручные формы (если когда-нибудь появятся в словаре)
    // Поддерживаем расширение без изменений логики: wordObj.enForms: ["went", "gone", ...]
    if (wordObj && Array.isArray(wordObj.enForms)) {
      for (var i = 0; i < wordObj.enForms.length; i++) {
        var f0 = String(wordObj.enForms[i] || '').trim();
        if (f0) forms.push(f0);
      }
    }

    // 1) База (как есть)
    forms.push(s);

    if (deckType === 'verb') {
      // Для фразового глагола ("go on") добавляем правила только к первому слову + форма фразы.
      var ph = splitPhrasalVerb(s);
      if (ph && ph.verb && ph.particle) {
        // полная фраза в "несепарабельном" виде (встречается как "go on", "went on")
        var v = ph.verb;
        var p = ph.particle;
        var vf = buildVerbForms(v).concat(extraVerbForms(v));
        for (var k = 0; k < vf.length; k++) {
          var vv = String(vf[k] || '').trim();
          if (!vv) continue;
          forms.push(vv + ' ' + p);
        }
        // также ищем только verb (если split был невозможен)
        forms = forms.concat(vf);
      } else {
        forms = forms.concat(buildVerbForms(s));
        forms = forms.concat(extraVerbForms(s));
      }
    } else if (deckType === 'noun') {
      // Для фраз ("media coverage") — плюрализируем последнее слово
      forms = forms.concat(buildNounForms(s));
    } else if (deckType === 'adj' || deckType === 'adv') {
      forms = forms.concat(buildAdjForms(s));
    }

    return uniqNonEmpty(forms);
  }

  function uniqNonEmpty(list) {
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var s = String(list[i] || '').trim();
      if (!s) continue;
      var key = s.toLowerCase();
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(s);
    }
    return out;
  }

  // =========================================================================
  // Regular rules (verbs / nouns / adjectives)
  // =========================================================================

  function buildVerbForms(base) {
    var forms = [];
    var v = String(base || '').trim();
    if (!v) return forms;

    // Убираем "to " если кто-то передал руками
    v = v.replace(/^\s*to\s+/i, '').trim();
    if (!v) return forms;

    // 3rd person singular
    var third = regularThird(v);
    if (third) forms.push(third);

    // past simple (regular)
    var past = regularPast(v);
    if (past) forms.push(past);

    // past participle (regular) — совпадает с past для regular verbs
    if (past) forms.push(past);

    // present continuous (-ing)
    var ing = regularIng(v);
    if (ing) forms.push(ing);

    // base itself
    forms.push(v);

    return uniqNonEmpty(forms);
  }

  function regularThird(v) {
    // special cases (handled in irregular map, но здесь — безопасный фолбэк)
    if (!v) return '';
    var lower = v.toLowerCase();

    // consonant + y -> ies (try -> tries)
    if (/[bcdfghjklmnpqrstvwxz]y$/i.test(lower)) return v.slice(0, -1) + 'ies';

    // -o, -ch, -sh, -ss, -x, -z -> +es
    if (/(o|ch|sh|ss|x|z)$/i.test(lower)) return v + 'es';

    return v + 's';
  }

  function regularPast(v) {
    if (!v) return '';
    var lower = v.toLowerCase();

    // consonant + y -> ied (try -> tried)
    if (/[bcdfghjklmnpqrstvwxz]y$/i.test(lower)) return v.slice(0, -1) + 'ied';

    // ends with e -> +d (like -> liked)
    if (/e$/i.test(lower)) return v + 'd';

    // CVC doubling (stop -> stopped)
    if (shouldDoubleFinalConsonant(lower)) return v + v.slice(-1) + 'ed';

    return v + 'ed';
  }

  function regularIng(v) {
    if (!v) return '';
    var lower = v.toLowerCase();

    // ie -> ying (die -> dying)
    if (/ie$/i.test(lower)) return v.slice(0, -2) + 'ying';

    // ends with e -> drop e (make -> making), but keep "ee" (see -> seeing)
    if (/e$/i.test(lower) && !/ee$/i.test(lower) && lower !== 'be') return v.slice(0, -1) + 'ing';

    // CVC doubling (sit -> sitting)
    if (shouldDoubleFinalConsonant(lower)) return v + v.slice(-1) + 'ing';

    return v + 'ing';
  }

  function shouldDoubleFinalConsonant(lower) {
    // Очень консервативная эвристика, чтобы не переудваивать.
    // CVC, длина 3–6, последний не w/x/y.
    if (!lower) return false;
    if (lower.length < 3 || lower.length > 6) return false;
    if (/[wxy]$/.test(lower)) return false;
    // ... consonant + vowel + consonant
    return /[^aeiou][aeiou][^aeiou]$/.test(lower);
  }

  function buildNounForms(base) {
    var forms = [];
    var s = String(base || '').trim();
    if (!s) return forms;

    // многословные: "data set" => плюрализируем last token
    var parts = s.split(/\s+/);
    if (parts.length > 1) {
      var head = parts[parts.length - 1];
      var prefix = parts.slice(0, -1).join(' ');
      var headForms = buildNounForms(head); // рекурсивно для одиночного слова
      for (var i = 0; i < headForms.length; i++) {
        forms.push(prefix + ' ' + headForms[i]);
      }
      forms.push(s);
      return uniqNonEmpty(forms);
    }

    // одиночные
    var n = s;
    forms.push(n);

    // irregular plural
    var irr = IRREG_NOUN_PLURAL[n.toLowerCase()];
    if (irr) {
      for (var k = 0; k < irr.length; k++) forms.push(irr[k]);
      return uniqNonEmpty(forms);
    }

    // regular plural
    forms.push(regularPlural(n));
    return uniqNonEmpty(forms);
  }

  function regularPlural(n) {
    var lower = n.toLowerCase();

    // consonant + y -> ies (city -> cities)
    if (/[bcdfghjklmnpqrstvwxz]y$/i.test(lower)) return n.slice(0, -1) + 'ies';

    // -s, -ss, -sh, -ch, -x, -z, -o -> +es
    if (/(s|ss|sh|ch|x|z|o)$/i.test(lower)) return n + 'es';

    // f/fe -> ves (knife -> knives) — очень ограниченно
    if (/fe$/i.test(lower)) return n.slice(0, -2) + 'ves';
    if (/f$/i.test(lower) && !/(ff)$/i.test(lower)) return n.slice(0, -1) + 'ves';

    return n + 's';
  }

  function buildAdjForms(base) {
    var forms = [];
    var a = String(base || '').trim();
    if (!a) return forms;

    // многословные: обычно не склоняются суффиксами, но оставляем как есть
    forms.push(a);

    // irregular adjectives (good -> better/best)
    var irr = IRREG_ADJ_FORMS[a.toLowerCase()];
    if (irr) {
      for (var k = 0; k < irr.length; k++) forms.push(irr[k]);
      return uniqNonEmpty(forms);
    }

    // regular -er / -est (small -> smaller/smallest)
    forms.push(regularComparative(a));
    forms.push(regularSuperlative(a));

    return uniqNonEmpty(forms);
  }

  function regularComparative(a) {
    var lower = a.toLowerCase();
    if (!a) return '';
    // consonant + y -> ier
    if (/[bcdfghjklmnpqrstvwxz]y$/i.test(lower)) return a.slice(0, -1) + 'ier';
    // CVC doubling
    if (shouldDoubleFinalConsonant(lower)) return a + a.slice(-1) + 'er';
    // ends with e -> +r
    if (/e$/i.test(lower)) return a + 'r';
    return a + 'er';
  }

  function regularSuperlative(a) {
    var lower = a.toLowerCase();
    if (!a) return '';
    // consonant + y -> iest
    if (/[bcdfghjklmnpqrstvwxz]y$/i.test(lower)) return a.slice(0, -1) + 'iest';
    // CVC doubling
    if (shouldDoubleFinalConsonant(lower)) return a + a.slice(-1) + 'est';
    // ends with e -> +st
    if (/e$/i.test(lower)) return a + 'st';
    return a + 'est';
  }

  // =========================================================================
  // Irregular / special cases (extendable maps)
  // =========================================================================

  // Нерегулярные формы глаголов: base -> { third, past, part, ing }
  // Правило: сначала regular, затем добавляем/переопределяем тут.
  var IRREG_VERB_MAP = {
    // be
    'be':   { third: ['is'], past: ['was','were'], part: ['been'], ing: ['being'], present: ['am','are'] },
    // have / do
    'have': { third: ['has'], past: ['had'], part: ['had'], ing: ['having'] },
    'do':   { third: ['does'], past: ['did'], part: ['done'], ing: ['doing'] },
    // go
    'go':   { third: ['goes'], past: ['went'], part: ['gone'], ing: ['going'] },
    // say / make / take (частые)
    'say':  { past: ['said'], part: ['said'] },
    'make': { past: ['made'], part: ['made'] },
    'take': { past: ['took'], part: ['taken'] },

    // lie / lay — омонимия (минимальный набор, расширяемо)
    // lie (recline): lay / lain / lying
    'lie(recline)': { past: ['lay'], part: ['lain'], ing: ['lying'] },
    // lie (tell untruth): lied / lied / lying
    'lie': { past: ['lied'], part: ['lied'], ing: ['lying'] },
    // lay: laid / laid / laying
    'lay': { past: ['laid'], part: ['laid'], ing: ['laying'] }
  };

  // Частые нерегулярные множ.числа
  var IRREG_NOUN_PLURAL = {
    'man': ['men'],
    'woman': ['women'],
    'child': ['children'],
    'person': ['people'],
    'mouse': ['mice'],
    'goose': ['geese'],
    'tooth': ['teeth'],
    'foot': ['feet']
  };

  // Нерегулярные степени сравнения
  var IRREG_ADJ_FORMS = {
    'good': ['better','best'],
    'well': ['better','best'],
    'bad': ['worse','worst'],
    'far': ['farther','farthest','further','furthest'],
    'little': ['less','least'],
    'many': ['more','most'],
    'much': ['more','most']
  };

  function extraVerbForms(base) {
    var out = [];
    var v = String(base || '').trim();
    if (!v) return out;

    // Для phrasal verb: extra только по первому слову
    var ph = splitPhrasalVerb(v);
    if (ph && ph.verb) v = ph.verb;

    var key = v.toLowerCase();
    var m = IRREG_VERB_MAP[key];

    // Отдельный ключ для lie(recline) — подключаем только если в словаре есть явная маркировка.
    // Сейчас это "аддитивная" возможность: если вы решите хранить такие леммы явно.
    if (!m && key === 'lie' && /recline/i.test(String(base))) {
      m = IRREG_VERB_MAP['lie(recline)'];
    }

    if (!m) return out;

    if (m.present) out = out.concat(m.present);
    if (m.third)   out = out.concat(m.third);
    if (m.past)    out = out.concat(m.past);
    if (m.part)    out = out.concat(m.part);
    if (m.ing)     out = out.concat(m.ing);

    return uniqNonEmpty(out);
  }

})(window);
