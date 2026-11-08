# Triển khai Xưởng IoT lên Internet

Tài liệu này dành cho giáo viên/tình nguyện viên không chuyên kỹ thuật.

## Điều kiện cần

- Có quyền quản trị repository GitHub.
- Có tài khoản Cloudflare.
- Dự án đã chạy được lệnh `npm run build`.

---

## Cách 1 (khuyến nghị): triển khai tự động bằng Cloudflare Dashboard

Cloudflare khuyến nghị dùng **Workers + Static Assets** cho dự án mới.

1. Vào Cloudflare Dashboard.
2. Mở **Workers & Pages**.
3. Bấm **Create** → **Import a repository**.
4. Kết nối GitHub và chọn repository `uandrb/iotkid`.
5. Cấu hình build:
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy`
6. Lưu và Deploy.
7. Từ lần sau, mỗi lần push lên nhánh `main` Cloudflare sẽ tự triển khai.
8. Pull Request sẽ có môi trường xem trước (Preview URL) để duyệt trước khi merge.

---

## Cách 2: triển khai từ máy cá nhân

1. Cài dependencies:

   ```bash
   npm ci
   ```

2. Đăng nhập Cloudflare CLI:

   ```bash
   npx wrangler login
   ```

3. Triển khai:

   ```bash
   npm run deploy
   ```

---

## Gắn tên miền riêng

1. Vào Cloudflare Dashboard → dự án Worker `xuong-iot`.
2. Mở tab **Triggers**.
3. Chọn **Add Custom Domain**.
4. Nhập domain/subdomain (ví dụ `iot.truongabc.edu.vn`).
5. Cloudflare tự tạo DNS record nếu domain đang dùng Cloudflare.

---

## Bật Cloudflare Web Analytics (không dùng cookie)

1. Vào dashboard của domain.
2. Mở **Web Analytics**.
3. Bật Analytics cho domain của website.
4. Kiểm tra dữ liệu truy cập sau vài giờ.

---

## Dự phòng: dùng GitHub Pages nếu chưa dùng Cloudflare

Tạo file workflow riêng: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

> Lưu ý: nếu dùng GitHub Pages, cần cấu hình lại `astro.config.mjs` cho base path phù hợp.
