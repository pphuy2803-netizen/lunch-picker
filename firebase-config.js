// firebase-config.js
//
// File này dùng để lịch sử "chốt món" được LƯU CHUNG cho tất cả mọi người
// truy cập trang (không phân biệt máy/trình duyệt nào mở link).
//
// Vì GitHub Pages là web tĩnh (không có server riêng), ta cần một nơi lưu dữ
// liệu trên mạng — Firebase Realtime Database (của Google, có gói miễn phí)
// là lựa chọn đơn giản nhất không cần biết lập trình backend.
//
// ================= CÁCH LẤY THÔNG TIN BÊN DƯỚI =================
// 1. Vào https://console.firebase.google.com , đăng nhập bằng tài khoản Google.
// 2. Bấm "Add project" / "Tạo dự án" → đặt tên tùy ý (vd: trua-nay-an-gi) →
//    có thể tắt Google Analytics cho đơn giản → Create project.
// 3. Trong project, vào menu bên trái "Build" → "Realtime Database" →
//    "Create Database" → chọn khu vực gần VN (vd: Singapore) → chọn chế độ
//    "Start in test mode" → Enable.
// 4. Vẫn trong Realtime Database, mở tab "Rules", thay nội dung bằng:
//      {
//        "rules": {
//          "history": {
//            ".read": true,
//            ".write": true
//          }
//        }
//      }
//    rồi bấm Publish.
//    (Lưu ý: cách này cho phép AI CŨNG có link đều đọc/ghi được mục lịch sử —
//    chấp nhận được cho một app nhỏ dùng trong nhóm bạn bè, đừng lưu gì nhạy
//    cảm vào đây.)
// 5. Bấm biểu tượng bánh răng ⚙️ cạnh "Project Overview" → "Project settings".
// 6. Kéo xuống mục "Your apps" → bấm biểu tượng "</>" (Web) → đặt tên app tùy
//    ý → Register app (không cần bật Firebase Hosting).
// 7. Firebase sẽ hiện ra một đoạn code có object "firebaseConfig" — copy các
//    giá trị đó vào bên dưới, thay cho các chỗ "..." mẫu.
//
// Nếu bạn CHƯA muốn làm bước này, cứ để nguyên file như mặc định — trang vẫn
// chạy bình thường, chỉ khác là lịch sử sẽ lưu riêng trên từng trình duyệt
// (giống bản trước) thay vì dùng chung cho mọi người.

window.FIREBASE_CONFIG = {
apiKey: "AIzaSyB1OfDfBAzmyhZ1UVubPfXCaNmSwbVwsr4",
  authDomain: "trua-nay-an-gi-a2bba.firebaseapp.com",
  databaseURL: "https://trua-nay-an-gi-a2bba-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "trua-nay-an-gi-a2bba",
  storageBucket: "trua-nay-an-gi-a2bba.firebasestorage.app",
  messagingSenderId: "966561574598",
  appId: "1:966561574598:web:a03782a25bca4c31e871c7",
  measurementId: "G-64PVF7V3NG"
};
