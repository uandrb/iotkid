# Content & UI Style Steering

## Giọng văn

- Xưng "em" khi nói với học sinh; "mình" khi hệ thống tự nói (ví dụ gợi ý Lab: "Mình đã nối sẵn dây cho em").
- Thân thiện, khuyến khích, rõ ràng. Câu ngắn, ưu tiên dưới 25 từ.
- Thuật ngữ tiếng Anh giải thích ở lần đầu: GPIO = chân vào/ra đa năng, ADC = bộ chuyển đổi tương tự–số, I2C, PWM...
- Thông điệp lỗi/cảnh báo nói việc cần làm, không chỉ nói sai: "LED có thể đang cắm ngược: chân (+) không được nối GND."
- Không chắc thông số kỹ thuật: ghi `TODO: kiểm tra`, không đoán.

## Cấu trúc bắt buộc mỗi bài học (theo thứ tự)

1. `<MucTieu>` — Mục tiêu (từ `frontmatter.goals`).
2. `<CanChuanBi>` — Cần chuẩn bị (từ `frontmatter.modules`).
3. `## Sơ đồ nối dây` + `<SoDoNoiDay connections=[{ tu, den }]>`.
4. `<CanhBao loai="an-toan">` khi có điện/nguồn.
5. `## Code` + `<Code language="cpp" code={...}>`.
6. `<GiaiThichDong items=[{ dong, y }]>` — giải thích từng dòng.
7. `<ThuThach hint="...">` — thử thách.
8. `## Lỗi hay gặp` + `<CanhBao loai="loi-hay-gap">`.
9. `## Quiz 3 câu` + `<Quiz>` đúng 3 câu.
10. `<MoTrongLab preset=...>` — nút mở Phòng Lab.

Mẫu đầy đủ: `src/content/lessons/01-nhay-led.mdx`. Hướng dẫn cho giáo viên: `docs/VIET-BAI-HOC.md`.

## Sự thật kỹ thuật phải nhất quán

- ESP32 DevKit V1: LED onboard GPIO2; GPIO34/35/36/39 chỉ đọc; ADC2 không ổn định khi bật Wi-Fi; strapping GPIO0/2/5/12/15; GPIO6–11 dành cho flash; I2C mặc định SDA 21, SCL 22.
- ESP32-S3 DevKitC-1: LED RGB GPIO48; USB GPIO19/20; GPIO35–37 dành cho PSRAM; I2C mặc định SDA 8, SCL 9.
- Nguồn chuẩn là `nhomDacBiet` trong `src/data/boards.json`; không viết tay số khác trong bài.
- Code mẫu dùng Arduino C++, `Serial.begin(115200)`.

## Cảnh báo an toàn điện (luôn hiển thị khi liên quan)

- ESP32 dùng logic 3.3V. Không nối 5V vào GPIO.
- Không chập nguồn với GND.
- Cẩn thận với pin Li-ion.
- Không tự đấu điện lưới 220V.
- Loa không nối thẳng GPIO, phải qua ampli.

## Phong cách giao diện

- Sáng, vui, cảm giác xưởng sáng chế. Tokens trong `src/styles/tokens.css`:
  - nền kem `--color-bg #fff9ee`, chữ xanh than `--color-text #113a5c`,
  - nhấn cam `--color-accent-orange #f28b30`, nhấn xanh ngọc `--color-accent-teal #1ea89b`,
  - success/warning/error riêng, có bộ dark mode.
- Góc bo tròn (`--radius-sm/md/lg` = 10/16/24px), bóng mềm.
- Minh họa SVG phẳng tự vẽ trong `public/images`. Không dùng nhân vật có bản quyền.
- Luôn dùng token, không hard-code màu trong component (trừ SVG).

## Tiếp cận (Accessibility)

- Tương phản chữ tối thiểu 4.5:1.
- Không chỉ dùng màu để báo trạng thái; kèm chữ hoặc biểu tượng (ví dụ "✅ Đúng rồi!", "❌ Chưa đúng").
- Mọi điều khiển dùng được bằng bàn phím; thông báo động dùng `aria-live="polite"`.
- Vùng bấm trên điện thoại tối thiểu 44px (`min-height: 44px` cho button).
- Có skip-link "Bỏ qua đến nội dung", `lang="vi"`, nav có `aria-label`.
