# AGENTS.md — Định hướng dự án Xưởng IoT

## 1) Sứ mệnh sản phẩm
- Tên: **[TÊN WEBSITE]** (tạm gọi **Xưởng IoT**).
- Khẩu hiệu: **"Tự tay làm đồ vật thông minh"**.
- Giúp người học làm IoT với ESP32 từ mức chưa biết gì.
- Học được ngay cả khi chưa mua linh kiện.
- Khi mua linh kiện, biết chọn đúng, ráp đúng, hạn chế hỏng.

## 2) Người dùng mục tiêu
- Học sinh THCS, THPT (12–18 tuổi) tại Việt Nam.
- Sinh viên năm nhất.
- Giáo viên STEM.
- Nhiều người dùng thiết bị yếu hoặc điện thoại.
- Nhiều người chưa từng lập trình.

## 3) Nguyên tắc sản phẩm
- Đơn giản trước hết.
- Mỗi trang chỉ tập trung một việc chính.
- Không bắt buộc đăng ký tài khoản.
- Không thu thập dữ liệu cá nhân.
- Không quảng cáo.
- Tiếng Việt là ngôn ngữ chính.

## 4) Tính năng cốt lõi
- Lộ trình 10 bài học.
- Thư viện board/linh kiện: sơ đồ chân, cách nối, module kết hợp.
- Phòng lab mô phỏng: nối dây + chạy code + gợi ý + cảnh báo.
- Dự án theo từng bước.
- Quiz ngắn.
- Tiến độ và huy hiệu.
- Xuất/nhập bài làm.

## 5) Ngoài phạm vi
- Không làm diễn đàn.
- Không có nhắn tin giữa học sinh.
- Không tích hợp bán hàng.
- Không đăng nhập mạng xã hội.

## 6) Quy chuẩn kỹ thuật
- Astro bản ổn định mới nhất, `output: static`.
- TypeScript `strict`.
- Nội dung dùng Astro Content Collections + Markdown/MDX + Zod schema.
- Dữ liệu board/linh kiện để ở JSON có schema.
- CSS thuần; tokens đặt ở `src/styles/tokens.css`.
- Không dùng Tailwind hoặc UI library.
- Chỉ dùng Preact khi tương tác phức tạp, thật sự cần.

## 7) Font, dữ liệu local, bảo mật
- Font chữ thường: Be Vietnam Pro.
- Font code: mono có hỗ trợ tiếng Việt.
- Tự host font bằng `@fontsource`.
- Lưu phía trình duyệt bằng `localStorage`, luôn bọc `try/catch`.
- Xuất/nhập bài làm bằng JSON có trường `version`.
- Không để API key trong client code.
- Không commit API key lên Git.

## 8) Triển khai & chất lượng
- Deploy trên Cloudflare Workers Static Assets.
- `wrangler.jsonc` dùng:
  - `assets.directory = "./dist"`
  - `not_found_handling = "404-page"`
- Tự động build từ GitHub.
- Chất lượng: ESLint + Prettier + Vitest + Playwright.
- Lighthouse mục tiêu: mỗi hạng mục ≥ 90.
- Ngân sách: trang bài học < 150 KB JavaScript.
- Ảnh ưu tiên SVG hoặc WebP.

## 9) Cấu trúc mã nguồn
- `src/pages`, `src/layouts`, `src/components`, `src/islands`, `src/lib`.
- Component tĩnh trong `src/components` dùng tên `PascalCase.astro`.
- Nội dung bài học: `src/content/lessons`.
- Nội dung dự án: `src/content/projects`.
- Dữ liệu: `src/data/boards.json`, `src/data/modules.json`.
- Styles: `src/styles`.
- Ảnh tĩnh: `public/images`.

## 10) URL và mô phỏng
- URL tiếng Việt không dấu, dạng `kebab-case`.
- Ví dụ: `/lo-trinh`, `/bai-hoc/nhay-led`, `/linh-kien/esp32`, `/phong-lab`, `/du-an`, `/tien-do`.
- Logic mô phỏng phải nằm ở `src/lib/sim`.
- Logic mô phỏng tách khỏi UI để test độc lập.

## 11) Phong cách nội dung
- Xưng "em" với học sinh.
- Câu ngắn, ưu tiên dưới 25 từ.
- Giải thích thuật ngữ Anh ngay lần đầu.
- Mỗi bài phải theo khung:
  - Mục tiêu → Cần chuẩn bị → Sơ đồ nối dây → Code → Giải thích từng dòng → Thử thách → Lỗi hay gặp → Quiz 3 câu.

## 12) An toàn & trải nghiệm
- Luôn cảnh báo an toàn khi có điện:
  - Logic 3.3V.
  - Không chập nguồn và GND.
  - Cẩn thận pin Li-ion.
  - Không tự đấu điện lưới 220V.
- UI sáng, vui, phong cách xưởng sáng chế.
- Màu chính: nền kem, chữ xanh than, nhấn cam, nhấn xanh ngọc.
- Minh họa SVG phẳng tự vẽ; không dùng nhân vật có bản quyền.
- Accessibility:
  - Tương phản chữ ≥ 4.5:1.
  - Không chỉ dùng màu để báo trạng thái.
  - Điều khiển được bằng bàn phím.
  - Vùng bấm di động ≥ 44px.
