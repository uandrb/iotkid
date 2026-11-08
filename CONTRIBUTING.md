# Hướng dẫn đóng góp

Cảm ơn bạn đã muốn đóng góp cho Xưởng IoT 💙

## Cách đóng góp nhanh

1. Fork repository.
2. Tạo nhánh mới từ `main`.
3. Thực hiện thay đổi nhỏ, rõ ràng.
4. Chạy kiểm tra:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
5. Mở Pull Request về nhánh `main`.

## Đóng góp bài học mới

1. Đọc hướng dẫn tại [docs/VIET-BAI-HOC.md](./docs/VIET-BAI-HOC.md).
2. Tạo đúng 1 file `.mdx` trong `src/content/lessons`.
3. Tuân thủ schema trong `src/content.config.ts`.
4. Viết tiếng Việt thân thiện, câu ngắn, có cảnh báo an toàn điện khi cần.

## Yêu cầu nội dung

- Không chèn link bán hàng cụ thể.
- Không yêu cầu học sinh đăng ký tài khoản.
- Không đưa dữ liệu cá nhân hoặc thông tin nhạy cảm vào ví dụ.

## Quy tắc kỹ thuật

- Không commit secret, token, API key.
- Không commit file `.env*` hoặc `.dev.vars*`.
- Ưu tiên sửa đúng phạm vi issue/PR, tránh chỉnh sửa không liên quan.

## Báo lỗi/đề xuất

- Báo lỗi: dùng template **Báo lỗi**.
- Đề xuất bài học: dùng template **Đề xuất bài học**.
