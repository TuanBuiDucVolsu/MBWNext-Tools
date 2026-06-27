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

```
mbwnext-tools/
├── manifest.json    # Config extension
├── inject.js        # Code chính (content script, world: MAIN)
├── icon48.png       # Icon extension 48px
├── icon128.png      # Icon extension 128px
└── README.md
```
