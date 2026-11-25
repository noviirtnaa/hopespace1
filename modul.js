/* HOPE SPACE — Halaman Modul. Data disimpan di localStorage (tanpa backend). */
(function () {
  'use strict';
  var M = window.MODULE;
  var KEY = 'hopespace_modul' + M.id;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  var st = read(KEY) || {};
  st.fields = st.fields || {}; st.checks = st.checks || {}; st.tabs = st.tabs || {}; st.done = !!st.done;

  var saveTimer, storageOk = true;
  function persist() { storageOk = write(KEY, st); return storageOk; }
  function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2); }
  function setStatus(msg, ok) {
    $$('.ws__status').forEach(function (el) { el.textContent = msg; el.classList.toggle('is-ok', !!ok); });
  }

  /* ---- Worksheet ---- */
  $$('[data-field]').forEach(function (ta) {
    ta.value = st.fields[ta.dataset.field] || '';
    ta.addEventListener('input', function () {
      st.fields[ta.dataset.field] = ta.value;
      setStatus('Menyimpan…');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        setStatus(persist() ? 'Tersimpan otomatis pukul ' + hhmm() : 'Gagal menyimpan: penyimpanan browser tidak tersedia.', storageOk);
      }, 400);
      render();
    });
  });
  $$('[data-save]').forEach(function (b) {
    b.addEventListener('click', function () {
      clearTimeout(saveTimer);
      setStatus(persist() ? 'Berhasil disimpan pukul ' + hhmm() : 'Gagal menyimpan: penyimpanan browser tidak tersedia.', storageOk);
    });
  });
  $$('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!confirm('Kosongkan semua isian worksheet ini?')) return;
      var act = $('[data-act="' + b.dataset.reset + '"]') || b.closest('.act');
      $$('[data-field]', act).forEach(function (ta) { ta.value = ''; delete st.fields[ta.dataset.field]; });
      persist(); setStatus('Isian dikosongkan.');
      steppers.forEach(function (x) { if (act.contains(x.ws)) x.show(0); });
      render();
    });
  });
  function getVal(ref) {
    var p = ref.split(':'), id = p.length === 2 ? p[0] : String(M.id), key = p[p.length - 1];
    var src = String(M.id) === id ? st : read('hopespace_modul' + id);
    return ((src && src.fields && src.fields[key]) || '').trim();
  }
  $$('[data-copy-from]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = getVal(b.dataset.copyFrom), dst = $('[data-field="' + b.dataset.copyTo + '"]');
      if (!v) { setStatus('Belum ada isian untuk diambil.'); return; }
      dst.value = v; dst.dispatchEvent(new Event('input'));
    });
  });

  /* ---- Kartu Positive Self-Talk ---- */
  $$('[data-card]').forEach(function (b) {
    var k = 'card:' + b.dataset.card;
    function paint() { var on = !!st.checks[k]; b.setAttribute('aria-pressed', on); $('.pcard__mark', b).textContent = on ? '♥' : '♡'; }
    paint();
    b.addEventListener('click', function () { st.checks[k] = !st.checks[k]; persist(); paint(); render(); });
  });
  function cardsOn() { return $$('[data-card]').filter(function (b) { return st.checks['card:' + b.dataset.card]; }).length; }

  /* ---- Worksheet satu pertanyaan per layar ---- */
  var steppers = [];
  $$('.ws').forEach(function (ws) {
    var fs = $$('.field', ws);
    if (fs.length < 2) return;
    var cur = 0;
    for (var i = 0; i < fs.length; i++) { if (!($('textarea', fs[i]).value || '').trim()) { cur = i; break; } }
    var nav = document.createElement('div');
    nav.className = 'steps';
    nav.innerHTML = '<span class="steps__count" aria-live="polite"></span><div class="steps__dots"></div><div class="steps__btns"><button type="button" class="btn btn--small btn--ghost" data-prev>← Sebelumnya</button><button type="button" class="btn btn--small" data-next>Lanjut →</button></div>';
    ws.insertBefore(nav, $('.ws__bar', ws));
    var dots = $('.steps__dots', nav), prev = $('[data-prev]', nav), next = $('[data-next]', nav);
    fs.forEach(function (f, n) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Pertanyaan ' + (n + 1));
      d.addEventListener('click', function () { show(n); });
      dots.appendChild(d);
    });
    function show(n) {
      cur = n;
      fs.forEach(function (f, i) { f.hidden = i !== cur; });
      $('.steps__count', nav).textContent = 'Pertanyaan ' + (cur + 1) + ' dari ' + fs.length;
      prev.disabled = cur === 0; next.hidden = cur === fs.length - 1;
      update();
    }
    function update() {
      $$('button', dots).forEach(function (d, i) {
        d.classList.toggle('is-filled', ($('textarea', fs[i]).value || '').trim().length > 0);
        d.classList.toggle('is-current', i === cur);
        d.setAttribute('aria-current', i === cur ? 'step' : 'false');
      });
    }
    prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    next.addEventListener('click', function () { if (cur < fs.length - 1) show(cur + 1); });
    steppers.push({ ws: ws, show: show, update: update });
    show(cur);
  });

  /* ---- Tab ---- */
  $$('.tabs').forEach(function (box) {
    var gate = box.dataset.gate, tabs = $$('[role="tab"]', box);
    function show(i) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      tabs[i].classList.add('is-seen');
      st.tabs[gate + ':' + i] = true; persist(); render();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (n === null) return;
        n = (n + tabs.length) % tabs.length; show(n); tabs[n].focus();
      });
      if (st.tabs[gate + ':' + i]) t.classList.add('is-seen');
    });
  });

  /* ---- Centang manual ---- */
  $$('[data-check]').forEach(function (c) {
    c.checked = !!st.checks[c.dataset.check];
    c.addEventListener('change', function () { st.checks[c.dataset.check] = c.checked; persist(); render(); });
  });

  /* ---- Hitung progres ---- */
  function tabsSeen(gate) {
    var box = $('.tabs[data-gate="' + gate + '"]'), n = $$('[role="tab"]', box).length, seen = 0;
    for (var i = 0; i < n; i++) if (st.tabs[gate + ':' + i]) seen++;
    return { seen: seen, total: n };
  }
  function render() {
    var acts = $$('.act'), done = 0;
    acts.forEach(function (a) {
      var ok;
      if (a.dataset.fields) {
        ok = a.dataset.fields.split(',').every(function (f) { return (st.fields[f] || '').trim().length > 0; });
        if (ok && a.dataset.cards) ok = cardsOn() > 0;
      } else {
        var c = $('[data-check]', a);
        if (c.dataset.requiresTabs) {
          var t = tabsSeen(c.dataset.requiresTabs), unlocked = t.seen >= t.total;
          c.disabled = !unlocked;
          if (!unlocked) { c.checked = false; st.checks[c.dataset.check] = false; }
          var h = $('.gate-hint', a); if (h) h.textContent = unlocked ? '' : 'Buka semua komponen (' + t.seen + '/' + t.total + ') untuk mengaktifkan centang.';
        }
        ok = !!st.checks[c.dataset.check];
      }
      a.classList.toggle('is-done', ok);
      $('.status', a).textContent = ok ? 'Selesai ✓' : 'Belum selesai';
      if (ok) done++;
    });
    var cc = $('#cardCount'); if (cc) cc.textContent = 'Kartu terpilih: ' + cardsOn();
    steppers.forEach(function (x) { x.update(); });
    $$('.field').forEach(function (f) { f.classList.toggle('is-filled', ($('textarea', f).value || '').trim().length > 0); });

    var total = acts.length, pct = Math.round(done / total * 100), all = done === total;
    $('#progText').textContent = 'Progres Modul ' + M.id + ': ' + done + ' dari ' + total + ' aktivitas';
    $('#progPct').textContent = pct + '%';
    $('#progFill').style.width = pct + '%';
    $('#progBar').setAttribute('aria-valuenow', pct);

    var box = $('#complete'), btn = $('#doneBtn');
    if (!all && st.done) { st.done = false; persist(); }
    box.classList.toggle('is-done', st.done);
    btn.hidden = st.done; $('#undoBtn').hidden = !st.done;
    btn.disabled = !all;
    $('#completeTitle').textContent = st.done ? 'Modul ' + M.id + ' selesai 🎉' : 'Sudah menyelesaikan semuanya?';
    $('#completeHint').textContent = st.done ? M.doneText : (all ? 'Semua aktivitas sudah selesai. Tandai modul ini sebagai selesai.' : 'Selesaikan ' + (total - done) + ' aktivitas lagi untuk menandai modul ini selesai.');
    $$('[data-lock]').forEach(function (a) { a.setAttribute('aria-disabled', !st.done); });
    var nb = $('#nextModuleBtn'); if (nb) nb.hidden = !st.done;
    journey();
  }
  $('#doneBtn').addEventListener('click', function () { st.done = true; persist(); render(); $('#complete').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#undoBtn').addEventListener('click', function () { st.done = false; persist(); render(); });

  $$('[data-lock]').forEach(function (a) {
    a.addEventListener('click', function (e) { if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); setStatus('Selesaikan dan tandai modul ini dahulu untuk lanjut.'); } });
  });

  /* ---- Perjalanan modul ---- */
  var HREF = { m1: 'discover-your-hope.html', m2: 'set-goals-find-pathways.html', m3: 'build-your-agency.html', m4: 'my-hope-journey.html' };
  var NEED = { m2: 'm1', m3: 'm2', m4: 'm3' };
  function journey() {
    var state = { pre: !!read('hopespace_pretest') };
    for (var i = 1; i <= 4; i++) { var m = i === M.id ? st : read('hopespace_modul' + i); state['m' + i] = !!(m && m.done); }
    $$('.journey__step').forEach(function (s) {
      var k = s.dataset.step;
      s.classList.toggle('is-done', !!state[k]);
      if (state[k]) $('i', s).textContent = '✓';
      if (NEED[k] && !s.classList.contains('is-current')) {
        var open = !!state[NEED[k]];
        s.classList.toggle('is-locked', !open);
        if (open) s.setAttribute('href', HREF[k]); else s.removeAttribute('href');
      }
    });
  }

  /* ---- Pengingat isian dari modul lain ---- */
  $$('[data-recall]').forEach(function (el) { el.textContent = getVal(el.dataset.recall) || el.dataset.empty; });

  render();
  if (!persist()) setStatus('Penyimpanan browser tidak tersedia, isianmu tidak akan tersimpan.');
})();
