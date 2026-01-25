/* ==========================================================
 * Проект: MOYAMOVA
 * Файл: trainer.prepositions.en.js
 * Назначение: Данные для тренера предлогов (EN) — 30 паттернов × 5 фраз
 * Версия: 0.1
 * Обновлено: 2026-01-23
 * ========================================================== */

(function(){
  'use strict';

  // Глобальный контейнер данных тренера предлогов
  // Важно: не используем i18n EN — интерфейс RU/UK.
  var root = (window.prepositionsTrainer = window.prepositionsTrainer || {});
  root.en = {
    lang: 'en',
    totalPatterns: 30,
    variantsPerPattern: 5,
    // Базовый пул предлогов-отвлекалок (уникальные подписи на кнопках — обязательны).
    distractorPool: [
      'at','on','in','to','from','for','with','without','about','of','by',
      'under','over','between','among','through','during','before','after',
      'until','since','into','onto','across','around','in front of','next to','near','inside','outside'
    ],
    patterns: [
      {
        id: "prep_01_at_time",
        answer: "at",
        items: ["I'll meet you ___ 5 pm.", "The train arrives ___ noon.", "She usually wakes up ___ 6:30.", "The store closes ___ midnight.", "We start the lesson ___ 9 o\u2019clock."]
      },
      {
        id: "prep_02_on_day",
        answer: "on",
        items: ["I work from home ___ Mondays.", "We have a meeting ___ Friday.", "Her birthday is ___ April 12th.", "The concert is ___ Saturday night.", "The package arrived ___ Tuesday."]
      },
      {
        id: "prep_03_in_month",
        answer: "in",
        items: ["We travel ___ August.", "He was born ___ 1998.", "The project ends ___ two weeks.", "Flowers bloom ___ spring.", "I\u2019ll call you ___ a minute."]
      },
      {
        id: "prep_04_in_place",
        answer: "in",
        items: ["She lives ___ London.", "There\u2019s a key ___ my bag.", "He is ___ the kitchen right now.", "I left my phone ___ the car.", "The kids are playing ___ the garden."]
      },
      {
        id: "prep_05_on_surface",
        answer: "on",
        items: ["Your book is ___ the desk.", "There\u2019s a photo ___ the wall.", "Put the cup ___ the table.", "He sat ___ the sofa.", "The sticker is ___ the laptop."]
      },
      {
        id: "prep_06_at_place",
        answer: "at",
        items: ["I\u2019m ___ the bus stop.", "Let\u2019s meet ___ the entrance.", "She\u2019s ___ work right now.", "He stayed ___ home yesterday.", "We\u2019re ___ the airport early."]
      },
      {
        id: "prep_07_to_destination",
        answer: "to",
        items: ["We\u2019re going ___ the cinema.", "She moved ___ Canada last year.", "Send this email ___ me, please.", "He walked ___ the station.", "I\u2019m flying ___ Berlin tomorrow."]
      },
      {
        id: "prep_08_from_origin",
        answer: "from",
        items: ["This gift is ___ my sister.", "I\u2019m ___ Ukraine.", "The train comes ___ Zurich.", "He borrowed the book ___ the library.", "She got a message ___ her boss."]
      },
      {
        id: "prep_09_for_purpose",
        answer: "for",
        items: ["This tool is ___ cutting paper.", "I\u2019m studying English ___ work.", "We saved money ___ a new phone.", "She went there ___ a job interview.", "I bought flowers ___ my mom."]
      },
      {
        id: "prep_10_with_company",
        answer: "with",
        items: ["I\u2019m going ___ my friends.", "He lives ___ his parents.", "Can you come ___ me?", "She works ___ a great team.", "We had dinner ___ our neighbors."]
      },
      {
        id: "prep_11_without",
        answer: "without",
        items: ["I can\u2019t work ___ coffee.", "He left ___ saying goodbye.", "Please don\u2019t start ___ me.", "She drove ___ a map.", "They did it ___ help."]
      },
      {
        id: "prep_12_about_topic",
        answer: "about",
        items: ["We talked ___ the plan.", "I read an article ___ AI.", "She asked me ___ your trip.", "He knows a lot ___ history.", "Let\u2019s think ___ the next step."]
      },
      {
        id: "prep_13_of_possession",
        answer: "of",
        items: ["The color ___ the car is red.", "A piece ___ cake, please.", "The end ___ the movie was surprising.", "The door ___ the house is open.", "The name ___ the street is on the sign."]
      },
      {
        id: "prep_14_by_agent",
        answer: "by",
        items: ["The book was written ___ Orwell.", "The project was finished ___ our team.", "The window was broken ___ a ball.", "The song was sung ___ her.", "The decision was made ___ the manager."]
      },
      {
        id: "prep_15_under",
        answer: "under",
        items: ["The cat is ___ the table.", "Keep the passport ___ your pillow.", "The shoes are ___ the bed.", "He hid ___ the bridge.", "There\u2019s a cable ___ the desk."]
      },
      {
        id: "prep_16_over",
        answer: "over",
        items: ["A lamp hangs ___ the table.", "There\u2019s a bridge ___ the river.", "He put a jacket ___ his shirt.", "We talked for ___ an hour.", "The plane flew ___ the city."]
      },
      {
        id: "prep_17_between",
        answer: "between",
        items: ["The bank is ___ the caf\u00e9 and the pharmacy.", "She sat ___ Anna and Mark.", "Choose ___ tea and coffee.", "There\u2019s a line ___ the two points.", "We split the work ___ the three of us."]
      },
      {
        id: "prep_18_among",
        answer: "among",
        items: ["He felt comfortable ___ friends.", "The secret spread ___ the students.", "There was excitement ___ the crowd.", "She walked ___ the trees.", "It\u2019s popular ___ young people."]
      },
      {
        id: "prep_19_through",
        answer: "through",
        items: ["We walked ___ the park.", "Light came ___ the window.", "He read ___ the document.", "The tunnel goes ___ the mountain.", "She looked ___ the photos."]
      },
      {
        id: "prep_20_during",
        answer: "during",
        items: ["No phones ___ the meeting.", "It rained ___ the night.", "I met her ___ my vacation.", "He slept ___ the flight.", "We were quiet ___ the exam."]
      },
      {
        id: "prep_21_before",
        answer: "before",
        items: ["Wash your hands ___ dinner.", "Call me ___ you leave.", "He arrived ___ everyone else.", "I always check the address ___ sending.", "Let\u2019s finish this ___ Monday."]
      },
      {
        id: "prep_22_after",
        answer: "after",
        items: ["We\u2019ll go out ___ work.", "She felt better ___ the break.", "Call me ___ you arrive.", "He went home ___ the lesson.", "I\u2019ll reply ___ lunch."]
      },
      {
        id: "prep_23_until",
        answer: "until",
        items: ["Wait here ___ I come back.", "The shop is open ___ 8 pm.", "He worked ___ midnight.", "Stay ___ the end.", "We talked ___ sunrise."]
      },
      {
        id: "prep_24_since",
        answer: "since",
        items: ["I\u2019ve known her ___ 2020.", "He has lived here ___ April.", "She hasn\u2019t called ___ last week.", "We\u2019ve been friends ___ school.", "Nothing changed ___ then."]
      },
      {
        id: "prep_25_into",
        answer: "into",
        items: ["She walked ___ the room.", "Pour the water ___ the glass.", "He got ___ the car.", "The cat jumped ___ the box.", "They ran ___ the house."]
      },
      {
        id: "prep_26_onto",
        answer: "onto",
        items: ["The child climbed ___ the chair.", "He stepped ___ the platform.", "Put the files ___ the desk.", "The cat jumped ___ the sofa.", "She moved ___ the stage."]
      },
      {
        id: "prep_27_across",
        answer: "across",
        items: ["We walked ___ the street.", "There\u2019s a store ___ the road.", "He ran ___ the field.", "They swam ___ the lake.", "The message spread ___ the country."]
      },
      {
        id: "prep_28_around",
        answer: "around",
        items: ["We sat ___ the fire.", "She looked ___ the room.", "The kids ran ___ the house.", "There are trees ___ the lake.", "Let\u2019s walk ___ the block."]
      },
      {
        id: "prep_29_in_front_of",
        answer: "in front of",
        items: ["He parked ___ the building.", "She stood ___ the mirror.", "The taxi stopped ___ the hotel.", "I\u2019ll wait ___ the station.", "The sign is ___ the shop."]
      },
      {
        id: "prep_30_next_to",
        answer: "next to",
        items: ["Sit ___ me.", "The pharmacy is ___ the bank.", "My desk is ___ the window.", "He lives ___ a park.", "Put the chair ___ the table."]
      }
    ]
  };
})();
