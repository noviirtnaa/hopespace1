/* HOPE SPACE — Pretest Harapan
   Jawaban disimpan di localStorage (tanpa backend/database). */
(function () {
  'use strict';

  var DRAFT_KEY  = 'hopespace_pretest_draft';
  var RESULT_KEY = 'hopespace_pretest';
  var NEXT_PAGE  = 'hasil-pretest.html';

  // Pernyataan diambil persis dari Tabel 2 proposal (Instrumen HOPE SPACE)
  var ASPECTS = [
    { id: 'goals', title: 'Goals', sub: 'Tujuan', range: [1, 4],
      icon: '<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/>' },
    { id: 'pathways', title: 'Pathways Thinking', sub: 'Pemikiran mengenai jalur', range: [5, 8],
      icon: '<circle cx="12" cy="36" r="4"/><circle cx="36" cy="12" r="4"/><path d="M16 36h10a6 6 0 0 0 0-12h-4a6 6 0 0 1 0-12h10"/>' },
    { id: 'agency', title: 'Agency Thinking', sub: 'Dorongan untuk mencapai tujuan', range: [9, 12],
      icon: '<path d="M26 6 12 26h10l-2 16 16-22H26Z"/>' }
  ];

  var STATEMENTS = [
    'Saya mengetahui hal-hal yang ingin saya capai pada masa depan.',
    'Saya memiliki tujuan yang ingin dicapai setelah lulus SMA.',
    'Saya memiliki gambaran mengenai kehidupan yang ingin saya jalani pada masa depan.',
    'Saya mengetahui tujuan yang penting bagi diri saya.',
    'Saya dapat menentukan langkah-langkah untuk mencapai tujuan saya.',
    'Saya dapat memikirkan beberapa cara untuk mencapai tujuan saya.',
    'Saya memiliki rencana untuk mewujudkan tujuan masa depan saya.',
    'Saya dapat mencari cara lain ketika rencana saya mengalami hambatan.',
    'Saya yakin dapat mencapai tujuan yang telah saya tetapkan.',
    'Saya memiliki motivasi untuk mulai melakukan sesuatu demi masa depan saya.',
    'Saya tetap berusaha mencapai tujuan meskipun menghadapi kesulitan.',
    'Saya yakin dapat mempersiapkan diri untuk mencapai masa depan yang saya inginkan.'
  ];

  var OPTIONS = [
    { v: 1, label: 'Pasti Salah' },
    { v: 2, label: 'Sebagian Besar Salah' },
    { v: 3, label: 'Sebagian Besar Benar' },
    { v: 4, label: 'Pasti Benar' }
  ];

  var TOTAL = STATEMENTS.length;
  var form = document.getElementById('pretestForm');
  var mount = document.getElementById('questions');
  var submitBtn = document.getElementById('submitBtn');
  var hint = document.getElementById('submitHint');
  var progressText = document.getElementById('progressText');
  var progressFill = document.getElementById('progressFill');
  var progressBar = document.getElementById('progressBar');

  /* ---------- storage aman ---------- */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* abaikan */ }
  }

  /* ---------- render ---------- */
  function render() {
    var html = '';
    ASPECTS.forEach(function (a) {
      html += '<section class="aspect" aria-labelledby="h-' + a.id + '">' +
        '<div class="aspect__head">' +
          '<div class="icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + a.icon + '</svg></div>' +
          '<div><h2 id="h-' + a.id + '">' + a.title + '</h2><p>' + a.sub + ' · pernyataan ' + a.range[0] + '–' + a.range[1] + '</p></div>' +
        '</div>';
      for (var n = a.range[0]; n <= a.range[1]; n++) {
        html += '<fieldset class="q" id="q' + n + '" data-no="' + n + '">' +
          '<legend><span class="q__no">' + n + '</span><span>' + STATEMENTS[n - 1] + '</span></legend>' +
          '<div class="q__options">';
        OPTIONS.forEach(function (o) {
          html += '<label class="opt"><input type="radio" name="q' + n + '" value="' + o.v + '" required>' +
            '<span><b>' + o.v + '</b>' + o.label + '</span></label>';
        });
        html += '</div></fieldset>';
      }
      html += '</section>';
    });
    mount.innerHTML = html;
  }

  /* ---------- state ---------- */
  function getAnswers() {
    var answers = [];
    for (var n = 1; n <= TOTAL; n++) {
      var checked = form.querySelector('input[name="q' + n + '"]:checked');
      answers.push(checked ? Number(checked.value) : null);
    }
    return answers;
  }

  function updateUI() {
    var answers = getAnswers();
    var done = answers.filter(function (a) { return a !== null; }).length;
    var left = TOTAL - done;

    progressText.textContent = done + ' dari ' + TOTAL + ' terjawab';
    progressFill.style.width = (done / TOTAL * 100) + '%';
    progressBar.setAttribute('aria-valuenow', done);

    answers.forEach(function (a, i) {
      var q = document.getElementById('q' + (i + 1));
      q.classList.toggle('is-answered', a !== null);
      if (a !== null) q.classList.remove('is-missing');
    });

    submitBtn.disabled = left > 0;
    hint.classList.remove('is-error');
    hint.textContent = left > 0
      ? 'Masih ada ' + left + ' pernyataan yang belum dijawab.'
      : 'Semua pernyataan sudah terjawab. Kamu siap mengirim jawaban.';
  }

  function sum(answers, from, to) {
    var s = 0;
    for (var i = from - 1; i < to; i++) s += answers[i];
    return s;
  }

  /* ---------- events ---------- */
  render();

  // pulihkan draf jika pengguna sempat menutup halaman
  var draft = load(DRAFT_KEY);
  if (draft && Array.isArray(draft.answers) && draft.answers.length === TOTAL) {
    draft.answers.forEach(function (v, i) {
      if (v >= 1 && v <= 4) {
        var input = form.querySelector('input[name="q' + (i + 1) + '"][value="' + v + '"]');
        if (input) input.checked = true;
      }
    });
  }
  updateUI();

  form.addEventListener('change', function () {
    updateUI();
    save(DRAFT_KEY, { answers: getAnswers() });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var answers = getAnswers();
    var missing = [];
    answers.forEach(function (a, i) { if (a === null) missing.push(i + 1); });

    // pengaman: jangan kirim bila masih ada yang kosong
    if (missing.length) {
      missing.forEach(function (n) { document.getElementById('q' + n).classList.add('is-missing'); });
      hint.classList.add('is-error');
      hint.textContent = 'Lengkapi pernyataan nomor ' + missing.join(', ') + ' terlebih dahulu.';
      document.getElementById('q' + missing[0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var result = {
      answers: answers,                       // skor 1–4 untuk item 1–12
      scores: {                               // jumlah skor (deskriptif, tanpa kategori)
        goals:    sum(answers, 1, 4),         // 4–16
        pathways: sum(answers, 5, 8),         // 4–16
        agency:   sum(answers, 9, 12),        // 4–16
        total:    sum(answers, 1, 12)         // 12–48
      },
      submittedAt: new Date().toISOString()
    };

    if (!save(RESULT_KEY, result)) {
      hint.classList.add('is-error');
      hint.textContent = 'Jawaban tidak dapat disimpan di browser ini. Pastikan penyimpanan lokal tidak diblokir, lalu coba lagi.';
      return;
    }
    remove(DRAFT_KEY);
    window.location.href = NEXT_PAGE;
  });
})();
