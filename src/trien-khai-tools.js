/**
 * MBWNext Extensions - trien-khai-tools.js
 * Tính năng cho đội triển khai: xuất danh sách field ra CSV, mở nhanh Import CSV,
 * xem Workflow states, xem Permission / Role, mở Report theo DocType.
 *
 * Phụ thuộc common.js (window.MBWNext). Đăng ký nút vào section 'trienkhai'.
 */
(function () {
  'use strict';

  var M = window.MBWNext;
  if (!M) { console.error('[MBWNext] common.js chưa load'); return; }

  M.addStyles(`
    .mbwnext-modal-wide { width: 680px; max-width: 95vw; }
    .mbwnext-perm-user-card {
      background: #f8f9fb; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
      border: 1px solid #eef0f2;
    }
    .mbwnext-perm-user-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .mbwnext-perm-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #2e7d32; color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .mbwnext-perm-user-name { font-weight: 600; font-size: 14px; color: #1f2933; }
    .mbwnext-perm-user-sub { font-size: 11px; color: #8a9aab; margin-top: 2px; }
    .mbwnext-perm-block-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
      color: #8a9aab; margin-bottom: 6px;
    }
    .mbwnext-perm-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .mbwnext-perm-chip {
      display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px;
      background: #eef1f5; color: #4a5568; border: 1px solid #e2e6ea; line-height: 1.4;
    }
    .mbwnext-perm-chip.active { background: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; font-weight: 600; }
    .mbwnext-perm-chip.muted { background: #fff; color: #9aa5b1; border-style: dashed; }
    .mbwnext-perm-my-rights { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8eaed; }
    .mbwnext-perm-table-wrap {
      border: 1px solid #eef0f2; border-radius: 8px; overflow: hidden;
    }
    .mbwnext-perm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .mbwnext-perm-table th {
      text-align: left; padding: 9px 12px; background: #f8f9fb; color: #6b7785;
      font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .4px;
      border-bottom: 1px solid #eef0f2;
    }
    .mbwnext-perm-table td {
      padding: 10px 12px; border-bottom: 1px solid #f5f6f7; vertical-align: middle;
      color: #1f2933; font-weight: 600; font-size: 12px;
    }
    .mbwnext-perm-table tr:last-child td { border-bottom: none; }
    .mbwnext-perm-table tr:hover td { background: #fafbfc; }
    .mbwnext-perm-table .col-role { font-weight: 600; white-space: nowrap; width: 1%; }
    .mbwnext-perm-table .col-level { width: 1%; white-space: nowrap; }
    .mbwnext-perm-level {
      display: inline-block; min-width: 22px; text-align: center; padding: 2px 7px;
      background: #eef1f5; border-radius: 4px; font-size: 11px; font-weight: 600; color: #6b7785;
    }
    .mbwnext-perm-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .mbwnext-perm-tag {
      display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600;
      background: #e8f5e9; color: #2e7d32; white-space: nowrap;
    }
    .mbwnext-perm-tag.dim { background: #fff3e0; color: #e65100; }
    .mbwnext-perm-none { color: #c5cdd5; font-size: 12px; }
    .mbwnext-perm-footer {
      margin-top: 14px; padding-top: 12px; border-top: 1px solid #eef0f2;
      display: flex; gap: 16px; flex-wrap: wrap;
    }
    .mbwnext-perm-footer a {
      font-size: 12px; color: #2e7d32; text-decoration: none; font-weight: 500;
    }
    .mbwnext-perm-footer a:hover { text-decoration: underline; }
    .mbwnext-wf-header {
      background: #f8f9fb; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
      border: 1px solid #eef0f2;
    }
    .mbwnext-wf-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mbwnext-wf-name { font-weight: 700; font-size: 14px; color: #1f2933; }
    .mbwnext-wf-pill {
      display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
    }
    .mbwnext-wf-pill.active { background: #e8f5e9; color: #2e7d32; }
    .mbwnext-wf-pill.inactive { background: #fff3e0; color: #e65100; }
    .mbwnext-wf-meta { margin-top: 8px; font-size: 12px; color: #6b7785; font-weight: 600; }
    .mbwnext-wf-meta b { color: #1f2933; font-weight: 700; }
    .mbwnext-wf-section { margin-bottom: 16px; }
    .mbwnext-wf-section:last-child { margin-bottom: 0; }
    .mbwnext-wf-state { font-weight: 700; color: #1f2933; }
    .mbwnext-wf-action { font-weight: 700; color: #2e7d32; }
    .mbwnext-wf-status {
      display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700;
      background: #eef1f5; color: #6b7785;
    }
    .mbwnext-rpt-filter {
      width: 100%; border: 1px solid #d1d8dd; border-radius: 6px; padding: 7px 10px;
      font-size: 13px; box-sizing: border-box; outline: none; margin-bottom: 10px;
    }
    .mbwnext-rpt-filter:focus { border-color: #2e7d32; }
    .mbwnext-rpt-count { font-size: 11px; color: #8a9aab; margin-bottom: 8px; font-weight: 600; }
  `);

  // ---------- Helper chung ----------

  function getDoctype() {
    var dt = window.cur_frm && window.cur_frm.doctype;
    if (!dt && window.frappe && window.frappe.get_route) {
      var route = window.frappe.get_route();
      if (route && route[0] === 'Form' && route[1]) dt = route[1];
    }
    if (!dt) {
      var match = window.location.pathname.match(/\/app\/([^/]+)/);
      if (match) dt = match[1].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    return dt;
  }

  function csvCell(val) {
    var s = (val === undefined || val === null) ? '' : String(val);
    s = s.replace(/\r?\n/g, ' ').replace(/"/g, '""');
    // Chặn CSV/formula injection khi mở file bằng Excel (=, +, -, @ ở đầu ô)
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s + '"';
  }

  function downloadCSV(filename, csvText) {
    var blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------- Xuất danh sách field ra CSV ----------

  function exportFieldsCSV() {
    var dt = window.cur_frm && window.cur_frm.doctype;
    if (!dt) { M.notify('Không có form nào đang mở', 'red'); return; }
    var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
    if (!meta || !meta.fields) { M.notify('Không lấy được metadata của ' + dt, 'red'); return; }

    var headers = ['idx', 'label', 'fieldname', 'fieldtype', 'options', 'mandatory', 'hidden', 'read_only', 'custom_field', 'default', 'depends_on', 'description'];
    var rows = [headers.map(csvCell).join(',')];

    meta.fields.forEach(function (f) {
      rows.push([
        f.idx, f.label, f.fieldname, f.fieldtype, f.options,
        f.reqd ? 'Yes' : '',
        f.hidden ? 'Yes' : '',
        f.read_only ? 'Yes' : '',
        (f.is_custom_field || f.custom) ? 'Yes' : '',
        f.default, f.depends_on, f.description,
      ].map(csvCell).join(','));
    });

    downloadCSV(dt.replace(/\s+/g, '_') + '_fields.csv', rows.join('\r\n'));
    M.notify('Đã xuất ' + meta.fields.length + ' field của ' + dt, 'green');
  }

  // ---------- Import CSV (mở Data Import) ----------

  function openImportCSV() {
    var dt = getDoctype();
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }
    var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
    if (meta && meta.allow_import === 0) { M.notify(dt + ' không cho phép import', 'orange'); return; }
    window.open('/app/data-import/new-data-import?reference_doctype=' + encodeURIComponent(dt), '_blank');
  }

  // ---------- Xem Workflow states ----------

  function viewWorkflow() {
    var dt = getDoctype();
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }
    var body = M.showModal('Workflow — ' + dt);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: { doctype: 'Workflow', filters: { document_type: dt }, fields: ['name', 'is_active', 'workflow_state_field'], limit_page_length: 10 },
      callback: function (r) {
        var list = r.message || [];
        if (!list.length) { body.innerHTML = '<div class="mbwnext-empty">DocType này chưa cấu hình Workflow.</div>'; return; }
        var wf = list.find(function (w) { return w.is_active; }) || list[0];
        window.frappe.call({
          method: 'frappe.client.get',
          args: { doctype: 'Workflow', name: wf.name },
          callback: function (r2) { renderWorkflow(body, r2.message); }
        });
      },
      error: function () { body.innerHTML = '<div class="mbwnext-empty">Lỗi khi tải Workflow.</div>'; }
    });
  }

  function docStatusLabel(status) {
    var labels = { 0: 'Draft', 1: 'Submitted', 2: 'Cancelled' };
    var n = Number(status);
    if (labels[n] !== undefined) return labels[n] + ' (' + n + ')';
    return String(status);
  }

  function renderRoleChip(roleStr) {
    if (!roleStr) return '<span class="mbwnext-perm-none">—</span>';
    return '<span class="mbwnext-perm-chip active">' + M.escHtml(roleStr) + '</span>';
  }

  function renderWorkflow(body, wf) {
    if (!wf) { body.innerHTML = '<div class="mbwnext-empty">Không đọc được Workflow.</div>'; return; }

    var html = '<div class="mbwnext-wf-header"><div class="mbwnext-wf-top">';
    html += '<span class="mbwnext-wf-name">' + M.escHtml(wf.name) + '</span>';
    html += '<span class="mbwnext-wf-pill ' + (wf.is_active ? 'active' : 'inactive') + '">' +
      (wf.is_active ? 'Active' : 'Inactive') + '</span></div>';
    if (wf.workflow_state_field) {
      html += '<div class="mbwnext-wf-meta">State field: <b>' + M.escHtml(wf.workflow_state_field) + '</b></div>';
    }
    html += '</div>';

    html += '<div class="mbwnext-wf-section">';
    html += '<div class="mbwnext-section-label" style="border:none;padding-top:0;margin-top:0">States</div>';
    if (wf.states && wf.states.length) {
      html += '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">';
      html += '<thead><tr><th>State</th><th>Doc Status</th><th>Allowed (edit)</th></tr></thead><tbody>';
      wf.states.forEach(function (s) {
        html += '<tr><td class="mbwnext-wf-state">' + M.escHtml(s.state) + '</td>';
        html += '<td><span class="mbwnext-wf-status">' + M.escHtml(docStatusLabel(s.doc_status)) + '</span></td>';
        html += '<td>' + renderRoleChip(s.allow_edit) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div class="mbwnext-empty">Không có state.</div>';
    }
    html += '</div>';

    html += '<div class="mbwnext-wf-section">';
    html += '<div class="mbwnext-section-label">Transitions</div>';
    if (wf.transitions && wf.transitions.length) {
      html += '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">';
      html += '<thead><tr><th>Từ</th><th>Action</th><th>Đến</th><th>Role</th></tr></thead><tbody>';
      wf.transitions.forEach(function (t) {
        html += '<tr><td class="mbwnext-wf-state">' + M.escHtml(t.state) + '</td>';
        html += '<td class="mbwnext-wf-action">' + M.escHtml(t.action) + '</td>';
        html += '<td class="mbwnext-wf-state">' + M.escHtml(t.next_state) + '</td>';
        html += '<td>' + renderRoleChip(t.allowed) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div class="mbwnext-empty">Không có transition.</div>';
    }
    html += '</div>';

    body.innerHTML = html;
  }

  // ---------- Xem Permission / Role ----------

  var PERM_COLS = [
    { key: 'read', label: 'Read' },
    { key: 'write', label: 'Write' },
    { key: 'create', label: 'Create' },
    { key: 'delete', label: 'Delete' },
    { key: 'submit', label: 'Submit' },
    { key: 'cancel', label: 'Cancel' },
    { key: 'import', label: 'Import' },
    { key: 'export', label: 'Export' },
  ];

  function getCurrentUserPerms(doctype) {
    var perms = {};
    var model = window.frappe && window.frappe.model;
    if (model) {
      if (model.can_read) perms.read = model.can_read(doctype);
      if (model.can_write) perms.write = model.can_write(doctype);
      if (model.can_create) perms.create = model.can_create(doctype);
      if (model.can_delete) perms.delete = model.can_delete(doctype);
      if (model.can_submit) perms.submit = model.can_submit(doctype);
      if (model.can_cancel) perms.cancel = model.can_cancel(doctype);
    }
    if (window.frappe && window.frappe.perm && window.frappe.perm.get_perm) {
      try {
        var doc = window.cur_frm && window.cur_frm.doctype === doctype ? window.cur_frm.doc : null;
        var gp = window.frappe.perm.get_perm(doctype, doc);
        if (gp) {
          PERM_COLS.forEach(function (col) {
            if (gp[col.key]) perms[col.key] = gp[col.key];
          });
        }
      } catch (e) { /* ignore */ }
    }
    return perms;
  }

  function getUserRoles() {
    if (window.frappe && window.frappe.boot && window.frappe.boot.user && window.frappe.boot.user.roles) {
      return window.frappe.boot.user.roles;
    }
    if (window.frappe && window.frappe.user_roles) return window.frappe.user_roles;
    return [];
  }

  function loadPermissions(dt, callback, onError) {
    var perms = null;
    if (window.cur_frm && window.cur_frm.doctype === dt && window.cur_frm.meta && window.cur_frm.meta.permissions) {
      perms = window.cur_frm.meta.permissions;
    }
    if (!perms || !perms.length) {
      var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
      if (meta && meta.permissions && meta.permissions.length) perms = meta.permissions;
    }
    if (perms && perms.length) {
      callback(perms);
      return;
    }
    window.frappe.call({
      method: 'frappe.client.get',
      args: { doctype: 'DocType', name: dt },
      callback: function (r) {
        callback((r.message && r.message.permissions) || []);
      },
      error: onError,
    });
  }

  function formatPermTags(p) {
    var tags = [];
    PERM_COLS.forEach(function (col) {
      if (p[col.key]) tags.push('<span class="mbwnext-perm-tag">' + col.label + '</span>');
    });
    if (p.if_owner) tags.push('<span class="mbwnext-perm-tag dim">Owner only</span>');
    return tags.length ? tags.join('') : '<span class="mbwnext-perm-none">—</span>';
  }

  function renderRoleChips(userRoles, permRoles) {
    var permSet = {};
    permRoles.forEach(function (r) { permSet[r] = true; });
    var matched = userRoles.filter(function (r) { return permSet[r]; });
    var html = '<div class="mbwnext-perm-chips">';
    if (matched.length) {
      matched.forEach(function (r) {
        html += '<span class="mbwnext-perm-chip active">' + M.escHtml(r) + '</span>';
      });
    } else {
      html += '<span class="mbwnext-perm-chip muted">Không khớp role nào trên DocType</span>';
    }
    var otherCount = userRoles.length - matched.length;
    if (otherCount > 0) {
      html += '<span class="mbwnext-perm-chip muted">+' + otherCount + ' role khác trên hệ thống</span>';
    }
    html += '</div>';
    return html;
  }

  function renderPermissions(body, dt, permissions) {
    var userRoles = getUserRoles();
    var userPerms = getCurrentUserPerms(dt);
    var userName = (window.frappe.boot && window.frappe.boot.user && window.frappe.boot.user.name) || '-';
    var initials = userName !== '-' ? userName.charAt(0).toUpperCase() : '?';
    var permRoles = [];
    permissions.forEach(function (p) {
      if (p.role && permRoles.indexOf(p.role) === -1) permRoles.push(p.role);
    });

    var html = '<div class="mbwnext-perm-user-card">';
    html += '<div class="mbwnext-perm-user-row">';
    html += '<div class="mbwnext-perm-avatar">' + M.escHtml(initials) + '</div>';
    html += '<div><div class="mbwnext-perm-user-name">' + M.escHtml(userName) + '</div>';
    html += '<div class="mbwnext-perm-user-sub">' + M.escHtml(dt) + '</div></div></div>';

    html += '<div class="mbwnext-perm-block-label">Role áp dụng cho DocType</div>';
    html += renderRoleChips(userRoles, permRoles);

    html += '<div class="mbwnext-perm-my-rights">';
    html += '<div class="mbwnext-perm-block-label">Quyền hiện tại của bạn</div>';
    html += '<div class="mbwnext-perm-tags">';
    var hasAny = false;
    PERM_COLS.forEach(function (col) {
      if (userPerms[col.key]) {
        hasAny = true;
        html += '<span class="mbwnext-perm-tag">' + col.label + '</span>';
      }
    });
    if (!hasAny) html += '<span class="mbwnext-perm-none">Không có quyền trên DocType này</span>';
    html += '</div></div></div>';

    html += '<div class="mbwnext-section-label">Permission theo Role</div>';
    if (!permissions.length) {
      html += '<div class="mbwnext-empty">Không có permission rule nào.</div>';
      body.innerHTML = html;
      return;
    }

    var sorted = permissions.slice().sort(function (a, b) {
      var byRole = (a.role || '').localeCompare(b.role || '');
      if (byRole !== 0) return byRole;
      return (a.permlevel || 0) - (b.permlevel || 0);
    });

    html += '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">';
    html += '<thead><tr><th>Role</th><th>Level</th><th>Quyền</th></tr></thead><tbody>';
    sorted.forEach(function (p) {
      html += '<tr><td class="col-role">' + M.escHtml(p.role || '') + '</td>';
      html += '<td class="col-level"><span class="mbwnext-perm-level">' + M.escHtml(String(p.permlevel || 0)) + '</span></td>';
      html += '<td><div class="mbwnext-perm-tags">' + formatPermTags(p) + '</div></td></tr>';
    });
    html += '</tbody></table></div>';

    html += '<div class="mbwnext-perm-footer">' +
      '<a class="mbwnext-link-btn" href="/app/role" target="_blank" rel="noopener">Quản lý Role</a>' +
      '</div>';

    body.innerHTML = html;
  }

  function viewPermissions() {
    var dt = getDoctype();
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }
    var body = M.showModal('Permission — ' + dt);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');
    loadPermissions(dt, function (permissions) {
      renderPermissions(body, dt, permissions);
    }, function () {
      body.innerHTML = '<div class="mbwnext-empty">Không đọc được permission. Thử mở form DocType hoặc cần quyền đọc DocType.</div>';
    });
  }

  // ---------- Mở Report theo DocType ----------

  function reportUrl(rpt) {
    return '/app/query-report/' + encodeURIComponent(rpt.name || rpt.report_name);
  }

  function openReportList() {
    var dt = getDoctype();
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }
    var body = M.showModal('Report — ' + dt);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Report',
        filters: { ref_doctype: dt, disabled: 0 },
        fields: ['name', 'report_name', 'report_type', 'is_standard'],
        order_by: 'report_name asc',
        limit_page_length: 100,
      },
      callback: function (r) {
        var list = r.message || [];
        if (!list.length) {
          body.innerHTML = '<div class="mbwnext-empty">Không có Report nào cho ' + M.escHtml(dt) + '.</div>';
          return;
        }

        function buildRows(filter) {
          var kw = (filter || '').toLowerCase();
          return list.filter(function (rpt) {
            return !kw || (rpt.report_name || rpt.name).toLowerCase().indexOf(kw) >= 0;
          }).map(function (rpt) {
            var url = reportUrl(rpt);
            var standard = rpt.is_standard
              ? '<span class="mbwnext-modal-pill">Yes</span>'
              : '<span class="mbwnext-perm-none">—</span>';
            return '<tr style="cursor:pointer" data-url="' + M.escHtml(url) + '">' +
              '<td class="mbwnext-wf-action" style="color:#1565c0">' + M.escHtml(rpt.report_name || rpt.name) + '</td>' +
              '<td>' + M.escHtml(rpt.report_type || '') + '</td>' +
              '<td style="text-align:center">' + standard + '</td></tr>';
          }).join('');
        }

        body.innerHTML =
          '<input id="mbwnext-rpt-filter" placeholder="Tìm report…" class="mbwnext-rpt-filter" />' +
          '<div id="mbwnext-rpt-count" class="mbwnext-rpt-count">' + list.length + ' report</div>' +
          '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">' +
          '<thead><tr><th>Tên Report</th><th>Loại</th><th style="text-align:center">Standard</th></tr></thead>' +
          '<tbody id="mbwnext-rpt-tbody">' + buildRows('') + '</tbody></table></div>';

        var filterInput = document.getElementById('mbwnext-rpt-filter');
        var tbody = document.getElementById('mbwnext-rpt-tbody');
        var countEl = document.getElementById('mbwnext-rpt-count');

        filterInput.addEventListener('input', function () {
          var rows = buildRows(filterInput.value);
          tbody.innerHTML = rows || '<tr><td colspan="3" class="mbwnext-empty">Không tìm thấy</td></tr>';
          var matched = tbody.querySelectorAll('tr[data-url]').length;
          countEl.textContent = matched + ' / ' + list.length + ' report';
        });
        filterInput.focus();

        body.addEventListener('click', function (e) {
          var row = e.target.closest('tr[data-url]');
          if (row) window.open(row.dataset.url, '_blank');
        });
      },
      error: function () { body.innerHTML = '<div class="mbwnext-empty">Lỗi khi tải danh sách Report.</div>'; }
    });
  }

  // ---------- Error Log ----------

  M.addStyles(`
    .mbwnext-err-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
    .mbwnext-err-badge-new { background: #fff3e0; color: #e65100; }
    .mbwnext-err-badge-seen { background: #eef1f5; color: #6b7785; }
    .mbwnext-err-detail-box { padding: 8px 0; background: #1a1a2e; border-radius: 8px; margin: 4px 0; }
    .mbwnext-err-detail-actions { display: flex; justify-content: flex-end; margin-bottom: 6px; padding: 0 10px; }
    .mbwnext-err-copy { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); color: #fff; }
    .mbwnext-err-copy:hover { background: rgba(255,255,255,.22); }
    .mbwnext-err-pre {
      margin: 0; padding: 0 10px 8px; max-height: 260px; overflow: auto;
      font-size: 11px; color: #e0e0e0;
      white-space: pre-wrap; word-break: break-word;
    }
    .mbwnext-link-btn {
      display: inline-block; padding: 5px 14px; border-radius: 8px;
      border: 1px solid #c8e6c9; background: #e8f5e9;
      color: #2e7d32 !important; font-size: 12px; font-weight: 700;
      text-decoration: none !important; transition: all .12s;
    }
    .mbwnext-link-btn:hover { background: #d7ecd8; border-color: #a5d6a7; }
  `);

  function formatDate(dt) {
    try {
      if (window.frappe && window.frappe.datetime && window.frappe.datetime.str_to_user) {
        return window.frappe.datetime.str_to_user(dt);
      }
    } catch (e) { /* ignore */ }
    return String(dt || '');
  }

  function firstLine(s) {
    s = String(s || '');
    var idx = s.indexOf('\n');
    return idx >= 0 ? s.slice(0, idx) : s;
  }

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function openErrorLog() {
    var body = M.showModal('Error Log gần đây');
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Error Log',
        fields: ['name', 'method', 'error', 'seen', 'creation'],
        order_by: 'creation desc',
        limit_page_length: 50,
      },
      callback: function (r) { renderErrorLog(body, r.message || []); },
      error: function () {
        body.innerHTML = '<div class="mbwnext-empty">Không đọc được Error Log (cần quyền System Manager).</div>';
      }
    });
  }

  function renderErrorLog(body, list) {
    if (!list.length) {
      body.innerHTML = '<div class="mbwnext-empty">Không có Error Log nào gần đây.</div>';
      return;
    }

    function buildRows(filter) {
      var kw = (filter || '').toLowerCase();
      return list.filter(function (e) {
        return !kw || (e.method || '').toLowerCase().indexOf(kw) >= 0 || (e.error || '').toLowerCase().indexOf(kw) >= 0;
      }).map(function (e) {
        var badge = e.seen
          ? '<span class="mbwnext-err-badge mbwnext-err-badge-seen">Đã xem</span>'
          : '<span class="mbwnext-err-badge mbwnext-err-badge-new">Mới</span>';
        return '<tr class="mbwnext-err-row" style="cursor:pointer" data-name="' + M.escHtml(e.name) + '">' +
          '<td style="white-space:nowrap;color:#6b7785;font-size:11px">' + M.escHtml(formatDate(e.creation)) + '</td>' +
          '<td style="font-weight:600">' + M.escHtml(truncate(e.method || '-', 40)) + '</td>' +
          '<td>' + M.escHtml(truncate(firstLine(e.error), 70)) + '</td>' +
          '<td style="text-align:center">' + badge + '</td></tr>';
      }).join('');
    }

    body.innerHTML =
      '<input id="mbwnext-err-filter" placeholder="Tìm theo method hoặc nội dung lỗi…" class="mbwnext-rpt-filter" />' +
      '<div id="mbwnext-err-count" class="mbwnext-rpt-count">' + list.length + ' error log</div>' +
      '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">' +
      '<thead><tr><th>Thời gian</th><th>Method</th><th>Lỗi</th><th style="text-align:center">Trạng thái</th></tr></thead>' +
      '<tbody id="mbwnext-err-tbody">' + buildRows('') + '</tbody></table></div>' +
      '<div class="mbwnext-perm-footer"><a class="mbwnext-link-btn" href="/app/error-log" target="_blank" rel="noopener">Mở Error Log List</a></div>';

    var filterInput = document.getElementById('mbwnext-err-filter');
    var tbody = document.getElementById('mbwnext-err-tbody');
    var countEl = document.getElementById('mbwnext-err-count');

    filterInput.addEventListener('input', function () {
      tbody.innerHTML = buildRows(filterInput.value) || '<tr><td colspan="4" class="mbwnext-empty">Không tìm thấy</td></tr>';
      var matched = tbody.querySelectorAll('tr[data-name]').length;
      countEl.textContent = matched + ' / ' + list.length + ' error log';
    });
    filterInput.focus();

    tbody.addEventListener('click', function (e) {
      var row = e.target.closest('tr.mbwnext-err-row');
      if (!row) return;
      var existing = row.nextElementSibling;
      if (existing && existing.classList.contains('mbwnext-err-detail')) { existing.remove(); return; }
      tbody.querySelectorAll('.mbwnext-err-detail').forEach(function (d) { d.remove(); });

      var entry = list.find(function (x) { return x.name === row.dataset.name; });
      if (!entry) return;
      var detailTr = document.createElement('tr');
      detailTr.className = 'mbwnext-err-detail';
      detailTr.innerHTML = '<td colspan="4"><div class="mbwnext-err-detail-box">' +
        '<div class="mbwnext-err-detail-actions"><button class="mbwnext-btn mbwnext-err-copy" data-action="copy-err">Copy</button></div>' +
        '<pre class="mbwnext-err-pre">' + M.escHtml(entry.error || '') + '</pre></div></td>';
      row.parentNode.insertBefore(detailTr, row.nextSibling);
      detailTr.querySelector('[data-action="copy-err"]').addEventListener('click', function (ev) {
        M.copyText(entry.error || '', ev.currentTarget, '✓ Copied');
      });
    });
  }

  // ---------- Linked With ----------

  function slugDoctype(dt) {
    try {
      if (window.frappe.router && window.frappe.router.slug) return window.frappe.router.slug(dt);
      if (window.frappe.scrub) return window.frappe.scrub(dt, '-');
    } catch (e) { /* fallthrough */ }
    return String(dt || '').toLowerCase().replace(/\s+/g, '-');
  }

  function openLinkedWith() {
    var frm = window.cur_frm;
    var dt = (frm && frm.doctype) || getDoctype();
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }

    var docname = null;
    if (frm && frm.docname && !(frm.is_new && frm.is_new())) {
      docname = frm.docname;
    }

    var body = M.showModal('Linked With — ' + dt + (docname ? ' ' + docname : ''));
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    // Frappe 15: get(doctype, docname) — bắt buộc có docname
    if (docname) {
      window.frappe.call({
        method: 'frappe.desk.form.linked_with.get',
        args: { doctype: dt, docname: docname },
        callback: function (r) {
          renderLinkedDocs(body, r.message || {});
        },
        error: function () {
          body.innerHTML = '<div class="mbwnext-empty">Không đọc được Linked With (thiếu quyền?).</div>';
        }
      });
      return;
    }

    // Chưa mở document: chỉ liệt kê DocType liên kết (schema)
    loadLinkedDoctypes(dt, body);
  }

  function loadLinkedDoctypes(dt, body) {
    window.frappe.call({
      method: 'frappe.desk.form.linked_with.get_linked_doctypes',
      args: { doctype: dt },
      callback: function (r) {
        var info = r.message || {};
        var keys = Object.keys(info);
        if (!keys.length) {
          body.innerHTML = '<div class="mbwnext-empty">Không tìm thấy DocType liên kết. Mở 1 document để xem bản ghi cụ thể.</div>';
          return;
        }
        body.innerHTML =
          '<div class="mbwnext-rpt-count">DocType liên kết với <b>' + M.escHtml(dt) + '</b> (mở 1 document để xem bản ghi cụ thể)</div>' +
          '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">' +
          '<thead><tr><th>DocType</th><th>Field / Quan hệ</th></tr></thead><tbody>' +
          keys.map(function (k) {
            var meta = info[k] || {};
            var detail = meta.fieldname || meta.child_doctype || meta.doctype_fieldname || '—';
            if (Array.isArray(detail)) detail = detail.join(', ');
            return '<tr><td class="mbwnext-wf-state">' + M.escHtml(k) + '</td><td>' +
              M.escHtml(String(detail)) + '</td></tr>';
          }).join('') +
          '</tbody></table></div>';
      },
      error: function () {
        body.innerHTML = '<div class="mbwnext-empty">Không đọc được Linked With. Hãy mở 1 document đã lưu rồi thử lại.</div>';
      }
    });
  }

  function renderLinkedDocs(body, linked) {
    // get() có thể trả về { docs: {...} } hoặc map doctype → list
    if (linked && linked.docs && typeof linked.docs === 'object') {
      linked = linked.docs;
    }

    var doctypes = Object.keys(linked || {}).filter(function (k) {
      var v = linked[k];
      return Array.isArray(v) ? v.length : (v && typeof v === 'object');
    });

    // Chuẩn hoá: một số version trả object thay vì array
    doctypes.forEach(function (k) {
      if (!Array.isArray(linked[k])) {
        linked[k] = linked[k] ? [linked[k]] : [];
      }
    });
    doctypes = doctypes.filter(function (k) { return linked[k].length; });

    if (!doctypes.length) {
      body.innerHTML = '<div class="mbwnext-empty">Không có document nào liên kết tới bản ghi này.</div>';
      return;
    }

    var total = doctypes.reduce(function (n, k) { return n + linked[k].length; }, 0);
    var html = '<input id="mbwnext-link-filter" placeholder="Tìm DocType hoặc name…" class="mbwnext-rpt-filter" />' +
      '<div id="mbwnext-link-count" class="mbwnext-rpt-count">' + total + ' document · ' + doctypes.length + ' DocType</div>' +
      '<div id="mbwnext-link-body"></div>';
    body.innerHTML = html;

    function build() {
      var kw = (document.getElementById('mbwnext-link-filter').value || '').toLowerCase().trim();
      var out = '';
      var shown = 0;
      doctypes.forEach(function (ldt) {
        var rows = linked[ldt].filter(function (doc) {
          if (!kw) return true;
          var name = doc.name || doc;
          return ldt.toLowerCase().indexOf(kw) >= 0 || String(name).toLowerCase().indexOf(kw) >= 0;
        });
        if (!rows.length) return;
        shown += rows.length;
        out += '<div style="margin-bottom:14px">' +
          '<div class="mbwnext-section-label" style="border:none;margin:0 0 6px;padding:0">' + M.escHtml(ldt) +
          ' <span style="font-weight:600;color:#9aa5b1">(' + rows.length + ')</span></div>' +
          '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table"><tbody>' +
          rows.slice(0, 30).map(function (doc) {
            var name = doc.name || doc;
            var url = '/app/' + slugDoctype(ldt) + '/' + encodeURIComponent(name);
            return '<tr style="cursor:pointer" data-url="' + M.escHtml(url) + '">' +
              '<td class="mbwnext-wf-action" style="color:#1565c0">' + M.escHtml(name) + '</td>' +
              '<td style="color:#6b7785;font-size:11px">' + M.escHtml(doc.modified || doc.status || '') + '</td></tr>';
          }).join('') +
          (rows.length > 30 ? '<tr><td colspan="2" class="mbwnext-empty">… và ' + (rows.length - 30) + ' nữa</td></tr>' : '') +
          '</tbody></table></div></div>';
      });
      document.getElementById('mbwnext-link-count').textContent = shown + ' / ' + total + ' document';
      document.getElementById('mbwnext-link-body').innerHTML = out || '<div class="mbwnext-empty">Không tìm thấy</div>';
    }

    document.getElementById('mbwnext-link-filter').addEventListener('input', build);
    body.addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-url]');
      if (row) window.open(row.dataset.url, '_blank');
    });
    build();
    document.getElementById('mbwnext-link-filter').focus();
  }

  // ---------- Custom Field list ----------

  function openCustomFieldList() {
    var dt = getDoctype();
    if (!dt && window.cur_frm) dt = window.cur_frm.doctype;
    if (!dt) { M.notify('Không xác định được DocType', 'red'); return; }

    var body = M.showModal('Custom Field — ' + dt);
    var modal = document.querySelector('#mbwnext-modal-overlay .mbwnext-modal');
    if (modal) modal.classList.add('mbwnext-modal-wide');

    function renderList(list) {
      if (!list.length) {
        body.innerHTML = '<div class="mbwnext-empty">DocType này chưa có Custom Field.</div>';
        return;
      }

      body.innerHTML =
        '<input id="mbwnext-cf-filter" placeholder="Tìm label / fieldname…" class="mbwnext-rpt-filter" />' +
        '<div id="mbwnext-cf-count" class="mbwnext-rpt-count">' + list.length + ' custom field</div>' +
        '<div class="mbwnext-perm-table-wrap"><table class="mbwnext-perm-table">' +
        '<thead><tr><th>Label</th><th>Fieldname</th><th>Type</th><th>After</th><th></th></tr></thead>' +
        '<tbody id="mbwnext-cf-tbody"></tbody></table></div>' +
        '<div class="mbwnext-perm-footer">' +
          '<a class="mbwnext-link-btn" href="/app/customize-form?doc_type=' + encodeURIComponent(dt) + '" target="_blank" rel="noopener">Customize Form</a>' +
        '</div>';

      var tbody = body.querySelector('#mbwnext-cf-tbody');
      var countEl = body.querySelector('#mbwnext-cf-count');
      var filterInput = body.querySelector('#mbwnext-cf-filter');

      function buildRows(kw) {
        kw = (kw || '').toLowerCase().trim();
        var matched = list.filter(function (f) {
          if (!kw) return true;
          return (f.label || '').toLowerCase().indexOf(kw) >= 0 ||
            (f.fieldname || '').toLowerCase().indexOf(kw) >= 0 ||
            (f.fieldtype || '').toLowerCase().indexOf(kw) >= 0;
        });
        countEl.textContent = matched.length + ' / ' + list.length + ' custom field';
        if (!matched.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="mbwnext-empty">Không tìm thấy</td></tr>';
          return;
        }
        tbody.innerHTML = matched.map(function (f) {
          var flags = [];
          if (f.reqd) flags.push('reqd');
          if (f.hidden) flags.push('hidden');
          return '<tr>' +
            '<td style="font-weight:700">' + M.escHtml(f.label || f.fieldname || '') +
            (flags.length ? '<div style="font-size:10px;color:#9aa5b1;margin-top:2px">' + M.escHtml(flags.join(', ')) + '</div>' : '') +
            '</td>' +
            '<td><code style="font-size:11px">' + M.escHtml(f.fieldname || '') + '</code></td>' +
            '<td>' + M.escHtml(f.fieldtype || '') + '</td>' +
            '<td style="font-size:11px;color:#6b7785">' + M.escHtml(f.insert_after || '—') + '</td>' +
            '<td><button class="mbwnext-btn" data-copy="' + M.escHtml(f.fieldname || '') + '">Copy</button></td>' +
            '</tr>';
        }).join('');
      }

      filterInput.addEventListener('input', function () { buildRows(filterInput.value); });
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-copy]');
        if (!btn) return;
        M.copyText(btn.getAttribute('data-copy') || '', btn, '✓');
      });
      buildRows('');
      filterInput.focus();
    }

    // Ưu tiên meta trên client (nhanh)
    var fromMeta = [];
    try {
      var meta = window.frappe.get_meta && window.frappe.get_meta(dt);
      if (meta && meta.fields) {
        fromMeta = meta.fields.filter(function (f) {
          return f.is_custom_field || f.custom;
        }).map(function (f) {
          return {
            label: f.label,
            fieldname: f.fieldname,
            fieldtype: f.fieldtype,
            insert_after: f.insert_after,
            reqd: f.reqd,
            hidden: f.hidden,
          };
        });
      }
    } catch (e) { /* ignore */ }

    if (fromMeta.length) {
      renderList(fromMeta);
      return;
    }

    window.frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Custom Field',
        filters: { dt: dt },
        fields: ['name', 'label', 'fieldname', 'fieldtype', 'insert_after', 'reqd', 'hidden', 'options'],
        order_by: 'idx asc',
        limit_page_length: 200,
      },
      callback: function (r) { renderList(r.message || []); },
      error: function () {
        body.innerHTML = '<div class="mbwnext-empty">Không đọc được Custom Field (thiếu quyền?).</div>';
      }
    });
  }

  // ---------- Đăng ký ----------

  M.register({ section: 'trienkhai', group: 'data', id: 'exportfields', label: 'Xuất field ra CSV', kind: 'action', buttonText: 'Xuất', onClick: exportFieldsCSV,
    helpDesc: 'Tải CSV metadata field (label, fieldname, fieldtype, mandatory, hidden…) làm tài liệu hoặc mapping data.' });
  M.register({ section: 'trienkhai', group: 'data', id: 'import', label: 'Import CSV', kind: 'action', buttonText: 'Import', onClick: openImportCSV,
    helpDesc: 'Mở Data Import với DocType hiện tại đã chọn sẵn. Cảnh báo nếu DocType không cho phép import.' });
  M.register({ section: 'trienkhai', group: 'data', id: 'customfields', label: 'Custom Field list', kind: 'action', buttonText: 'Xem', onClick: openCustomFieldList,
    helpDesc: 'Liệt kê toàn bộ Custom Field của DocType: label, fieldname, type, insert after. Có tìm kiếm và Copy fieldname.' });
  M.register({ section: 'trienkhai', group: 'xemnhanh', id: 'reports', label: 'Report', kind: 'action', buttonText: 'Xem', onClick: openReportList,
    helpDesc: 'Liệt kê Report theo DocType, tìm kiếm nhanh, click mở report tab mới. Hoạt động ở Form View và List View.' });
  M.register({ section: 'trienkhai', group: 'xemnhanh', id: 'workflow', label: 'Workflow states', kind: 'action', buttonText: 'Xem', onClick: viewWorkflow,
    helpDesc: 'Xem States (state, doc status, role edit) và Transitions (từ → action → đến, role) của workflow trên DocType.' });
  M.register({ section: 'trienkhai', group: 'xemnhanh', id: 'permissions', label: 'Permission / Role', kind: 'action', buttonText: 'Xem', onClick: viewPermissions,
    helpDesc: 'Xem quyền user hiện tại và bảng DocPerm theo role (read, write, create, delete, submit, import…).' });
  M.register({ section: 'trienkhai', group: 'xemnhanh', id: 'linkedwith', label: 'Linked With', kind: 'action', buttonText: 'Xem', onClick: openLinkedWith,
    helpDesc: 'Xem document / DocType liên kết với bản ghi hoặc DocType đang mở. Click mở tab mới.' });
  M.register({ section: 'trienkhai', group: 'xemnhanh', id: 'errorlog', label: 'Error Log gần đây', kind: 'action', buttonText: 'Xem', onClick: openErrorLog,
    helpDesc: '50 Error Log mới nhất toàn site, tìm theo method/nội dung lỗi, click 1 dòng để xem traceback đầy đủ + Copy. Cần quyền System Manager.' });
})();
