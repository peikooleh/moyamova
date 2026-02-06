/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: trainer.prepositions.de.js
 * Назначение: Данные для тренера предлогов (DE) — CLEAN v5 SCALE (60 patterns)
 * Статус: шаг 5 (масштабирование: 60 паттернов)
 * Версия: 5.0
 * Обновлено: 2026-02-06
 * ========================================================== */

(function(){
  'use strict';

  var root = (window.prepositionsTrainer = window.prepositionsTrainer || {});
  root.de = {
    lang: 'de',
    totalPatterns: 60,
    variantsPerPattern: 5,

    distractorPool: [
      'in','auf','an','unter','über','zwischen','vor','hinter','neben',
      'zu','nach','von','bei','mit','aus','seit',
      'für','ohne','durch','gegen','um','bis'
    ],

    patterns: [
      /* =========================
       * BASE v4-QA (30 patterns)
       * ========================= */

      { id: "de_prep_dative_041_zu", answer: "zu", items: [
        "Morgen gehe ich ___ meinem Arzt.",
        "Wir fahren am Wochenende ___ meinen Eltern.",
        "Kommst du heute ___ der Party?",
        "Sie geht jeden Tag ___ ihrer Arbeit zu Fuß.",
        "Ich muss noch kurz ___ der Bank."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_042_nach", answer: "nach", items: [
        "Nächsten Monat fliegen wir ___ Spanien.",
        "Am Abend gehe ich direkt ___ Hause.",
        "___ dem Essen mache ich einen Spaziergang.",
        "Er ist ___ der Arbeit sofort eingeschlafen.",
        "Wir fahren morgen ___ Berlin."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_043_von", answer: "von", items: [
        "Ich habe das ___ meinem Chef erfahren.",
        "Sie kommt gerade ___ der Arbeit.",
        "Das Geschenk ist ___ meiner Mutter.",
        "Kannst du mir eine Nachricht ___ deinem Bruder weiterleiten?",
        "Wir sprechen heute ___ dem neuen Projekt."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_044_bei", answer: "bei", items: [
        "Ich habe das ___ der Arbeit gelernt.",
        "Am Wochenende bin ich ___ meinen Freunden.",
        "Er wohnt noch ___ seinen Eltern.",
        "Sie arbeitet ___ einer großen Firma.",
        "___ dem Termin habe ich keine Zeit."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_045_mit", answer: "mit", items: [
        "Ich fahre morgen ___ dem Zug nach Zürich.",
        "Er schreibt ___ einem Bleistift.",
        "Wir gehen ___ unseren Nachbarn ins Kino.",
        "Kannst du das ___ einer App bezahlen?",
        "Sie spricht oft ___ ihrer Schwester darüber."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_046_aus", answer: "aus", items: [
        "Ich komme ___ der Schweiz.",
        "Der Tisch ist ___ Holz.",
        "Sie holt das Handy ___ der Tasche.",
        "Der Rauch kommt ___ dem Fenster.",
        "Er trinkt Wasser ___ der Flasche."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_dative_047_seit", answer: "seit", items: [
        "Ich lerne Deutsch ___ einem Jahr.",
        "___ Montag bin ich krank.",
        "Wir kennen uns ___ der Schule.",
        "Sie wohnt ___ drei Monaten in Basel.",
        "___ dem Morgen regnet es ununterbrochen."
      ], meta:{ bucket:"dative", case:"Dat", quality:"rewrite_v2" } },

      { id: "de_prep_accusative_062_ohne", answer: "ohne", items: [
        "Ich gehe nie ___ meinen Schlüssel aus dem Haus.",
        "Er trinkt Kaffee ___ Milch.",
        "Wir fahren ___ Auto in die Stadt.",
        "Sie kann ___ ihre Brille nichts lesen.",
        "Ich möchte das ___ Stress erledigen."
      ], meta:{ bucket:"accusative", case:"Akk", quality:"rewrite_v2" } },

      { id: "de_prep_accusative_063_durch", answer: "durch", items: [
        "Wir gehen ___ den Park nach Hause.",
        "Der Zug fährt ___ einen langen Tunnel.",
        "Sie schaut ___ das Fenster nach draußen.",
        "Die Katze läuft ___ die offene Tür.",
        "___ den starken Wind ist es heute sehr kalt."
      ], meta:{ bucket:"accusative", case:"Akk", quality:"rewrite_v2" } },

      { id: "de_prep_accusative_064_gegen", answer: "gegen", items: [
        "Die Mannschaft spielt ___ den FC Basel.",
        "Der Ball prallt ___ die Wand.",
        "Ich bin ___ diesen Vorschlag.",
        "Wir sind ___ Diskriminierung am Arbeitsplatz.",
        "Kommst du ___ acht Uhr?"
      ], meta:{ bucket:"accusative", case:"Akk", quality:"rewrite_v2" } },

      { id: "de_prep_accusative_065_um", answer: "um", items: [
        "Der Film beginnt ___ 19 Uhr.",
        "Wir laufen einmal ___ den See.",
        "Sie kümmert sich ___ ihre Kinder.",
        "Er bittet ___ Hilfe.",
        "Es geht ___ eine wichtige Entscheidung."
      ], meta:{ bucket:"accusative", case:"Akk", quality:"rewrite_v2" } },

      { id: "de_prep_accusative_066_bis", answer: "bis", items: [
        "Ich arbeite heute ___ 18 Uhr.",
        "Der Kurs dauert ___ nächsten Freitag.",
        "Warte bitte ___ morgen.",
        "Wir bleiben ___ Sonntag in Bern.",
        "Geh ___ zur Ecke und dann links."
      ], meta:{ bucket:"accusative", case:"Akk", quality:"rewrite_v2" } },

      { id: "de_book_nvv_001_in_kauf_nehmen_in", answer: "in", items: [
        "Man muss die Nachteile ___ Kauf nehmen.",
        "Er nahm das Risiko ___ Kauf.",
        "Wir müssen längere Wartezeiten ___ Kauf nehmen.",
        "Sie hat die Kritik ___ Kauf genommen.",
        "Wer umzieht, muss manchmal Heimweh ___ Kauf nehmen."
      ], meta:{ type:"nvv", source:"book", anchor:"in Kauf nehmen" } },

      { id: "de_book_nvv_002_in_kontakt_treten_in", answer: "in", items: [
        "Ich bin mit dem Support ___ Kontakt getreten.",
        "Sind Sie schon ___ Kontakt mit der Firma getreten?",
        "Er ist schnell ___ Kontakt mit den Nachbarn getreten.",
        "Wir treten morgen ___ Kontakt mit dem Vermieter.",
        "Sie ist telefonisch ___ Kontakt mit dem Arzt getreten."
      ], meta:{ type:"nvv", source:"book", anchor:"in Kontakt treten" } },

      { id: "de_book_nvv_003_in_kontakt_treten_mit", answer: "mit", items: [
        "Er ist in Kontakt getreten ___ seinem Anwalt.",
        "Bitte treten Sie in Kontakt ___ unserem Kundenservice.",
        "Sie tritt heute in Kontakt ___ der Personalabteilung.",
        "Wir sind in Kontakt ___ dem Team in Berlin.",
        "Ich möchte in Kontakt ___ dem Vermieter treten."
      ], meta:{ type:"nvv", source:"book", anchor:"in Kontakt treten mit" } },

      { id: "de_book_nvv_004_ruecksicht_nehmen_auf", answer: "auf", items: [
        "Wir sollten mehr Rücksicht ___ unsere Mitmenschen nehmen.",
        "Nimm bitte Rücksicht ___ die Kinder.",
        "Er nimmt kaum Rücksicht ___ die Regeln.",
        "Sie nimmt Rücksicht ___ meine Situation.",
        "Im Straßenverkehr muss man Rücksicht ___ andere nehmen."
      ], meta:{ type:"nvv", source:"book", anchor:"Rücksicht nehmen auf" } },

      { id: "de_book_nvv_005_schluss_machen_mit", answer: "mit", items: [
        "Wir müssen endlich Schluss ___ der Verschwendung machen.",
        "Mach bitte Schluss ___ den Ausreden.",
        "Er hat Schluss ___ dem Rauchen gemacht.",
        "Sie möchte Schluss ___ dem Streit machen.",
        "Jetzt machen wir Schluss ___ diesem Thema."
      ], meta:{ type:"nvv", source:"book", anchor:"Schluss machen mit" } },

      { id: "de_book_nvv_006_sich_sorgen_machen_um", answer: "um", items: [
        "Ich mache mir Sorgen ___ meinen Freund.",
        "Mach dir keine Sorgen ___ die Prüfung.",
        "Sie macht sich große Sorgen ___ ihre Mutter.",
        "Wir machen uns Sorgen ___ die Zukunft.",
        "Er macht sich ständig Sorgen ___ seine Gesundheit."
      ], meta:{ type:"nvv", source:"book", anchor:"sich Sorgen machen um" } },

      { id: "de_book_nvv_007_aufs_spiel_setzen_auf", answer: "auf", items: [
        "Wir dürfen unsere Zukunft nicht ___s Spiel setzen.",
        "Er setzt alles ___s Spiel, um zu gewinnen.",
        "Setz deine Gesundheit nicht ___s Spiel.",
        "Sie hat ihre Karriere ___s Spiel gesetzt.",
        "Man sollte nichts ___s Spiel setzen, was wichtig ist."
      ], meta:{ type:"nvv", source:"book", anchor:"aufs Spiel setzen" } },

      { id: "de_book_nvv_008_zweifel_haben_an", answer: "an", items: [
        "Viele Menschen haben Zweifel ___ dieser Entscheidung.",
        "Ich habe keine Zweifel ___ seinen Fähigkeiten.",
        "Sie zweifelt ___ der Ehrlichkeit des Mannes.",
        "Experten haben Zweifel ___ der Wirksamkeit des Medikaments.",
        "Er hat Zweifel ___ diesem Plan."
      ], meta:{ type:"nvv", source:"book", anchor:"Zweifel haben an" } },

      { id: "de_book_nvv_009_in_betracht_ziehen_in", answer: "in", items: [
        "Wir ziehen mehrere Möglichkeiten ___ Betracht.",
        "Er zieht einen Umzug ___ Betracht.",
        "Man sollte auch andere Lösungen ___ Betracht ziehen.",
        "Sie zieht einen Arztbesuch ___ Betracht.",
        "Ich ziehe das Angebot ___ Betracht."
      ], meta:{ type:"nvv", source:"book", anchor:"in Betracht ziehen" } },

      { id: "de_book_nvv_010_bezug_nehmen_auf", answer: "auf", items: [
        "Mit diesem Schreiben nehme ich Bezug ___ Ihre Anfrage.",
        "Ich nehme Bezug ___ unser letztes Gespräch.",
        "Er nahm Bezug ___ den Artikel in der Zeitung.",
        "Wir nehmen Bezug ___ die aktuellen Zahlen.",
        "Sie nimmt Bezug ___ die Vereinbarung."
      ], meta:{ type:"nvv", source:"book", anchor:"Bezug nehmen auf" } },

      { id: "de_book_nvv_011_unter_druck_stehen_unter", answer: "unter", items: [
        "Viele Jugendliche stehen stark ___ Druck.",
        "Im Job stehe ich oft ___ Druck.",
        "Er geriet ___ Druck und machte Fehler.",
        "Sie setzt sich selbst ___ Druck.",
        "Das Team steht ___ großem Druck."
      ], meta:{ type:"nvv", source:"book", anchor:"unter Druck stehen" } },

      { id: "de_book_nvv_012_einfluss_nehmen_auf", answer: "auf", items: [
        "Ich möchte ___ diese Entscheidung Einfluss nehmen.",
        "Medien nehmen starken Einfluss ___ die Meinung vieler Menschen.",
        "Er versucht, Einfluss ___ das Ergebnis zu nehmen.",
        "Das Wetter hat Einfluss ___ die Stimmung.",
        "Eltern können Einfluss ___ ihre Kinder nehmen."
      ], meta:{ type:"nvv", source:"book", anchor:"Einfluss nehmen auf" } },

      { id: "de_book_nvv_013_zu_ende_bringen_zu", answer: "zu", items: [
        "Wir müssen das Projekt ___ Ende bringen.",
        "Sie bringt ihre Ausbildung ___ Ende.",
        "Er hat die Aufgabe nicht ___ Ende gebracht.",
        "Bring das bitte ___ Ende, bevor du gehst.",
        "Ich will die Diskussion ___ Ende bringen."
      ], meta:{ type:"nvv", source:"book", anchor:"zu Ende bringen" } },

      { id: "de_book_nvv_014_flucht_ergreifen_vor", answer: "vor", items: [
        "Der Dieb ergriff ___ der Polizei die Flucht.",
        "Viele Menschen ergreifen ___ dem Krieg die Flucht.",
        "Sie ergriff ___ der Verantwortung die Flucht.",
        "Er ergriff ___ den Reportern die Flucht.",
        "Manche fliehen ___ Problemen."
      ], meta:{ type:"nvv", source:"book", anchor:"die Flucht ergreifen vor" } },

      { id: "de_book_nvv_015_nicht_in_frage_kommen_in", answer: "in", items: [
        "Das kommt für mich nicht ___ Frage.",
        "Ein Umzug kommt gerade nicht ___ Frage.",
        "Für ihn kommt so ein Risiko nicht ___ Frage.",
        "Ohne Vertrag kommt das nicht ___ Frage.",
        "So eine Lösung kommt nicht ___ Frage."
      ], meta:{ type:"nvv", source:"book", anchor:"nicht in Frage kommen" } },

      { id: "de_book_nvv_016_in_frage_stellen_in", answer: "in", items: [
        "Er stellt ihre Aussage ___ Frage.",
        "Man sollte diese Regel nicht ___ Frage stellen.",
        "Sie stellt seine Kompetenz ___ Frage.",
        "Der Bericht stellt die Zahlen ___ Frage.",
        "Ich stelle das Ergebnis nicht ___ Frage."
      ], meta:{ type:"nvv", source:"book", anchor:"in Frage stellen" } },

      { id: "de_book_nvv_017_sich_gedanken_machen_ueber_ueber", answer: "über", items: [
        "Ich mache mir viele Gedanken ___ die Zukunft.",
        "Sie macht sich Gedanken ___ ihren nächsten Schritt.",
        "Wir sollten uns Gedanken ___ dieses Problem machen.",
        "Er macht sich Gedanken ___ seine Karriere.",
        "Mach dir Gedanken ___ die Konsequenzen."
      ], meta:{ type:"nvv", source:"book", anchor:"sich Gedanken machen über" } },

      { id: "de_book_nvv_018_abschied_nehmen_von_von", answer: "von", items: [
        "Vor der Reise nahm er Abschied ___ seiner Familie.",
        "Sie nahm Abschied ___ ihren Kollegen.",
        "Wir müssen Abschied ___ dieser Idee nehmen.",
        "Er hat sich ___ seinem Freund verabschiedet und Abschied genommen.",
        "Nach dem Treffen nahm ich Abschied ___ allen."
      ], meta:{ type:"nvv", source:"book", anchor:"Abschied nehmen von" } },

      /* =========================
       * SCALE ADD-ON (30 new patterns)
       * Verb-Prep / Adj-Prep / weitere feste Verbindungen
       * ========================= */

      // warten auf
      { id: "de_scale_001_warten_auf", answer: "auf", items: [
        "Wir warten ___ den Bus.",
        "Ich warte noch ___ deine Antwort.",
        "Sie wartet ___ den Anruf.",
        "Wartest du ___ mich?",
        "Alle warten ___ das Ergebnis."
      ], meta:{ type:"verb_prep", anchor:"warten auf" } },

      // sich freuen auf
      { id: "de_scale_002_freuen_auf", answer: "auf", items: [
        "Ich freue mich ___ das Wochenende.",
        "Sie freut sich ___ den Urlaub.",
        "Wir freuen uns ___ das Konzert.",
        "Freust du dich ___ die Reise?",
        "Er freut sich ___ den Besuch."
      ], meta:{ type:"verb_prep", anchor:"sich freuen auf" } },

      // sich freuen über
      { id: "de_scale_003_freuen_ueber", answer: "über", items: [
        "Ich freue mich ___ die gute Nachricht.",
        "Sie freut sich ___ das Geschenk.",
        "Wir freuen uns ___ deinen Erfolg.",
        "Er freut sich ___ die Einladung.",
        "Alle freuen sich ___ das Ergebnis."
      ], meta:{ type:"verb_prep", anchor:"sich freuen über" } },

      // sich erinnern an
      { id: "de_scale_004_erinnern_an", answer: "an", items: [
        "Ich erinnere mich ___ seinen Namen.",
        "Sie erinnert sich ___ das Gespräch.",
        "Wir erinnern uns ___ die Zeit in der Schule.",
        "Er erinnert sich ___ den Termin.",
        "Erinnerst du dich ___ die Adresse?"
      ], meta:{ type:"verb_prep", anchor:"sich erinnern an" } },

      // denken an
      { id: "de_scale_005_denken_an", answer: "an", items: [
        "Ich denke oft ___ meine Familie.",
        "Denk bitte ___ den Schlüssel.",
        "Sie denkt ___ ihre Zukunft.",
        "Wir denken ___ den Plan.",
        "Er denkt ___ den nächsten Schritt."
      ], meta:{ type:"verb_prep", anchor:"denken an" } },

      // sprechen über
      { id: "de_scale_006_sprechen_ueber", answer: "über", items: [
        "Wir sprechen ___ das neue Projekt.",
        "Sie spricht ___ ihre Arbeit.",
        "Er spricht ___ seine Pläne.",
        "Können wir ___ die Preise sprechen?",
        "Alle sprechen ___ diese Entscheidung."
      ], meta:{ type:"verb_prep", anchor:"sprechen über" } },

      // informieren über
      { id: "de_scale_007_informieren_ueber", answer: "über", items: [
        "Bitte informieren Sie mich ___ den Stand.",
        "Wir informieren uns ___ die Regeln.",
        "Sie hat uns ___ die Änderung informiert.",
        "Er informiert sich ___ die Angebote.",
        "Ich möchte mich ___ die Bedingungen informieren."
      ], meta:{ type:"verb_prep", anchor:"informieren über" } },

      // entscheiden für
      { id: "de_scale_008_entscheiden_fuer", answer: "für", items: [
        "Ich entscheide mich ___ die erste Option.",
        "Sie hat sich ___ das Angebot entschieden.",
        "Wir entscheiden uns ___ einen neuen Plan.",
        "Er entscheidet sich ___ den Kurs.",
        "Hast du dich ___ das Studium entschieden?"
      ], meta:{ type:"verb_prep", anchor:"sich entscheiden für" } },

      // entscheiden gegen
      { id: "de_scale_009_entscheiden_gegen", answer: "gegen", items: [
        "Er entscheidet sich ___ diesen Vorschlag.",
        "Sie hat sich ___ den Umzug entschieden.",
        "Wir entscheiden uns ___ eine schnelle Lösung.",
        "Ich entscheide mich ___ den Vertrag.",
        "Hast du dich ___ das Angebot entschieden?"
      ], meta:{ type:"verb_prep", anchor:"sich entscheiden gegen" } },

      // sich bewerben um
      { id: "de_scale_010_bewerben_um", answer: "um", items: [
        "Er bewirbt sich ___ eine Stelle.",
        "Sie bewirbt sich ___ ein Praktikum.",
        "Wir bewerben uns ___ die Wohnung.",
        "Ich bewerbe mich ___ den Job.",
        "Bewirbst du dich ___ das Stipendium?"
      ], meta:{ type:"verb_prep", anchor:"sich bewerben um" } },

      // bitten um
      { id: "de_scale_011_bitten_um", answer: "um", items: [
        "Ich bitte ___ Hilfe.",
        "Sie bittet ___ Geduld.",
        "Wir bitten ___ eine kurze Antwort.",
        "Er bat ___ Entschuldigung.",
        "Kann ich ___ einen Rat bitten?"
      ], meta:{ type:"verb_prep", anchor:"bitten um" } },

      // danken für
      { id: "de_scale_012_danken_fuer", answer: "für", items: [
        "Ich danke dir ___ deine Unterstützung.",
        "Wir danken Ihnen ___ die Einladung.",
        "Sie dankt ___ die Hilfe.",
        "Er dankte ___ das Gespräch.",
        "Danke ___ die Information."
      ], meta:{ type:"verb_prep", anchor:"danken für" } },

      // sich entschuldigen für
      { id: "de_scale_013_entschuldigen_fuer", answer: "für", items: [
        "Ich entschuldige mich ___ die Verspätung.",
        "Sie entschuldigt sich ___ den Fehler.",
        "Wir entschuldigen uns ___ das Missverständnis.",
        "Er hat sich ___ seine Worte entschuldigt.",
        "Entschuldigen Sie sich bitte ___ die Störung."
      ], meta:{ type:"verb_prep", anchor:"sich entschuldigen für" } },

      // Angst haben vor
      { id: "de_scale_014_angst_vor", answer: "vor", items: [
        "Er hat Angst ___ der Prüfung.",
        "Sie hat Angst ___ Hunden.",
        "Viele Menschen haben Angst ___ Veränderungen.",
        "Ich habe Angst ___ dem Gespräch.",
        "Hast du Angst ___ der Dunkelheit?"
      ], meta:{ type:"adj_prep", anchor:"Angst haben vor" } },

      // warnen vor
      { id: "de_scale_015_warnen_vor", answer: "vor", items: [
        "Die Polizei warnt ___ Betrügern.",
        "Experten warnen ___ zu viel Stress.",
        "Ich warne dich ___ diesem Fehler.",
        "Sie warnt ___ falschen Versprechen.",
        "Wir warnen ___ Risiken."
      ], meta:{ type:"verb_prep", anchor:"warnen vor" } },

      // abhängig sein von
      { id: "de_scale_016_abhaengig_von", answer: "von", items: [
        "Das hängt ___ der Situation ab.",
        "Der Preis ist ___ der Saison abhängig.",
        "Alles ist ___ der Zeit abhängig.",
        "Der Erfolg hängt ___ guter Planung ab.",
        "Es ist ___ deiner Entscheidung abhängig."
      ], meta:{ type:"adj_prep", anchor:"abhängig von" } },

      // gehören zu
      { id: "de_scale_017_gehoeren_zu", answer: "zu", items: [
        "Das gehört ___ unserem Plan.",
        "Sie gehört ___ dem Team.",
        "Er gehört ___ meiner Familie.",
        "Das Thema gehört ___ diesem Kapitel.",
        "Diese Regeln gehören ___ der Prüfung."
      ], meta:{ type:"verb_prep", anchor:"gehören zu" } },

      // teilnehmen an
      { id: "de_scale_018_teilnehmen_an", answer: "an", items: [
        "Ich nehme ___ dem Kurs teil.",
        "Sie nimmt ___ der Sitzung teil.",
        "Wir nehmen ___ der Besprechung teil.",
        "Er nimmt ___ dem Training teil.",
        "Nimmst du ___ dem Treffen teil?"
      ], meta:{ type:"verb_prep", anchor:"teilnehmen an" } },

      // Interesse haben an
      { id: "de_scale_019_interesse_an", answer: "an", items: [
        "Ich habe Interesse ___ diesem Angebot.",
        "Sie hat Interesse ___ dem Job.",
        "Wir haben Interesse ___ einer Zusammenarbeit.",
        "Er hat Interesse ___ Musik.",
        "Hast du Interesse ___ dem Kurs?"
      ], meta:{ type:"adj_prep", anchor:"Interesse an" } },

      // stolz sein auf
      { id: "de_scale_020_stolz_auf", answer: "auf", items: [
        "Sie ist stolz ___ ihre Leistung.",
        "Wir sind stolz ___ unser Team.",
        "Er ist stolz ___ seinen Erfolg.",
        "Ich bin stolz ___ dich.",
        "Seid ihr stolz ___ euer Ergebnis?"
      ], meta:{ type:"adj_prep", anchor:"stolz auf" } },

      // bestehen aus
      { id: "de_scale_021_bestehen_aus", answer: "aus", items: [
        "Das Team besteht ___ fünf Personen.",
        "Der Vertrag besteht ___ zwei Teilen.",
        "Die Mischung besteht ___ Wasser und Salz.",
        "Das Menü besteht ___ drei Gängen.",
        "Der Kurs besteht ___ mehreren Modulen."
      ], meta:{ type:"verb_prep", anchor:"bestehen aus" } },

      // anfangen mit
      { id: "de_scale_022_anfangen_mit", answer: "mit", items: [
        "Wir fangen ___ dem ersten Teil an.",
        "Fang bitte ___ der Aufgabe an.",
        "Sie fängt ___ dem Training an.",
        "Er fängt ___ dem Bericht an.",
        "Womit fangen wir an? — ___ dem Plan."
      ], meta:{ type:"verb_prep", anchor:"anfangen mit" } },

      // aufhören mit
      { id: "de_scale_023_aufhoeren_mit", answer: "mit", items: [
        "Er hört ___ dem Rauchen auf.",
        "Sie hat ___ dem Lernen aufgehört.",
        "Wir hören ___ der Diskussion auf.",
        "Hör bitte ___ den Ausreden auf.",
        "Ich will ___ dem Stress aufhören."
      ], meta:{ type:"verb_prep", anchor:"aufhören mit" } },

      // rechnen mit
      { id: "de_scale_024_rechnen_mit", answer: "mit", items: [
        "Rechnen Sie ___ höheren Kosten.",
        "Ich rechne ___ einer Antwort.",
        "Wir rechnen ___ Verzögerungen.",
        "Er rechnet nicht ___ so einer Frage.",
        "Man muss ___ Problemen rechnen."
      ], meta:{ type:"verb_prep", anchor:"rechnen mit" } },

      // leiden unter
      { id: "de_scale_025_leiden_unter", answer: "unter", items: [
        "Viele Menschen leiden ___ Stress.",
        "Er leidet ___ Rückenschmerzen.",
        "Sie leidet ___ Schlafproblemen.",
        "Wir leiden ___ dem Lärm.",
        "Das Team leidet ___ Personalmangel."
      ], meta:{ type:"verb_prep", anchor:"leiden unter" } },

      // sich konzentrieren auf
      { id: "de_scale_026_konzentrieren_auf", answer: "auf", items: [
        "Ich konzentriere mich ___ die Aufgabe.",
        "Bitte konzentrieren Sie sich ___ das Wesentliche.",
        "Sie konzentriert sich ___ den Text.",
        "Wir konzentrieren uns ___ das Ziel.",
        "Er kann sich nicht ___ die Arbeit konzentrieren."
      ], meta:{ type:"verb_prep", anchor:"sich konzentrieren auf" } },

      // sich beschweren über
      { id: "de_scale_027_beschweren_ueber", answer: "über", items: [
        "Er beschwert sich ___ den Lärm.",
        "Sie beschwert sich ___ den Service.",
        "Wir beschweren uns ___ die Wartezeit.",
        "Viele beschweren sich ___ die Preise.",
        "Beschwerst du dich ___ das Ergebnis?"
      ], meta:{ type:"verb_prep", anchor:"sich beschweren über" } },

      // sich verlassen auf
      { id: "de_scale_028_verlassen_auf", answer: "auf", items: [
        "Du kannst dich ___ mich verlassen.",
        "Wir verlassen uns ___ den Plan.",
        "Sie verlässt sich ___ ihre Erfahrung.",
        "Er verlässt sich ___ die Zahlen.",
        "Man sollte sich nicht nur ___ Glück verlassen."
      ], meta:{ type:"verb_prep", anchor:"sich verlassen auf" } },

      // sich kümmern um (повтор якоря, но норм как отдельный паттерн)
      { id: "de_scale_029_kuemmern_um", answer: "um", items: [
        "Ich kümmere mich ___ die Rechnung.",
        "Sie kümmert sich ___ ihre Eltern.",
        "Wir kümmern uns ___ das Problem.",
        "Er kümmert sich ___ den Hund.",
        "Kümmerst du dich ___ die Termine?"
      ], meta:{ type:"verb_prep", anchor:"sich kümmern um" } },

      // achten auf
      { id: "de_scale_030_achten_auf", answer: "auf", items: [
        "Achte bitte ___ die Aussprache.",
        "Wir achten ___ die Qualität.",
        "Sie achtet ___ ihre Gesundheit.",
        "Er achtet ___ die Details.",
        "Achtet ihr ___ die Regeln?"
      ], meta:{ type:"verb_prep", anchor:"achten auf" } }
    ]
  };
})();
