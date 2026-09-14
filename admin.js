// admin.js — logic cho trang quanly.html
// Lưu ý: các thay đổi ở đây CHỈ tồn tại trong phiên duyệt web hiện tại.
// Phải bấm "Tải file dữ liệu" rồi thay data.js trong repo GitHub + push
// thì mọi người mới thấy được thay đổi.

const MAX_IMAGE_WIDTH = 480; // ảnh upload sẽ được thu nhỏ về chiều rộng này

let workingData = JSON.parse(JSON.stringify(window.LUNCH_DATA)); // deep copy
let editingSection = null; // "quanAn" | "quanNuoc" | null
let editingId = null;

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
        <div class="name">${escapeHtml(item.ten)} ${item.loai ? `<span class="tag-mini">${loaiLabel(item.loai)}</span>` : ""} ${item.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(item.hinhThuc)}</span>` : ""}</div>
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
  document.getElementById(section + "_hinhThuc").value = "";
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
  document.getElementById(section + "_hinhThuc").value = item.hinhThuc || "";
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
  const hinhThuc = document.getElementById(section + "_hinhThuc").value;

  if (editingSection === section && editingId) {
    const item = workingData[section].find(x => x.id === editingId);
    item.ten = ten; item.giaTu = giaTu; item.giaDen = giaDen;
    item.ghiChu = ghiChu; item.anh = anh; item.hinhThuc = hinhThuc;
    if (loai !== undefined) item.loai = loai;
    showToast("Đã lưu thay đổi.");
  } else {
    const newItem = { id: genId(section === "quanAn" ? "qa" : "qn"), ten, giaTu, giaDen, ghiChu, anh, hinhThuc };
    if (loai !== undefined) newItem.loai = loai;
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

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  ["quanAn", "quanNuoc"].forEach(section => {
    setupFileUpload(section);
    setupUrlPreview(section);
  });
  document.getElementById("quanAn_submitBtn").addEventListener("click", () => submitForm("quanAn"));
  document.getElementById("quanNuoc_submitBtn").addEventListener("click", () => submitForm("quanNuoc"));
  document.getElementById("quanAn_cancelBtn").addEventListener("click", () => resetForm("quanAn"));
  document.getElementById("quanNuoc_cancelBtn").addEventListener("click", () => resetForm("quanNuoc"));
  document.getElementById("exportBtn").addEventListener("click", exportData);
});
