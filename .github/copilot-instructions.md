# Copilot Instructions

> Nguồn định hướng chính: [AGENTS.md](../AGENTS.md). Khi có xung đột, ưu tiên AGENTS.md.

## Quy tắc quan trọng (10–15)

1. Luôn bám mục tiêu giáo dục IoT cho người mới bắt đầu, đặc biệt học sinh Việt Nam.
2. Ưu tiên đơn giản: mỗi trang một nhiệm vụ chính, tránh quá tải nhận thức.
3. Không thêm tính năng ngoài phạm vi: diễn đàn, chat học sinh, bán hàng, đăng nhập mạng xã hội.
4. Mặc định tiếng Việt; văn phong thân thiện, xưng "em", câu ngắn, dễ hiểu.
5. Bài học phải giữ khung chuẩn: mục tiêu, chuẩn bị, nối dây, code, giải thích, thử thách, lỗi thường gặp, quiz.
6. Bắt buộc cảnh báo an toàn khi có nội dung điện/nguồn (3.3V, GND, Li-ion, cấm 220V tự đấu).
7. Giữ stack chuẩn: Astro static + TypeScript strict + Content Collections + Zod schema.
8. Dùng CSS thuần và tokens trong `src/styles/tokens.css`; không thêm Tailwind/UI library.
9. Chỉ dùng island/Preact khi tương tác phức tạp thực sự cần.
10. Tách logic mô phỏng vào `src/lib/sim`, độc lập UI để dễ test.
11. Dữ liệu board/module đặt ở JSON có schema; tránh hard-code phân tán.
12. Bảo mật tuyệt đối: không để API key trong client code hoặc Git.
13. Tối ưu hiệu năng: trang bài học < 150 KB JavaScript; ảnh ưu tiên SVG/WebP.
14. Luôn duy trì accessibility: tương phản ≥ 4.5:1, không dùng màu làm tín hiệu duy nhất, hỗ trợ bàn phím, vùng bấm ≥ 44px.
15. Trước khi tạo mới cấu trúc hoặc rule, kiểm tra [AGENTS.md](../AGENTS.md) để tái sử dụng đúng chuẩn dự án.
