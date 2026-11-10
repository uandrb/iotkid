# Structure Steering

## Thư mục

```
src/
  pages/                 route (xem bảng URL bên dưới)
  layouts/MainLayout.astro   layout duy nhất: header, nav 8 mục, footer, skip-link
  components/
    PinoutBoard.astro    vẽ sơ đồ chân board
    lesson/              component dùng trong MDX bài học, export qua index.ts
  islands/Lab/           Lab.tsx (Preact) + lab.css
  lib/                   logic TS thuần, test đặt cạnh (*.test.ts)
    schema.ts            Zod cho boards/modules
    catalog.ts           nạp + validate JSON, boardMap/moduleMap
    storage.ts           localStorage, xuất/nhập, chia sẻ
    progress.ts          API mỏng cho UI: bài học, quiz, dự án, huy hiệu
    badges.ts            định nghĩa + điều kiện huy hiệu
    lessons.ts, projects.ts   truy vấn content collections
    pricing.ts           parse/format giá VND
    sim/                 wiring.ts, projects.ts (preset), connections.ts (stub cũ), runtime/
  content/
    lessons/NN-ten-bai.mdx     10 bài, số thứ tự 2 chữ số
    projects/ten-du-an.mdx     4 dự án
    quiz/qN.json               ngân hàng câu hỏi cho /on-tap
  content.config.ts      schema collections
  data/boards.json, modules.json
  styles/tokens.css, global.css
public/
  images/modules/*.svg, images/projects/*.svg
  _headers, favicon.svg
tests/e2e/               Playwright
docs/VIET-BAI-HOC.md     hướng dẫn viết bài cho giáo viên
docs/TRIEN-KHAI.md       hướng dẫn deploy
scripts/check-links.mjs
```

## URL

- Tiếng Việt không dấu, `kebab-case`.
- `/`, `/lo-trinh`, `/bai-hoc/[slug]`, `/linh-kien`, `/linh-kien/[id]`, `/phong-lab`, `/on-tap`, `/du-an`, `/du-an/[slug]`, `/tien-do`, `/giao-vien`, `/giao-vien/[slug]`, `/404`.
- `/phong-lab` nhận `?preset=<id>` (chấp nhận cả `preset-<id>`, Lab tự bỏ tiền tố) và `#work=<lz>` để mở bài làm chia sẻ.
- Thêm route mới phải thêm vào `navItems` trong `MainLayout.astro` nếu là trang cấp 1.

## Định danh (id) hiện có

- Board: `esp32-devkit-v1`, `esp32-s3-devkitc-1-n16r8`.
- Module: `led-dien-tro-220`, `nut-nhan`, `bien-tro-10k`, `dht22`, `oled-ssd1306-i2c`, `inmp441`, `max98357a`, `loa-4ohm-3w`, `relay-1-kenh-cach-ly`, `servo-sg90`, `hc-sr04`, `cam-bien-anh-sang-ldr`, `cam-bien-do-am-dat`, `cong-tac-tu-reed`, `coi-buzzer-3v3`.
- Preset Lab: `nhay-led`, `nut-nhan`, `bien-tro`, `tram-thoi-tiet`.
- Lưu ý lệch tên: frontmatter bài học/dự án dùng `board: 'esp32' | 'esp32s3'`, còn data và Lab dùng id đầy đủ ở trên. Không trộn hai kiểu.

## Frontmatter

- Lesson: `title, slug, order, level ('Dễ'|'Vừa'|'Khó'), durationMinutes, board, modules[], goals[], labPreset, draft`.
- Project: `title, slug, level, board, modules[], thoiGian, anhBia, labPreset, steps, danhSachMua[{id, soLuong}]`.
- `slug` chỉ `[a-z0-9-]`. `modules[]` và `danhSachMua[].id` phải là id module có trong `modules.json`.
- `labPreset` của lesson hiện ghi `preset-<id>`, của project ghi `<id>`; cả hai đều chạy. Bài mới nên dùng `<id>` không tiền tố.

## Component bài học (`src/components/lesson`)

`MucTieu`, `CanChuanBi`, `SoDoNoiDay`, `Code`, `GiaiThichDong`, `CanhBao` (`loai="an-toan"|"meo"|"loi-hay-gap"`), `ThuThach`, `Quiz`, `MoTrongLab`. Chúng được truyền vào `<Content components={lessonComponents} />`, nên MDX không cần import.

## Hai định dạng quiz

- Quiz trong bài (`Quiz.astro`): `{ id, question, options: string[], answerIndex, explanation }`, đúng 3 câu.
- Ngân hàng ôn tập (`content/quiz/*.json`): `{ id, question, options: [{ text, correct }], explanation, lessonLink }`, đúng 1 đáp án `correct`, `lessonLink` bắt đầu bằng `/`. Test `quiz-bank.test.ts` kiểm tra.

## Quy ước mã

- Component tĩnh: `PascalCase.astro`. Component bài học đặt tên tiếng Việt không dấu (`SoDoNoiDay`).
- Logic mô phỏng chỉ ở `src/lib/sim`, không phụ thuộc DOM, test được bằng Vitest.
- Chuỗi hiển thị cho người dùng viết tiếng Việt có dấu, trực tiếp trong code (không i18n).
- Không tạo file có hậu tố ` 2` (bản sao của macOS). Các file như vậy trong repo là bản cũ, không dùng.
