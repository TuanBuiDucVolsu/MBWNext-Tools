# MBWNext Extensions

Chrome extension (Manifest V3) hỗ trợ debug/dev/triển khai trên các site Frappe/ERPNext của MBWNext.

## Tính năng

### Người dùng / Vận hành

- **Tìm field trên form** — tìm theo label/fieldname, click cuộn tới và tô sáng.
- **Lịch sử gần đây** — document vừa mở (lưu local trên trình duyệt), click mở tab mới.
- **Copy link chia sẻ** — copy link document đang mở để gửi đồng nghiệp.
- **Attachments** — danh sách file đính kèm, mở/tải nhanh.
- **Quyền của tôi** — tóm tắt Read/Write/Create/… và roles trên DocType hiện tại.
- **Field bắt buộc trống** — liệt kê field `reqd` còn trống, tô đỏ, click nhảy tới.
- **Chế độ tập trung** — ẩn tạm navbar/sidebar Frappe cho form rộng hơn.
- **Phím tắt** — luôn bật (`Alt+M` panel, `Alt+/` tìm field…). `Esc` đóng modal. Nút **Xem bảng phím tắt** để xem đủ danh sách.

### Lập trình (Dev)

- **Hiện field ẩn** — field có `hidden = 1` hiện ra với viền trái đỏ + mờ đi, debug nhanh field nào đang bị ẩn.
- **Đánh dấu Custom Field** — viền trái xanh dương cho custom field, phân biệt nhanh field gốc vs field thêm qua Customize Form / app riêng.
- **Highlight field đã sửa** — tô cam field đã đổi giá trị kể từ lúc bật toggle / mở document.
- **Xem chi tiết field (hover)** — hover qua field để xem tooltip (fieldname, fieldtype, options, mandatory, hidden, custom, depends_on…). Click để pin tooltip, có nút **Copy fieldname** và **Copy All**.
- **Inspect child table row** — hover dòng bảng con: xem `idx`, `name`, `parentfield` + JSON dòng; click pin, Copy JSON.
- **Hiện fieldname** — in tag fieldname cạnh label mỗi field (cả form cha, bảng con, dialog). Click tag để copy.
- **Copy doc JSON** — copy toàn bộ `cur_frm.doc` dạng JSON vào clipboard.
- **Copy form URL** — copy URL chuẩn `/app/doctype/name` của document đang mở.
- **Quick API Call** — gọi `frappe.call` trực tiếp từ dialog: nhập method + args (JSON), xem kết quả + copy.
- **Quick get_doc** — gọi nhanh `get` / `get_value` / `get_list` (prefill DocType/name từ form).
- **Site / Version info** — xem site, user, developer_mode, app versions từ `frappe.boot` (+ Copy JSON).
- **Thêm Custom Field** — tạo custom field trực tiếp từ form, đầy đủ: label, fieldtype, options, insert after, default, fetch from, depends on, các thuộc tính (mandatory, hidden, read only…).
- **Customize Form** — mở Customize Form đúng DocType đang xem (tab mới).
- **Version** — lịch sử thay đổi document (ai sửa, field nào đổi) + tab **So sánh** để diff 2 bản Version. Cần DocType bật Track Changes.

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
│   ├── nguoi-dung-tools.js    # Người dùng: tìm field, lịch sử, link, file, quyền,
│   │                          #   field bắt buộc, focus mode, phím tắt
│   ├── dev-tools.js           # Tính năng Dev: field ẩn, custom/dirty, inspect (+ child table),
│   │                          #   fieldname, copy JSON/URL, Quick API/get_doc, Site info,
│   │                          #   thêm custom field, Customize Form, Version (changelog + diff)
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
  section: 'dev',              // 'nguoidung' | 'dev' | 'trienkhai'
  group: 'overlay',            // nhóm accordion (xem GROUP_ORDER trong common.js)
  id: 'my-toggle',
  label: 'Tên hiển thị',
  kind: 'toggle',
  stateKey: 'myFlag',          // key lưu trong state (tự persist)
  poll: true,                  // giữ polling khi bật
  scan: function (ctx) {       // chạy mỗi nhịp; ctx.eachField, ctx.isCustom, ctx.meta...
    ctx.eachField(function (el, field, fieldname) { /* ... */ });
  },
});
```

Panel dùng **accordion theo nhóm** — mặc định chỉ mở nhóm đầu mỗi section; trạng thái mở/đóng được lưu. Ô tìm kiếm vẫn lọc xuyên nhóm và tự mở nhóm có kết quả.

---

**Made By TuanBD**
