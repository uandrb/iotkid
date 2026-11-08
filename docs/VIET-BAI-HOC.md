# Hướng dẫn viết bài học mới (giáo viên)

## 1) Tạo file mới

- Tạo **1 file `.mdx`** trong thư mục `src/content/lessons/`.
- Đặt tên gợi ý theo thứ tự: `11-ten-bai.mdx`.

## 2) Bắt buộc đủ frontmatter

```yaml
---
title: "Bài 11: ..."
slug: "ten-bai-khong-dau"
order: 11
level: "Dễ" # Dễ | Vừa | Khó
durationMinutes: 45
board: "esp32" # esp32 | esp32s3
modules:
  - led-dien-tro-220
goals:
  - Mục tiêu 1
labPreset: "preset-..."
draft: false
---
```

- Nếu thiếu trường hoặc sai kiểu, schema Zod sẽ báo lỗi rõ khi chạy build.

## 3) Dùng component bài học

- `<MucTieu items={frontmatter.goals} />`
- `<CanChuanBi moduleIds={frontmatter.modules} />`
- `<SoDoNoiDay connections={[{ tu: "GPIO2", den: "LED (+)" }]} />`
- `<Code code={\`...\`} />`
- `<GiaiThichDong items={[{ dong: 1, y: "..." }]} />`
- `<CanhBao loai="an-toan|meo|loi-hay-gap">...</CanhBao>`
- `<ThuThach hint="...">...</ThuThach>`
- `<Quiz lessonSlug={frontmatter.slug} quizId="quiz-..." questions={[...3 câu...]} />`
- `<MoTrongLab preset={frontmatter.labPreset} />`

## 4) Cấu trúc nội dung chuẩn

1. Mục tiêu  
2. Cần chuẩn bị  
3. Sơ đồ nối dây  
4. Code  
5. Giải thích từng dòng  
6. Thử thách  
7. Lỗi hay gặp  
8. Quiz 3 câu

## 5) Quy tắc an toàn và kỹ thuật

- Nhắc rõ mức logic **3.3V**.
- Không chập nguồn với GND.
- ESP32 DevKit V1: LED onboard ở **GPIO2**.
- GPIO34–39 chỉ đọc.
- ADC2 không ổn định khi bật Wi-Fi.
- Không chắc thông số: ghi **TODO: kiểm tra**, không đoán.

## 6) Trạng thái draft

- `draft: true`: dùng để soạn nháp.
- Bài nháp **không xuất hiện khi build production**.
