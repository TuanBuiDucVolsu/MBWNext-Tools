/**
 * MBWNext Dev Tools - inject.js
 * Chạy trong "world": "MAIN" nên có thể truy cập trực tiếp window.frappe, window.cur_frm
 * (giống như mở Console và gõ cur_frm.something).
 *
 * An toàn trên các site không phải Frappe: script tự kiểm tra window.frappe trước khi làm gì cả.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'mbwnext_tools_state_v1';

  const state = {
    showHidden: false,
    highlightCustom: false,
    inspect: false,
  };

  // ---------- Helpers ----------

  function isFrappeDesk() {
    return typeof window.frappe !== 'undefined' && !!window.frappe.boot;
  }

  function waitForFrappe(cb, tries) {
    tries = tries || 0;
    if (isFrappeDesk()) return cb();
    if (tries > 60) return; // ~30s, sau đó bỏ qua (không phải trang Frappe / load quá lâu)
    setTimeout(function () {
      waitForFrappe(cb, tries + 1);
    }, 500);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
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
    } catch (e) {
      /* fallthrough */
    }
    alert(message);
  }

  // ---------- CSS ----------

  function injectStyles() {
    if (document.getElementById('mbwnext-tools-style')) return;
    const style = document.createElement('style');
    style.id = 'mbwnext-tools-style';
    style.textContent = `
      .mbwnext-fab {
        position: fixed;
        bottom: 22px;
        right: 22px;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: #1a1a2e;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999998;
        box-shadow: 0 2px 10px rgba(0,0,0,.35);
        user-select: none;
      }
      .mbwnext-fab:hover { background: #2a2a4e; }
      .mbwnext-panel {
        position: fixed;
        bottom: 78px;
        right: 22px;
        width: 270px;
        background: #fff;
        border: 1px solid #d1d8dd;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,.25);
        z-index: 999998;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #1f2933;
        display: none;
        overflow: hidden;
      }
      .mbwnext-panel.open { display: block; }
      .mbwnext-panel-header {
        background: #2e7d32;
        color: #fff;
        padding: 9px 12px;
        font-weight: 600;
      }
      .mbwnext-panel-sub {
        padding: 6px 12px 0;
        font-size: 11px;
        color: #6b7785;
      }
      .mbwnext-panel-body { padding: 6px 12px 10px; }
      .mbwnext-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .mbwnext-row:last-child { border-bottom: none; }
      .mbwnext-row button {
        background: #f4f5f6;
        border: 1px solid #d1d8dd;
        border-radius: 4px;
        padding: 3px 10px;
        cursor: pointer;
        font-size: 12px;
        min-width: 52px;
      }
      .mbwnext-row button.active { background: #2e7d32; color: #fff; border-color: #2e7d32; }
      .mbwnext-field-hidden {
        display: block !important;
        opacity: 0.45 !important;
        border-left: 3px solid #e53935 !important;
      }
      .mbwnext-field-custom {
        border-left: 3px solid #1e88e5 !important;
      }
      .mbwnext-tooltip {
        position: fixed;
        z-index: 9999999;
        background: #1a1a2e;
        color: #e0e0e0;
        padding: 0;
        border-radius: 8px;
        font-size: 12px;
        max-width: 360px;
        min-width: 240px;
        line-height: 1.5;
        pointer-events: auto;
        box-shadow: 0 8px 30px rgba(0,0,0,.45);
        font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        display: none;
        overflow: hidden;
        user-select: text;
      }
      .mbwnext-tooltip-header {
        background: #2e7d32;
        color: #fff;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .mbwnext-tooltip-copy {
        background: rgba(255,255,255,.2);
        border: none;
        color: #fff;
        padding: 2px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .mbwnext-tooltip-copy:hover { background: rgba(255,255,255,.35); }
      .mbwnext-tooltip-close {
        background: none;
        border: none;
        color: rgba(255,255,255,.7);
        cursor: pointer;
        font-size: 16px;
        padding: 0 0 0 6px;
        line-height: 1;
      }
      .mbwnext-tooltip-close:hover { color: #fff; }
      .mbwnext-copy-fn {
        background: none;
        border: none;
        color: #8a8fa8;
        cursor: pointer;
        font-size: 13px;
        padding: 0 0 0 6px;
        vertical-align: middle;
        line-height: 1;
      }
      .mbwnext-copy-fn:hover { color: #ffd54f; }
      .mbwnext-tooltip-body { padding: 8px 12px 10px; }
      .mbwnext-tooltip-row {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }
      .mbwnext-tooltip-row:last-child { border-bottom: none; }
      .mbwnext-tooltip-key {
        color: #8a8fa8;
        margin-right: 12px;
        white-space: nowrap;
      }
      .mbwnext-tooltip-val {
        color: #ffd54f;
        text-align: right;
        word-break: break-word;
      }
      .mbwnext-tooltip-options {
        margin-top: 4px;
        padding: 6px 12px 8px;
        background: rgba(0,0,0,.2);
        border-top: 1px solid rgba(255,255,255,.08);
      }
      .mbwnext-tooltip-options-label {
        color: #8a8fa8;
        font-size: 11px;
        margin-bottom: 3px;
      }
      .mbwnext-tooltip-options-list {
        color: #b8c0e0;
        font-size: 11px;
        line-height: 1.6;
      }
      .mbwnext-tooltip-opt-item {
        padding: 1px 0;
      }
      .mbwnext-tooltip-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .mbwnext-badge-yes { background: #2e7d32; color: #fff; }
      .mbwnext-api-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.4);
        z-index: 9999990;
        display: none;
      }
      .mbwnext-api-overlay.open { display: flex; align-items: center; justify-content: center; }
      .mbwnext-api-dialog {
        background: #fff;
        border-radius: 10px;
        width: 520px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 12px 40px rgba(0,0,0,.35);
        font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      }
      .mbwnext-api-header {
        background: #1a1a2e;
        color: #fff;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .mbwnext-api-header button {
        background: none;
        border: none;
        color: rgba(255,255,255,.7);
        font-size: 20px;
        cursor: pointer;
        padding: 0;
      }
      .mbwnext-api-header button:hover { color: #fff; }
      .mbwnext-api-body { padding: 16px; }
      .mbwnext-api-body label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: #6b7785;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .mbwnext-api-body input,
      .mbwnext-api-body textarea {
        width: 100%;
        border: 1px solid #d1d8dd;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 13px;
        font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
        margin-bottom: 12px;
        box-sizing: border-box;
        outline: none;
      }
      .mbwnext-api-body input:focus,
      .mbwnext-api-body textarea:focus { border-color: #2e7d32; }
      .mbwnext-api-body textarea { resize: vertical; min-height: 60px; }
      .mbwnext-api-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      .mbwnext-api-actions button {
        padding: 7px 18px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
      }
      .mbwnext-api-run {
        background: #2e7d32;
        color: #fff;
      }
      .mbwnext-api-run:hover { background: #256428; }
      .mbwnext-api-run:disabled { background: #999; cursor: wait; }
      .mbwnext-api-copy-res {
        background: #f4f5f6;
        border: 1px solid #d1d8dd !important;
        color: #333;
      }
      .mbwnext-api-result {
        max-height: 300px;
        overflow: auto;
        border-top: 1px solid #eee;
        padding: 12px 16px;
        background: #1a1a2e;
        font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
        font-size: 12px;
        color: #e0e0e0;
        white-space: pre-wrap;
        word-break: break-word;
        display: none;
      }
      .mbwnext-api-result.has-data { display: block; }
      .mbwnext-api-error { color: #ef5350; }
      .mbwnext-badge-no { background: #444; color: #999; }
    `;
    document.head.appendChild(style);
  }

  // ---------- Field state scanning (hidden / custom field highlight) ----------

  function isCustomField(df) {
    return !!(df.is_custom_field || df.custom);
  }

  function applyFieldStates() {
    if (!window.cur_frm || !window.cur_frm.fields_dict) return;
    var meta = window.frappe.get_meta && window.frappe.get_meta(window.cur_frm.doctype);
    var customSet = null;
    if (meta && meta.fields) {
      customSet = new Set();
      meta.fields.forEach(function (f) {
        if (f.is_custom_field || f.custom) customSet.add(f.fieldname);
      });
    }

    var fields_dict = window.cur_frm.fields_dict;
    Object.keys(fields_dict).forEach(function (fieldname) {
      var field = fields_dict[fieldname];
      var el = getFieldDomEl(field);
      if (!el || !el.classList || !field.df) return;

      if (state.showHidden && field.df.hidden) {
        el.classList.add('mbwnext-field-hidden');
      } else {
        el.classList.remove('mbwnext-field-hidden');
      }

      var custom = isCustomField(field.df) || (customSet && customSet.has(fieldname));
      if (state.highlightCustom && custom) {
        el.classList.add('mbwnext-field-custom');
      } else {
        el.classList.remove('mbwnext-field-custom');
      }
    });
  }

  let pollTimer = null;
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(applyFieldStates, 700);
  }
  function stopPollingIfIdle() {
    if (!state.showHidden && !state.highlightCustom && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ---------- Inspect tooltip ----------

  let tooltipEl = null;
  let currentDf = null;

  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'mbwnext-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function badge(val) {
    return val
      ? '<span class="mbwnext-tooltip-badge mbwnext-badge-yes">Yes</span>'
      : '<span class="mbwnext-tooltip-badge mbwnext-badge-no">No</span>';
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function copyText(text, btnEl) {
    navigator.clipboard.writeText(text).then(function () {
      var orig = btnEl.textContent;
      btnEl.textContent = 'Copied!';
      setTimeout(function () { btnEl.textContent = orig; }, 1200);
    });
  }

  function buildTooltipContent(df) {
    var rows = [
      ['fieldtype', df.fieldtype],
    ];
    if (df.depends_on) rows.push(['depends_on', df.depends_on]);
    if (df.mandatory_depends_on) rows.push(['mandatory_depends_on', df.mandatory_depends_on]);
    if (df.read_only_depends_on) rows.push(['read_only_depends_on', df.read_only_depends_on]);

    var html = '<div class="mbwnext-tooltip-header">' +
      '<span>' + escHtml(df.label || df.fieldname) + '</span>' +
      '<span>' +
      '<button class="mbwnext-tooltip-copy" data-action="copy-all">Copy All</button>' +
      '<button class="mbwnext-tooltip-close" data-action="close">&times;</button>' +
      '</span>' +
      '</div>' +
      '<div class="mbwnext-tooltip-body">';

    html += '<div class="mbwnext-tooltip-row">' +
      '<span class="mbwnext-tooltip-key">fieldname</span>' +
      '<span class="mbwnext-tooltip-val">' + escHtml(df.fieldname) +
      '<button class="mbwnext-copy-fn" data-action="copy-fn" title="Copy fieldname">&#x2398;</button>' +
      '</span></div>';

    rows.forEach(function (r) {
      html += '<div class="mbwnext-tooltip-row">' +
        '<span class="mbwnext-tooltip-key">' + r[0] + '</span>' +
        '<span class="mbwnext-tooltip-val">' + escHtml(String(r[1])) + '</span>' +
        '</div>';
    });

    html += '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">hidden</span><span class="mbwnext-tooltip-val">' + badge(df.hidden) + '</span></div>';
    html += '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">mandatory</span><span class="mbwnext-tooltip-val">' + badge(df.reqd) + '</span></div>';
    html += '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">custom field</span><span class="mbwnext-tooltip-val">' + badge(isCustomField(df)) + '</span></div>';
    html += '</div>';

    if (df.options) {
      var opts = String(df.options).split('\n').filter(Boolean);
      html += '<div class="mbwnext-tooltip-options">' +
        '<div class="mbwnext-tooltip-options-label">options (' + opts.length + ')</div>' +
        '<div class="mbwnext-tooltip-options-list">' +
        opts.map(function (o) { return '<div class="mbwnext-tooltip-opt-item">' + escHtml(o) + '</div>'; }).join('') +
        '</div></div>';
    }

    return html;
  }

  function getPlainText(df) {
    var lines = [
      (df.label || df.fieldname),
      'fieldname: ' + df.fieldname,
      'fieldtype: ' + df.fieldtype,
    ];
    if (df.options) lines.push('options: ' + df.options);
    lines.push('hidden: ' + (df.hidden ? 'Yes' : 'No'));
    lines.push('mandatory: ' + (df.reqd ? 'Yes' : 'No'));
    lines.push('custom field: ' + (isCustomField(df) ? 'Yes' : 'No'));
    if (df.depends_on) lines.push('depends_on: ' + df.depends_on);
    if (df.mandatory_depends_on) lines.push('mandatory_depends_on: ' + df.mandatory_depends_on);
    if (df.read_only_depends_on) lines.push('read_only_depends_on: ' + df.read_only_depends_on);
    return lines.join('\n');
  }

  function positionTooltip(el, x, y) {
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.display = 'block';
    var rect = el.getBoundingClientRect();
    var pad = 14;
    var left = x + pad;
    var top = y + pad;
    if (left + rect.width > window.innerWidth - 10) left = x - rect.width - pad;
    if (top + rect.height > window.innerHeight - 10) top = y - rect.height - pad;
    el.style.left = Math.max(4, left) + 'px';
    el.style.top = Math.max(4, top) + 'px';
  }

  let pinned = false;

  function closeTooltip() {
    pinned = false;
    if (tooltipEl) tooltipEl.style.display = 'none';
    currentDf = null;
  }

  function showTooltip(x, y, df) {
    if (pinned) return;
    currentDf = df;
    var el = ensureTooltip();
    el.innerHTML = buildTooltipContent(df);
    positionTooltip(el, x, y);
  }

  function hideTooltip() {
    if (pinned) return;
    if (tooltipEl) tooltipEl.style.display = 'none';
    currentDf = null;
  }

  function pinTooltip() {
    pinned = true;
  }

  function setupInspectDelegation() {
    document.addEventListener('mouseover', function (e) {
      if (!state.inspect || !window.cur_frm || pinned) return;
      var wrapper = e.target.closest('[data-fieldname]');
      if (!wrapper) return;
      var fieldname = wrapper.getAttribute('data-fieldname');
      var field = window.cur_frm.fields_dict && window.cur_frm.fields_dict[fieldname];
      if (!field || !field.df) return;
      showTooltip(e.clientX, e.clientY, field.df);
    }, true);

    document.addEventListener('mousemove', function (e) {
      if (!state.inspect || pinned || !tooltipEl || tooltipEl.style.display !== 'block') return;
      positionTooltip(tooltipEl, e.clientX, e.clientY);
    }, true);

    document.addEventListener('mouseout', function (e) {
      if (!state.inspect || pinned) return;
      if (!e.target.closest('[data-fieldname]')) return;
      hideTooltip();
    }, true);

    document.addEventListener('click', function (e) {
      if (!state.inspect) return;

      if (e.target.closest('.mbwnext-tooltip')) {
        var actionEl = e.target.closest('[data-action]');
        var action = actionEl && actionEl.dataset.action;
        if (action === 'close') {
          closeTooltip();
        } else if (action === 'copy-fn' && currentDf) {
          copyText(currentDf.fieldname, actionEl);
        } else if (action === 'copy-all' && currentDf) {
          copyText(getPlainText(currentDf), actionEl);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (pinned) {
        closeTooltip();
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (currentDf) {
        e.preventDefault();
        e.stopPropagation();
        pinTooltip();
      }
    }, true);
  }

  // ---------- Customize Form shortcut ----------

  function openCustomizeForm() {
    if (!window.cur_frm) {
      notify('Không có form nào đang mở', 'red');
      return;
    }
    window.open('/app/customize-form?doc_type=' + encodeURIComponent(window.cur_frm.doctype), '_blank');
  }

  // ---------- Import CSV ----------

  function openImportCSV() {
    var dt = window.cur_frm && window.cur_frm.doctype;
    if (!dt) {
      var path = window.location.pathname;
      var match = path.match(/\/app\/([^/]+)/);
      if (match) {
        dt = match[1].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      }
    }
    if (!dt) {
      notify('Không xác định được DocType', 'red');
      return;
    }
    var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
    if (meta && meta.allow_import === 0) {
      notify(dt + ' không cho phép import', 'orange');
      return;
    }
    window.open('/app/data-import/new-data-import?reference_doctype=' + encodeURIComponent(dt), '_blank');
  }

  // ---------- Quick API Call ----------

  var apiOverlay = null;
  var apiResultEl = null;
  var lastApiResult = null;

  function openApiDialog() {
    if (apiOverlay) {
      apiOverlay.classList.add('open');
      return;
    }
    apiOverlay = document.createElement('div');
    apiOverlay.className = 'mbwnext-api-overlay open';
    apiOverlay.innerHTML =
      '<div class="mbwnext-api-dialog">' +
        '<div class="mbwnext-api-header"><span>Quick API Call</span><button data-action="close-api">&times;</button></div>' +
        '<div class="mbwnext-api-body">' +
          '<label>Method</label>' +
          '<input id="mbwnext-api-method" placeholder="frappe.client.get_list" />' +
          '<label>Args (JSON)</label>' +
          '<textarea id="mbwnext-api-args" placeholder=\'{"doctype": "Sales Order", "limit_page_length": 5}\'></textarea>' +
          '<div class="mbwnext-api-actions">' +
            '<button class="mbwnext-api-run" id="mbwnext-api-run">Run</button>' +
            '<button class="mbwnext-api-copy-res" id="mbwnext-api-copy-res" style="display:none">Copy Result</button>' +
          '</div>' +
        '</div>' +
        '<div class="mbwnext-api-result" id="mbwnext-api-result"></div>' +
      '</div>';
    document.body.appendChild(apiOverlay);

    apiResultEl = document.getElementById('mbwnext-api-result');
    var copyResBtn = document.getElementById('mbwnext-api-copy-res');

    apiOverlay.addEventListener('click', function (e) {
      if (e.target === apiOverlay || e.target.dataset.action === 'close-api') {
        apiOverlay.classList.remove('open');
      }
    });

    document.getElementById('mbwnext-api-run').addEventListener('click', function () {
      var method = document.getElementById('mbwnext-api-method').value.trim();
      if (!method) { notify('Nhập method', 'orange'); return; }
      var argsRaw = document.getElementById('mbwnext-api-args').value.trim();
      var args = {};
      if (argsRaw) {
        try { args = JSON.parse(argsRaw); }
        catch (e) { notify('JSON args không hợp lệ', 'red'); return; }
      }
      var runBtn = document.getElementById('mbwnext-api-run');
      runBtn.disabled = true;
      runBtn.textContent = 'Running...';
      apiResultEl.textContent = '';
      apiResultEl.classList.remove('has-data');
      copyResBtn.style.display = 'none';

      window.frappe.call({
        method: method,
        args: args,
        async: true,
        callback: function (r) {
          lastApiResult = JSON.stringify(r.message, null, 2);
          apiResultEl.textContent = lastApiResult;
          apiResultEl.classList.add('has-data');
          copyResBtn.style.display = '';
          runBtn.disabled = false;
          runBtn.textContent = 'Run';
        },
        error: function (err) {
          var msg = err.responseJSON ? JSON.stringify(err.responseJSON, null, 2) : String(err.statusText || err);
          apiResultEl.innerHTML = '<span class="mbwnext-api-error">' + escHtml(msg) + '</span>';
          apiResultEl.classList.add('has-data');
          lastApiResult = msg;
          copyResBtn.style.display = '';
          runBtn.disabled = false;
          runBtn.textContent = 'Run';
        }
      });
    });

    copyResBtn.addEventListener('click', function () {
      if (lastApiResult) {
        navigator.clipboard.writeText(lastApiResult).then(function () {
          copyResBtn.textContent = 'Copied!';
          setTimeout(function () { copyResBtn.textContent = 'Copy Result'; }, 1200);
        });
      }
    });
  }

  // ---------- UI ----------

  function setButtonState(btn, on) {
    btn.textContent = on ? 'ON' : 'OFF';
    btn.classList.toggle('active', on);
  }

  function buildUI() {
    if (document.getElementById('mbwnext-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'mbwnext-fab';
    fab.className = 'mbwnext-fab';
    fab.textContent = 'M';
    fab.style.cssText += 'color:#e53935;font-size:22px;font-weight:800;font-family:-apple-system,\"Segoe UI\",Roboto,sans-serif;';
    fab.title = 'MBWNext Dev Tools';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'mbwnext-panel';
    panel.className = 'mbwnext-panel';
    panel.innerHTML =
      '<div class="mbwnext-panel-header">MBWNext Dev Tools</div>' +
      '<div class="mbwnext-panel-sub">DocType hiện tại: <span id="mbwnext-doctype">-</span></div>' +
      '<div class="mbwnext-panel-body">' +
      '<div class="mbwnext-row"><span>Hiện field ẩn</span><button id="mbwnext-btn-hidden">OFF</button></div>' +
      '<div class="mbwnext-row"><span>Đánh dấu Custom Field</span><button id="mbwnext-btn-custom">OFF</button></div>' +
      '<div class="mbwnext-row"><span>Xem chi tiết field (hover)</span><button id="mbwnext-btn-inspect">OFF</button></div>' +
      '<div class="mbwnext-row"><span>Import CSV</span><button id="mbwnext-btn-import">Import</button></div>' +
      '<div class="mbwnext-row"><span>Quick API Call</span><button id="mbwnext-btn-api">Gọi</button></div>' +
      '<div class="mbwnext-row"><span>Customize Form</span><button id="mbwnext-btn-customize">Mở</button></div>' +
      '</div>';
    document.body.appendChild(panel);

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      var dtEl = document.getElementById('mbwnext-doctype');
      if (dtEl) dtEl.textContent = (window.cur_frm && window.cur_frm.doctype) || '-';
    });

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('click', function () {
      panel.classList.remove('open');
    });

    const btnHidden = document.getElementById('mbwnext-btn-hidden');
    btnHidden.addEventListener('click', function () {
      state.showHidden = !state.showHidden;
      setButtonState(btnHidden, state.showHidden);
      saveState();
      if (state.showHidden) {
        startPolling();
      } else {
        applyFieldStates();
        stopPollingIfIdle();
      }
    });

    const btnCustom = document.getElementById('mbwnext-btn-custom');
    btnCustom.addEventListener('click', function () {
      state.highlightCustom = !state.highlightCustom;
      setButtonState(btnCustom, state.highlightCustom);
      saveState();
      if (state.highlightCustom) {
        startPolling();
      } else {
        applyFieldStates();
        stopPollingIfIdle();
      }
    });

    const btnInspect = document.getElementById('mbwnext-btn-inspect');
    btnInspect.addEventListener('click', function () {
      state.inspect = !state.inspect;
      setButtonState(btnInspect, state.inspect);
      saveState();
      if (!state.inspect) hideTooltip();
    });

    document.getElementById('mbwnext-btn-import').addEventListener('click', openImportCSV);
    document.getElementById('mbwnext-btn-api').addEventListener('click', openApiDialog);
    document.getElementById('mbwnext-btn-customize').addEventListener('click', openCustomizeForm);

    // Khôi phục trạng thái đã lưu
    setButtonState(btnHidden, state.showHidden);
    setButtonState(btnCustom, state.highlightCustom);
    setButtonState(btnInspect, state.inspect);
    if (state.showHidden || state.highlightCustom) startPolling();
  }

  // ---------- Init ----------

  waitForFrappe(function () {
    loadState();
    injectStyles();
    buildUI();
    setupInspectDelegation();
  });
})();
