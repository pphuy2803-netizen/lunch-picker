// app.js — logic cho trang chính (index.html)

// ---------- Cấu hình có thể chỉnh tay ----------
const HISTORY_WINDOW_DAYS = 14;   // "đã ăn trong 2 tuần" tính giảm tỉ lệ
const REPEAT_DECAY = 0.85;        // mỗi lần đã ăn gần đây, tỉ lệ quay ra lại còn 85%
const STAR_BOOST = 1.15;          // ngôi sao hy vọng (quán ăn) tăng tỉ lệ thêm 15%
const WISH_BOOST = 1.15;          // nguyện vọng (quán nước) tăng tỉ lệ thêm 15%
const HISTORY_STORAGE_KEY = "truaNayAnGi_history_v1";

// Phân khúc giá riêng cho quán ăn
const PRICE_TIERS_FOOD = [
  { id: "duoi30", label: "Dưới 30k",   min: 0,     max: 30000 },
  { id: "31-40",  label: "31k – 40k",  min: 31000, max: 40000 },
  { id: "41-50",  label: "41k – 50k",  min: 41000, max: 50000 },
  { id: "51-59",  label: "51k – 59k",  min: 51000, max: 59000 },
  { id: "tu60",   label: "Từ 60k trở lên", min: 60000, max: Infinity },
];

// Phân khúc giá riêng cho quán nước
const PRICE_TIERS_DRINK = [
  { id: "duoi30", label: "Dưới 30k",  min: 0,     max: 30000 },
  { id: "31-50",  label: "31k – 50k", min: 31000, max: 50000 },
  { id: "tren50", label: "Trên 50k",  min: 50001, max: Infinity },
];

// Danh mục đồ uống (mỗi quán có thể thuộc nhiều danh mục)
const DRINK_CATEGORIES = [
  { id: "sinhTo",     label: "🥤 Sinh tố - Nước ép" },
  { id: "traSua",     label: "🧋 Trà sữa" },
  { id: "traTraiCay", label: "🍹 Trà trái cây" },
  { id: "caPhe",      label: "☕ Cà phê" },
];

function getPriceTiers(){
  return currentTab === "quanAn" ? PRICE_TIERS_FOOD : PRICE_TIERS_DRINK;
}

// ---------- State ----------
let currentTab = "quanAn";   // "quanAn" | "quanNuoc"
// bộ lọc giá lưu riêng cho từng tab để không bị mất khi chuyển qua lại
let tierSelections = { quanAn: new Set(), quanNuoc: new Set() };
let currentModes = new Set();     // hình thức — chỉ áp dụng cho quán ăn
let currentCategories = new Set(); // danh mục đồ uống — chỉ áp dụng cho quán nước
let currentStar = "none";         // ngôi sao hy vọng — chỉ áp dụng cho quán ăn
let currentWishlist = new Set();   // nguyện vọng (id quán) — chỉ áp dụng cho quán nước
let spinning = false;
let currentResult = null;    // item đang hiển thị, chờ chốt

// ---------- Helpers ----------
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
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
  if (!danhMuc || danhMuc.length === 0) return "";
  return danhMuc.map(id => {
    const cat = DRINK_CATEGORIES.find(c => c.id === id);
    return cat ? `<span class="tag-mini">${cat.label}</span>` : "";
  }).join(" ");
}

function getCurrentList(){
  return window.LUNCH_DATA[currentTab] || [];
}

// ---------- Lịch sử (dùng chung qua Firebase, hoặc lưu cục bộ nếu chưa cấu hình) ----------
let useFirebase = false;
let firebaseHistoryRef = null;
let historyCache = []; // luôn là mảng {key, date, section, itemId, ten, gia, anh, loai, hinhThuc}

function isFirebaseConfigured(){
  const cfg = window.FIREBASE_CONFIG;
  return !!(cfg && cfg.apiKey && !String(cfg.apiKey).startsWith("DIEN_"));
}

function loadLocalHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}

function saveLocalHistory(list){
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
}

function withinWindow(dateIso, days){
  const then = new Date(dateIso).getTime();
  const now = Date.now();
  return (now - then) <= days * 24 * 60 * 60 * 1000;
}

function initHistoryStore(){
  if (isFirebaseConfigured() && window.firebase) {
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      firebaseHistoryRef = firebase.database().ref(window.HISTORY_PATH || "history");
      useFirebase = true;
      document.getElementById("historyNote").textContent =
        "Lịch sử này dùng chung cho tất cả mọi người mở link — ai chốt món nào, mọi người đều thấy.";
      firebaseHistoryRef.on("value", snapshot => {
        const val = snapshot.val() || {};
        historyCache = Object.keys(val).map(key => ({ key, ...val[key] }));
        renderHistory();
      }, err => {
        console.error("Không kết nối được Firebase, chuyển sang lưu cục bộ:", err);
        useFirebase = false;
        historyCache = loadLocalHistory();
        renderHistory();
      });
      return;
    } catch(e){
      console.error("Lỗi khởi tạo Firebase, chuyển sang lưu cục bộ:", e);
    }
  }
  useFirebase = false;
  historyCache = loadLocalHistory();
  document.getElementById("historyNote").textContent =
    "Lịch sử này đang lưu riêng trên trình duyệt của bạn (chưa cấu hình Firebase để dùng chung).";
}

function addHistoryEntry(section, item){
  const entry = {
    date: new Date().toISOString(),
    section,
    itemId: item.id,
    ten: item.ten,
    gia: formatPriceRange(item),
    anh: item.anh || "",
    loai: item.loai || "",
    hinhThuc: item.hinhThuc || ""
  };

  if (useFirebase && firebaseHistoryRef) {
    firebaseHistoryRef.push(entry); // listener .on("value") sẽ tự render lại
  } else {
    const key = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    historyCache.unshift({ key, ...entry });
    saveLocalHistory(historyCache);
    renderHistory();
  }
}

function removeHistoryEntry(key){
  if (useFirebase && firebaseHistoryRef) {
    firebaseHistoryRef.child(key).remove();
  } else {
    historyCache = historyCache.filter(h => h.key !== key);
    saveLocalHistory(historyCache);
    renderHistory();
  }
}

function renderHistory(){
  const el = document.getElementById("historyList");
  const all = historyCache
    .filter(h => withinWindow(h.date, HISTORY_WINDOW_DAYS))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (all.length === 0) {
    el.innerHTML = `<div class="empty-list">Chưa chốt món nào trong 2 tuần qua.</div>`;
    return;
  }

  el.innerHTML = all.map(h => {
    const d = new Date(h.date);
    const dateLabel = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    const timeLabel = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const icon = h.section === "quanAn" ? "🍚" : "🥤";
    return `
      <div class="history-item">
        <div class="history-date">${dateLabel}<span>${timeLabel}</span></div>
        <div class="history-body">
          <div class="history-name">${icon} ${escapeHtml(h.ten)} ${h.loai ? `<span class="tag-mini">${loaiLabel(h.loai)}</span>` : ""} ${h.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(h.hinhThuc)}</span>` : ""}</div>
          <div class="history-sub">${escapeHtml(h.gia)}</div>
        </div>
        <button class="icon-btn" onclick="removeHistoryEntry('${h.key}')" title="Xóa khỏi lịch sử">✕</button>
      </div>
    `;
  }).join("");
}

// ---------- Trọng số quay ----------
function computeWeight(item, section, history){
  let w = 1;

  if (section === "quanAn" && (currentStar === "kho" || currentStar === "nuoc") && item.loai === currentStar) {
    w *= STAR_BOOST;
  }

  if (section === "quanNuoc" && currentWishlist.has(item.id)) {
    w *= WISH_BOOST;
  }

  const recentCount = history.filter(h =>
    h.section === section &&
    h.itemId === item.id &&
    withinWindow(h.date, HISTORY_WINDOW_DAYS)
  ).length;

  w *= Math.pow(REPEAT_DECAY, recentCount);
  return w;
}

function getFilteredPool(){
  let list = getCurrentList();
  const tiers = tierSelections[currentTab];

  if (tiers.size > 0) {
    const activeTiers = getPriceTiers().filter(t => tiers.has(t.id));
    list = list.filter(item =>
      activeTiers.some(tier => item.giaTu <= tier.max && item.giaDen >= tier.min)
    );
  }

  if (currentTab === "quanAn") {
    if (currentModes.size > 0) {
      list = list.filter(item => item.hinhThuc && currentModes.has(item.hinhThuc));
    }
    if (currentStar === "chacKho" || currentStar === "chacNuoc") {
      const wantLoai = currentStar === "chacKho" ? "kho" : "nuoc";
      list = list.filter(item => item.loai === wantLoai);
    }
  }

  if (currentTab === "quanNuoc" && currentCategories.size > 0) {
    list = list.filter(item =>
      Array.isArray(item.danhMuc) && item.danhMuc.some(dm => currentCategories.has(dm))
    );
  }

  return list;
}

function pickWeighted(pool){
  const weighted = pool.map(item => ({ item, weight: computeWeight(item, currentTab, historyCache) }));
  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) {
    if (r < w.weight) return w.item;
    r -= w.weight;
  }
  return weighted[weighted.length - 1].item;
}

// ---------- Render danh sách ----------
function renderThumb(item, sizeClass, clickable){
  if (item.anh) {
    const click = clickable ? `onclick="openLightbox('${escapeHtml(item.anh).replace(/'/g,"\\'")}')"` : "";
    return `<img class="${sizeClass}${clickable ? " zoomable" : ""}" ${click} src="${escapeHtml(item.anh)}" alt="${escapeHtml(item.ten)}" onerror="this.style.display='none'">`;
  }
  return `<div class="${sizeClass} no-img">🍜</div>`;
}

function renderList(){
  const list = getCurrentList();
  const listEl = document.getElementById("listEl");
  const headingEl = document.getElementById("listHeading");

  headingEl.textContent = currentTab === "quanAn"
    ? `Tất cả quán ăn (${list.length})`
    : `Tất cả quán nước (${list.length})`;

  if (list.length === 0) {
    listEl.innerHTML = `<div class="empty-list">Chưa có quán nào trong danh sách này.</div>`;
    return;
  }

  listEl.innerHTML = list.map(item => `
    <div class="card">
      ${renderThumb(item, "thumb", true)}
      <div class="info">
        <div class="name">${escapeHtml(item.ten)} ${item.loai ? `<span class="tag-mini">${loaiLabel(item.loai)}</span>` : ""} ${item.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(item.hinhThuc)}</span>` : ""} ${danhMucLabels(item.danhMuc)}</div>
        <div class="price">${formatPriceRange(item)}</div>
        ${item.ghiChu ? `<div class="note">${escapeHtml(item.ghiChu)}</div>` : ""}
      </div>
    </div>
  `).join("");
}

// ---------- Render các bộ lọc phụ thuộc tab ----------
function renderPriceChips(){
  const container = document.getElementById("tierChips");
  const tiers = getPriceTiers();
  const selected = tierSelections[currentTab];
  container.innerHTML = tiers.map(t => `
    <button class="tier-chip${selected.has(t.id) ? " active" : ""}" data-tier="${t.id}">${escapeHtml(t.label)}</button>
  `).join("");
  container.querySelectorAll(".tier-chip").forEach(chip => {
    chip.addEventListener("click", () => toggleTier(chip.dataset.tier));
  });
}

function renderWishlistPanel(){
  const panel = document.getElementById("wishlistPanel");
  const list = window.LUNCH_DATA.quanNuoc || [];
  if (list.length === 0) {
    panel.innerHTML = `<div class="empty-list">Chưa có quán nước nào.</div>`;
    return;
  }
  panel.innerHTML = list.map(item => `
    <label class="wish-item">
      <input type="checkbox" data-wish="${item.id}" ${currentWishlist.has(item.id) ? "checked" : ""}>
      <span>${escapeHtml(item.ten)}</span>
    </label>
  `).join("");
  panel.querySelectorAll("input[data-wish]").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) currentWishlist.add(cb.dataset.wish);
      else currentWishlist.delete(cb.dataset.wish);
      updateWishlistSummary();
    });
  });
}

function updateWishlistSummary(){
  const btn = document.getElementById("wishlistToggleBtn");
  btn.textContent = currentWishlist.size > 0
    ? `🌟 Nguyện vọng (${currentWishlist.size} quán) ▾`
    : `🌟 Chọn quán nguyện vọng ▾`;
}

// ---------- Điều khiển tab / bộ lọc ----------
function switchTab(tab){
  if (spinning) return;
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.getElementById("starRow").style.display = tab === "quanAn" ? "flex" : "none";
  document.getElementById("modeRow").style.display = tab === "quanAn" ? "flex" : "none";
  document.getElementById("categoryRow").style.display = tab === "quanNuoc" ? "flex" : "none";
  document.getElementById("wishlistRow").style.display = tab === "quanNuoc" ? "block" : "none";

  currentStar = "none";
  document.querySelectorAll(".star-chip").forEach(c => c.classList.toggle("active", c.dataset.star === "none"));

  renderPriceChips();
  renderWishlistPanel();
  resetFlipCard();
  renderList();
}

function toggleTier(tierId){
  if (spinning) return;
  const selected = tierSelections[currentTab];
  if (selected.has(tierId)) selected.delete(tierId);
  else selected.add(tierId);
  renderPriceChips();
}

function toggleMode(modeId){
  if (spinning) return;
  if (currentModes.has(modeId)) currentModes.delete(modeId);
  else currentModes.add(modeId);
  document.querySelectorAll(".mode-chip").forEach(c => {
    c.classList.toggle("active", currentModes.has(c.dataset.mode));
  });
}

function toggleCategory(catId){
  if (spinning) return;
  if (currentCategories.has(catId)) currentCategories.delete(catId);
  else currentCategories.add(catId);
  document.querySelectorAll(".category-chip").forEach(c => {
    c.classList.toggle("active", currentCategories.has(c.dataset.cat));
  });
}

function setStar(star){
  if (spinning) return;
  currentStar = star;
  document.querySelectorAll(".star-chip").forEach(c => c.classList.toggle("active", c.dataset.star === star));
}

function toggleWishlistPanel(){
  const panel = document.getElementById("wishlistPanel");
  panel.classList.toggle("show");
}

// ---------- Quay & chốt ----------
function resetFlipCard(){
  const card = document.getElementById("flipCard");
  card.classList.remove("spinning");
  card.innerHTML = `<div class="placeholder">Bấm "Quay thử" để xem hôm nay ăn gì 👇</div>`;
  currentResult = null;
  document.getElementById("confirmBtn").style.display = "none";
}

function spin(){
  const pool = getFilteredPool();
  const card = document.getElementById("flipCard");
  const btn = document.getElementById("spinBtn");
  const confirmBtn = document.getElementById("confirmBtn");

  if (pool.length === 0) {
    card.innerHTML = `<div class="placeholder">Không có quán nào khớp bộ lọc đang chọn.</div>`;
    confirmBtn.style.display = "none";
    currentResult = null;
    return;
  }
  if (spinning) return;

  spinning = true;
  btn.disabled = true;
  confirmBtn.style.display = "none";
  card.classList.add("spinning");

  let ticks = 0;
  const totalTicks = 16 + Math.floor(Math.random() * 6);
  const finalItem = pickWeighted(pool);

  const interval = setInterval(() => {
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    card.innerHTML = `<div class="result"><div class="name">${escapeHtml(randomItem.ten)}</div></div>`;
    ticks++;

    if (ticks >= totalTicks) {
      clearInterval(interval);
      card.classList.remove("spinning");
      card.innerHTML = `
        <div class="result">
          ${finalItem.anh ? `<img class="zoomable" onclick="openLightbox('${escapeHtml(finalItem.anh).replace(/'/g,"\\'")}')" src="${escapeHtml(finalItem.anh)}" alt="${escapeHtml(finalItem.ten)}" onerror="this.style.display='none'">` : ""}
          <div class="name">${escapeHtml(finalItem.ten)} ${finalItem.loai ? `<span class="tag-mini">${loaiLabel(finalItem.loai)}</span>` : ""} ${finalItem.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(finalItem.hinhThuc)}</span>` : ""} ${danhMucLabels(finalItem.danhMuc)}</div>
          <div class="price">${formatPriceRange(finalItem)}</div>
          ${finalItem.ghiChu ? `<div class="note">${escapeHtml(finalItem.ghiChu)}</div>` : ""}
        </div>
      `;
      spinning = false;
      btn.disabled = false;
      currentResult = finalItem;
      confirmBtn.style.display = "inline-block";
      confirmBtn.textContent = "🔒 Chốt món này";
    }
  }, 90);
}

function confirmChoice(){
  if (!currentResult) return;
  addHistoryEntry(currentTab, currentResult);
  const confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.textContent = "✓ Đã chốt!";
  confirmBtn.disabled = true;
  setTimeout(() => {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "🔒 Chốt món này";
  }, 1400);
}

// ---------- Lightbox ----------
function openLightbox(src){
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxOverlay").classList.add("show");
}
function closeLightbox(){
  document.getElementById("lightboxOverlay").classList.remove("show");
  document.getElementById("lightboxImg").src = "";
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll(".mode-chip").forEach(chip => {
    chip.addEventListener("click", () => toggleMode(chip.dataset.mode));
  });
  document.querySelectorAll(".category-chip").forEach(chip => {
    chip.addEventListener("click", () => toggleCategory(chip.dataset.cat));
  });
  document.querySelectorAll(".star-chip").forEach(chip => {
    chip.addEventListener("click", () => setStar(chip.dataset.star));
  });
  document.getElementById("spinBtn").addEventListener("click", spin);
  document.getElementById("confirmBtn").addEventListener("click", confirmChoice);
  document.getElementById("lightboxOverlay").addEventListener("click", closeLightbox);
  document.getElementById("wishlistToggleBtn").addEventListener("click", toggleWishlistPanel);

  renderPriceChips();
  updateWishlistSummary();
  resetFlipCard();
  renderList();
  initHistoryStore();
  renderHistory();

  const vegMsg = window.getVegetarianReminder ? window.getVegetarianReminder() : null;
  if (vegMsg) {
    const banner = document.getElementById("vegBanner");
    banner.textContent = vegMsg;
    banner.style.display = "block";
  }
});
