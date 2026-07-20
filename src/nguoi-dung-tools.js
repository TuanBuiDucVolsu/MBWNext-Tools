/**
 * MBWNext Extensions - nguoi-dung-tools.js
 * Tính năng cho người dùng cuối / vận hành: tìm field, copy link, lịch sử gần đây,
 * attachments, nhắc field bắt buộc, chế độ tập trung, phím tắt.
 *
 * Phụ thuộc common.js (window.MBWNext). Đăng ký nút vào section 'nguoidung'.
 */
(function () {
  'use strict';

  var M = window.MBWNext;
  if (!M) { console.error('[MBWNext] common.js chưa load'); return; }
  var state = M.state;

  var RECENT_KEY = 'mbwnext_recent_docs_v1';
  var RECENT_MAX = 20;

  M.addStyles(`
    .mbwnext-user-filter {
      width: 100%; box-sizing: border-box; border: 1px solid #d1d8dd; border-radius: 6px;
      padding: 7px 10px; font-size: 13px; outline: none; margin-bottom: 10px;
    }
    .mbwnext-user-filter:focus { border-color: #2e7d32; }
    .mbwnext-user-hint { font-size: 11px; color: #8a9aab; margin-bottom: 8px; font-weight: 600; }
    .mbwnext-user-list { border: 1px solid #eef0f2; border-radius: 8px; overflow: hidden; }
    .mbwnext-user-item {
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      padding: 9px 12px; border-bottom: 1px solid #f5f6f7; cursor: pointer;
    }
    .mbwnext-user-item:last-child { border-bottom: none; }
    .mbwnext-user-item:hover { background: #f8f9fb; }
    .mbwnext-user-item-title { font-weight: 700; color: #1f2933; font-size: 12.5px; }
    .mbwnext-user-item-sub { font-size: 11px; color: #8a9aab; margin-top: 2px; }
    .mbwnext-user-item-meta { font-size: 11px; color: #6b7785; white-space: nowrap; }
    .mbwnext-field-flash {
      outline: 2px solid #2e7d32 !important; outline-offset: 2px !important;
      background: rgba(46,125,50,.08) !important; transition: background .2s;
    }
    .mbwnext-req-empty { border-left: 3px solid #e53935 !important; background: rgba(229,57,53,.06) !important; }
    .mbwnext-focus-mode .navbar,
    .mbwnext-focus-mode .layout-side-section,
    .mbwnext-focus-mode .list-sidebar,
    .mbwnext-focus-mode .form-sidebar,
    .mbwnext-focus-mode .page-head .breadcrumb,
    .mbwnext-focus-mode #navbar-breadcrumbs {
      display: none !important;
    }
    .mbwnext-focus-mode .layout-main-section-wrapper,
    .mbwnext-focus-mode .layout-main-section {
      width: 100% !important; max-width: 100% !important;
    }
    .mbwnext-att-row {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 9px 0; border-bottom: 1px solid #f0f1f3;
    }
    .mbwnext-att-row:last-child { border-bottom: none; }
    .mbwnext-att-name { font-weight: 700; color: #1f2933; font-size: 12.5px; word-break: break-all; }
    .mbwnext-att-meta { font-size: 11px; color: #8a9aab; margin-top: 2px; }
    .mbwnext-shortcut-table td { font-weight: 600 !important; }
    .mbwnext-shortcut-kbd {
      display: inline-block; padding: 2px 7px; border-radius: 4px; background: #eef1f5;
      font-weight: 700; font-size: 11px; color: #1f2933; border: 1px solid #e2e6ea;
    }
  `);

  // ---------- Helpers ----------

  function slugDoctype(dt) {
    try {
      if (window.frappe.router && window.frappe.router.slug) return window.frappe.router.slug(dt);
      if (window.frappe.scrub) return window.frappe.scrub(dt, '-');
    } catch (e) { /* fallthrough */ }
    return String(dt || '').toLowerCase().replace(/\s+/g, '-');
  }

  function formUrl(doctype, docname) {
    var slug = slugDoctype(doctype);
    if (docname) return window.location.origin + '/app/' + slug + '/' + encodeURIComponent(docname);
    return window.location.origin + '/app/' + slug;
  }

  function formatDate(dt) {
    try {
      if (window.frappe && window.frappe.datetime && window.frappe.datetime.str_to_user) {
        return window.frappe.datetime.str_to_user(dt);
      }
    } catch (e) { /* ignore */ }
    return String(dt || '');
  }

  function flashField(el) {
    if (!el) return;
    el.classList.add('mbwnext-field-flash');
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {
      el.scrollIntoView(true);
    }
    setTimeout(function () { el.classList.remove('mbwnext-field-flash'); }, 2200);
  }

  function getFieldLabel(field) {
    var df = field && field.df;
    if (!df) return '';
    return df.label || df.fieldname || '';
  }

  /** Chuẩn hoá để tìm tiếng Việt không cần dấu: "hoa don" ≈ "Hóa đơn" */
  function normalizeSearch(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getFieldSearchLabels(field) {
    var df = field && field.df;
    if (!df) return [];
    var labels = [];
    var raw = df.label || '';
    if (raw) labels.push(raw);
    try {
      if (window.__ && raw) {
        var translated = window.__(raw);
        if (translated && translated !== raw) labels.push(translated);
      }
    } catch (e) { /* ignore */ }
    // Label đang hiện trên DOM (thường đã dịch sang tiếng Việt)
    try {
      var el = M.getFieldDomEl(field);
      if (el) {
        var labelEl = el.querySelector('.control-label, label');
        if (labelEl) {
          var domText = (labelEl.textContent || '').replace(/\s+/g, ' ').trim();
          // bỏ tag fieldname nếu có
          domText = domText.replace(/\s*[a-z0-9_]+$/i, function (m) {
            // chỉ cắt nếu giống fieldname
            return (m.trim() === df.fieldname) ? '' : m;
          }).trim();
          if (domText) labels.push(domText);
        }
      }
    } catch (e2) { /* ignore */ }
    if (df.fieldname) labels.push(df.fieldname);
    // unique
    var seen = {};
    return labels.filter(function (l) {
      var k = normalizeSearch(l);
      if (!k || seen[k]) return false;
      seen[k] = 1;
      return true;
    });
  }

  function isEmptyValue(v) {
    if (v === undefined || v === null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    return false;
  }

  // ---------- Recent history ----------

  function loadRecent() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveRecent(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))); } catch (e) { /* ignore */ }
  }

  function trackCurrentDoc() {
    var frm = window.cur_frm;
    if (!frm || !frm.doctype || !frm.doc) return;
    if (frm.is_new && frm.is_new()) return;
    var docname = frm.docname || frm.doc.name;
    if (!docname) return;

    var list = loadRecent().filter(function (x) {
      return !(x.doctype === frm.doctype && x.docname === docname);
    });
    list.unshift({
      doctype: frm.doctype,
      docname: docname,
      title: (frm.doc && (frm.doc.title || frm.doc.name)) || docname,
      at: Date.now(),
    });
    saveRecent(list);
  }

  var _lastTracked = null;
  function scanRecent(ctx) {
    if (!ctx.curFrm || !ctx.curFrm.docname) return;
    var key = ctx.doctype + '::' + ctx.curFrm.docname;
    if (key === _lastTracked) return;
    _lastTracked = key;
    trackCurrentDoc();
  }

  function openRecent() {
    var list = loadRecent();
    var body = M.showModal('Lịch sử gần đây');
    if (!list.length) {
      body.innerHTML = '<div class="mbwnext-empty">Chưa có document nào được ghi nhận. Mở vài form rồi quay lại.</div>';
      return;
    }

    body.innerHTML =
      '<div class="mbwnext-user-hint">' + list.length + ' mục · click để mở</div>' +
      '<div class="mbwnext-user-list" id="mbwnext-recent-list">' +
      list.map(function (item, i) {
        return '<div class="mbwnext-user-item" data-idx="' + i + '">' +
          '<div><div class="mbwnext-user-item-title">' + M.escHtml(item.title || item.docname) + '</div>' +
          '<div class="mbwnext-user-item-sub">' + M.escHtml(item.doctype) + ' · ' + M.escHtml(item.docname) + '</div></div>' +
          '<div class="mbwnext-user-item-meta">' + M.escHtml(item.at ? new Date(item.at).toLocaleString() : '') + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div style="margin-top:12px;text-align:right"><button class="mbwnext-btn" id="mbwnext-recent-clear">Xoá lịch sử</button></div>';

    body.querySelector('#mbwnext-recent-list').addEventListener('click', function (e) {
      var row = e.target.closest('.mbwnext-user-item');
      if (!row) return;
      var item = list[parseInt(row.dataset.idx, 10)];
      if (!item) return;
      M.closeModal();
      window.open(formUrl(item.doctype, item.docname), '_blank');
    });

    body.querySelector('#mbwnext-recent-clear').addEventListener('click', function () {
      saveRecent([]);
      body.innerHTML = '<div class="mbwnext-empty">Đã xoá lịch sử.</div>';
      M.notify('Đã xoá lịch sử gần đây', 'green');
    });
  }

  // ---------- Tìm field trên form ----------

  function openFindField() {
    var frm = window.cur_frm;
    if (!frm || !frm.fields_dict) { M.notify('Không có form nào đang mở', 'red'); return; }

    var fields = [];
    Object.keys(frm.fields_dict).forEach(function (fn) {
      var field = frm.fields_dict[fn];
      if (!field || !field.df) return;
      var ft = field.df.fieldtype;
      if (ft === 'Section Break' || ft === 'Column Break' || ft === 'Tab Break' || ft === 'Fold') return;
      var labels = getFieldSearchLabels(field);
      var displayLabel = labels[0] || fn;
      // ưu tiên label đã dịch / DOM nếu khác fieldname
      labels.forEach(function (l) {
        if (l && l !== fn && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(l)) {
          displayLabel = l;
        }
      });
      fields.push({
        fieldname: fn,
        label: displayLabel,
        labels: labels,
        searchText: normalizeSearch(labels.join(' ') + ' ' + fn),
        fieldtype: ft,
        reqd: !!field.df.reqd,
        el: M.getFieldDomEl(field),
      });
    });

    var body = M.showModal('Tìm field — ' + frm.doctype);
    body.innerHTML =
      '<input class="mbwnext-user-filter" id="mbwnext-find-q" placeholder="Label tiếng Việt / Anh hoặc fieldname…" autocomplete="off" />' +
      '<div class="mbwnext-user-hint" id="mbwnext-find-count">' + fields.length + ' field · tìm có/không dấu</div>' +
      '<div class="mbwnext-user-list" id="mbwnext-find-list"></div>';

    var input = body.querySelector('#mbwnext-find-q');
    var listEl = body.querySelector('#mbwnext-find-list');
    var countEl = body.querySelector('#mbwnext-find-count');

    function render(q) {
      var kw = normalizeSearch(q);
      var matched = fields.filter(function (f) {
        if (!kw) return true;
        return f.searchText.indexOf(kw) >= 0;
      }).slice(0, 40);

      countEl.textContent = matched.length + ' / ' + fields.length + ' field · tìm có/không dấu';
      if (!matched.length) {
        listEl.innerHTML = '<div class="mbwnext-empty" style="padding:12px">Không tìm thấy</div>';
        return;
      }
      listEl.innerHTML = matched.map(function (f, i) {
        return '<div class="mbwnext-user-item" data-idx="' + i + '">' +
          '<div><div class="mbwnext-user-item-title">' + M.escHtml(f.label || f.fieldname) +
          (f.reqd ? ' <span style="color:#e53935">*</span>' : '') + '</div>' +
          '<div class="mbwnext-user-item-sub">' + M.escHtml(f.fieldname) + ' · ' + M.escHtml(f.fieldtype) + '</div></div>' +
          '</div>';
      }).join('');
      listEl._matched = matched;
    }

    listEl.addEventListener('click', function (e) {
      var row = e.target.closest('.mbwnext-user-item');
      if (!row || !listEl._matched) return;
      var f = listEl._matched[parseInt(row.dataset.idx, 10)];
      if (!f) return;
      M.closeModal();
      flashField(f.el);
      try {
        if (frm.scroll_to_field) frm.scroll_to_field(f.fieldname);
      } catch (err) { /* ignore */ }
    });

    input.addEventListener('input', function () { render(input.value); });
    render('');
    setTimeout(function () { input.focus(); }, 50);
  }

  // ---------- Copy link chia sẻ ----------

  function copyShareLink() {
    var frm = window.cur_frm;
    if (!frm || !frm.doctype) { M.notify('Không có form nào đang mở', 'red'); return; }
    var url;
    if (frm.docname && !(frm.is_new && frm.is_new())) {
      url = formUrl(frm.doctype, frm.docname);
    } else {
      url = formUrl(frm.doctype) + '/new';
    }
    M.copyText(url).then(function () {
      M.notify('Đã copy link chia sẻ', 'green');
    }).catch(function () { M.notify('Copy thất bại', 'red'); });
  }

  // ---------- In nhanh ----------

  function openQuickPrint() {
    var frm = window.cur_frm;
    if (!frm || !frm.doc) { M.notify('Không có document nào đang mở', 'red'); return; }
    if (frm.is_new && frm.is_new()) { M.notify('Document chưa lưu, chưa in được', 'orange'); return; }

    var dt = frm.doctype;
    var name = frm.docname || frm.doc.name;
    var body = M.showModal('In nhanh — ' + name);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    function openPrint(format) {
      var url = '/printview?doctype=' + encodeURIComponent(dt) +
        '&name=' + encodeURIComponent(name) +
        '&trigger_print=0';
      if (format) url += '&format=' + encodeURIComponent(format);
      window.open(url, '_blank');
    }

    body.innerHTML =
      '<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="mbwnext-btn" id="mbwnext-print-default" style="background:#2e7d32;color:#fff;border-color:#2e7d32">In mặc định</button>' +
        '<button class="mbwnext-btn" id="mbwnext-print-dialog">Mở hộp thoại In</button>' +
      '</div>' +
      '<div class="mbwnext-user-hint">Hoặc chọn Print Format</div>' +
      '<div id="mbwnext-print-list"><div class="mbwnext-empty">Đang tải Print Format…</div></div>';

    body.querySelector('#mbwnext-print-default').addEventListener('click', function () {
      openPrint('');
    });
    body.querySelector('#mbwnext-print-dialog').addEventListener('click', function () {
      M.closeModal();
      try {
        if (typeof frm.print_doc === 'function') {
          frm.print_doc();
          return;
        }
      } catch (e) { /* fallthrough */ }
      openPrint('');
    });

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Print Format',
        filters: { doc_type: dt, disabled: 0 },
        fields: ['name', 'standard', 'print_format_type'],
        order_by: 'name asc',
        limit_page_length: 50,
      },
      callback: function (r) {
        var list = r.message || [];
        var box = body.querySelector('#mbwnext-print-list');
        if (!list.length) {
          box.innerHTML = '<div class="mbwnext-empty">Không có Print Format riêng — dùng In mặc định.</div>';
          return;
        }
        box.innerHTML = '<div class="mbwnext-user-list">' + list.map(function (pf, i) {
          return '<div class="mbwnext-user-item" data-idx="' + i + '">' +
            '<div><div class="mbwnext-user-item-title">' + M.escHtml(pf.name) + '</div>' +
            '<div class="mbwnext-user-item-sub">' + M.escHtml(pf.print_format_type || 'Print Format') +
            (pf.standard ? ' · Standard' : '') + '</div></div>' +
            '<button class="mbwnext-btn" data-action="print">In</button></div>';
        }).join('') + '</div>';
        box._list = list;
        box.addEventListener('click', function (e) {
          var row = e.target.closest('.mbwnext-user-item');
          if (!row || !box._list) return;
          var pf = box._list[parseInt(row.dataset.idx, 10)];
          if (pf) openPrint(pf.name);
        });
      },
      error: function () {
        body.querySelector('#mbwnext-print-list').innerHTML =
          '<div class="mbwnext-empty">Không tải được Print Format. Vẫn có thể In mặc định.</div>';
      }
    });
  }

  // ---------- Attachments ----------

  function openAttachments() {
    var frm = window.cur_frm;
    if (!frm || !frm.doc) { M.notify('Không có document nào đang mở', 'red'); return; }
    if (frm.is_new && frm.is_new()) { M.notify('Document chưa lưu, chưa có file đính kèm', 'orange'); return; }

    var body = M.showModal('Attachments — ' + frm.docname);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    function renderAtts(list) {
      if (!list.length) {
        body.innerHTML = '<div class="mbwnext-empty">Không có file đính kèm.</div>';
        return;
      }
      body.innerHTML = '<div class="mbwnext-user-hint">' + list.length + ' file</div>' +
        list.map(function (f) {
          var name = f.file_name || f.name || 'file';
          var url = f.file_url || '';
          return '<div class="mbwnext-att-row">' +
            '<div><div class="mbwnext-att-name">' + M.escHtml(name) + '</div>' +
            '<div class="mbwnext-att-meta">' + M.escHtml(f.file_size ? String(f.file_size) + ' bytes · ' : '') +
            M.escHtml(formatDate(f.creation)) + '</div></div>' +
            (url
              ? '<a class="mbwnext-btn" href="' + M.escHtml(url) + '" target="_blank" rel="noopener">Mở</a>'
              : '') +
            '</div>';
        }).join('');
    }

    var fromDocinfo = (frm.docinfo && frm.docinfo.attachments) || [];
    if (fromDocinfo.length) {
      renderAtts(fromDocinfo);
      return;
    }

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'File',
        filters: {
          attached_to_doctype: frm.doctype,
          attached_to_name: frm.docname,
        },
        fields: ['name', 'file_name', 'file_url', 'file_size', 'creation', 'is_private'],
        order_by: 'creation desc',
        limit_page_length: 50,
      },
      callback: function (r) { renderAtts(r.message || []); },
      error: function () {
        body.innerHTML = '<div class="mbwnext-empty">Không đọc được danh sách file.</div>';
      }
    });
  }

  // ---------- Quyền của tôi (tóm tắt) ----------

  function openMyPerms() {
    var frm = window.cur_frm;
    var dt = frm && frm.doctype;
    if (!dt && window.frappe && window.frappe.get_route) {
      var route = window.frappe.get_route();
      if (route && (route[0] === 'Form' || route[0] === 'List') && route[1]) dt = route[1];
    }
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }

    var model = window.frappe && window.frappe.model;
    var perms = [
      { key: 'read', label: 'Read', ok: model && model.can_read && model.can_read(dt) },
      { key: 'write', label: 'Write', ok: model && model.can_write && model.can_write(dt) },
      { key: 'create', label: 'Create', ok: model && model.can_create && model.can_create(dt) },
      { key: 'delete', label: 'Delete', ok: model && model.can_delete && model.can_delete(dt) },
      { key: 'submit', label: 'Submit', ok: model && model.can_submit && model.can_submit(dt) },
      { key: 'cancel', label: 'Cancel', ok: model && model.can_cancel && model.can_cancel(dt) },
    ];

    var user = (window.frappe.boot && window.frappe.boot.user && window.frappe.boot.user.name) || '-';
    var roles = (window.frappe.boot && window.frappe.boot.user && window.frappe.boot.user.roles) ||
      window.frappe.user_roles || [];

    var body = M.showModal('Quyền của tôi — ' + dt);
    body.innerHTML =
      '<div style="margin-bottom:12px"><b>' + M.escHtml(user) + '</b>' +
      '<div class="mbwnext-user-hint" style="margin:4px 0 0">' + M.escHtml(dt) + '</div></div>' +
      '<div class="mbwnext-user-hint">Quyền trên DocType</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">' +
      perms.map(function (p) {
        return '<span class="mbwnext-modal-pill" style="' +
          (p.ok ? '' : 'background:#f5f6f8;color:#9aa5b1') + '">' +
          M.escHtml(p.label) + (p.ok ? '' : ' ✕') + '</span>';
      }).join('') +
      '</div>' +
      '<div class="mbwnext-user-hint">Roles (' + roles.length + ')</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px">' +
      roles.slice(0, 30).map(function (r) {
        return '<span class="mbwnext-modal-pill" style="background:#eef1f5;color:#4a5568">' + M.escHtml(r) + '</span>';
      }).join('') +
      (roles.length > 30 ? '<span class="mbwnext-user-hint">+' + (roles.length - 30) + ' nữa</span>' : '') +
      '</div>';
  }

  // ---------- Nhắc field bắt buộc trống ----------

  function checkRequiredEmpty() {
    var frm = window.cur_frm;
    if (!frm || !frm.doc || !frm.fields_dict) { M.notify('Không có form nào đang mở', 'red'); return; }

    var missing = [];
    Object.keys(frm.fields_dict).forEach(function (fn) {
      var field = frm.fields_dict[fn];
      if (!field || !field.df || !field.df.reqd) return;
      var ft = field.df.fieldtype;
      if (ft === 'Section Break' || ft === 'Column Break' || ft === 'Tab Break' || ft === 'Fold' || ft === 'Table') return;
      // bỏ field đang ẩn / phụ thuộc không hiện
      if (field.df.hidden) return;
      try {
        if (field.disp_status && field.disp_status === 'None') return;
      } catch (e) { /* ignore */ }

      var val = frm.doc[fn];
      if (isEmptyValue(val)) {
        missing.push({
          fieldname: fn,
          label: getFieldLabel(field),
          el: M.getFieldDomEl(field),
        });
      }
    });

    // highlight
    document.querySelectorAll('.mbwnext-req-empty').forEach(function (el) {
      el.classList.remove('mbwnext-req-empty');
    });
    missing.forEach(function (m) {
      if (m.el) m.el.classList.add('mbwnext-req-empty');
    });

    if (!missing.length) {
      M.notify('Không còn field bắt buộc trống', 'green');
      return;
    }

    var body = M.showModal('Field bắt buộc trống — ' + missing.length);
    body.innerHTML =
      '<div class="mbwnext-user-hint">Click để nhảy tới field</div>' +
      '<div class="mbwnext-user-list">' +
      missing.map(function (m, i) {
        return '<div class="mbwnext-user-item" data-idx="' + i + '">' +
          '<div><div class="mbwnext-user-item-title">' + M.escHtml(m.label || m.fieldname) +
          ' <span style="color:#e53935">*</span></div>' +
          '<div class="mbwnext-user-item-sub">' + M.escHtml(m.fieldname) + '</div></div></div>';
      }).join('') +
      '</div>';

    body.querySelector('.mbwnext-user-list').addEventListener('click', function (e) {
      var row = e.target.closest('.mbwnext-user-item');
      if (!row) return;
      var m = missing[parseInt(row.dataset.idx, 10)];
      if (!m) return;
      M.closeModal();
      flashField(m.el);
      try { if (frm.scroll_to_field) frm.scroll_to_field(m.fieldname); } catch (err) { /* ignore */ }
    });
  }

  // ---------- Focus mode ----------

  function onFocusToggle(on) {
    document.documentElement.classList.toggle('mbwnext-focus-mode', !!on);
    document.body.classList.toggle('mbwnext-focus-mode', !!on);
    M.notify(on ? 'Đã bật chế độ tập trung' : 'Đã tắt chế độ tập trung', 'blue');
  }

  // ---------- Phím tắt (prefix Alt) ----------

  var SHORTCUT_ROWS = [
    { keys: 'Alt+M', desc: 'Mở danh sách Tool' },
    { keys: 'Alt+/', desc: 'Tìm field trên form' },
    { keys: 'Alt+L', desc: 'Copy link chia sẻ' },
    { keys: 'Alt+H', desc: 'Lịch sử gần đây' },
    { keys: 'Alt+A', desc: 'Attachments' },
    { keys: 'Alt+Y', desc: 'In nhanh' },
    { keys: 'Alt+C', desc: 'Custom Field list' },
    { keys: 'Alt+R', desc: 'Field bắt buộc trống' },
    { keys: 'Alt+F', desc: 'Bật / tắt chế độ tập trung' },
    { keys: 'Alt+J', desc: 'Copy doc JSON (Dev)' },
    { keys: 'Alt+I', desc: 'Inspect field on/off (Dev)' },
    { keys: 'Alt+N', desc: 'Hiện fieldname on/off (Dev)' },
    { keys: 'Alt+G', desc: 'Quick get_doc (Dev)' },
    { keys: 'Alt+V', desc: 'Version (Dev)' },
    { keys: 'Alt+K', desc: 'Xem bảng phím tắt' },
    { keys: 'Esc', desc: 'Đóng modal đang mở' },
  ];

  function openShortcutHelp() {
    var body = M.showModal('Phím tắt');
    body.innerHTML =
      '<table class="mbwnext-shortcut-table">' +
        '<tr><th>Phím</th><th>Hành động</th></tr>' +
        SHORTCUT_ROWS.map(function (row) {
          var parts = row.keys.split('+').map(function (k) {
            return '<span class="mbwnext-shortcut-kbd">' + M.escHtml(k.trim()) + '</span>';
          }).join(' + ');
          return '<tr><td>' + parts + '</td><td>' + M.escHtml(row.desc) + '</td></tr>';
        }).join('') +
      '</table>' +
      '<p class="mbwnext-user-hint" style="margin-top:12px">Phím tắt Alt luôn bật. Esc đóng modal. Khi đang gõ trong ô nhập, chỉ Alt+M và Alt+K còn chạy.</p>';
  }

  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return !!(el.closest && el.closest('[contenteditable="true"]'));
  }

  function clickFeature(id) {
    var btn = document.querySelector('#mbwnext-panel [data-feature="' + id + '"]');
    if (btn) btn.click();
    else M.notify('Không tìm thấy tính năng: ' + id, 'orange');
  }

  function toggleFocusMode() {
    var btn = document.querySelector('#mbwnext-panel [data-feature="focus"]');
    if (btn) {
      btn.click();
      return;
    }
    state.focusMode = !state.focusMode;
    onFocusToggle(state.focusMode);
  }

  function setupShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Esc → luôn đóng modal (kể cả khi đang gõ)
      if (e.key === 'Escape') {
        if (document.getElementById('mbwnext-modal-overlay')) {
          M.closeModal();
          e.preventDefault();
        } else {
          var api = document.querySelector('.mbwnext-api-overlay.open');
          if (api) api.classList.remove('open');
        }
        return;
      }

      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      // Khi đang gõ trong ô input: chỉ cho Alt+M và Alt+K
      var typing = isTypingTarget(e.target);
      var code = e.code;
      var key = e.key;
      var isHelp = code === 'KeyK' || key === 'k' || key === 'K';
      var isPanel = code === 'KeyM' || key === 'm' || key === 'M';

      if (typing && !isPanel && !isHelp) return;

      var ran = false;

      if (isPanel) {
        if (typeof M.togglePanel === 'function') M.togglePanel();
        ran = true;
      } else if (isHelp) {
        openShortcutHelp();
        ran = true;
      } else if (code === 'Slash' && !e.shiftKey) {
        openFindField();
        ran = true;
      } else if (code === 'KeyL' && !e.shiftKey) {
        copyShareLink();
        ran = true;
      } else if (code === 'KeyH' && !e.shiftKey) {
        openRecent();
        ran = true;
      } else if (code === 'KeyA' && !e.shiftKey) {
        openAttachments();
        ran = true;
      } else if ((code === 'KeyY' || key === 'y' || key === 'Y') && !e.shiftKey) {
        // Không dùng Alt+P: trình duyệt/OS mở hộp thoại In hệ thống (menu File→Print)
        openQuickPrint();
        ran = true;
      } else if (code === 'KeyC' && !e.shiftKey) {
        clickFeature('customfields');
        ran = true;
      } else if (code === 'KeyR' && !e.shiftKey) {
        checkRequiredEmpty();
        ran = true;
      } else if (code === 'KeyF' && !e.shiftKey) {
        toggleFocusMode();
        ran = true;
      } else if (code === 'KeyJ' && !e.shiftKey) {
        clickFeature('docjson');
        ran = true;
      } else if (code === 'KeyI' && !e.shiftKey) {
        clickFeature('inspect');
        ran = true;
      } else if (code === 'KeyN' && !e.shiftKey) {
        clickFeature('fieldnames');
        ran = true;
      } else if (code === 'KeyG' && !e.shiftKey) {
        clickFeature('getdoc');
        ran = true;
      } else if (code === 'KeyV' && !e.shiftKey) {
        clickFeature('version');
        ran = true;
      }

      if (ran) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    }, true);
  }

  // ---------- Đăng ký ----------

  M.register({
    section: 'nguoidung', group: 'navigate', id: 'findfield', label: 'Tìm field trên form',
    kind: 'action', buttonText: 'Tìm', onClick: openFindField,
    helpDesc: 'Tìm field theo label tiếng Việt/Anh (có hoặc không dấu) hoặc fieldname, click để cuộn tới và tô sáng trên form.'
  });
  M.register({
    section: 'nguoidung', group: 'navigate', id: 'recent', label: 'Lịch sử gần đây',
    kind: 'action', buttonText: 'Xem', onClick: openRecent,
    helpDesc: 'Danh sách document vừa mở trên trình duyệt này (lưu local). Click để mở tab mới.'
  });
  M.register({
    section: 'nguoidung', group: 'navigate', id: 'sharelink', label: 'Copy link chia sẻ',
    kind: 'action', buttonText: 'Copy', onClick: copyShareLink,
    helpDesc: 'Copy link document đang mở để gửi đồng nghiệp.'
  });

  M.register({
    section: 'nguoidung', group: 'info', id: 'quickprint', label: 'In nhanh',
    kind: 'action', buttonText: 'In', onClick: openQuickPrint,
    helpDesc: 'Mở printview hoặc chọn Print Format của document đang mở.'
  });
  M.register({
    section: 'nguoidung', group: 'info', id: 'attachments', label: 'Attachments',
    kind: 'action', buttonText: 'Xem', onClick: openAttachments,
    helpDesc: 'Liệt kê file đính kèm của document, click Mở để xem/tải.'
  });
  M.register({
    section: 'nguoidung', group: 'info', id: 'myperms', label: 'Quyền của tôi',
    kind: 'action', buttonText: 'Xem', onClick: openMyPerms,
    helpDesc: 'Tóm tắt quyền Read/Write/Create/… và roles của bạn trên DocType hiện tại.'
  });

  M.register({
    section: 'nguoidung', group: 'helpers', id: 'reqempty', label: 'Field bắt buộc trống',
    kind: 'action', buttonText: 'Kiểm tra', onClick: checkRequiredEmpty,
    helpDesc: 'Liệt kê field bắt buộc còn trống, tô đỏ trên form, click để nhảy tới.'
  });
  M.register({
    section: 'nguoidung', group: 'helpers', id: 'focus', label: 'Chế độ tập trung',
    kind: 'toggle', stateKey: 'focusMode', poll: false, onToggle: onFocusToggle,
    helpDesc: 'Ẩn tạm navbar / sidebar Frappe để form rộng hơn, dễ làm việc.'
  });
  M.register({
    section: 'nguoidung', group: 'helpers', id: 'shortcuthelp', label: 'Xem bảng phím tắt',
    kind: 'action', buttonText: 'Xem', onClick: openShortcutHelp,
    helpDesc: 'Xem danh sách phím tắt Alt (luôn bật). Esc đóng modal.'
  });

  // Ghi lịch sử khi đổi document (poll nhẹ qua onScan luôn chạy nếu có toggle poll —
  // đăng ký scanner riêng không cần poll flag)
  M.onScan(scanRecent);
  // bật polling tối thiểu: dùng interval riêng cho recent
  setInterval(function () {
    try { scanRecent({ curFrm: window.cur_frm, doctype: window.cur_frm && window.cur_frm.doctype }); } catch (e) { /* ignore */ }
  }, 2000);

  // restore focus mode nếu đã bật trước đó
  if (state.focusMode) {
    document.documentElement.classList.add('mbwnext-focus-mode');
    document.body.classList.add('mbwnext-focus-mode');
  }

  setupShortcuts();
})();
