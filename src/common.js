/**
 * MBWNext Extensions - common.js
 * Hạ tầng dùng chung: state, helper, panel UI, polling engine.
 * Các file feature (dev-tools.js, trien-khai-tools.js) gọi MBWNext.register(...) để thêm nút.
 *
 * Chạy trong "world": "MAIN" nên truy cập trực tiếp window.frappe, window.cur_frm.
 * An toàn trên site không phải Frappe: tự kiểm tra window.frappe trước khi chạy.
 */
(function () {
  'use strict';

  if (window.MBWNext) return; // tránh khởi tạo 2 lần

  const STORAGE_KEY = 'mbwnext_tools_state_v1';
  const SECTION_ORDER = ['dev', 'trienkhai'];
  const SECTION_LABEL = { dev: 'Lập trình', trienkhai: 'Triển khai' };
  const SECTION_ICON = { dev: '&#60;/&#62;', trienkhai: '&#9881;' };

  const state = {};
  const features = [];   // { section, id, label, kind, stateKey, poll, scan, onToggle, buttonText, onClick }
  const scanners = [];   // scan(ctx) — chạy mỗi nhịp polling

  // ---------- Helpers ----------

  function isFrappeDesk() {
    return typeof window.frappe !== 'undefined' && !!window.frappe.boot;
  }

  function waitForFrappe(cb, tries) {
    tries = tries || 0;
    if (isFrappeDesk()) return cb();
    if (tries > 60) return; // ~30s rồi bỏ qua
    setTimeout(function () { waitForFrappe(cb, tries + 1); }, 500);
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }

  function getFieldDomEl(field) {
    if (!field) return null;
    if (field.$wrapper && field.$wrapper.length) return field.$wrapper[0];
    if (field.wrapper) return field.wrapper;
    return null;
  }

  function notify(message, indicator) {
    try {
      if (window.frappe && window.frappe.show_alert) {
        window.frappe.show_alert({ message: message, indicator: indicator || 'blue' });
        return;
      }
    } catch (e) { /* fallthrough */ }
    alert(message);
  }

  var _escDiv = null;
  function escHtml(str) {
    if (!_escDiv) _escDiv = document.createElement('div');
    _escDiv.textContent = str;
    return _escDiv.innerHTML;
  }

  function _fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      // Giữ ngoài viewport nhưng vẫn focus/select được
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('execCommand copy failed'));
    });
  }

  function copyText(text, btnEl, label) {
    // navigator.clipboard chỉ tồn tại trong secure context (HTTPS/localhost).
    // Site HTTP (vd mbw.com:8044) sẽ không có -> fallback execCommand.
    var p = (navigator.clipboard && navigator.clipboard.writeText)
      ? navigator.clipboard.writeText(text)
      : _fallbackCopy(text);
    return p.then(function () {
      if (btnEl) {
        var orig = btnEl.textContent;
        btnEl.textContent = label || 'Copied!';
        setTimeout(function () { btnEl.textContent = orig; }, 1200);
      }
    });
  }

  function addStyles(css) {
    var style = document.createElement('style');
    style.className = 'mbwnext-tools-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ---------- CSS (chỉ phần khung chung) ----------

  function injectBaseStyles() {
    addStyles(`
      .mbwnext-fab {
        position: fixed; bottom: 20px; right: 20px;
        width: 46px; height: 46px; border-radius: 50%;
        background: linear-gradient(135deg, #2a2a45, #131320);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 999998;
        box-shadow: 0 6px 20px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.2); user-select: none;
        color: #ff5252; font-size: 20px; font-weight: 800;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        transition: transform .18s ease, box-shadow .18s ease;
      }
      .mbwnext-fab:hover { transform: scale(1.08) translateY(-1px); box-shadow: 0 10px 28px rgba(0,0,0,.32), 0 3px 8px rgba(0,0,0,.24); }
      .mbwnext-fab:active { transform: scale(.96); }
      .mbwnext-fab-badge {
        position: absolute; top: -1px; right: -1px; width: 12px; height: 12px; border-radius: 50%;
        background: #43a047; border: 2px solid #fff; display: none;
      }
      .mbwnext-fab-badge.show { display: block; }
      .mbwnext-panel {
        position: fixed; bottom: 76px; right: 20px; width: 280px;
        background: #fff; border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.08); z-index: 999998;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 13px;
        color: #1f2933; display: flex; flex-direction: column; max-height: 80vh; overflow: hidden;
        border: 1px solid rgba(0,0,0,.06);
        opacity: 0; visibility: hidden; pointer-events: none;
        transform: translateY(10px) scale(.98); transform-origin: bottom right;
        transition: opacity .16s ease, transform .16s ease, visibility 0s linear .16s;
      }
      .mbwnext-panel.open {
        opacity: 1; visibility: visible; pointer-events: auto;
        transform: translateY(0) scale(1);
        transition: opacity .16s ease, transform .16s ease;
      }
      .mbwnext-panel-header {
        background: linear-gradient(135deg, #2e7d32, #1b5e20); color: #fff; padding: 12px 16px; font-weight: 700; font-size: 14px;
        border-radius: 16px 16px 0 0; letter-spacing: .2px; flex-shrink: 0;
        display: flex; justify-content: space-between; align-items: center;
      }
      .mbwnext-help-btn {
        width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.6);
        background: none; color: rgba(255,255,255,.8); font-size: 13px; font-weight: 800;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-family: Georgia, serif; transition: all .15s; line-height: 1; padding: 0;
      }
      .mbwnext-help-btn:hover { background: rgba(255,255,255,.2); color: #fff; border-color: #fff; }
      .mbwnext-panel-sub { padding: 10px 14px 0; font-size: 12px; color: #6b7785; font-weight: 600; flex-shrink: 0; }
      .mbwnext-panel-sub b { color: #1f2933; font-weight: 700; }
      .mbwnext-panel-search { padding: 8px 14px; flex-shrink: 0; }
      .mbwnext-panel-search input {
        width: 100%; box-sizing: border-box; border: 1px solid #e2e6ea; border-radius: 8px;
        padding: 7px 10px; font-size: 12.5px; outline: none; background: #f7f8fa;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        transition: border-color .12s ease, background .12s ease;
      }
      .mbwnext-panel-search input:focus { border-color: #2e7d32; background: #fff; }
      .mbwnext-panel-body { padding: 2px 14px 12px; overflow-y: auto; }
      .mbwnext-section-label {
        font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px;
        color: #6b7785; margin: 12px 0 4px; padding: 6px 0 4px;
        border-top: 1px solid #eef0f2;
        display: flex; align-items: center; gap: 5px;
      }
      .mbwnext-section-label:first-child { border-top: none; margin-top: 6px; }
      .mbwnext-section-icon { font-size: 12px; opacity: .7; }
      .mbwnext-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 7px 0; transition: opacity .1s ease;
      }
      .mbwnext-row span { font-size: 13px; color: #1f2933; font-weight: 600; line-height: 1.3; }
      .mbwnext-row + .mbwnext-row { border-top: 1px solid #f5f6f7; }
      .mbwnext-btn {
        background: #f5f6f8; border: 1px solid #e2e6ea; border-radius: 8px;
        padding: 5px 14px; cursor: pointer; font-size: 11px; min-width: 50px;
        font-weight: 700; color: #374151; transition: all .12s;
      }
      .mbwnext-btn:hover { background: #eef0f2; border-color: #c9ced4; }
      .mbwnext-switch {
        position: relative; width: 38px; height: 21px; border-radius: 999px; flex-shrink: 0;
        background: #d7dbe0; border: none; cursor: pointer; padding: 0;
        transition: background .18s ease;
      }
      .mbwnext-switch .mbwnext-switch-knob {
        position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: 50%;
        background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3);
        transition: transform .18s ease;
      }
      .mbwnext-switch.on { background: #2e7d32; }
      .mbwnext-switch.on .mbwnext-switch-knob { transform: translateX(17px); }
      .mbwnext-switch:hover { background: #c5cad1; }
      .mbwnext-switch.on:hover { background: #256428; }

      /* button/input/select/textarea không tự kế thừa font-family từ thẻ cha (khác div/span),
         nên phải khai lại tường minh để đồng bộ với phần chữ còn lại của panel/modal/tooltip.
         Trừ .mbwnext-help-btn (cố tình dùng Georgia serif cho icon "!"). */
      .mbwnext-panel button:not(.mbwnext-help-btn), .mbwnext-panel input, .mbwnext-panel select, .mbwnext-panel textarea,
      .mbwnext-modal button, .mbwnext-modal input, .mbwnext-modal select, .mbwnext-modal textarea,
      .mbwnext-tooltip button, .mbwnext-tooltip input, .mbwnext-tooltip select, .mbwnext-tooltip textarea,
      .mbwnext-api-overlay button, .mbwnext-api-overlay input, .mbwnext-api-overlay select, .mbwnext-api-overlay textarea {
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      }

      .mbwnext-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.42); z-index: 9999990;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(1.5px);
      }
      .mbwnext-modal {
        background: #fff; border-radius: 16px; width: 560px; max-width: 92vw; max-height: 82vh;
        display: flex; flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,.28); overflow: hidden;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        animation: mbwnextModalIn .16s ease;
      }
      @keyframes mbwnextModalIn {
        from { opacity: 0; transform: translateY(8px) scale(.97); }
        to { opacity: 1; transform: none; }
      }
      .mbwnext-modal-header {
        background: linear-gradient(135deg, #2e7d32, #1b5e20); color: #fff; padding: 14px 18px; font-weight: 600; font-size: 14px;
        display: flex; justify-content: space-between; align-items: center;
      }
      .mbwnext-modal-header button { background: none; border: none; color: rgba(255,255,255,.7); font-size: 22px; cursor: pointer; padding: 0; line-height: 1; transition: color .1s; }
      .mbwnext-modal-header button:hover { color: #fff; }
      .mbwnext-modal-body { padding: 18px; overflow: auto; font-size: 13px; color: #1f2933; }
      .mbwnext-modal-body table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .mbwnext-modal-body th, .mbwnext-modal-body td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f0f1f3; vertical-align: top; }
      .mbwnext-modal-body th { color: #6b7785; font-weight: 600; background: #f8f9fb; position: sticky; top: 0; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
      .mbwnext-modal-body tr:hover td { background: #f8f9fb; }
      .mbwnext-modal-body .mbwnext-empty { color: #9aa5b1; padding: 8px 0; font-style: italic; font-size: 12px; }
      .mbwnext-modal-pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
      .mbwnext-modal-wide { width: 680px; max-width: 95vw; }
      .mbwnext-help-note {
        font-size: 13px; color: #6b7785; margin-bottom: 16px; padding: 10px 12px;
        background: #f8f9fb; border-radius: 6px; line-height: 1.6;
      }
      .mbwnext-help-section { margin-bottom: 18px; }
      .mbwnext-help-section:last-of-type { margin-bottom: 0; }
      .mbwnext-help-section-title {
        font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
        color: #2e7d32; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e8f5e9;
        display: flex; align-items: center; gap: 6px;
      }
      .mbwnext-help-item { margin-bottom: 14px; }
      .mbwnext-help-item:last-child { margin-bottom: 0; }
      .mbwnext-help-item-name { font-weight: 700; font-size: 16px; color: #1f2933; margin-bottom: 4px; }
      .mbwnext-help-item-desc { font-size: 14px; color: #4a5568; line-height: 1.6; }
      .mbwnext-help-item-kind {
        display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 4px;
        font-size: 12px; font-weight: 700; background: #eef1f5; color: #6b7785;
      }
      .mbwnext-help-footer {
        font-size: 16px; color: #6b7785; border-top: 1px solid #eef0f2;
        padding-top: 14px; margin-top: 16px; font-weight: 700; text-align: center;
      }
    `);
  }

  // ---------- Polling engine ----------

  function buildCtx() {
    var curFrm = window.cur_frm;
    var doctype = curFrm && curFrm.doctype;
    var meta = (doctype && window.frappe.get_meta) ? window.frappe.get_meta(doctype) : null;
    var customSet = null;
    return {
      curFrm: curFrm,
      doctype: doctype,
      meta: meta,
      isCustom: function (fieldname, df) {
        if (df && (df.is_custom_field || df.custom)) return true;
        if (!meta || !meta.fields) return false;
        if (!customSet) {
          customSet = new Set();
          meta.fields.forEach(function (f) { if (f.is_custom_field || f.custom) customSet.add(f.fieldname); });
        }
        return customSet.has(fieldname);
      },
      eachField: function (cb) {
        if (!curFrm || !curFrm.fields_dict) return;
        var fd = curFrm.fields_dict;
        Object.keys(fd).forEach(function (fn) {
          var field = fd[fn];
          var el = getFieldDomEl(field);
          if (!el || !el.classList || !field.df) return;
          cb(el, field, fn);
        });
      }
    };
  }

  function runScans() {
    var ctx = buildCtx();
    scanners.forEach(function (s) {
      try { s(ctx); } catch (e) { console.error('[MBWNext] scan lỗi:', e); }
    });
  }

  let pollTimer = null;
  function shouldPoll() {
    return features.some(function (f) {
      return f.kind === 'toggle' && f.poll && state[f.stateKey];
    });
  }
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(runScans, 1000);
  }
  function refreshPolling() {
    if (shouldPoll()) {
      startPolling();
    } else if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ---------- Registration ----------

  function register(feature) {
    if (feature.kind === 'toggle' && feature.stateKey && state[feature.stateKey] === undefined) {
      state[feature.stateKey] = false;
    }
    features.push(feature);
    if (typeof feature.scan === 'function') scanners.push(feature.scan);
  }

  function onScan(fn) { if (typeof fn === 'function') scanners.push(fn); }

  // ---------- Modal dùng chung ----------

  function closeModal() {
    var o = document.getElementById('mbwnext-modal-overlay');
    if (o) o.remove();
  }

  // Mở modal, trả về phần tử body để caller cập nhật nội dung (kể cả async)
  function showModal(title) {
    closeModal();
    var overlay = document.createElement('div');
    overlay.id = 'mbwnext-modal-overlay';
    overlay.className = 'mbwnext-modal-overlay';
    overlay.innerHTML =
      '<div class="mbwnext-modal">' +
        '<div class="mbwnext-modal-header"><span>' + escHtml(title) + '</span>' +
        '<button data-action="close-modal">&times;</button></div>' +
        '<div class="mbwnext-modal-body">Đang tải…</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || (e.target.dataset && e.target.dataset.action === 'close-modal')) closeModal();
    });
    return overlay.querySelector('.mbwnext-modal-body');
  }

  // ---------- UI ----------

  function setButtonState(btn, on) {
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function updateFabBadge() {
    var badge = document.getElementById('mbwnext-fab-badge');
    if (!badge) return;
    var anyOn = features.some(function (f) { return f.kind === 'toggle' && state[f.stateKey]; });
    badge.classList.toggle('show', anyOn);
  }

  // Lọc danh sách tính năng theo từ khoá, ẩn luôn section rỗng
  function filterFeatureRows(panel, query) {
    var q = query.trim().toLowerCase();
    var sections = panel.querySelectorAll('.mbwnext-section-label');
    panel.querySelectorAll('.mbwnext-row').forEach(function (row) {
      var match = !q || (row.dataset.label || '').indexOf(q) >= 0;
      row.style.display = match ? '' : 'none';
    });
    sections.forEach(function (sec) {
      var hasVisible = false;
      var next = sec.nextElementSibling;
      while (next && !next.classList.contains('mbwnext-section-label')) {
        if (next.classList.contains('mbwnext-row') && next.style.display !== 'none') hasVisible = true;
        next = next.nextElementSibling;
      }
      sec.style.display = hasVisible ? '' : 'none';
    });
  }

  function buildUI() {
    if (document.getElementById('mbwnext-fab')) return;

    var fab = document.createElement('div');
    fab.id = 'mbwnext-fab';
    fab.className = 'mbwnext-fab';
    fab.innerHTML = 'M<span class="mbwnext-fab-badge" id="mbwnext-fab-badge"></span>';
    fab.title = 'MBWNext Extensions';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.id = 'mbwnext-panel';
    panel.className = 'mbwnext-panel';

    var html = '<div class="mbwnext-panel-header"><span>MBWNext Extensions</span><button class="mbwnext-help-btn" id="mbwnext-help-btn" title="Xem hướng dẫn tính năng">!</button></div>' +
      '<div class="mbwnext-panel-sub"><span id="mbwnext-doctype">-</span></div>' +
      '<div class="mbwnext-panel-search"><input type="text" id="mbwnext-search" placeholder="Tìm tính năng…" autocomplete="off" /></div>' +
      '<div class="mbwnext-panel-body">';

    SECTION_ORDER.forEach(function (sec) {
      var list = features.filter(function (f) { return (f.section || 'dev') === sec; });
      if (!list.length) return;
      var icon = SECTION_ICON[sec] || '';
      html += '<div class="mbwnext-section-label"><span class="mbwnext-section-icon">' + icon + '</span> ' + escHtml(SECTION_LABEL[sec] || sec) + '</div>';
      list.forEach(function (f) {
        var control = f.kind === 'toggle'
          ? '<button class="mbwnext-switch" data-feature="' + f.id + '" role="switch" aria-checked="false"><span class="mbwnext-switch-knob"></span></button>'
          : '<button class="mbwnext-btn" data-feature="' + f.id + '">' + escHtml(f.buttonText || 'Run') + '</button>';
        html += '<div class="mbwnext-row" data-label="' + escHtml(f.label.toLowerCase()) + '"><span>' + escHtml(f.label) + '</span>' + control + '</div>';
      });
    });
    html += '</div>';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    var searchInput = document.getElementById('mbwnext-search');
    searchInput.addEventListener('input', function () { filterFeatureRows(panel, searchInput.value); });

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      var dtEl = document.getElementById('mbwnext-doctype');
      if (dtEl) dtEl.textContent = (window.cur_frm && window.cur_frm.doctype) || '-';
      if (panel.classList.contains('open')) setTimeout(function () { searchInput.focus(); }, 160);
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { panel.classList.remove('open'); });

    document.getElementById('mbwnext-help-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      openHelpModal();
    });

    // Wire từng feature
    features.forEach(function (f) {
      var btn = panel.querySelector('[data-feature="' + f.id + '"]');
      if (!btn) return;

      if (f.kind === 'toggle') {
        setButtonState(btn, !!state[f.stateKey]);
        btn.addEventListener('click', function () {
          state[f.stateKey] = !state[f.stateKey];
          setButtonState(btn, state[f.stateKey]);
          saveState();
          if (typeof f.onToggle === 'function') f.onToggle(state[f.stateKey]);
          // chạy 1 nhịp ngay để áp/gỡ hiệu ứng, rồi bật/tắt polling
          runScans();
          refreshPolling();
          updateFabBadge();
        });
      } else {
        btn.addEventListener('click', function () {
          try { f.onClick(btn); } catch (e) { console.error('[MBWNext]', e); }
        });
      }
    });

    refreshPolling();
    updateFabBadge();
  }

  // ---------- Help modal (sinh từ features[].helpDesc) ----------

  function openHelpModal() {
    var body = showModal('Hướng dẫn tính năng — MBWNext Extensions');
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    var html = '<div class="mbwnext-help-note">Các nút <b>Toggle (ON/OFF)</b> tự lưu trạng thái trên trình duyệt. Nút hành động chạy ngay khi bấm.</div>';
    var hasItems = false;

    SECTION_ORDER.forEach(function (sec) {
      var list = features.filter(function (f) {
        return (f.section || 'dev') === sec && f.helpDesc;
      });
      if (!list.length) return;
      hasItems = true;
      html += '<div class="mbwnext-help-section">';
      html += '<div class="mbwnext-help-section-title"><span class="mbwnext-section-icon">' +
        (SECTION_ICON[sec] || '') + '</span> ' + escHtml(SECTION_LABEL[sec] || sec) + '</div>';
      list.forEach(function (f) {
        var kindLabel = f.kind === 'toggle' ? 'Toggle' : ('Nút ' + (f.buttonText || 'Run'));
        html += '<div class="mbwnext-help-item">' +
          '<div class="mbwnext-help-item-name">' + escHtml(f.label) + '</div>' +
          '<div class="mbwnext-help-item-desc">' + escHtml(f.helpDesc) + '</div>' +
          '<span class="mbwnext-help-item-kind">' + escHtml(kindLabel) + '</span>' +
          '</div>';
      });
      html += '</div>';
    });

    if (!hasItems) html += '<div class="mbwnext-empty">Chưa có mô tả tính năng.</div>';
    html += '<div class="mbwnext-help-footer">Made By TuanBD</div>';
    body.innerHTML = html;
  }

  // ---------- Expose API ----------

  window.MBWNext = {
    state: state,
    register: register,
    onScan: onScan,
    // helpers cho các file feature dùng chung
    notify: notify,
    escHtml: escHtml,
    copyText: copyText,
    addStyles: addStyles,
    getFieldDomEl: getFieldDomEl,
    refreshPolling: refreshPolling,
    runScans: runScans,
    showModal: showModal,
    closeModal: closeModal,
  };

  // ---------- Init ----------

  waitForFrappe(function () {
    // setTimeout(0): đảm bảo dev-tools.js / trien-khai-tools.js đã register xong
    setTimeout(function () {
      loadState();
      injectBaseStyles();
      buildUI();
    }, 0);
  });
})();
