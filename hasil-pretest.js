/* HOPE SPACE — Hasil Pretest
   Membaca jawaban dari localStorage ('hopespace_pretest') dan menghitung ulang skor. */
(function () {
  'use strict';

  var RESULT_KEY = 'hopespace_pretest';
  var ASPECTS = [
    { id: 'goals', from: 1, to: 4 },
    { id: 'pathways', from: 5, to: 8 },
    { id: 'agency', from: 9, to: 12 }
  ];

  var content = document.getElementById('resultContent');
  var empty = document.getElementById('resultEmpty');

  function load() {
    try { return JSON.parse(localStorage.getItem(RESULT_KEY)); } catch (e) { return null; }
  }

  // jawaban valid: 12 angka bulat 1–4
  function validAnswers(data) {
    return data && Array.isArray(data.answers) && data.answers.length === 12 &&
      data.answers.every(function (v) { return Number.isInteger(v) && v >= 1 && v <= 4; });
  }

  function sum(answers, from, to) {
    var s = 0;
    for (var i = from - 1; i < to; i++) s += answers[i];
    return s;
  }

  function setBar(id, score, min, max) {
    var fill = document.getElementById('bar-' + id);
    var track = fill.parentNode;
    var pct = (score - min) / (max - min) * 100;
    track.setAttribute('aria-valuenow', score);
    // dua frame agar animasi isi bar terlihat
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fill.style.width = pct + '%'; });
    });
  }

  var data = load();
  if (!validAnswers(data)) {
    content.hidden = true;
    empty.hidden = false;
    return;
  }

  var answers = data.answers;
  var scores = {};
  ASPECTS.forEach(function (a) { scores[a.id] = sum(answers, a.from, a.to); });
  scores.total = sum(answers, 1, 12);

  // skor aspek
  ASPECTS.forEach(function (a) {
    document.getElementById('score-' + a.id).textContent = scores[a.id];
    setBar(a.id, scores[a.id], 4, 16);
    var list = document.getElementById('items-' + a.id);
    for (var n = a.from; n <= a.to; n++) {
      var li = document.createElement('li');
      li.textContent = 'No. ' + n + ': ' + answers[n - 1];
      list.appendChild(li);
    }
  });

  // skor total
  document.getElementById('score-total').textContent = scores.total;
  setBar('total', scores.total, 12, 48);

  empty.hidden = true;
  content.hidden = false;
})();
