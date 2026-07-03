# MBWNext Extensions

Chrome extension (Manifest V3) hỗ trợ debug/dev/triển khai trên các site Frappe/ERPNext của MBWNext.

## Tính năng

### Lập trình (Dev)

- **Hiện field ẩn** — field có `hidden = 1` hiện ra với viền trái đỏ + mờ đi, debug nhanh field nào đang bị ẩn.
- **Đánh dấu Custom Field** — viền trái xanh dương cho custom field, phân biệt nhanh field gốc vs field thêm qua Customize Form / app riêng.
- **Xem chi tiết field (hover)** — hover qua field để xem tooltip (fieldname, fieldtype, options, mandatory, hidden, custom, depends_on…). Click để pin tooltip, có nút **Copy fieldname** và **Copy All**.
- **Hiện fieldname** — in tag fieldname cạnh label mỗi field (cả form cha, bảng con, dialog). Click tag để copy.
- **Copy doc JSON** — copy toàn bộ `cur_frm.doc` dạng JSON vào clipboard.
- **Quick API Call** — gọi `frappe.call` trực tiếp từ dialog: nhập method + args (JSON), xem kết quả + copy.
- **Thêm Custom Field** — tạo custom field trực tiếp từ form, đầy đủ: label, fieldtype, options, insert after, default, fetch from, depends on, các thuộc tính (mandatory, hidden, read only…).
- **Customize Form** — mở Customize Form đúng DocType đang xem (tab mới).
- **Version / Changelog** — xem lịch sử thay đổi (`Version`) của document đang mở: field nào đổi giá trị, dòng con thêm/xoá/sửa, ai sửa lúc nào. Cần DocType bật Track Changes.

### Triển khai

- **Xuất field ra CSV** — tải file CSV đầy đủ field của doctype (label, fieldname, fieldtype, options, mandatory, hidden…). Dùng làm tài liệu hoặc mapping data.
- **Import CSV** — mở trang Data Import với doctype hiện tại đã chọn sẵn.
- **Report** — liệt kê tất cả Report có ref_doctype là doctype đang xem, có filter tìm kiếm, click mở tab mới. Hoạt động cả ở List View và Form View.
- **Xem Workflow states** — hiện bảng States + Transitions của workflow active trên doctype. Hoạt động cả ở List View.
- **Xem Permission / Role** — hiện quyền user hiện tại và bảng DocPerm đầy đủ (role, level, read/write/create/delete/submit…).
- **Error Log gần đây** — 50 Error Log mới nhất toàn site, tìm theo method/nội dung lỗi, click 1 dòng để xem traceback đầy đủ + Copy. Không cần mở DocType nào, hoạt động ở mọi trang.

### Chung

- **Nút hướng dẫn (!)** — trong panel header, click mở popup mô tả chi tiết tất cả tính năng.
- Panel tự phát hiện DocType từ Form View hoặc List View.
- Trạng thái toggle được lưu theo domain qua `localStorage`.

## Cài đặt

1. Mở `chrome://extensions`
2. Bật **Developer mode** (góc trên phải)
3. Bấm **Load unpacked**, chọn thư mục `mbwnext-tools`
4. Bật toggle site access cho domain bạn cần dùng
5. Reload lại site — sẽ thấy nút tròn **"M"** ở góc dưới phải

> Yêu cầu Chrome ≥ 111 (dùng `"world": "MAIN"` để truy cập trực tiếp `window.frappe`, `window.cur_frm`).

## Domain hỗ trợ

```
https://*.mbwnext.com/*
http://*.mbwnext.com/*
http://localhost/*
http://127.0.0.1/*
```

Thêm domain khác bằng cách sửa mảng `matches` trong `manifest.json`, rồi reload extension.

## Cấu trúc

Code tách theo nhóm người dùng, chung 1 panel:

```
mbwnext-tools/
├── manifest.json              # Config extension
├── src/
│   ├── common.js              # Hạ tầng chung: state, helper, panel UI, polling engine, help modal
│   ├── dev-tools.js           # Tính năng Dev: field ẩn, custom field, inspect, fieldname,
│   │                          #   copy doc JSON, Quick API Call, thêm custom field, Customize Form
│   └── trien-khai-tools.js    # Tính năng Triển khai: xuất CSV, import CSV, report, workflow, permission
├── icons/
│   ├── icon48.png             # Icon extension 48px
│   └── icon128.png            # Icon extension 128px
└── README.md
```

### Thêm tính năng mới

Trong `dev-tools.js` hoặc `trien-khai-tools.js`, gọi `MBWNext.register(...)`:

```js
// Nút bật/tắt (toggle)
MBWNext.register({
  section: 'dev',              // 'dev' hoặc 'trienkhai'
  id: 'my-toggle',
  label: 'Tên hiển thị',
  kind: 'toggle',
  stateKey: 'myFlag',          // key lưu trong state (tự persist)
  poll: true,                  // giữ polling khi bật
  scan: function (ctx) {       // chạy mỗi nhịp; ctx.eachField, ctx.isCustom, ctx.meta...
    ctx.eachField(function (el, field, fieldname) { /* ... */ });
  },
});

// Nút hành động (action)
MBWNext.register({
  section: 'trienkhai',
  id: 'my-action',
  label: 'Tên hiển thị',
  kind: 'action',
  buttonText: 'Chạy',
  onClick: function () { /* ... */ },
});
```

Helper dùng chung qua `MBWNext`: `notify`, `escHtml`, `copyText`, `addStyles`, `getFieldDomEl`, `showModal`, `closeModal`.

---

**Made By TuanBD**
