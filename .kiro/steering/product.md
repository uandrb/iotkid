# Product Steering

- Tên sản phẩm: **Xưởng IoT** (package `xuong-iot`, repo GitHub `uandrb/iotkid`).
- Khẩu hiệu: **"Tự tay làm đồ vật thông minh"**.
- Giấy phép: mã nguồn MIT (`LICENSE`), học liệu CC BY-SA 4.0 (`CONTENT-LICENSE`).
- Đối tượng chính:
  - Học sinh THCS, THPT (12–18 tuổi) tại Việt Nam.
  - Sinh viên năm nhất.
  - Giáo viên STEM.
  - Ưu tiên người mới bắt đầu, thiết bị yếu, điện thoại.
- Mục tiêu học tập:
  - Học IoT với ESP32 mà chưa cần mua linh kiện.
  - Khi cần mua thì biết chọn gì, nối thế nào, và tránh hỏng.
- Giá trị cốt lõi:
  - Đơn giản trước hết. Mỗi trang tập trung một việc chính.
  - Không máy chủ, không tài khoản, không thu thập dữ liệu cá nhân, không quảng cáo.
  - Mọi dữ liệu học tập chỉ nằm trong trình duyệt; người dùng tự xuất file sao lưu.
  - Tiếng Việt là ngôn ngữ chính.

## Tính năng đã có (trạng thái hiện tại)

| Tính năng | Route | Ghi chú |
|---|---|---|
| Trang chủ | `/` | |
| Lộ trình 10 bài | `/lo-trinh`, `/bai-hoc/[slug]` | 10 bài trong `src/content/lessons`, bài 1 nháy LED → bài 10 robot giọng nói |
| Thư viện linh kiện | `/linh-kien`, `/linh-kien/[id]` | 2 board, 15 module; sơ đồ chân, cách nối, lỗi hay gặp, từ khóa mua, giá tham khảo |
| Phòng Lab mô phỏng | `/phong-lab?preset=<id>` | Nối dây bằng click, kiểm tra dây, chạy code Arduino giả lập trong Web Worker, gợi ý 3 mức, lưu/chia sẻ bài làm |
| Dự án theo bước | `/du-an`, `/du-an/[slug]` | 4 dự án: đèn ngủ tự bật, trạm thời tiết mini, cây tự tưới, báo động cửa mở; có checklist và danh sách mua |
| Ôn tập | `/on-tap` | 10 câu ngẫu nhiên từ ngân hàng 12 câu, chế độ flashcard |
| Quiz trong bài | trong `/bai-hoc/[slug]` | 3 câu mỗi bài, lưu kết quả |
| Tiến độ + huy hiệu | `/tien-do` | Tên hiển thị, 5 huy hiệu, danh sách bài làm Lab, xuất/nhập JSON |
| Góc giáo viên | `/giao-vien`, `/giao-vien/[slug]` | Gợi ý tiết 45 phút, thu bài qua file, phiếu bài tập in cho từng bài |
| 404 | `/404` | Dùng cho `not_found_handling` của Cloudflare |

- Huy hiệu (`src/lib/badges.ts`): `thap-sang-dau-tien`, `khong-chap-mach`, `tham-tu-so-do-chan`, `ky-su-iot-nhi`, `nha-sang-che`.
- Preset Lab hiện có (`src/lib/sim/projects.ts`): `nhay-led`, `nut-nhan`, `bien-tro`, `tram-thoi-tiet`.
- Lệnh Arduino mô phỏng được: `#define`, `setup/loop`, `pinMode`, `digitalWrite/Read`, `analogRead/Write`, `delay`, `millis`, `map`, `Serial.print/println`, lớp `DHT`, `OLED`, `WiFi` (giả lập). Không có: ngắt, timer, thư viện ngoài.

## Ngoài phạm vi (không làm)

- Diễn đàn, nhắn tin giữa học sinh.
- Bán hàng, link mua cụ thể.
- Đăng nhập, tài khoản, đăng nhập mạng xã hội.
- Backend, API, cookie theo dõi.
