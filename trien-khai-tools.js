/**
 * MBWNext Dev Tools - trien-khai-tools.js
 * Tính năng cho đội triển khai: xuất danh sách field ra CSV, mở nhanh Import CSV,
 * xem Workflow states, xem Permission / Role.
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
    var dt = window.cur_frm && window.cur_frm.doctype;
    if (!dt) { M.notify('Không có form nào đang mở', 'red'); return; }
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
      '<a href="/app/role" target="_blank" rel="noopener">Quản lý Role</a>' +
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

  // ---------- Đăng ký ----------

  M.register({ section: 'trienkhai', id: 'exportfields', label: 'Xuất field ra CSV', kind: 'action', buttonText: 'Xuất', onClick: exportFieldsCSV });
  M.register({ section: 'trienkhai', id: 'import', label: 'Import CSV', kind: 'action', buttonText: 'Import', onClick: openImportCSV });
  M.register({ section: 'trienkhai', id: 'workflow', label: 'Xem Workflow states', kind: 'action', buttonText: 'Xem', onClick: viewWorkflow });
  M.register({ section: 'trienkhai', id: 'permissions', label: 'Xem Permission / Role', kind: 'action', buttonText: 'Xem', onClick: viewPermissions });
})();
