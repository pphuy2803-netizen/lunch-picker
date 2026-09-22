// notify-config.js
//
// File này dùng để gửi TIN NHẮN THÔNG BÁO vào một nhóm Telegram mỗi khi có
// ai đó bấm "Chốt món này" hoặc "Chốt: Không ăn/uống". Điện thoại mọi người
// trong nhóm sẽ nhận được như tin nhắn Telegram bình thường.
//
// ================= CÁCH LẤY THÔNG TIN BÊN DƯỚI (khoảng 5 phút) =================
// 1. Mở Telegram, tìm kiếm tài khoản "BotFather" (có tick xanh chính chủ).
// 2. Nhắn "/newbot" cho BotFather, làm theo hướng dẫn: đặt tên bot (vd:
//    "Trua Nay An Gi Bot") và username cho bot (phải kết thúc bằng "bot",
//    vd: "trua_nay_an_gi_bot").
// 3. BotFather sẽ trả về một đoạn "token" dạng:
//    123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//    Copy đoạn này, dán vào "botToken" bên dưới.
// 4. Tạo một nhóm (group) Telegram với bạn bè (hoặc dùng nhóm có sẵn).
// 5. Thêm bot vừa tạo vào nhóm đó (tìm theo username bot đã đặt ở bước 2).
// 6. Lấy "chat ID" của nhóm — cách đơn giản nhất:
//    a. Trong nhóm, gửi thử một tin nhắn bất kỳ (vd: "test").
//    b. Mở trình duyệt, truy cập link sau (thay YOUR_BOT_TOKEN bằng token ở
//       bước 3):
//       https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
//    c. Tìm trong kết quả trả về (dạng JSON) mục "chat":{"id": -123456789...}
//       — số đó (thường là số âm vì là nhóm) chính là chat ID. Copy số đó
//       (giữ nguyên dấu trừ nếu có) dán vào "chatId" bên dưới (dạng chuỗi
//       trong dấu ngoặc kép).
//
// Nếu chưa muốn làm bước này, cứ để nguyên file mặc định — web vẫn hoạt động
// bình thường, chỉ là sẽ không gửi thông báo Telegram khi có người chốt món.
//
// ⚠️ LƯU Ý BẢO MẬT: token bot sẽ nằm trong code công khai (ai xem mã nguồn
// trang web cũng thấy được). Với 1 bot chỉ dùng để gửi tin vào 1 nhóm bạn bè
// thì rủi ro thấp (nhiều nhất là ai đó có thể lợi dụng bot gửi tin vào nhóm
// hộ), nhưng đừng dùng chung token này cho việc gì quan trọng khác.

window.TELEGRAM_CONFIG = {
  botToken: "DIEN_BOT_TOKEN_VAO_DAY",
  chatId: "DIEN_CHAT_ID_VAO_DAY"
};

// ================================================================
// CÁCH 2: GỬI EMAIL THÔNG BÁO QUA EmailJS (không cần Telegram)
// ================================================================
// EmailJS là dịch vụ miễn phí (200 email/tháng) cho phép gửi email thẳng từ
// trình duyệt, không cần server riêng. Làm theo các bước sau (~7-10 phút):
//
// 1. Vào https://www.emailjs.com , bấm "Sign Up" tạo tài khoản miễn phí
//    (có thể đăng ký bằng Google cho nhanh).
//
// 2. Sau khi đăng nhập, vào mục "Email Services" (menu bên trái) → bấm
//    "Add New Service" → chọn nhà cung cấp email bạn đang dùng để gửi đi
//    (vd: Gmail) → làm theo hướng dẫn kết nối tài khoản Gmail của bạn.
//    Sau khi tạo xong, bạn sẽ thấy một "Service ID" (dạng service_xxxxxxx)
//    — copy lại, dán vào "serviceId" bên dưới.
//
// 3. Vào mục "Email Templates" → bấm "Create New Template". Trong khung
//    soạn email hiện ra:
//    - Ô "To Email": điền (các) email bạn muốn NHẬN thông báo, cách nhau
//      bằng dấu phẩy nếu nhiều người, vd: an@gmail.com, binh@gmail.com
//    - Ô "Subject": gõ tùy ý, vd: Có người vừa chốt món trưa nay!
//    - Nội dung email (Content): xóa mẫu có sẵn, gõ:
//      {{message}}
//      (đúng như vậy, kể cả 2 dấu ngoặc nhọn — đây là chỗ nội dung thông
//      báo thật sẽ được điền vào).
//    - Bấm "Save". Bạn sẽ thấy "Template ID" (dạng template_xxxxxxx) ở đầu
//      trang — copy lại, dán vào "templateId" bên dưới.
//
// 4. Vào mục "Account" (góc trên bên phải, hoặc menu General) → tìm mục
//    "API Keys" hoặc "Public Key" → copy đoạn "Public Key" → dán vào
//    "publicKey" bên dưới.
//
// Nếu chưa muốn làm bước này, cứ để nguyên mặc định — web vẫn chạy bình
// thường, chỉ là chưa gửi email thông báo.
//
// LƯU Ý: gói miễn phí giới hạn 200 email/tháng — với nhóm bạn bè dùng hàng
// ngày thì thường đủ dùng thoải mái.

window.EMAILJS_CONFIG = {
  publicKey: "JwlmgylT8oUoMp3zt",
  serviceId: "service_rrfbzjk",
  templateId: "template_04hojyq"
};

// ================================================================
// CÁCH 3 (tùy chọn thêm): CHỌN GỬI EMAIL CHO TỪNG NGƯỜI CỤ THỂ
// ================================================================
// Nếu bạn điền danh sách "EMAIL_CONTACTS" bên dưới, mỗi khi bấm "Chốt món
// này" (hoặc "Chốt: Không ăn/uống"), web sẽ hiện ra các nút tên người —
// bấm vào tên ai thì email chỉ gửi cho đúng người đó, muốn báo nhiều người
// thì bấm nhiều tên. Nếu để trống mảng này, email sẽ tự gửi theo đúng địa
// chỉ cố định bạn đã điền sẵn trong ô "To Email" của template (Cách 2).
//
// QUAN TRỌNG: nếu dùng cách này, vào EmailJS → Email Templates → mở lại
// template đã tạo → tab "Settings" → sửa ô "To Email" thành:
//   {{to_email}}
// (đúng như vậy, thay vì điền sẵn địa chỉ cố định) — để web có thể tự thay
// đúng người bạn vừa bấm chọn vào đó.

window.EMAIL_CONTACTS = [
  { name: "Vinh", email: "thanhvinh09022001@gmail.com" },
  { name: "Huy", email: "pphuy2803@gmail.com" },
  { name: "Duy", email: "d.duypp@dcorp.com.vn" },
  { name: "Nghia", email: "d.nghidt@dcorp.com.vn" },
  { name: "Phong", email: "d.phongnd@dcorp.com.vn" },
  { name: "Trong", email: "d.tronglt@dcorp.com.vn" },
  { name: "Tri", email: "d.tridm@dcorp.com.vn" },
];
