/**
 * MBWNext Dev Tools - common.js
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

  function copyText(text, btnEl, label) {
    return navigator.clipboard.writeText(text).then(function () {
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
        width: 42px; height: 42px; border-radius: 50%;
        background: #1a1a2e; display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 999998;
        box-shadow: 0 3px 12px rgba(0,0,0,.3); user-select: none;
        color: #e53935; font-size: 20px; font-weight: 800;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        transition: transform .15s, box-shadow .15s;
      }
      .mbwnext-fab:hover { transform: scale(1.1); box-shadow: 0 4px 16px rgba(0,0,0,.4); }
      .mbwnext-panel {
        position: fixed; bottom: 72px; right: 20px; width: 260px;
        background: #fff; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,.18); z-index: 999998;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 13px;
        color: #1f2933; display: none; max-height: 80vh; overflow: hidden;
        border: 1px solid rgba(0,0,0,.08);
      }
      .mbwnext-panel.open { display: flex; flex-direction: column; }
      .mbwnext-panel-header {
        background: #2e7d32; color: #fff; padding: 10px 14px; font-weight: 700; font-size: 14px;
        border-radius: 12px 12px 0 0; letter-spacing: .2px;
      }
      .mbwnext-panel-sub { padding: 8px 14px 0; font-size: 12px; color: #6b7785; font-weight: 600; }
      .mbwnext-panel-sub b { color: #1f2933; font-weight: 700; }
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
        padding: 7px 0;
      }
      .mbwnext-row span { font-size: 13px; color: #1f2933; font-weight: 600; line-height: 1.3; }
      .mbwnext-row + .mbwnext-row { border-top: 1px solid #f5f6f7; }
      .mbwnext-row button {
        background: #f5f6f8; border: 1px solid #e2e6ea; border-radius: 6px;
        padding: 4px 12px; cursor: pointer; font-size: 11px; min-width: 50px;
        font-weight: 700; color: #374151; transition: all .12s;
      }
      .mbwnext-row button:hover { background: #e8eaed; border-color: #d1d5db; }
      .mbwnext-row button.active {
        background: #2e7d32; color: #fff; border-color: #2e7d32; font-weight: 700;
      }
      .mbwnext-row button.active:hover { background: #256428; }

      .mbwnext-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 9999990;
        display: flex; align-items: center; justify-content: center;
      }
      .mbwnext-modal {
        background: #fff; border-radius: 14px; width: 560px; max-width: 92vw; max-height: 82vh;
        display: flex; flex-direction: column;
        box-shadow: 0 16px 48px rgba(0,0,0,.25); overflow: hidden;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .mbwnext-modal-header {
        background: #2e7d32; color: #fff; padding: 14px 18px; font-weight: 600; font-size: 14px;
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
    btn.textContent = on ? 'ON' : 'OFF';
    btn.classList.toggle('active', on);
  }

  function buildUI() {
    if (document.getElementById('mbwnext-fab')) return;

    var fab = document.createElement('div');
    fab.id = 'mbwnext-fab';
    fab.className = 'mbwnext-fab';
    fab.textContent = 'M';
    fab.title = 'MBWNext Dev Tools';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.id = 'mbwnext-panel';
    panel.className = 'mbwnext-panel';

    var html = '<div class="mbwnext-panel-header">MBWNext Dev Tools</div>' +
      '<div class="mbwnext-panel-sub"><span id="mbwnext-doctype">-</span></div>' +
      '<div class="mbwnext-panel-body">';

    SECTION_ORDER.forEach(function (sec) {
      var list = features.filter(function (f) { return (f.section || 'dev') === sec; });
      if (!list.length) return;
      var icon = SECTION_ICON[sec] || '';
      html += '<div class="mbwnext-section-label"><span class="mbwnext-section-icon">' + icon + '</span> ' + escHtml(SECTION_LABEL[sec] || sec) + '</div>';
      list.forEach(function (f) {
        var btnText = f.kind === 'toggle' ? 'OFF' : (f.buttonText || 'Run');
        html += '<div class="mbwnext-row"><span>' + escHtml(f.label) + '</span>' +
          '<button data-feature="' + f.id + '">' + escHtml(btnText) + '</button></div>';
      });
    });
    html += '</div>';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      var dtEl = document.getElementById('mbwnext-doctype');
      if (dtEl) dtEl.textContent = (window.cur_frm && window.cur_frm.doctype) || '-';
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { panel.classList.remove('open'); });

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
        });
      } else {
        btn.addEventListener('click', function () {
          try { f.onClick(btn); } catch (e) { console.error('[MBWNext]', e); }
        });
      }
    });

    refreshPolling();
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
