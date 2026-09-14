# Trưa nay ăn gì?

Web quay ngẫu nhiên chọn quán ăn trưa / quán nước, host miễn phí trên GitHub Pages.

## Cấu trúc project

```
index.html    ← trang chính (mọi người vào xem + quay)
quanly.html   ← trang quản lý (chỉ mình bạn dùng, để thêm/sửa/xóa quán)
data.js       ← danh sách quán ăn & quán nước
style.css     ← giao diện
app.js        ← logic trang chính
admin.js      ← logic trang quản lý
```

## Cách đưa lên GitHub Pages (làm 1 lần)

1. Tạo một repo mới trên GitHub, ví dụ tên `trua-nay-an-gi`.
2. Upload toàn bộ các file trong thư mục này lên repo (kéo thả trên GitHub web, hoặc dùng `git push`).
3. Vào repo → **Settings** → **Pages**.
4. Ở mục "Build and deployment", chọn **Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Bấm **Save**.
5. Đợi khoảng 1-2 phút, GitHub sẽ cho bạn một link dạng:
   `https://<ten-tai-khoan>.github.io/trua-nay-an-gi/`
6. Gửi link đó cho mọi người — đó chính là trang `index.html`.

## Cách thêm / xóa / sửa quán

1. Mở file `quanly.html` (bạn có thể mở trực tiếp từ máy, hoặc qua link
   `https://<ten-tai-khoan>.github.io/trua-nay-an-gi/quanly.html`).
   > Trang này không có mật khẩu — về bản chất bất kỳ ai có link đều sửa được
   > trên máy họ, nhưng **thay đổi đó không tự động lên trang chung**. Chỉ có
   > người tải file `data.js` mới rồi push lên GitHub mới thực sự cập nhật cho
   > mọi người. Vì vậy đừng chia sẻ rộng link `quanly.html` nếu không muốn ai
   > khác "tưởng" họ sửa được.
2. Thêm/sửa/xóa quán ăn, quán nước như bình thường.
3. Bấm nút **"Tải file dữ liệu (data.js)"** ở cuối trang — trình duyệt sẽ tải
   về một file `data.js` mới.
4. Vào repo GitHub, mở file `data.js`, bấm nút chỉnh sửa (icon bút chì) hoặc
   xóa file cũ rồi upload file mới đè lên.
5. Bấm **Commit changes**. Sau vài phút, GitHub Pages sẽ tự cập nhật —
   mọi người vào `index.html` sẽ thấy danh sách mới.

## Thêm ảnh cho quán

Cách đơn giản nhất: tìm ảnh trên mạng (hoặc upload ảnh lên Imgur/Google
Drive/GitHub), lấy **link ảnh trực tiếp** (đuôi thường là .jpg/.png), dán vào
ô "Link ảnh" trong trang quản lý.

Nếu muốn dùng ảnh tự chụp và lưu ngay trong repo:
1. Tạo thư mục `images/` trong repo, upload ảnh vào đó (VD: `images/comtam.jpg`).
2. Trong ô "Link ảnh", nhập đường dẫn tương đối: `images/comtam.jpg`.

## Tính năng quay & chốt món

- **Quay thử**: bấm bao nhiêu lần tùy thích, không lưu gì cả.
- **Chốt món này**: chỉ khi bấm nút này thì kết quả mới được lưu vào lịch sử.
- **Lịch sử 2 tuần**: hiển thị các món đã chốt trong 14 ngày gần nhất. Lịch sử
  này lưu bằng `localStorage`, tức là **lưu riêng trên từng trình duyệt/máy**,
  không dùng chung cho mọi người — mỗi người quay trên máy mình sẽ có lịch sử
  riêng của người đó.
- **Phân khúc giá**: tích chọn "Dưới 30k / 31k–40k / 41k–50k / 51k–59k / Từ
  60k trở lên" trước khi quay — có thể tích nhiều ô cùng lúc (ví dụ tích cả
  "Dưới 30k" và "31k–40k" để
  chừa dư chút ngân sách). Không tích ô nào = không lọc, quay trên toàn bộ
  danh sách. Muốn đổi mốc giá, sửa mảng `PRICE_TIERS` ở đầu file `app.js`.
- **Hình thức**: mỗi quán chọn 1 trong 2 — "🍽️ Đi ăn" (ra quán ngồi) hoặc
  "🛵 Đặt app" (giao hàng). Áp dụng cho cả quán ăn lẫn quán nước. Lúc quay có
  thể tích chọn để chỉ quay trong đúng hình thức đang cần.
- **Ngôi sao hy vọng (chỉ áp dụng cho quán ăn)**: 5 mức —
  - *Không ưu tiên*: quay bình thường.
  - *🍜 Khô* / *🍲 Nước*: tăng nhẹ tỉ lệ loại đó (15%), vẫn có thể ra loại kia.
  - *✅ Chắc chắn Khô* / *✅ Chắc chắn Nước*: lọc cứng, chỉ quay trong đúng loại
    đã chọn — dùng khi bạn đã quyết chắc ăn khô hay ăn nước rồi, chỉ cần quay
    để chọn quán thôi.
  Muốn đổi mức tăng của "Khô/Nước" (không phải "Chắc chắn"), sửa hằng số
  `STAR_BOOST` trong `app.js`.
- **Giảm tỉ lệ quán đã ăn gần đây**: mỗi lần một quán xuất hiện trong lịch sử
  14 ngày, tỉ lệ quay trúng lại sẽ giảm nhẹ (mặc định còn 85% mỗi lần, giảm
  dồn). Muốn đổi mức giảm, sửa hằng số `REPEAT_DECAY` trong `app.js`.

## Ảnh cho quán

- **Dán link ảnh**: cách nhẹ nhàng nhất, không làm nặng file `data.js`.
- **Tải ảnh từ máy**: trang quản lý hỗ trợ nhiều định dạng (jpg, png, gif,
  webp...). Ảnh sẽ tự động được thu nhỏ trước khi lưu để `data.js` không bị
  quá nặng — nhưng nếu thêm rất nhiều ảnh upload trực tiếp, file `data.js` vẫn
  sẽ to dần, nên nếu quán có sẵn ảnh trên mạng thì ưu tiên dùng link.
- **Xem ảnh phóng to**: bấm vào bất kỳ ảnh nào (trong danh sách hoặc kết quả
  quay) để xem full-size, bấm ra ngoài để đóng lại.

## Lưu ý khi mới thêm thuộc tính "Hình thức"

Nếu bạn đã có sẵn danh sách quán từ trước (chưa có trường "Hình thức"), các
quán đó sẽ hiện trống ở mục này. Vào `quanly.html`, bấm "Sửa" từng quán và
chọn "Đi ăn" hoặc "Đặt app" cho đúng — quán chưa chọn sẽ không xuất hiện khi
bạn có tích bộ lọc "Hình thức" lúc quay.

## Lịch sử dùng chung cho mọi người (Firebase)

Mặc định, lịch sử "chốt món" chỉ lưu riêng trên trình duyệt của từng người.
Để **tất cả mọi người mở link đều thấy chung một lịch sử** (ai chốt món gì,
người khác cũng thấy), bạn cần cấu hình Firebase Realtime Database (miễn phí)
— làm theo hướng dẫn chi tiết ngay trong file `firebase-config.js`. Tóm tắt:

1. Tạo project miễn phí tại https://console.firebase.google.com
2. Bật Realtime Database, đặt rule cho phép đọc/ghi mục `history`.
3. Lấy đoạn `firebaseConfig`, dán vào file `firebase-config.js`.
4. Push lên GitHub như bình thường.

Nếu chưa muốn làm bước này, cứ để nguyên `firebase-config.js` mặc định — web
vẫn chạy bình thường, chỉ khác là lịch sử lưu riêng từng trình duyệt (không
dùng chung).

**Lưu ý bảo mật**: cách làm này để mục `history` trên Firebase ai có link đều
đọc/ghi được (không cần đăng nhập) — phù hợp cho app nhỏ dùng trong nhóm bạn
bè, đừng lưu thông tin nhạy cảm vào lịch sử.

## Nhắc ăn chay theo âm lịch

Mỗi khi mở trang, web tự tính ngày âm lịch hôm nay (dùng thuật toán thiên văn,
không cần internet gọi API ngoài). Nếu hôm đó là mùng 1, 14 hoặc 15 âm lịch,
một banner nhỏ sẽ hiện ở đầu trang nhắc "có thể cân nhắc ăn chay". Ngày
thường thì không hiện gì cả.

## Tùy biến thêm

- Đổi màu sắc, font chữ: sửa các biến ở đầu file `style.css` (phần `:root`).
- Đổi tốc độ / kiểu quay: sửa hàm `spin()` trong `app.js`.
- Đổi số ngày tính lịch sử (mặc định 14 ngày): sửa `HISTORY_WINDOW_DAYS` trong `app.js`.
