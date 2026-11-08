# Xưởng IoT

**Khẩu hiệu:** Tự tay làm đồ vật thông minh.

Xưởng IoT là dự án mã nguồn mở phi lợi nhuận giúp học sinh, sinh viên năm nhất và giáo viên STEM học IoT với ESP32 theo cách đơn giản, an toàn và thân thiện tiếng Việt.

## Mục tiêu

- Học IoT dù chưa có linh kiện thật.
- Thực hành qua mô phỏng trước khi ráp mạch thật.
- Hiểu rõ cách nối dây để tránh hỏng thiết bị.

## Lưu trữ dữ liệu học tập

- Website không dùng máy chủ và không có tài khoản.
- Tiến độ, quiz, huy hiệu và bài làm Phòng Lab chỉ lưu trong trình duyệt của em.
- Em nên xuất file sao lưu định kỳ ở trang **Tiến độ của em**.

## Chạy dự án

Yêu cầu: Node.js phiên bản phù hợp với [package.json](./package.json).

```bash
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ do Astro hiển thị (mặc định thường là `http://localhost:4321`).

## Các lệnh chính

- `npm run dev`: chạy môi trường phát triển.
- `npm run build`: build tĩnh ra thư mục `dist/`.
- `npm run lint`: kiểm tra ESLint.
- `npm run test`: chạy Vitest.

## Đóng góp

1. Fork repository và tạo nhánh mới.
2. Thực hiện thay đổi nhỏ, rõ ràng, có thể kiểm thử.
3. Chạy `npm run lint` và `npm run build` trước khi gửi Pull Request.
4. Mô tả mục tiêu thay đổi và ảnh chụp màn hình (nếu có giao diện).

## Giấy phép

- Mã nguồn: [MIT](./LICENSE)
- Nội dung học liệu: [CC BY-SA 4.0](./CONTENT-LICENSE)
