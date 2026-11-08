# Chính sách bảo mật

## Phạm vi

Xưởng IoT là website tĩnh phục vụ học tập. Dự án không yêu cầu tài khoản người dùng và không thu thập dữ liệu cá nhân.

## Báo cáo lỗ hổng

Nếu bạn phát hiện lỗ hổng bảo mật, vui lòng:

1. Không công khai ngay trên issue công khai.
2. Liên hệ maintainer qua kênh riêng (email/nhắn tin đã công bố).
3. Mô tả rõ bước tái hiện, ảnh hưởng và đề xuất giảm thiểu.

Chúng tôi sẽ xác nhận đã nhận báo cáo trong thời gian sớm nhất và phối hợp xử lý có trách nhiệm.

## Thực hành bảo mật trong repository

- Không commit token, API key, khóa bí mật.
- Không commit `.env*`, `.dev.vars*`.
- Ưu tiên cập nhật dependency và chạy CI đầy đủ trước khi merge.
- Tăng cường header bảo mật khi triển khai.
