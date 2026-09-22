// admin.js — logic cho trang quanly.html
// Lưu ý: các thay đổi ở đây CHỈ tồn tại trong phiên duyệt web hiện tại.
// Phải bấm "Tải file dữ liệu" rồi thay data.js trong repo GitHub + push
// thì mọi người mới thấy được thay đổi.

const MAX_IMAGE_WIDTH = 480; // ảnh upload sẽ được thu nhỏ về chiều rộng này

let workingData = JSON.parse(JSON.stringify(window.LUNCH_DATA)); // deep copy
let workingContacts = JSON.parse(JSON.stringify(window.EMAIL_CONTACTS || [])); // deep copy
let editingSection = null; // "quanAn" | "quanNuoc" | null
let editingId = null;
let editingContactIndex = null;

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function genId(prefix){
  return prefix + "_" + Date.now().toString(36) + Math.floor(Math.random()*1000);
}

function formatVnd(n){
  return Number(n).toLocaleString("vi-VN") + "đ";
}

function formatPriceRange(item){
  if (item.giaTu === item.giaDen) return formatVnd(item.giaTu);
  return `${formatVnd(item.giaTu)} - ${formatVnd(item.giaDen)}`;
}

function loaiLabel(loai){
  return loai === "kho" ? "🍜 Khô" : loai === "nuoc" ? "🍲 Nước" : "";
}

function hinhThucLabel(ht){
  return ht === "diAn" ? "🍽️ Đi ăn" : ht === "datApp" ? "🛵 Đặt app" : "";
}

function danhMucLabels(danhMuc){
  const map = { sinhTo: "🥤 Sinh tố - Nước ép", traSua: "🧋 Trà sữa", traTraiCay: "🍹 Trà trái cây", caPhe: "☕ Cà phê" };
  if (!danhMuc || danhMuc.length === 0) return "";
  return danhMuc.map(id => `<span class="tag-mini">${map[id] || id}</span>`).join(" ");
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Lightbox (xem ảnh phóng to trong trang quản lý) ----------
function openLightboxAdmin(src){
  if (!src) return;
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxOverlay").classList.add("show");
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lightboxOverlay").addEventListener("click", () => {
    document.getElementById("lightboxOverlay").classList.remove("show");
  });
});

// ---------- Upload ảnh: đọc nhiều định dạng, tự thu nhỏ ----------
function setupFileUpload(section){
  const fileInput = document.getElementById(section + "_file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("File này không phải ảnh.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Giữ PNG (có thể trong suốt), các định dạng khác nén thành JPEG cho nhẹ
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const quality = outputType === "image/jpeg" ? 0.82 : undefined;
        const dataUrl = canvas.toDataURL(outputType, quality);

        document.getElementById(section + "_anh").value = dataUrl;
        updatePreview(section, dataUrl);
        showToast("Đã gắn ảnh (đã thu nhỏ tự động).");
      };
      img.onerror = () => showToast("Không đọc được ảnh này, thử ảnh khác nhé.");
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updatePreview(section, src){
  const preview = document.getElementById(section + "_preview");
  if (src) {
    preview.src = src;
    preview.classList.add("show");
  } else {
    preview.src = "";
    preview.classList.remove("show");
  }
}

// khi người dùng tự dán link ảnh vào ô text, cũng cập nhật preview
function setupUrlPreview(section){
  document.getElementById(section + "_anh").addEventListener("input", (e) => {
    updatePreview(section, e.target.value.trim());
  });
}

// ---------- Render danh sách trong trang quản lý ----------
function renderSection(section){
  const listEl = document.getElementById(section + "List");
  const items = workingData[section];

  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-list">Chưa có quán nào.</div>`;
    return;
  }

  listEl.innerHTML = items.map(item => `
    <div class="admin-item">
      ${item.anh
        ? `<img class="thumb" style="cursor:zoom-in" onclick="openLightboxAdmin('${escapeHtml(item.anh).replace(/'/g,"\\'")}')" src="${escapeHtml(item.anh)}" onerror="this.style.display='none'">`
        : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;">🍜</div>`}
      <div class="meta">
        <div class="name">${escapeHtml(item.ten)} ${item.loai ? `<span class="tag-mini">${loaiLabel(item.loai)}</span>` : ""} ${item.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(item.hinhThuc)}</span>` : ""} ${danhMucLabels(item.danhMuc)}</div>
        <div class="sub">${formatPriceRange(item)}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" onclick="startEdit('${section}','${item.id}')">Sửa</button>
        <button class="icon-btn" onclick="deleteItem('${section}','${item.id}')">Xóa</button>
      </div>
    </div>
  `).join("");
}

function renderAll(){
  renderSection("quanAn");
  renderSection("quanNuoc");
}

function resetForm(section){
  document.getElementById(section + "_ten").value = "";
  document.getElementById(section + "_giaTu").value = "";
  document.getElementById(section + "_giaDen").value = "";
  document.getElementById(section + "_ghiChu").value = "";
  document.getElementById(section + "_anh").value = "";
  document.getElementById(section + "_file").value = "";
  if (section === "quanAn") document.getElementById("quanAn_loai").value = "kho";
  if (section === "quanAn") {
    document.getElementById("quanAn_hinhThuc").value = "";
  } else {
    document.querySelectorAll(".quanNuoc_danhMuc").forEach(cb => cb.checked = false);
  }
  updatePreview(section, "");
  document.getElementById(section + "_submitBtn").textContent = "Thêm quán";
  document.getElementById(section + "_cancelBtn").style.display = "none";
  editingSection = null;
  editingId = null;
}

function startEdit(section, id){
  const item = workingData[section].find(x => x.id === id);
  if (!item) return;
  document.getElementById(section + "_ten").value = item.ten;
  document.getElementById(section + "_giaTu").value = item.giaTu;
  document.getElementById(section + "_giaDen").value = item.giaDen;
  document.getElementById(section + "_ghiChu").value = item.ghiChu || "";
  document.getElementById(section + "_anh").value = item.anh || "";
  if (section === "quanAn") document.getElementById("quanAn_loai").value = item.loai || "kho";
  if (section === "quanAn") {
    document.getElementById("quanAn_hinhThuc").value = item.hinhThuc || "";
  } else {
    const danhMuc = item.danhMuc || [];
    document.querySelectorAll(".quanNuoc_danhMuc").forEach(cb => {
      cb.checked = danhMuc.includes(cb.value);
    });
  }
  updatePreview(section, item.anh || "");
  document.getElementById(section + "_submitBtn").textContent = "Lưu thay đổi";
  document.getElementById(section + "_cancelBtn").style.display = "inline-block";
  editingSection = section;
  editingId = id;
  document.getElementById(section + "_ten").scrollIntoView({behavior:"smooth", block:"center"});
}

function deleteItem(section, id){
  const item = workingData[section].find(x => x.id === id);
  if (!item) return;
  if (!confirm(`Xóa "${item.ten}" khỏi danh sách?`)) return;
  workingData[section] = workingData[section].filter(x => x.id !== id);
  renderSection(section);
  showToast("Đã xóa. Nhớ tải file & push lên GitHub để cập nhật cho mọi người.");
}

function submitForm(section){
  const ten = document.getElementById(section + "_ten").value.trim();
  const giaTuRaw = document.getElementById(section + "_giaTu").value;
  const giaDenRaw = document.getElementById(section + "_giaDen").value;
  const ghiChu = document.getElementById(section + "_ghiChu").value.trim();
  const anh = document.getElementById(section + "_anh").value.trim();

  if (!ten) {
    showToast("Bạn cần nhập tên quán.");
    return;
  }

  const giaTu = giaTuRaw === "" ? 0 : Number(giaTuRaw);
  const giaDen = giaDenRaw === "" ? giaTu : Number(giaDenRaw);

  if (isNaN(giaTu) || isNaN(giaDen) || giaTu < 0 || giaDen < 0) {
    showToast("Giá phải là số hợp lệ.");
    return;
  }
  if (giaDen < giaTu) {
    showToast('"Giá đến" phải lớn hơn hoặc bằng "Giá từ".');
    return;
  }

  const loai = section === "quanAn" ? document.getElementById("quanAn_loai").value : undefined;
  const hinhThuc = section === "quanAn" ? document.getElementById("quanAn_hinhThuc").value : undefined;
  const danhMuc = section === "quanNuoc"
    ? Array.from(document.querySelectorAll(".quanNuoc_danhMuc:checked")).map(cb => cb.value)
    : undefined;

  if (editingSection === section && editingId) {
    const item = workingData[section].find(x => x.id === editingId);
    item.ten = ten; item.giaTu = giaTu; item.giaDen = giaDen;
    item.ghiChu = ghiChu; item.anh = anh;
    if (loai !== undefined) item.loai = loai;
    if (hinhThuc !== undefined) item.hinhThuc = hinhThuc;
    if (danhMuc !== undefined) item.danhMuc = danhMuc;
    showToast("Đã lưu thay đổi.");
  } else {
    const newItem = { id: genId(section === "quanAn" ? "qa" : "qn"), ten, giaTu, giaDen, ghiChu, anh };
    if (loai !== undefined) newItem.loai = loai;
    if (hinhThuc !== undefined) newItem.hinhThuc = hinhThuc;
    if (danhMuc !== undefined) newItem.danhMuc = danhMuc;
    workingData[section].push(newItem);
    showToast("Đã thêm quán mới.");
  }

  resetForm(section);
  renderSection(section);
}

function exportData(){
  const content = `// data.js
// Được xuất từ trang quản lý — thay file này vào repo GitHub rồi commit + push
// để cập nhật danh sách cho tất cả mọi người.

window.LUNCH_DATA = ${JSON.stringify(workingData, null, 2)};
`;
  const blob = new Blob([content], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.js";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Đã tải data.js — nhớ thay vào repo & push!");
}

// ---------- Quản lý danh sách email nhận thông báo ----------
function renderContactList(){
  const listEl = document.getElementById("contactList");
  if (workingContacts.length === 0) {
    listEl.innerHTML = `<div class="empty-list">Chưa có ai trong danh sách.</div>`;
    return;
  }
  listEl.innerHTML = workingContacts.map((c, idx) => `
    <div class="admin-item">
      <div class="meta">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="sub">${escapeHtml(c.email)}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" onclick="startEditContact(${idx})">Sửa</button>
        <button class="icon-btn" onclick="deleteContact(${idx})">Xóa</button>
      </div>
    </div>
  `).join("");
}

function resetContactForm(){
  document.getElementById("contact_name").value = "";
  document.getElementById("contact_email").value = "";
  document.getElementById("contact_submitBtn").textContent = "Thêm người";
  document.getElementById("contact_cancelBtn").style.display = "none";
  editingContactIndex = null;
}

function startEditContact(idx){
  const c = workingContacts[idx];
  if (!c) return;
  document.getElementById("contact_name").value = c.name;
  document.getElementById("contact_email").value = c.email;
  document.getElementById("contact_submitBtn").textContent = "Lưu thay đổi";
  document.getElementById("contact_cancelBtn").style.display = "inline-block";
  editingContactIndex = idx;
}

function deleteContact(idx){
  const c = workingContacts[idx];
  if (!c) return;
  if (!confirm(`Xóa "${c.name}" khỏi danh sách nhận thông báo?`)) return;
  workingContacts.splice(idx, 1);
  renderContactList();
  showToast("Đã xóa. Nhớ tải file cấu hình thông báo & push lên GitHub.");
}

function submitContactForm(){
  const name = document.getElementById("contact_name").value.trim();
  const email = document.getElementById("contact_email").value.trim();

  if (!name || !email) {
    showToast("Cần nhập đủ tên và email.");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    showToast("Email có vẻ không hợp lệ, kiểm tra lại nhé.");
    return;
  }

  if (editingContactIndex !== null) {
    workingContacts[editingContactIndex] = { name, email };
    showToast("Đã lưu thay đổi.");
  } else {
    workingContacts.push({ name, email });
    showToast("Đã thêm người mới vào danh sách.");
  }

  resetContactForm();
  renderContactList();
}

function exportNotifyConfig(){
  const telegramCfg = window.TELEGRAM_CONFIG || { botToken: "DIEN_BOT_TOKEN_VAO_DAY", chatId: "DIEN_CHAT_ID_VAO_DAY" };
  const emailjsCfg = window.EMAILJS_CONFIG || { publicKey: "DIEN_PUBLIC_KEY_VAO_DAY", serviceId: "DIEN_SERVICE_ID_VAO_DAY", templateId: "DIEN_TEMPLATE_ID_VAO_DAY" };

  const contactsCode = workingContacts.length > 0
    ? workingContacts.map(c => `  { name: ${JSON.stringify(c.name)}, email: ${JSON.stringify(c.email)} },`).join("\n")
    : `  // { name: "An", email: "an@gmail.com" },`;

  const content = `// notify-config.js
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

window.TELEGRAM_CONFIG = ${JSON.stringify(telegramCfg, null, 2)};

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
//    - Ô "To Email": nếu dùng danh sách "chọn từng người" (Cách 3 bên
//      dưới), điền {{to_email}}; nếu không, điền sẵn (các) email cố định
//      muốn nhận, cách nhau bằng dấu phẩy.
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

window.EMAILJS_CONFIG = ${JSON.stringify(emailjsCfg, null, 2)};

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
//
// Danh sách này quản lý dễ dàng qua trang quanly.html (mục "Danh sách nhận
// email thông báo") — không cần sửa tay ở đây, chỉ cần tải file mới sau khi
// thêm/sửa/xóa người trong trang quản lý rồi push lên GitHub.

window.EMAIL_CONTACTS = [
${contactsCode}
];
`;

  const blob = new Blob([content], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notify-config.js";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Đã tải notify-config.js — nhớ thay vào repo & push!");
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  renderContactList();
  ["quanAn", "quanNuoc"].forEach(section => {
    setupFileUpload(section);
    setupUrlPreview(section);
  });
  document.getElementById("quanAn_submitBtn").addEventListener("click", () => submitForm("quanAn"));
  document.getElementById("quanNuoc_submitBtn").addEventListener("click", () => submitForm("quanNuoc"));
  document.getElementById("quanAn_cancelBtn").addEventListener("click", () => resetForm("quanAn"));
  document.getElementById("quanNuoc_cancelBtn").addEventListener("click", () => resetForm("quanNuoc"));
  document.getElementById("contact_submitBtn").addEventListener("click", submitContactForm);
  document.getElementById("contact_cancelBtn").addEventListener("click", resetContactForm);
  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("exportNotifyBtn").addEventListener("click", exportNotifyConfig);
});
