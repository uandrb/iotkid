# Tech Steering

## Nền tảng

- Astro 7 (`astro ^7.4.7`), `output: 'static'`, integrations: `@astrojs/mdx`, `@astrojs/preact`.
- TypeScript `strict` (extends `astro/tsconfigs/strict`).
- Node: `package.json` yêu cầu `>=22.23.4`; CI dùng Node 22.
- Dependencies runtime: `preact ^11`, `zod ^4`, `lz-string` (nén link chia sẻ), CodeMirror 6 (`@codemirror/*`, chỉ trong Lab).
- Không thêm dependency mới nếu có thể tự viết gọn. Không Tailwind, không thư viện UI.

## Quản lý nội dung

- Astro Content Collections (loader `glob`), schema Zod trong `src/content.config.ts`.
- Collection `lessons` (MDX), `projects` (MDX). Quiz ôn tập là JSON rời trong `src/content/quiz/`, nạp bằng `import.meta.glob`.
- Dữ liệu board/module: `src/data/boards.json`, `src/data/modules.json`, kiểm tra bằng Zod trong `src/lib/schema.ts`, nạp qua `src/lib/catalog.ts` (`boards`, `modulesCatalog`, `boardMap`, `moduleMap`).
- Trường trong JSON data đặt tên tiếng Việt không dấu camelCase (`ten`, `moTa`, `chanTrai`, `nhomDacBiet`, `canNoi`, `loiHayGap`...). Giữ quy ước này khi thêm trường.
- Lesson `draft: true` bị ẩn khi `import.meta.env.PROD` (`src/lib/lessons.ts`).

## Giao diện

- CSS thuần. Tokens tại `src/styles/tokens.css`, global tại `src/styles/global.css`. Có sẵn dark mode qua `prefers-color-scheme`.
- Component tĩnh `.astro`. Tương tác nhỏ dùng `<script>` trong file `.astro`, import logic từ `src/lib`.
- Preact chỉ dùng cho `src/islands/Lab/Lab.tsx` (`client:load`). Không thêm island mới nếu `<script>` thường làm được.
- Font tự host bằng `@fontsource`: `be-vietnam-pro` (chữ thường), `fira-code` (mono).

## Dữ liệu phía trình duyệt (`src/lib/storage.ts`)

- Một key duy nhất `xuong-iot:v1:store`, giá trị là `BrowserStore` có `version: 1`, validate bằng Zod khi đọc; sai schema → trả store mặc định.
- Tự chuyển dữ liệu từ key cũ `xuong-iot-progress-v1`.
- Mọi thao tác đọc/ghi bọc `try/catch`; hàm trả `StorageResult { ok, errorCode: 'blocked'|'quota'|'invalid'|'too-large', message }`. Không ném lỗi ra UI.
- Giới hạn: store ≤ 900 KB, file nhập ≤ 1 MB.
- Định dạng xuất: `{ type: 'xuong-iot-backup', version: 1, exportedAt, data }` và `{ type: 'xuong-iot-lab-work', version: 1, work }`. Nhập hỗ trợ `merge` hoặc `replace`.
- Chia sẻ bài làm Lab qua URL hash `#work=<lz-string>`.
- `src/lib/progress.ts` là lớp mỏng trên `storage.ts`; code UI gọi `progress`, không gọi `storage` trực tiếp trừ Lab/Tiến độ.
- Thêm trường mới vào store: cập nhật interface, schema Zod, `createDefaultStore`, `mergeStores`, và test trong `storage.test.ts`.

## Mô phỏng (`src/lib/sim`)

- `wiring.ts`: `checkWire(ctx, wire)` trả `{ level: 'ok'|'info'|'warn'|'err', message }`; `checkCodeUsage` đối chiếu GPIO trong code với board. Mọi thông điệp tiếng Việt, xưng "em".
- `runtime/`: `transpile.ts` chuyển Arduino C++ → JS bằng regex + `diagnoseBasicSyntax`; `worker.ts` chạy trong Web Worker (giới hạn 12 s / 25 000 vòng loop); `sandbox.ts` phiên bản đồng bộ cho test; `index.ts` tạo controller cho UI.
- `projects.ts`: preset Lab (linh kiện, bước nối, gợi ý 3 mức, code mẫu).
- Thêm hàm Arduino mới: cập nhật cả `worker.ts`, `sandbox.ts`, `transpile.ts` (nếu cần await), và `supportedArduinoCommands`.

## Triển khai

- Cloudflare Workers Static Assets, cấu hình `wrangler.toml` (không phải jsonc): `name = "iotkid"`, `assets.directory = "./dist"`, `not_found_handling = "404-page"`.
- Build tự động từ GitHub qua Cloudflare Dashboard (`npm run build` + `npx wrangler deploy`). Hướng dẫn: `docs/TRIEN-KHAI.md`.
- `public/_headers`: CSP `default-src 'self'`, `worker-src 'self' blob:`, cache `_astro/*` 1 năm. Thêm nguồn ngoài phải sửa CSP.

## Chất lượng và lệnh

- `npm run lint` (ESLint 9 flat config + eslint-plugin-astro + typescript-eslint), `npm run format` (Prettier: tab, singleQuote, printWidth 100, no trailing comma).
- `npm run test` = `vitest run`, include `src/**/*.test.ts`. Test đặt cạnh file logic.
- `npm run test:e2e` = Playwright, `tests/e2e/`, tự chạy `astro dev` ở `127.0.0.1:4321`. Chỉ test luồng chính (hiện có: nối dây + chạy LED trong Lab).
- `npm run check:links` kiểm tra link hỏng trong `dist/`.
- Lighthouse CI (`.lighthouserc.json`) chạy qua `wrangler dev` cổng 8787, mục tiêu ≥ 0.9 cả 4 hạng mục.
- CI (`.github/workflows/ci.yml`, on PR): lint → test → build → Playwright → check-links → lhci.
- Trước khi kết thúc một thay đổi: chạy `npm run lint && npm run test && npm run build`.

## Ngân sách hiệu năng

- Trang bài học < 150 KB JS. Hiện `progress` chunk (kéo theo zod + lz-string) ≈ 100 KB vì `Quiz.astro` import `progress`. Không import thêm thư viện nặng vào chuỗi `progress → storage`.
- Trang Lab được miễn ngân sách này (CodeMirror ≈ 440 KB), nhưng không để code Lab lọt vào trang khác.
- Ảnh ưu tiên SVG tự vẽ trong `public/images/`, hoặc WebP.

## Bảo mật

- Không API key, không secret trong code hay Git. `.env*`, `.dev.vars*` đã ignore.
- Code người dùng chạy trong Worker qua `AsyncFunction`; không mở rộng API runtime ra DOM/fetch.
