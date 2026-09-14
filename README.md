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
- **Phân khúc giá**: tích chọn "Dưới 35k / 35k–50k / Trên 50k" trước khi quay
  — có thể tích nhiều ô cùng lúc (ví dụ tích cả "Dưới 35k" và "35k–50k" để
  chừa dư chút ngân sách). Không tích ô nào = không lọc, quay trên toàn bộ
  danh sách. Muốn đổi mốc giá, sửa mảng `PRICE_TIERS` ở đầu file `app.js`.
- **Ngôi sao hy vọng (chỉ áp dụng cho quán ăn)**: chọn "Khô" hoặc "Nước" để
  tăng nhẹ tỉ lệ quay trúng loại đó (mặc định tăng 15%, không làm lệch tỉ lệ
  quá nhiều). Muốn đổi mức tăng, sửa hằng số `STAR_BOOST` trong `app.js`.
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

## Tùy biến thêm

- Đổi màu sắc, font chữ: sửa các biến ở đầu file `style.css` (phần `:root`).
- Đổi tốc độ / kiểu quay: sửa hàm `spin()` trong `app.js`.
- Đổi số ngày tính lịch sử (mặc định 14 ngày): sửa `HISTORY_WINDOW_DAYS` trong `app.js`.
