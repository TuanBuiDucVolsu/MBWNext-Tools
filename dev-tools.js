/**
 * MBWNext Dev Tools - dev-tools.js
 * Tính năng cho lập trình viên: hiện field ẩn, đánh dấu custom field, inspect field (tooltip),
 * hiện fieldname, copy doc JSON, Quick API Call, mở Customize Form.
 *
 * Phụ thuộc common.js (window.MBWNext). Đăng ký nút vào section 'dev'.
 */
(function () {
  'use strict';

  var M = window.MBWNext;
  if (!M) { console.error('[MBWNext] common.js chưa load'); return; }
  var state = M.state;

  // ---------- CSS riêng ----------

  M.addStyles(`
    .mbwnext-field-hidden { display: block !important; opacity: 0.45 !important; border-left: 3px solid #e53935 !important; }
    .mbwnext-field-custom { border-left: 3px solid #1e88e5 !important; }
    .mbwnext-fieldname-tag {
      display: inline-block; background: #eef1f5; color: #5a6573;
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace; font-size: 10px;
      padding: 0 5px; border-radius: 3px; margin-left: 6px; vertical-align: middle;
      cursor: pointer; border: 1px solid #dde2e8; user-select: all;
    }
    .mbwnext-fieldname-tag:hover { background: #2e7d32; color: #fff; border-color: #2e7d32; }
    .mbwnext-tooltip {
      position: fixed; z-index: 9999999; background: #1a1a2e; color: #e0e0e0; padding: 0;
      border-radius: 8px; font-size: 12px; max-width: 360px; min-width: 240px; line-height: 1.5;
      pointer-events: auto; box-shadow: 0 8px 30px rgba(0,0,0,.45);
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; display: none; overflow: hidden; user-select: text;
    }
    .mbwnext-tooltip-header {
      background: #2e7d32; color: #fff; padding: 8px 12px; font-weight: 600; font-size: 13px;
      display: flex; align-items: center; justify-content: space-between;
      font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .mbwnext-tooltip-copy {
      background: rgba(255,255,255,.2); border: none; color: #fff; padding: 2px 8px;
      border-radius: 4px; cursor: pointer; font-size: 11px; font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .mbwnext-tooltip-copy:hover { background: rgba(255,255,255,.35); }
    .mbwnext-tooltip-close { background: none; border: none; color: rgba(255,255,255,.7); cursor: pointer; font-size: 16px; padding: 0 0 0 6px; line-height: 1; }
    .mbwnext-tooltip-close:hover { color: #fff; }
    .mbwnext-copy-fn { background: none; border: none; color: #8a8fa8; cursor: pointer; font-size: 13px; padding: 0 0 0 6px; vertical-align: middle; line-height: 1; }
    .mbwnext-copy-fn:hover { color: #ffd54f; }
    .mbwnext-tooltip-body { padding: 8px 12px 10px; }
    .mbwnext-tooltip-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
    .mbwnext-tooltip-row:last-child { border-bottom: none; }
    .mbwnext-tooltip-key { color: #8a8fa8; margin-right: 12px; white-space: nowrap; }
    .mbwnext-tooltip-val { color: #ffd54f; text-align: right; word-break: break-word; }
    .mbwnext-tooltip-options { margin-top: 4px; padding: 6px 12px 8px; background: rgba(0,0,0,.2); border-top: 1px solid rgba(255,255,255,.08); }
    .mbwnext-tooltip-options-label { color: #8a8fa8; font-size: 11px; margin-bottom: 3px; }
    .mbwnext-tooltip-options-list { color: #b8c0e0; font-size: 11px; line-height: 1.6; }
    .mbwnext-tooltip-opt-item { padding: 1px 0; }
    .mbwnext-tooltip-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
    .mbwnext-badge-yes { background: #2e7d32; color: #fff; }
    .mbwnext-badge-no { background: #444; color: #999; }
    .mbwnext-api-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 9999990; display: none; }
    .mbwnext-api-overlay.open { display: flex; align-items: center; justify-content: center; }
    .mbwnext-api-dialog { background: #fff; border-radius: 10px; width: 520px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,.35); font-family: -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    .mbwnext-api-header { background: #1a1a2e; color: #fff; padding: 12px 16px; font-weight: 600; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .mbwnext-api-header button { background: none; border: none; color: rgba(255,255,255,.7); font-size: 20px; cursor: pointer; padding: 0; }
    .mbwnext-api-header button:hover { color: #fff; }
    .mbwnext-api-body { padding: 16px; }
    .mbwnext-api-body label { display: block; font-size: 11px; font-weight: 600; color: #6b7785; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .mbwnext-api-body input, .mbwnext-api-body textarea {
      width: 100%; border: 1px solid #d1d8dd; border-radius: 6px; padding: 8px 10px; font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace; margin-bottom: 12px; box-sizing: border-box; outline: none;
    }
    .mbwnext-api-body input:focus, .mbwnext-api-body textarea:focus { border-color: #2e7d32; }
    .mbwnext-api-body textarea { resize: vertical; min-height: 60px; }
    .mbwnext-api-actions { display: flex; gap: 8px; margin-top: 4px; }
    .mbwnext-api-actions button { padding: 7px 18px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
    .mbwnext-api-run { background: #2e7d32; color: #fff; }
    .mbwnext-api-run:hover { background: #256428; }
    .mbwnext-api-run:disabled { background: #999; cursor: wait; }
    .mbwnext-api-copy-res { background: #f4f5f6; border: 1px solid #d1d8dd !important; color: #333; }
    .mbwnext-api-result { max-height: 300px; overflow: auto; border-top: 1px solid #eee; padding: 12px 16px; background: #1a1a2e; font-family: 'SF Mono', 'Fira Code', Consolas, monospace; font-size: 12px; color: #e0e0e0; white-space: pre-wrap; word-break: break-word; display: none; }
    .mbwnext-api-result.has-data { display: block; }
    .mbwnext-api-error { color: #ef5350; }
  `);

  // ---------- Scanners (chạy mỗi nhịp polling) ----------

  function scanHidden(ctx) {
    ctx.eachField(function (el, field) {
      var want = !!(state.showHidden && field.df.hidden);
      var has = el.classList.contains('mbwnext-field-hidden');
      if (want && !has) el.classList.add('mbwnext-field-hidden');
      else if (!want && has) el.classList.remove('mbwnext-field-hidden');
    });
  }

  function scanCustom(ctx) {
    ctx.eachField(function (el, field, fn) {
      var want = !!(state.highlightCustom && ctx.isCustom(fn, field.df));
      var has = el.classList.contains('mbwnext-field-custom');
      if (want && !has) el.classList.add('mbwnext-field-custom');
      else if (!want && has) el.classList.remove('mbwnext-field-custom');
    });
  }

  // Quét thẳng DOM theo [data-fieldname] -> bao phủ cả form cha, bảng con (grid detail), dialog
  var _fieldnamesDoctype = null;
  function scanFieldnames(ctx) {
    if (!state.showFieldnames) {
      document.querySelectorAll('.mbwnext-fieldname-tag').forEach(function (t) { t.remove(); });
      _fieldnamesDoctype = null;
      return;
    }
    // Khi đổi DocType, xóa hết tag cũ tránh hiển thị fieldname sai
    if (ctx && ctx.doctype && ctx.doctype !== _fieldnamesDoctype) {
      document.querySelectorAll('.mbwnext-fieldname-tag').forEach(function (t) { t.remove(); });
      _fieldnamesDoctype = ctx.doctype;
    }
    document.querySelectorAll('.frappe-control[data-fieldname]').forEach(function (el) {
      var fieldname = el.getAttribute('data-fieldname');
      if (!fieldname) return;
      var labelEl = el.querySelector(':scope > .clearfix > .control-label, :scope > .control-label, :scope > label');
      if (!labelEl) labelEl = el.querySelector('.control-label, label');
      if (!labelEl) return;
      if (labelEl.querySelector('.mbwnext-fieldname-tag')) return;
      var tag = document.createElement('span');
      tag.className = 'mbwnext-fieldname-tag';
      tag.textContent = fieldname;
      tag.title = 'Click để copy fieldname';
      labelEl.appendChild(tag);
    });
  }

  // ---------- Inspect tooltip ----------

  function isCustomField(df) { return !!(df.is_custom_field || df.custom); }

  var tooltipEl = null;
  var currentDf = null;
  var pinned = false;
  var _tooltipCacheKey = null;
  var _tooltipCacheHtml = null;

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

  function buildTooltipContent(df) {
    var cacheKey = (window.cur_frm ? window.cur_frm.doctype : '') + '.' + df.fieldname;
    if (_tooltipCacheKey === cacheKey) return _tooltipCacheHtml;

    var rows = [['fieldtype', df.fieldtype]];
    if (df.depends_on) rows.push(['depends_on', df.depends_on]);
    if (df.mandatory_depends_on) rows.push(['mandatory_depends_on', df.mandatory_depends_on]);
    if (df.read_only_depends_on) rows.push(['read_only_depends_on', df.read_only_depends_on]);

    var html = '<div class="mbwnext-tooltip-header">' +
      '<span>' + M.escHtml(df.label || df.fieldname) + '</span>' +
      '<span>' +
      '<button class="mbwnext-tooltip-copy" data-action="copy-all">Copy All</button>' +
      '<button class="mbwnext-tooltip-close" data-action="close">&times;</button>' +
      '</span></div>' +
      '<div class="mbwnext-tooltip-body">';

    html += '<div class="mbwnext-tooltip-row">' +
      '<span class="mbwnext-tooltip-key">fieldname</span>' +
      '<span class="mbwnext-tooltip-val">' + M.escHtml(df.fieldname) +
      '<button class="mbwnext-copy-fn" data-action="copy-fn" title="Copy fieldname">&#x2398;</button>' +
      '</span></div>';

    rows.forEach(function (r) {
      html += '<div class="mbwnext-tooltip-row">' +
        '<span class="mbwnext-tooltip-key">' + r[0] + '</span>' +
        '<span class="mbwnext-tooltip-val">' + M.escHtml(String(r[1])) + '</span></div>';
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
        opts.map(function (o) { return '<div class="mbwnext-tooltip-opt-item">' + M.escHtml(o) + '</div>'; }).join('') +
        '</div></div>';
    }
    _tooltipCacheKey = cacheKey;
    _tooltipCacheHtml = html;
    return html;
  }

  function getPlainText(df) {
    var lines = [(df.label || df.fieldname), 'fieldname: ' + df.fieldname, 'fieldtype: ' + df.fieldtype];
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
    el.style.left = '0px'; el.style.top = '0px'; el.style.display = 'block';
    var rect = el.getBoundingClientRect();
    var pad = 14;
    var left = x + pad, top = y + pad;
    if (left + rect.width > window.innerWidth - 10) left = x - rect.width - pad;
    if (top + rect.height > window.innerHeight - 10) top = y - rect.height - pad;
    el.style.left = Math.max(4, left) + 'px';
    el.style.top = Math.max(4, top) + 'px';
  }

  function closeTooltip() { pinned = false; if (tooltipEl) tooltipEl.style.display = 'none'; currentDf = null; _tooltipCacheKey = null; }
  function showTooltip(x, y, df) { if (pinned) return; currentDf = df; var el = ensureTooltip(); el.innerHTML = buildTooltipContent(df); positionTooltip(el, x, y); }
  function hideTooltip() { if (pinned) return; if (tooltipEl) tooltipEl.style.display = 'none'; currentDf = null; }

  function setupInspectDelegation() {
    // Click vào tag fieldname -> copy
    document.addEventListener('click', function (e) {
      var tag = e.target.closest('.mbwnext-fieldname-tag');
      if (!tag) return;
      e.preventDefault();
      e.stopPropagation();
      M.copyText(tag.textContent, tag, '✓ copied');
    }, true);

    document.addEventListener('mouseover', function (e) {
      if (!state.inspect || !window.cur_frm || pinned) return;
      var wrapper = e.target.closest('[data-fieldname]');
      if (!wrapper) return;
      var fieldname = wrapper.getAttribute('data-fieldname');
      var field = window.cur_frm.fields_dict && window.cur_frm.fields_dict[fieldname];
      if (!field || !field.df) return;
      showTooltip(e.clientX, e.clientY, field.df);
    }, true);

    var _rafPending = false;
    var _lastMoveX = 0, _lastMoveY = 0;
    document.addEventListener('mousemove', function (e) {
      if (!state.inspect || pinned || !tooltipEl || tooltipEl.style.display !== 'block') return;
      _lastMoveX = e.clientX;
      _lastMoveY = e.clientY;
      if (_rafPending) return;
      _rafPending = true;
      requestAnimationFrame(function () {
        _rafPending = false;
        positionTooltip(tooltipEl, _lastMoveX, _lastMoveY);
      });
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
        if (action === 'close') closeTooltip();
        else if (action === 'copy-fn' && currentDf) M.copyText(currentDf.fieldname, actionEl);
        else if (action === 'copy-all' && currentDf) M.copyText(getPlainText(currentDf), actionEl);
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (pinned) { closeTooltip(); e.preventDefault(); e.stopPropagation(); return; }
      if (currentDf) { e.preventDefault(); e.stopPropagation(); pinned = true; }
    }, true);
  }

  // ---------- Actions ----------

  function openCustomizeForm() {
    if (!window.cur_frm) { M.notify('Không có form nào đang mở', 'red'); return; }
    window.open('/app/customize-form?doc_type=' + encodeURIComponent(window.cur_frm.doctype), '_blank');
  }

  function copyDocJSON() {
    if (!window.cur_frm || !window.cur_frm.doc) { M.notify('Không có document nào đang mở', 'red'); return; }
    var json;
    try {
      json = JSON.stringify(window.cur_frm.doc, null, 2);
    } catch (err) {
      var seen = new WeakSet();
      json = JSON.stringify(window.cur_frm.doc, function (k, v) {
        if (typeof v === 'object' && v !== null) { if (seen.has(v)) return undefined; seen.add(v); }
        return v;
      }, 2);
    }
    var sizeStr = json.length > 1000 ? (json.length / 1024).toFixed(1) + ' KB' : json.length + ' ký tự';
    M.copyText(json).then(function () {
      M.notify('Đã copy doc JSON (' + sizeStr + ')', 'green');
    }).catch(function () { M.notify('Copy thất bại', 'red'); });
  }

  // ---------- Quick API Call ----------

  var apiOverlay = null;
  var apiResultEl = null;
  var lastApiResult = null;

  function openApiDialog() {
    if (apiOverlay) { apiOverlay.classList.add('open'); return; }
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
      if (e.target === apiOverlay || e.target.dataset.action === 'close-api') apiOverlay.classList.remove('open');
    });

    document.getElementById('mbwnext-api-run').addEventListener('click', function () {
      var method = document.getElementById('mbwnext-api-method').value.trim();
      if (!method) { M.notify('Nhập method', 'orange'); return; }
      var argsRaw = document.getElementById('mbwnext-api-args').value.trim();
      var args = {};
      if (argsRaw) {
        try { args = JSON.parse(argsRaw); }
        catch (e) { M.notify('JSON args không hợp lệ', 'red'); return; }
      }
      var runBtn = document.getElementById('mbwnext-api-run');
      runBtn.disabled = true; runBtn.textContent = 'Running...';
      apiResultEl.textContent = ''; apiResultEl.classList.remove('has-data');
      copyResBtn.style.display = 'none';

      window.frappe.call({
        method: method, args: args, async: true,
        callback: function (r) {
          lastApiResult = JSON.stringify(r.message, null, 2);
          apiResultEl.textContent = lastApiResult;
          apiResultEl.classList.add('has-data');
          copyResBtn.style.display = '';
          runBtn.disabled = false; runBtn.textContent = 'Run';
        },
        error: function (err) {
          var msg = err.responseJSON ? JSON.stringify(err.responseJSON, null, 2) : String(err.statusText || err);
          apiResultEl.innerHTML = '<span class="mbwnext-api-error">' + M.escHtml(msg) + '</span>';
          apiResultEl.classList.add('has-data');
          lastApiResult = msg;
          copyResBtn.style.display = '';
          runBtn.disabled = false; runBtn.textContent = 'Run';
        }
      });
    });

    copyResBtn.addEventListener('click', function () {
      if (lastApiResult) M.copyText(lastApiResult, copyResBtn, 'Copied!');
    });
  }

  // ---------- Đăng ký ----------

  M.register({ section: 'dev', id: 'hidden', label: 'Hiện field ẩn', kind: 'toggle', stateKey: 'showHidden', poll: true, scan: scanHidden });
  M.register({ section: 'dev', id: 'custom', label: 'Đánh dấu Custom Field', kind: 'toggle', stateKey: 'highlightCustom', poll: true, scan: scanCustom });
  M.register({ section: 'dev', id: 'inspect', label: 'Xem chi tiết field (hover)', kind: 'toggle', stateKey: 'inspect', poll: false, onToggle: function (on) { if (!on) hideTooltip(); } });
  M.register({ section: 'dev', id: 'fieldnames', label: 'Hiện fieldname', kind: 'toggle', stateKey: 'showFieldnames', poll: true, scan: scanFieldnames });
  M.register({ section: 'dev', id: 'docjson', label: 'Copy doc JSON', kind: 'action', buttonText: 'Copy', onClick: copyDocJSON });
  M.register({ section: 'dev', id: 'api', label: 'Quick API Call', kind: 'action', buttonText: 'Gọi', onClick: openApiDialog });
  M.register({ section: 'dev', id: 'customize', label: 'Customize Form', kind: 'action', buttonText: 'Mở', onClick: openCustomizeForm });

  setupInspectDelegation();
})();
