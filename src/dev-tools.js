/**
 * MBWNext Extensions - dev-tools.js
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
      font-size: 10px;
      padding: 0 5px; border-radius: 3px; margin-left: 6px; vertical-align: middle;
      cursor: pointer; border: 1px solid #dde2e8; user-select: all;
    }
    .mbwnext-fieldname-tag:hover { background: #2e7d32; color: #fff; border-color: #2e7d32; }
    .mbwnext-tooltip {
      position: fixed; z-index: 9999999; background: #1a1a2e; color: #e0e0e0; padding: 0;
      border-radius: 8px; font-size: 12px; max-width: 360px; min-width: 240px; line-height: 1.5;
      pointer-events: auto; box-shadow: 0 8px 30px rgba(0,0,0,.45);
      display: none; overflow: hidden; user-select: text;
    }
    .mbwnext-tooltip-header {
      background: #2e7d32; color: #fff; padding: 8px 12px; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mbwnext-tooltip-copy {
      background: rgba(255,255,255,.2); border: none; color: #fff; padding: 2px 8px;
      border-radius: 4px; cursor: pointer; font-size: 11px;
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
    .mbwnext-tooltip-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .mbwnext-badge-yes { background: #2e7d32; color: #fff; }
    .mbwnext-badge-no { background: #444; color: #999; }
    .mbwnext-api-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 9999990; display: none; }
    .mbwnext-api-overlay.open { display: flex; align-items: center; justify-content: center; }
    .mbwnext-api-dialog { background: #fff; border-radius: 10px; width: 520px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,.35); overflow: hidden; font-size: 13px; }
    .mbwnext-api-header { background: #1a1a2e; color: #fff; padding: 12px 16px; font-weight: 700; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .mbwnext-api-header button { background: none; border: none; color: rgba(255,255,255,.7); font-size: 20px; cursor: pointer; padding: 0; }
    .mbwnext-api-header button:hover { color: #fff; }
    .mbwnext-api-body { padding: 16px; }
    .mbwnext-api-body label { display: block; font-size: 11px; font-weight: 700; color: #6b7785; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .mbwnext-api-body input, .mbwnext-api-body textarea {
      width: 100%; border: 1px solid #d1d8dd; border-radius: 6px; padding: 8px 10px; font-size: 13px;
      font-family: var(--mbwnext-font-mono, ui-monospace, Consolas, monospace); margin-bottom: 12px; box-sizing: border-box; outline: none;
    }
    .mbwnext-api-body input:focus, .mbwnext-api-body textarea:focus { border-color: #2e7d32; }
    .mbwnext-api-body textarea { resize: vertical; min-height: 60px; }
    .mbwnext-api-actions { display: flex; gap: 8px; margin-top: 4px; }
    .mbwnext-api-actions button { padding: 7px 18px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }
    .mbwnext-api-run { background: #2e7d32; color: #fff; }
    .mbwnext-api-run:hover { background: #256428; }
    .mbwnext-api-run:disabled { background: #999; cursor: wait; }
    .mbwnext-api-copy-res { background: #f4f5f6; border: 1px solid #d1d8dd !important; color: #333; }
    .mbwnext-api-result { max-height: 300px; overflow: auto; border-top: 1px solid #eee; padding: 12px 16px; background: #1a1a2e; font-size: 12px; color: #e0e0e0; white-space: pre-wrap; word-break: break-word; display: none; }
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

  // ---------- Thêm Custom Field ----------

  var FIELD_TYPES = [
    'Data', 'Link', 'Dynamic Link', 'Select', 'Int', 'Float', 'Currency', 'Percent', 'Check',
    'Small Text', 'Text', 'Text Editor', 'Code', 'Phone', 'Date', 'Datetime', 'Time',
    'Table', 'Table MultiSelect', 'Attach', 'Attach Image',
    'Section Break', 'Column Break', 'Tab Break',
  ];

  var FIELD_TYPES_NEED_OPTIONS = {
    'Link': 1, 'Dynamic Link': 1, 'Select': 1, 'Table': 1, 'Table MultiSelect': 1,
  };

  function canCreateCustomField() {
    var user = window.frappe && window.frappe.user;
    if (user && user.has_role) {
      if (user.has_role('System Manager') || user.has_role('Administrator')) return true;
    }
    if (window.frappe && window.frappe.model && window.frappe.model.can_create) {
      return !!window.frappe.model.can_create('Custom Field');
    }
    return false;
  }

  function getInsertAfterFieldname() {
    if (!state.inspect || !currentDf || !currentDf.fieldname) return '';
    return currentDf.fieldname;
  }

  function stripDiacritics(str) {
    // đ/Đ không decompose qua NFD nên phải map tay
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  function labelToFieldname(label) {
    var name = stripDiacritics(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!name) return '';
    return name.indexOf('custom_') === 0 ? name : 'custom_' + name;
  }

  function normalizeFieldname(raw, label) {
    var name = raw || labelToFieldname(label);
    if (!name) return '';
    return name.indexOf('custom_') === 0 ? name : 'custom_' + name;
  }

  function fieldnameExists(meta, fieldname) {
    return meta.fields.some(function (f) { return f.fieldname === fieldname; });
  }

  function openAddCustomField() {
    var frm = window.cur_frm;
    if (!frm) { M.notify('Không có form nào đang mở', 'red'); return; }
    if (!canCreateCustomField()) {
      M.notify('Bạn không có quyền tạo Custom Field (cần System Manager hoặc quyền Create Custom Field)', 'red');
      return;
    }
    var dt = frm.doctype;
    var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
    if (!meta || !meta.fields) { M.notify('Không lấy được metadata', 'red'); return; }

    var prefillAfter = getInsertAfterFieldname();

    var body = M.showModal('Thêm Custom Field — ' + dt);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    var insertOptions = meta.fields
      .filter(function (f) { return f.fieldname; })
      .map(function (f) {
        return '<option value="' + M.escHtml(f.fieldname) + '">' +
          M.escHtml((f.label || f.fieldname) + ' (' + f.fieldname + ')') + '</option>';
      }).join('');

    var typeOptions = FIELD_TYPES.map(function (t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');

    function inp(id, label, tag, attrs) {
      attrs = attrs || '';
      var req = attrs.indexOf('required') >= 0 ? ' <span style="color:#e53935">*</span>' : '';
      return '<div class="mbwnext-cf-row"><label>' + label + req + '</label>' +
        '<' + tag + ' id="mbwnext-cf-' + id + '" ' + attrs + '></' + tag + '></div>';
    }
    function chk(id, label) {
      return '<div class="mbwnext-cf-chk"><label><input type="checkbox" id="mbwnext-cf-' + id + '" /> ' + label + '</label></div>';
    }
    function sec(title) { return '<div class="mbwnext-cf-sec">' + title + '</div>'; }

    body.innerHTML =
      '<div class="mbwnext-cf-form">' +
        sec('Cơ bản') +
        inp('label', 'Label', 'input', 'placeholder="Tên hiển thị" required') +
        inp('fieldname', 'Fieldname', 'input', 'placeholder="Tự sinh từ label"') +
        '<div class="mbwnext-cf-row"><label>Fieldtype</label><select id="mbwnext-cf-type">' + typeOptions + '</select></div>' +
        '<div class="mbwnext-cf-row" id="mbwnext-cf-options-row">' +
          '<label>Options <span style="font-weight:400;color:#8a9aab">(Link/Dynamic Link → DocType, Select → mỗi dòng 1)</span></label>' +
          '<textarea id="mbwnext-cf-options" rows="3"></textarea></div>' +
        '<div class="mbwnext-cf-row"><label>Insert After</label>' +
          '<select id="mbwnext-cf-after"><option value="">— Đầu form —</option>' + insertOptions + '</select></div>' +

        sec('Giá trị') +
        inp('default', 'Default Value', 'input', 'placeholder=""') +
        inp('placeholder', 'Placeholder', 'input', 'placeholder=""') +
        inp('description', 'Description', 'input', 'placeholder="Mô tả hiện dưới field"') +
        inp('length', 'Length', 'input', 'type="number" placeholder="0" min="0"') +

        sec('Fetch') +
        inp('fetch-from', 'Fetch From', 'input', 'placeholder="link_field.source_field"') +
        chk('fetch-if-empty', 'Fetch on Save If Empty') +

        sec('Depends On') +
        inp('depends-on', 'Depends On', 'input', 'placeholder="eval:doc.status==\'Draft\'"') +
        inp('mandatory-depends-on', 'Mandatory Depends On', 'input', 'placeholder=""') +
        inp('read-only-depends-on', 'Read Only Depends On', 'input', 'placeholder=""') +

        sec('Thuộc tính') +
        '<div class="mbwnext-cf-checks">' +
          chk('reqd', 'Is Mandatory Field') +
          chk('unique', 'Unique') +
          chk('read-only', 'Read Only') +
          chk('hidden', 'Hidden') +
          chk('allow-on-submit', 'Allow on Submit') +
          chk('no-copy', 'No Copy') +
          chk('print-hide', 'Print Hide') +
          chk('in-list-view', 'In List View') +
          chk('in-standard-filter', 'In Standard Filter') +
          chk('bold', 'Bold') +
        '</div>' +

        '<div class="mbwnext-cf-actions">' +
          '<button id="mbwnext-cf-submit" class="mbwnext-cf-btn-primary">Tạo Custom Field</button>' +
        '</div>' +
        '<div id="mbwnext-cf-msg" style="margin-top:10px"></div>' +
      '</div>';

    var labelInput = document.getElementById('mbwnext-cf-label');
    var fnInput = document.getElementById('mbwnext-cf-fieldname');
    var typeSelect = document.getElementById('mbwnext-cf-type');
    var optionsRow = document.getElementById('mbwnext-cf-options-row');
    var afterSelect = document.getElementById('mbwnext-cf-after');

    if (prefillAfter) {
      var hasAfterOption = false;
      Array.prototype.forEach.call(afterSelect.options, function (opt) {
        if (opt.value === prefillAfter) hasAfterOption = true;
      });
      if (hasAfterOption) afterSelect.value = prefillAfter;
      else M.notify('Insert After: field "' + prefillAfter + '" không có trong danh sách', 'blue');
    }

    labelInput.addEventListener('input', function () {
      if (!fnInput.dataset.manual) fnInput.value = labelToFieldname(labelInput.value);
    });
    fnInput.addEventListener('input', function () { fnInput.dataset.manual = '1'; });

    function toggleOptionsRow() {
      optionsRow.style.display = FIELD_TYPES_NEED_OPTIONS[typeSelect.value] ? '' : 'none';
    }
    typeSelect.addEventListener('change', toggleOptionsRow);
    toggleOptionsRow();

    function val(id) { var e = document.getElementById('mbwnext-cf-' + id); return e ? e.value.trim() : ''; }
    function checked(id) { var e = document.getElementById('mbwnext-cf-' + id); return e ? (e.checked ? 1 : 0) : 0; }

    document.getElementById('mbwnext-cf-submit').addEventListener('click', function () {
      var label = val('label');
      if (!label) { M.notify('Nhập Label', 'orange'); return; }
      var fieldname = normalizeFieldname(val('fieldname'), label);
      if (!fieldname) {
        M.notify('Không sinh được fieldname từ label. Nhập fieldname thủ công (vd: custom_ghi_chu)', 'orange');
        return;
      }
      if (!/^[a-z][a-z0-9_]*$/.test(fieldname)) {
        M.notify('Fieldname chỉ gồm chữ thường, số và _ (bắt đầu bằng chữ)', 'orange');
        return;
      }
      if (fieldnameExists(meta, fieldname)) {
        M.notify('Fieldname "' + fieldname + '" đã tồn tại trên DocType này', 'orange');
        return;
      }

      var fieldtype = typeSelect.value;
      var options = val('options');
      if (FIELD_TYPES_NEED_OPTIONS[fieldtype] && !options) {
        M.notify('Fieldtype ' + fieldtype + ' cần nhập Options', 'orange');
        return;
      }

      var btn = document.getElementById('mbwnext-cf-submit');
      var msgEl = document.getElementById('mbwnext-cf-msg');
      btn.disabled = true; btn.textContent = 'Đang tạo…';
      msgEl.innerHTML = '';

      var doc = {
        doctype: 'Custom Field',
        dt: dt,
        label: label,
        fieldname: fieldname,
        fieldtype: fieldtype,
      };

      // Giá trị
      if (options) doc.options = options;
      if (val('after')) doc.insert_after = val('after');
      if (val('default')) doc.default = val('default');
      if (val('placeholder')) doc.placeholder = val('placeholder');
      if (val('description')) doc.description = val('description');
      var len = val('length');
      if (len && parseInt(len) > 0) doc.length = parseInt(len);

      // Fetch
      if (val('fetch-from')) doc.fetch_from = val('fetch-from');
      if (checked('fetch-if-empty')) doc.fetch_if_empty = 1;

      // Depends On
      if (val('depends-on')) doc.depends_on = val('depends-on');
      if (val('mandatory-depends-on')) doc.mandatory_depends_on = val('mandatory-depends-on');
      if (val('read-only-depends-on')) doc.read_only_depends_on = val('read-only-depends-on');

      // Thuộc tính
      if (checked('reqd')) doc.reqd = 1;
      if (checked('unique')) doc.unique = 1;
      if (checked('read-only')) doc.read_only = 1;
      if (checked('hidden')) doc.hidden = 1;
      if (checked('allow-on-submit')) doc.allow_on_submit = 1;
      if (checked('no-copy')) doc.no_copy = 1;
      if (checked('print-hide')) doc.print_hide = 1;
      if (checked('in-list-view')) doc.in_list_view = 1;
      if (checked('in-standard-filter')) doc.in_standard_filter = 1;
      if (checked('bold')) doc.bold = 1;

      window.frappe.call({
        method: 'frappe.client.insert',
        args: { doc: doc },
        callback: function (r) {
          btn.disabled = false; btn.textContent = 'Tạo Custom Field';
          if (r.message) {
            msgEl.innerHTML = '<span style="color:#2e7d32;font-weight:600">Đã tạo field "' + M.escHtml(fieldname) + '". Reload trang để thấy.</span>';
            M.notify('Đã tạo custom field: ' + fieldname, 'green');
          }
        },
        error: function (err) {
          btn.disabled = false; btn.textContent = 'Tạo Custom Field';
          var msg = 'Lỗi tạo field';
          if (err && err.responseJSON && err.responseJSON._server_messages) {
            try {
              var msgs = JSON.parse(err.responseJSON._server_messages);
              msg = msgs.map(function (m) { try { return JSON.parse(m).message; } catch (e) { return m; } }).join('\n');
            } catch (e) { /* fallthrough */ }
          } else if (err && err.message) {
            msg = String(err.message);
          }
          msgEl.textContent = msg;
          msgEl.style.color = '#e53935';
          msgEl.style.fontWeight = '600';
        }
      });
    });
  }

  // ---------- CSS cho Custom Field form ----------

  M.addStyles(`
    .mbwnext-cf-form { font-size: 13px; }
    .mbwnext-cf-sec {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px;
      color: #6b7785; margin: 16px 0 6px; padding: 6px 0 4px;
      border-top: 1px solid #eef0f2;
    }
    .mbwnext-cf-sec:first-child { border-top: none; margin-top: 0; }
    .mbwnext-cf-row { margin-bottom: 10px; }
    .mbwnext-cf-row > label { display: block; font-size: 12px; font-weight: 700; color: #1f2933; margin-bottom: 4px; }
    .mbwnext-cf-row input[type="text"], .mbwnext-cf-row input[type="number"],
    .mbwnext-cf-row input:not([type]), .mbwnext-cf-row select, .mbwnext-cf-row textarea {
      width: 100%; border: 1px solid #d1d8dd; border-radius: 6px; padding: 7px 10px;
      font-size: 13px; box-sizing: border-box; outline: none;
    }
    .mbwnext-cf-row input:focus, .mbwnext-cf-row select:focus, .mbwnext-cf-row textarea:focus { border-color: #2e7d32; }
    .mbwnext-cf-row textarea { resize: vertical; font-family: var(--mbwnext-font-mono, ui-monospace, Consolas, monospace); font-size: 12px; }
    .mbwnext-cf-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-bottom: 12px; }
    .mbwnext-cf-chk label {
      display: flex; align-items: center; gap: 5px; font-size: 12px; color: #3d4f5f;
      cursor: pointer; padding: 3px 0;
    }
    .mbwnext-cf-chk input[type="checkbox"] { margin: 0; accent-color: #2e7d32; }
    .mbwnext-cf-actions { text-align: right; margin-top: 6px; }
    .mbwnext-cf-btn-primary {
      background: #2e7d32; color: #fff; border: none; border-radius: 6px;
      padding: 8px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .mbwnext-cf-btn-primary:hover { background: #256428; }
    .mbwnext-cf-btn-primary:disabled { background: #999; cursor: wait; }
  `);

  // ---------- Version (Changelog + Diff trong 1 modal) ----------

  M.addStyles(`
    .mbwnext-cl-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .mbwnext-cl-tabs { display: flex; gap: 4px; background: #f0f2f5; border-radius: 8px; padding: 3px; }
    .mbwnext-cl-tab {
      border: none; background: transparent; border-radius: 6px; padding: 5px 12px;
      font-size: 12px; font-weight: 700; color: #6b7785; cursor: pointer;
    }
    .mbwnext-cl-tab.active { background: #fff; color: #1f2933; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
    .mbwnext-cl-entry { padding: 10px 0; border-bottom: 1px solid #f0f1f3; }
    .mbwnext-cl-entry:last-child { border-bottom: none; }
    .mbwnext-cl-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    .mbwnext-cl-owner { font-weight: 700; color: #1f2933; font-size: 12.5px; }
    .mbwnext-cl-time { font-size: 11px; color: #9aa5b1; }
    .mbwnext-cl-line { font-size: 12px; color: #374151; padding: 3px 0; line-height: 1.5; }
    .mbwnext-cl-field { font-weight: 700; color: #1f2933; margin-right: 6px; }
    .mbwnext-cl-old { color: #c62828; text-decoration: line-through; word-break: break-word; }
    .mbwnext-cl-arrow { color: #9aa5b1; margin: 0 6px; }
    .mbwnext-cl-new { color: #2e7d32; font-weight: 600; word-break: break-word; }
    .mbwnext-cl-tag {
      display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 10px; font-weight: 700;
      margin-right: 6px; text-transform: uppercase; letter-spacing: .3px;
    }
    .mbwnext-cl-tag-add { background: #e8f5e9; color: #2e7d32; }
    .mbwnext-cl-tag-del { background: #ffebee; color: #c62828; }
    .mbwnext-cl-tag-row { background: #eef1f5; color: #6b7785; }
    .mbwnext-cl-empty { font-size: 12px; color: #9aa5b1; font-style: italic; }
    .mbwnext-diff-pick { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: flex-end; }
    .mbwnext-diff-pick label { font-size: 11px; font-weight: 700; color: #6b7785; display: block; margin-bottom: 4px; }
    .mbwnext-diff-pick select {
      min-width: 200px; border: 1px solid #d1d8dd; border-radius: 6px; padding: 6px 8px; font-size: 12px;
    }
    .mbwnext-diff-old { color: #c62828; text-decoration: line-through; word-break: break-word; }
    .mbwnext-diff-new { color: #2e7d32; font-weight: 600; word-break: break-word; }
  `);

  function parseVersionData(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function formatVersionDate(dt) {
    try {
      if (window.frappe && window.frappe.datetime && window.frappe.datetime.str_to_user) {
        return window.frappe.datetime.str_to_user(dt);
      }
    } catch (e) { /* ignore */ }
    return String(dt || '');
  }

  function fmtVersionVal(v) {
    if (v === undefined || v === null || v === '') return '(trống)';
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } }
    var s = String(v);
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  }

  function renderChangelogEntry(v) {
    var data = parseVersionData(v.data);
    var html = '<div class="mbwnext-cl-entry">' +
      '<div class="mbwnext-cl-head"><span class="mbwnext-cl-owner">' + M.escHtml(v.owner || '') + '</span>' +
      '<span class="mbwnext-cl-time">' + M.escHtml(formatVersionDate(v.creation)) + '</span></div>';

    var lines = [];
    if (data) {
      (data.changed || []).forEach(function (c) {
        lines.push('<div class="mbwnext-cl-line"><span class="mbwnext-cl-field">' + M.escHtml(c[0]) + '</span>' +
          '<span class="mbwnext-cl-old">' + M.escHtml(fmtVersionVal(c[1])) + '</span>' +
          '<span class="mbwnext-cl-arrow">&#8594;</span>' +
          '<span class="mbwnext-cl-new">' + M.escHtml(fmtVersionVal(c[2])) + '</span></div>');
      });
      (data.added || []).forEach(function (a) {
        lines.push('<div class="mbwnext-cl-line"><span class="mbwnext-cl-tag mbwnext-cl-tag-add">+ thêm dòng</span>' +
          '<b>' + M.escHtml(a[0]) + '</b> (' + ((a[1] && a[1].length) || 0) + ' dòng)</div>');
      });
      (data.removed || []).forEach(function (rm) {
        lines.push('<div class="mbwnext-cl-line"><span class="mbwnext-cl-tag mbwnext-cl-tag-del">- xoá dòng</span>' +
          '<b>' + M.escHtml(rm[0]) + '</b> (' + ((rm[1] && rm[1].length) || 0) + ' dòng)</div>');
      });
      (data.row_changed || []).forEach(function (rc) {
        var fieldname = rc[0], changes = rc[3] || [];
        changes.forEach(function (c) {
          lines.push('<div class="mbwnext-cl-line"><span class="mbwnext-cl-tag mbwnext-cl-tag-row">dòng con</span>' +
            '<span class="mbwnext-cl-field">' + M.escHtml(fieldname) + '.' + M.escHtml(c[0]) + '</span>' +
            '<span class="mbwnext-cl-old">' + M.escHtml(fmtVersionVal(c[1])) + '</span>' +
            '<span class="mbwnext-cl-arrow">&#8594;</span>' +
            '<span class="mbwnext-cl-new">' + M.escHtml(fmtVersionVal(c[2])) + '</span></div>');
        });
      });
    }
    if (!lines.length) lines.push('<div class="mbwnext-cl-empty">Tạo mới document / không có thay đổi field theo dõi được.</div>');
    html += lines.join('') + '</div>';
    return html;
  }

  function versionEntryToText(v) {
    var data = parseVersionData(v.data);
    var lines = ['[' + formatVersionDate(v.creation) + '] ' + (v.owner || '')];
    if (data) {
      (data.changed || []).forEach(function (c) {
        lines.push('  ' + c[0] + ': ' + fmtVersionVal(c[1]) + ' -> ' + fmtVersionVal(c[2]));
      });
      (data.added || []).forEach(function (a) {
        lines.push('  + ' + a[0] + ' (' + ((a[1] && a[1].length) || 0) + ' dòng)');
      });
      (data.removed || []).forEach(function (rm) {
        lines.push('  - ' + rm[0] + ' (' + ((rm[1] && rm[1].length) || 0) + ' dòng)');
      });
      (data.row_changed || []).forEach(function (rc) {
        var fieldname = rc[0], changes = rc[3] || [];
        changes.forEach(function (c) {
          lines.push('  ' + fieldname + '.' + c[0] + ': ' + fmtVersionVal(c[1]) + ' -> ' + fmtVersionVal(c[2]));
        });
      });
    }
    if (lines.length === 1) lines.push('  (tạo mới / không có thay đổi field theo dõi được)');
    return lines.join('\n');
  }

  function changelogToPlainText(list) {
    return list.map(versionEntryToText).join('\n\n');
  }

  function flattenVersionData(data) {
    var map = {};
    if (!data) return map;
    (data.changed || []).forEach(function (c) {
      map[c[0]] = { old: c[1], new: c[2], kind: 'changed' };
    });
    (data.added || []).forEach(function (a) {
      map['+ ' + a[0]] = { old: null, new: (a[1] && a[1].length) + ' dòng', kind: 'added' };
    });
    (data.removed || []).forEach(function (rm) {
      map['- ' + rm[0]] = { old: (rm[1] && rm[1].length) + ' dòng', new: null, kind: 'removed' };
    });
    (data.row_changed || []).forEach(function (rc) {
      var fieldname = rc[0];
      (rc[3] || []).forEach(function (c) {
        map[fieldname + '.' + c[0]] = { old: c[1], new: c[2], kind: 'row' };
      });
    });
    return map;
  }

  function buildVersionDiffHtml(list, ia, ib) {
    if (ia === ib) return '<div class="mbwnext-empty">Chọn 2 version khác nhau.</div>';
    var va = list[ia], vb = list[ib];
    if (va.creation > vb.creation) { var tmp = va; va = vb; vb = tmp; }

    var mapA = flattenVersionData(parseVersionData(va.data));
    var mapB = flattenVersionData(parseVersionData(vb.data));
    var keys = {};
    Object.keys(mapA).forEach(function (k) { keys[k] = 1; });
    Object.keys(mapB).forEach(function (k) { keys[k] = 1; });

    var rows = Object.keys(keys).sort().map(function (k) {
      var a = mapA[k], b = mapB[k];
      var valA = a ? (a.new !== undefined ? a.new : a.old) : undefined;
      var valB = b ? (b.new !== undefined ? b.new : b.old) : undefined;
      if (valuesEqual(valA, valB) && a && b) return '';
      return '<tr>' +
        '<td style="font-weight:700">' + M.escHtml(k) + '</td>' +
        '<td class="mbwnext-diff-old">' + M.escHtml(fmtVersionVal(valA)) + '</td>' +
        '<td class="mbwnext-diff-new">' + M.escHtml(fmtVersionVal(valB)) + '</td>' +
        '</tr>';
    }).filter(Boolean).join('');

    if (!rows) {
      return '<div class="mbwnext-empty">Không thấy khác biệt field giữa 2 version đã chọn.</div>';
    }
    return '<div class="mbwnext-rpt-count" style="margin-bottom:8px">A: ' + M.escHtml(formatVersionDate(va.creation)) +
      ' (' + M.escHtml(va.owner || '') + ') → B: ' + M.escHtml(formatVersionDate(vb.creation)) +
      ' (' + M.escHtml(vb.owner || '') + ')</div>' +
      '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">' +
      '<thead><tr><th>Field</th><th>Version A</th><th>Version B</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<p style="font-size:11px;color:#9aa5b1;margin-top:10px">Mỗi Version lưu delta tại thời điểm sửa. Diff so sánh giá trị “sau đổi” của từng bản.</p>';
  }

  function renderVersionModal(body, list) {
    if (!list.length) {
      body.innerHTML = '<div class="mbwnext-empty">Chưa có lịch sử — DocType chưa bật Track Changes hoặc document chưa từng sửa.</div>';
      return;
    }

    var canDiff = list.length >= 2;
    var options = list.map(function (v, i) {
      return '<option value="' + i + '">#' + (i + 1) + ' · ' + M.escHtml(formatVersionDate(v.creation)) +
        ' · ' + M.escHtml(v.owner || '') + '</option>';
    }).join('');

    body.innerHTML =
      '<div class="mbwnext-cl-toolbar">' +
        '<div class="mbwnext-cl-tabs">' +
          '<button type="button" class="mbwnext-cl-tab active" data-tab="history">Lịch sử</button>' +
          '<button type="button" class="mbwnext-cl-tab" data-tab="diff"' + (canDiff ? '' : ' disabled title="Cần ≥ 2 version"') + '>So sánh</button>' +
        '</div>' +
        '<button class="mbwnext-btn" id="mbwnext-cl-copy">Copy</button>' +
      '</div>' +
      '<div id="mbwnext-cl-pane-history">' + list.map(renderChangelogEntry).join('') + '</div>' +
      '<div id="mbwnext-cl-pane-diff" style="display:none">' +
        (canDiff
          ? '<div class="mbwnext-diff-pick">' +
              '<div><label>Version A (cũ hơn)</label><select id="mbwnext-diff-a">' + options + '</select></div>' +
              '<div><label>Version B (mới hơn)</label><select id="mbwnext-diff-b">' + options + '</select></div>' +
              '<button class="mbwnext-btn" id="mbwnext-diff-run" style="background:#2e7d32;color:#fff;border-color:#2e7d32">So sánh</button>' +
            '</div>' +
            '<div id="mbwnext-diff-out"><div class="mbwnext-empty">Chọn 2 version rồi bấm So sánh.</div></div>'
          : '<div class="mbwnext-empty">Cần ít nhất 2 bản Version để so sánh.</div>') +
      '</div>';

    var paneHistory = body.querySelector('#mbwnext-cl-pane-history');
    var paneDiff = body.querySelector('#mbwnext-cl-pane-diff');
    var copyBtn = body.querySelector('#mbwnext-cl-copy');

    body.querySelectorAll('.mbwnext-cl-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.disabled) return;
        body.querySelectorAll('.mbwnext-cl-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var isDiff = tab.dataset.tab === 'diff';
        paneHistory.style.display = isDiff ? 'none' : '';
        paneDiff.style.display = isDiff ? '' : 'none';
        copyBtn.style.display = isDiff ? 'none' : '';
      });
    });

    copyBtn.addEventListener('click', function () {
      M.copyText(changelogToPlainText(list), copyBtn, '✓ Copied');
    });

    if (canDiff) {
      body.querySelector('#mbwnext-diff-a').value = '1';
      body.querySelector('#mbwnext-diff-b').value = '0';
      body.querySelector('#mbwnext-diff-run').addEventListener('click', function () {
        var ia = parseInt(body.querySelector('#mbwnext-diff-a').value, 10);
        var ib = parseInt(body.querySelector('#mbwnext-diff-b').value, 10);
        if (ia === ib) { M.notify('Chọn 2 version khác nhau', 'orange'); return; }
        body.querySelector('#mbwnext-diff-out').innerHTML = buildVersionDiffHtml(list, ia, ib);
      });
    }
  }

  function openVersion() {
    var frm = window.cur_frm;
    if (!frm || !frm.doc) { M.notify('Không có document nào đang mở', 'red'); return; }
    if (frm.is_new && frm.is_new()) { M.notify('Document chưa được lưu, chưa có lịch sử', 'orange'); return; }

    var body = M.showModal('Version — ' + frm.doctype + ' ' + frm.docname);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Version',
        filters: { ref_doctype: frm.doctype, docname: frm.docname },
        fields: ['name', 'owner', 'creation', 'data'],
        order_by: 'creation desc',
        limit_page_length: 50,
      },
      callback: function (r) { renderVersionModal(body, r.message || []); },
      error: function () {
        body.innerHTML = '<div class="mbwnext-empty">Không đọc được lịch sử (có thể thiếu quyền đọc Version).</div>';
      }
    });
  }

  // ---------- Copy form URL ----------

  function slugDoctype(dt) {
    try {
      if (window.frappe.router && window.frappe.router.slug) return window.frappe.router.slug(dt);
      if (window.frappe.scrub) return window.frappe.scrub(dt, '-');
    } catch (e) { /* fallthrough */ }
    return String(dt || '').toLowerCase().replace(/\s+/g, '-');
  }

  function copyFormUrl() {
    var frm = window.cur_frm;
    if (!frm || !frm.doctype) { M.notify('Không có form nào đang mở', 'red'); return; }
    var slug = slugDoctype(frm.doctype);
    var path;
    if (frm.docname && !(frm.is_new && frm.is_new())) {
      path = '/app/' + slug + '/' + encodeURIComponent(frm.docname);
    } else {
      path = '/app/' + slug + '/new';
    }
    var url = window.location.origin + path;
    M.copyText(url).then(function () {
      M.notify('Đã copy URL: ' + path, 'green');
    }).catch(function () { M.notify('Copy thất bại', 'red'); });
  }

  // ---------- Site / version info ----------

  function openSiteInfo() {
    var boot = window.frappe && window.frappe.boot;
    if (!boot) { M.notify('Không đọc được frappe.boot', 'red'); return; }

    var body = M.showModal('Site / Version info');
    var versions = boot.versions || {};
    var apps = boot.versions ? Object.keys(boot.versions) : (boot.sysdefaults && []) || [];
    if (!apps.length && boot.app_data) {
      apps = Object.keys(boot.app_data);
    }
    // Frappe mới: boot.versions = { frappe: '15.x', erpnext: '15.x', ... }
    var versionRows = Object.keys(versions).map(function (app) {
      return '<tr><td>' + M.escHtml(app) + '</td><td>' + M.escHtml(String(versions[app])) + '</td></tr>';
    }).join('');

    var user = (boot.user && boot.user.name) || '-';
    var sitename = boot.sitename || window.location.hostname;
    var lang = (boot.lang || boot.user && boot.user.language) || '-';
    var developerMode = boot.developer_mode ? 'Yes' : 'No';
    var csrf = (window.frappe.csrf_token || '').slice(0, 8) + '…';

    var installedApps = '';
    if (boot.installed_apps && boot.installed_apps.length) {
      installedApps = boot.installed_apps.map(function (a) {
        return '<span class="mbwnext-modal-pill" style="margin:2px">' + M.escHtml(a) + '</span>';
      }).join(' ');
    } else if (versionRows) {
      installedApps = '<span class="mbwnext-empty">Xem bảng version bên dưới</span>';
    } else {
      installedApps = '<span class="mbwnext-empty">Không có dữ liệu</span>';
    }

    body.innerHTML =
      '<table>' +
        '<tr><th style="width:40%">Key</th><th>Value</th></tr>' +
        '<tr><td>Site</td><td><b>' + M.escHtml(sitename) + '</b></td></tr>' +
        '<tr><td>User</td><td>' + M.escHtml(user) + '</td></tr>' +
        '<tr><td>Language</td><td>' + M.escHtml(String(lang)) + '</td></tr>' +
        '<tr><td>Developer Mode</td><td>' + developerMode + '</td></tr>' +
        '<tr><td>CSRF (prefix)</td><td>' + M.escHtml(csrf) + '</td></tr>' +
        '<tr><td>Origin</td><td>' + M.escHtml(window.location.origin) + '</td></tr>' +
      '</table>' +
      '<div class="mbwnext-site-sec">Installed apps</div>' +
      '<div style="margin-bottom:14px">' + installedApps + '</div>' +
      (versionRows
        ? '<div class="mbwnext-site-sec">Versions</div>' +
          '<table><thead><tr><th>App</th><th>Version</th></tr></thead><tbody>' + versionRows + '</tbody></table>'
        : '') +
      '<div style="margin-top:14px;text-align:right">' +
        '<button class="mbwnext-btn" id="mbwnext-site-copy">Copy JSON</button>' +
      '</div>';

    var info = {
      sitename: sitename,
      user: user,
      language: lang,
      developer_mode: !!boot.developer_mode,
      origin: window.location.origin,
      versions: versions,
      installed_apps: boot.installed_apps || Object.keys(versions),
    };
    var copyBtn = document.getElementById('mbwnext-site-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        M.copyText(JSON.stringify(info, null, 2), copyBtn, '✓ Copied');
      });
    }
  }

  // ---------- Highlight dirty fields ----------

  M.addStyles(`
    .mbwnext-field-dirty { border-left: 3px solid #fb8c00 !important; background: rgba(251,140,0,.06) !important; }
    .mbwnext-grid-row-inspect {
      outline: 2px solid #7e57c2; outline-offset: -2px; cursor: pointer;
    }
    .mbwnext-child-tooltip {
      position: fixed; z-index: 9999999; background: #1a1a2e; color: #e0e0e0; padding: 0;
      border-radius: 8px; font-size: 12px; max-width: 420px; min-width: 280px; line-height: 1.5;
      box-shadow: 0 8px 30px rgba(0,0,0,.45);
      overflow: hidden; user-select: text;
    }
    .mbwnext-getdoc-body label { display: block; font-size: 11px; font-weight: 700; color: #6b7785; margin-bottom: 4px; text-transform: uppercase; }
    .mbwnext-getdoc-body input, .mbwnext-getdoc-body select, .mbwnext-getdoc-body textarea {
      width: 100%; box-sizing: border-box; border: 1px solid #d1d8dd; border-radius: 6px;
      padding: 7px 10px; font-size: 13px; margin-bottom: 10px; outline: none;
      font-family: var(--mbwnext-font-mono, ui-monospace, Consolas, monospace);
    }
    .mbwnext-getdoc-body input:focus, .mbwnext-getdoc-body select:focus, .mbwnext-getdoc-body textarea:focus { border-color: #2e7d32; }
    .mbwnext-getdoc-result {
      margin-top: 8px; max-height: 320px; overflow: auto; background: #1a1a2e; color: #e0e0e0;
      border-radius: 8px; padding: 12px;
      font-size: 12px; white-space: pre-wrap; word-break: break-word; display: none;
    }
    .mbwnext-getdoc-result.has-data { display: block; }
  `);

  var _dirtySnapshot = null;
  var _dirtyKey = null;

  function docSnapshotKey(frm) {
    if (!frm || !frm.doc) return null;
    return (frm.doctype || '') + '::' + (frm.docname || frm.doc.name || 'new');
  }

  function takeDirtySnapshot(frm) {
    if (!frm || !frm.doc) { _dirtySnapshot = null; _dirtyKey = null; return; }
    try {
      _dirtySnapshot = JSON.parse(JSON.stringify(frm.doc));
      _dirtyKey = docSnapshotKey(frm);
    } catch (e) {
      // fallback shallow clone for non-JSON values
      _dirtySnapshot = Object.assign({}, frm.doc);
      _dirtyKey = docSnapshotKey(frm);
    }
  }

  function valuesEqual(a, b) {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (typeof a === 'object' || typeof b === 'object') {
      try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
    }
    return String(a) === String(b);
  }

  function scanDirty(ctx) {
    if (!state.highlightDirty) {
      document.querySelectorAll('.mbwnext-field-dirty').forEach(function (el) {
        el.classList.remove('mbwnext-field-dirty');
      });
      _dirtySnapshot = null;
      _dirtyKey = null;
      return;
    }
    var frm = ctx.curFrm;
    if (!frm || !frm.doc) return;

    var key = docSnapshotKey(frm);
    if (!_dirtySnapshot || _dirtyKey !== key) {
      takeDirtySnapshot(frm);
      ctx.eachField(function (el) { el.classList.remove('mbwnext-field-dirty'); });
      return;
    }

    ctx.eachField(function (el, field, fn) {
      // bỏ layout fields
      var ft = field.df && field.df.fieldtype;
      if (ft === 'Section Break' || ft === 'Column Break' || ft === 'Tab Break' || ft === 'Fold') {
        el.classList.remove('mbwnext-field-dirty');
        return;
      }
      var cur = frm.doc[fn];
      var orig = _dirtySnapshot[fn];
      var dirty = !valuesEqual(cur, orig);
      el.classList.toggle('mbwnext-field-dirty', dirty);
    });
  }

  function onDirtyToggle(on) {
    if (on && window.cur_frm) takeDirtySnapshot(window.cur_frm);
    if (!on) {
      document.querySelectorAll('.mbwnext-field-dirty').forEach(function (el) {
        el.classList.remove('mbwnext-field-dirty');
      });
      _dirtySnapshot = null;
      _dirtyKey = null;
    }
  }

  // ---------- Inspect child table row ----------

  var childTooltipEl = null;
  var childPinned = false;
  var currentChildRow = null;

  function ensureChildTooltip() {
    if (!childTooltipEl) {
      childTooltipEl = document.createElement('div');
      childTooltipEl.className = 'mbwnext-child-tooltip';
      childTooltipEl.style.display = 'none';
      document.body.appendChild(childTooltipEl);
    }
    return childTooltipEl;
  }

  function closeChildTooltip() {
    childPinned = false;
    currentChildRow = null;
    if (childTooltipEl) childTooltipEl.style.display = 'none';
    document.querySelectorAll('.mbwnext-grid-row-inspect').forEach(function (el) {
      el.classList.remove('mbwnext-grid-row-inspect');
    });
  }

  function findGridRowDoc(rowEl) {
    var frm = window.cur_frm;
    if (!frm || !frm.doc) return null;

    var gridRow = rowEl.closest('.grid-row');
    if (!gridRow) return null;

    // Frappe gắn grid_row object trên DOM qua jQuery data trong nhiều version
    var $row = window.$ ? window.$(gridRow) : null;
    var gridRowObj = $row && $row.data && $row.data('grid_row');
    if (gridRowObj && gridRowObj.doc) {
      return {
        doc: gridRowObj.doc,
        parentfield: gridRowObj.grid && gridRowObj.grid.fieldname,
        idx: gridRowObj.doc.idx,
        doctype: gridRowObj.doc.doctype,
      };
    }

    var idxAttr = gridRow.getAttribute('data-idx') || (gridRow.querySelector('[data-idx]') && gridRow.querySelector('[data-idx]').getAttribute('data-idx'));
    var idx = parseInt(idxAttr, 10);
    if (!idx) return null;

    // Tìm parentfield từ grid wrapper
    var gridWrap = gridRow.closest('[data-fieldname]');
    var parentfield = gridWrap && gridWrap.getAttribute('data-fieldname');
    if (!parentfield || !Array.isArray(frm.doc[parentfield])) return null;
    var doc = frm.doc[parentfield].find(function (r) { return Number(r.idx) === idx; })
      || frm.doc[parentfield][idx - 1];
    if (!doc) return null;
    return { doc: doc, parentfield: parentfield, idx: idx, doctype: doc.doctype };
  }

  function buildChildTooltipHtml(info) {
    var doc = info.doc;
    var json;
    try { json = JSON.stringify(doc, null, 2); }
    catch (e) { json = String(doc); }
    if (json.length > 2500) json = json.slice(0, 2500) + '\n…';

    return '<div class="mbwnext-tooltip-header">' +
      '<span>Child · ' + M.escHtml(info.parentfield || '') + ' #' + M.escHtml(String(info.idx || '')) + '</span>' +
      '<span>' +
      '<button class="mbwnext-tooltip-copy" data-action="copy-child">Copy JSON</button>' +
      '<button class="mbwnext-tooltip-close" data-action="close-child">&times;</button>' +
      '</span></div>' +
      '<div class="mbwnext-tooltip-body">' +
        '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">doctype</span><span class="mbwnext-tooltip-val">' + M.escHtml(info.doctype || '') + '</span></div>' +
        '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">name</span><span class="mbwnext-tooltip-val">' + M.escHtml(doc.name || '') + '</span></div>' +
        '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">idx</span><span class="mbwnext-tooltip-val">' + M.escHtml(String(doc.idx || info.idx || '')) + '</span></div>' +
        '<div class="mbwnext-tooltip-row"><span class="mbwnext-tooltip-key">parentfield</span><span class="mbwnext-tooltip-val">' + M.escHtml(info.parentfield || '') + '</span></div>' +
      '</div>' +
      '<div class="mbwnext-tooltip-options"><div class="mbwnext-tooltip-options-label">row JSON</div>' +
      '<pre style="margin:0;white-space:pre-wrap;word-break:break-word;color:#b8c0e0;font-size:11px;max-height:220px;overflow:auto">' +
      M.escHtml(json) + '</pre></div>';
  }

  function showChildTooltip(x, y, info) {
    if (childPinned) return;
    currentChildRow = info;
    var el = ensureChildTooltip();
    el.innerHTML = buildChildTooltipHtml(info);
    el.style.display = 'block';
    el.style.left = '0px'; el.style.top = '0px';
    var rect = el.getBoundingClientRect();
    var left = x + 14, top = y + 14;
    if (left + rect.width > window.innerWidth - 10) left = x - rect.width - 14;
    if (top + rect.height > window.innerHeight - 10) top = y - rect.height - 14;
    el.style.left = Math.max(4, left) + 'px';
    el.style.top = Math.max(4, top) + 'px';
  }

  function setupChildInspect() {
    document.addEventListener('mouseover', function (e) {
      if (!state.inspectChild || !window.cur_frm || childPinned) return;
      var row = e.target.closest('.grid-row');
      if (!row || e.target.closest('.mbwnext-child-tooltip')) return;
      document.querySelectorAll('.mbwnext-grid-row-inspect').forEach(function (el) {
        el.classList.remove('mbwnext-grid-row-inspect');
      });
      row.classList.add('mbwnext-grid-row-inspect');
      var info = findGridRowDoc(row);
      if (info) showChildTooltip(e.clientX, e.clientY, info);
    }, true);

    document.addEventListener('mouseout', function (e) {
      if (!state.inspectChild || childPinned) return;
      var row = e.target.closest('.grid-row');
      if (!row) return;
      if (e.relatedTarget && row.contains(e.relatedTarget)) return;
      if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mbwnext-child-tooltip')) return;
      row.classList.remove('mbwnext-grid-row-inspect');
      if (childTooltipEl) childTooltipEl.style.display = 'none';
      currentChildRow = null;
    }, true);

    document.addEventListener('click', function (e) {
      if (!state.inspectChild) return;
      if (e.target.closest('.mbwnext-child-tooltip')) {
        var actionEl = e.target.closest('[data-action]');
        var action = actionEl && actionEl.dataset.action;
        if (action === 'close-child') closeChildTooltip();
        else if (action === 'copy-child' && currentChildRow) {
          try {
            M.copyText(JSON.stringify(currentChildRow.doc, null, 2), actionEl, 'Copied!');
          } catch (err) { M.notify('Copy thất bại', 'red'); }
        }
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (childPinned) { closeChildTooltip(); return; }
      if (currentChildRow && e.target.closest('.grid-row')) {
        childPinned = true;
        e.preventDefault(); e.stopPropagation();
      }
    }, true);
  }

  // ---------- Quick get_doc ----------

  function openGetDocDialog() {
    var body = M.showModal('Quick get_doc');
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    var preDt = (window.cur_frm && window.cur_frm.doctype) || '';
    var preName = (window.cur_frm && window.cur_frm.docname && !(window.cur_frm.is_new && window.cur_frm.is_new()))
      ? window.cur_frm.docname : '';

    body.innerHTML =
      '<div class="mbwnext-getdoc-body">' +
        '<label>Action</label>' +
        '<select id="mbwnext-gd-action">' +
          '<option value="get_doc">get_doc</option>' +
          '<option value="get_value">get_value</option>' +
          '<option value="get_list">get_list</option>' +
        '</select>' +
        '<label>DocType</label>' +
        '<input id="mbwnext-gd-doctype" value="' + M.escHtml(preDt) + '" placeholder="Sales Order" />' +
        '<label>Name / Filters</label>' +
        '<input id="mbwnext-gd-name" value="' + M.escHtml(preName) + '" placeholder="SO-0001 hoặc {\"status\":\"Draft\"} cho get_list" />' +
        '<label>Fieldname (get_value) / Fields CSV (get_list)</label>' +
        '<input id="mbwnext-gd-field" placeholder="customer  |  name,status,grand_total" />' +
        '<div style="display:flex;gap:8px">' +
          '<button class="mbwnext-btn" id="mbwnext-gd-run" style="background:#2e7d32;color:#fff;border-color:#2e7d32">Run</button>' +
          '<button class="mbwnext-btn" id="mbwnext-gd-copy" style="display:none">Copy Result</button>' +
        '</div>' +
        '<div class="mbwnext-getdoc-result" id="mbwnext-gd-result"></div>' +
      '</div>';

    var lastResult = null;
    var resultEl = document.getElementById('mbwnext-gd-result');
    var copyBtn = document.getElementById('mbwnext-gd-copy');
    var runBtn = document.getElementById('mbwnext-gd-run');

    runBtn.addEventListener('click', function () {
      var action = document.getElementById('mbwnext-gd-action').value;
      var doctype = document.getElementById('mbwnext-gd-doctype').value.trim();
      var nameOrFilters = document.getElementById('mbwnext-gd-name').value.trim();
      var fieldRaw = document.getElementById('mbwnext-gd-field').value.trim();
      if (!doctype) { M.notify('Nhập DocType', 'orange'); return; }

      var method, args;
      if (action === 'get_doc') {
        if (!nameOrFilters) { M.notify('Nhập Name', 'orange'); return; }
        method = 'frappe.client.get';
        args = { doctype: doctype, name: nameOrFilters };
      } else if (action === 'get_value') {
        if (!nameOrFilters) { M.notify('Nhập Name', 'orange'); return; }
        method = 'frappe.client.get_value';
        args = { doctype: doctype, filters: nameOrFilters, fieldname: fieldRaw || 'name' };
      } else {
        method = 'frappe.client.get_list';
        var filters = {};
        if (nameOrFilters) {
          try { filters = JSON.parse(nameOrFilters); }
          catch (e) { M.notify('Filters phải là JSON object', 'red'); return; }
        }
        var fields = fieldRaw ? fieldRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : ['name'];
        args = { doctype: doctype, filters: filters, fields: fields, limit_page_length: 20 };
      }

      runBtn.disabled = true; runBtn.textContent = 'Running…';
      resultEl.classList.remove('has-data'); resultEl.textContent = '';
      copyBtn.style.display = 'none';

      window.frappe.call({
        method: method,
        args: args,
        callback: function (r) {
          lastResult = JSON.stringify(r.message, null, 2);
          resultEl.textContent = lastResult;
          resultEl.classList.add('has-data');
          copyBtn.style.display = '';
          runBtn.disabled = false; runBtn.textContent = 'Run';
        },
        error: function (err) {
          var msg = err.responseJSON ? JSON.stringify(err.responseJSON, null, 2) : String(err.statusText || err);
          lastResult = msg;
          resultEl.textContent = msg;
          resultEl.classList.add('has-data');
          copyBtn.style.display = '';
          runBtn.disabled = false; runBtn.textContent = 'Run';
        }
      });
    });

    copyBtn.addEventListener('click', function () {
      if (lastResult) M.copyText(lastResult, copyBtn, 'Copied!');
    });
  }

  // ---------- Đăng ký ----------

  M.register({ section: 'dev', group: 'overlay', id: 'hidden', label: 'Hiện field ẩn', kind: 'toggle', stateKey: 'showHidden', poll: true, scan: scanHidden,
    helpDesc: 'Hiện field có hidden=1 trên form (viền đỏ + mờ). Giúp debug nhanh field đang bị ẩn.' });
  M.register({ section: 'dev', group: 'overlay', id: 'custom', label: 'Đánh dấu Custom Field', kind: 'toggle', stateKey: 'highlightCustom', poll: true, scan: scanCustom,
    helpDesc: 'Tô viền trái xanh cho custom field, phân biệt field gốc Frappe vs field thêm qua Customize Form / app.' });
  M.register({ section: 'dev', group: 'overlay', id: 'dirty', label: 'Highlight field đã sửa', kind: 'toggle', stateKey: 'highlightDirty', poll: true, scan: scanDirty,
    onToggle: onDirtyToggle,
    helpDesc: 'Tô cam các field đã đổi giá trị kể từ lúc bật toggle (hoặc lúc mở document). Giúp thấy nhanh form đang dirty ở field nào.' });
  M.register({ section: 'dev', group: 'overlay', id: 'inspect', label: 'Chi tiết field (hover)', kind: 'toggle', stateKey: 'inspect', poll: false,
    onToggle: function (on) { if (!on) hideTooltip(); }, shortcut: 'Alt+I',
    helpDesc: 'Hover field để xem tooltip (fieldname, fieldtype, options, mandatory, depends_on…). Click để pin, có Copy fieldname / Copy All.' });
  M.register({ section: 'dev', group: 'overlay', id: 'inspectchild', label: 'Inspect child row', kind: 'toggle', stateKey: 'inspectChild', poll: false,
    onToggle: function (on) { if (!on) closeChildTooltip(); },
    helpDesc: 'Hover dòng trong bảng con để xem idx, name, parentfield + JSON dòng. Click để pin, có Copy JSON.' });
  M.register({ section: 'dev', group: 'overlay', id: 'fieldnames', label: 'Hiện fieldname', kind: 'toggle', stateKey: 'showFieldnames', poll: true, scan: scanFieldnames,
    shortcut: 'Alt+N',
    helpDesc: 'In tag fieldname cạnh label trên form và bảng con. Click tag để copy fieldname.' });
  M.register({ section: 'dev', group: 'copy', id: 'docjson', label: 'Copy doc JSON', kind: 'action', buttonText: 'Copy', onClick: copyDocJSON,
    shortcut: 'Alt+J',
    helpDesc: 'Copy cur_frm.doc dạng JSON vào clipboard — tiện report bug hoặc so sánh giá trị.' });
  M.register({ section: 'dev', group: 'copy', id: 'formurl', label: 'Copy form URL', kind: 'action', buttonText: 'Copy', onClick: copyFormUrl,
    helpDesc: 'Copy URL chuẩn của document đang mở (/app/doctype/name) — gửi đồng nghiệp hoặc gắn vào ticket.' });
  M.register({ section: 'dev', group: 'api', id: 'api', label: 'Quick API Call', kind: 'action', buttonText: 'Gọi', onClick: openApiDialog,
    helpDesc: 'Gọi frappe.call với method + args (JSON), xem kết quả ngay — thay mở Console test API.' });
  M.register({ section: 'dev', group: 'api', id: 'getdoc', label: 'Quick get_doc', kind: 'action', buttonText: 'Gọi', onClick: openGetDocDialog,
    shortcut: 'Alt+G',
    helpDesc: 'Gọi nhanh frappe.client.get / get_value / get_list với DocType + name/filters. Prefill từ form đang mở.' });
  M.register({ section: 'dev', group: 'api', id: 'siteinfo', label: 'Site / Version info', kind: 'action', buttonText: 'Xem', onClick: openSiteInfo,
    helpDesc: 'Xem site name, user, developer_mode, danh sách app và version (từ frappe.boot). Có Copy JSON.' });
  M.register({ section: 'dev', group: 'form', id: 'addfield', label: 'Thêm Custom Field', kind: 'action', buttonText: 'Thêm', onClick: openAddCustomField,
    helpDesc: 'Tạo Custom Field từ form: label, fieldtype, options, insert after, default, fetch from, depends on, các thuộc tính. Cần quyền System Manager.' });
  M.register({ section: 'dev', group: 'form', id: 'customize', label: 'Customize Form', kind: 'action', buttonText: 'Mở', onClick: openCustomizeForm,
    helpDesc: 'Mở Customize Form của DocType hiện tại trong tab mới.' });
  M.register({ section: 'dev', group: 'form', id: 'version', label: 'Version', kind: 'action', buttonText: 'Xem', onClick: openVersion,
    shortcut: 'Alt+V',
    helpDesc: 'Xem lịch sử thay đổi (Version) của document: ai sửa, field nào đổi. Tab So sánh để chọn 2 bản Version và diff. Cần DocType bật Track Changes.' });

  setupInspectDelegation();
  setupChildInspect();
})();
