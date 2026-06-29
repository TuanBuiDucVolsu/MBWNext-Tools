# MBWNext Dev Tools

Chrome extension (Manifest V3) hỗ trợ debug/dev trên các site Frappe/ERPNext của MBWNext.

## Tính năng v1.1.0

- **Hiện field ẩn** — field có `hidden = 1` được hiện ra với viền trái đỏ + mờ đi (opacity), dễ nhận biết mà không rối mắt.
- **Đánh dấu Custom Field** — custom field được đánh dấu viền trái xanh dương, phân biệt nhanh field gốc vs field thêm qua Customize Form / app riêng.
- **Xem chi tiết field** — bật "Inspect", hover qua field để xem tooltip (fieldname, fieldtype, options, mandatory, hidden, custom field, depends_on...). Click vào field để pin tooltip cố định, có nút **Copy fieldname** và **Copy All**.
- **Import CSV** — mở nhanh trang Data Import với DocType hiện tại đã chọn sẵn.
- **Quick API Call** — gọi `frappe.call` trực tiếp từ dialog, nhập method + args (JSON), xem kết quả + copy.
- **Customize Form** — 1 click mở Customize Form đúng DocType đang xem (mở tab mới).

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
├── manifest.json          # Config extension
├── common.js              # Hạ tầng chung: state, helper, panel UI, polling engine
├── dev-tools.js           # Tính năng cho lập trình: field ẩn, custom field, inspect,
│                          #   fieldname, copy doc JSON, Quick API Call, Customize Form
├── trien-khai-tools.js    # Tính năng cho triển khai: field bắt buộc, xuất CSV, import CSV
├── icon48.png             # Icon extension 48px
├── icon128.png            # Icon extension 128px
└── README.md
```

### Thêm tính năng mới

Trong `dev-tools.js` hoặc `trien-khai-tools.js`, gọi `MBWNext.register(...)`:

```js
// Nút bật/tắt (toggle), tự tham gia polling nếu có scan
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

Helper dùng chung qua `MBWNext`: `notify`, `escHtml`, `copyText`, `addStyles`, `getFieldDomEl`.
