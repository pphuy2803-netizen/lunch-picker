// app.js — logic cho trang chính (index.html)

// ---------- Cấu hình có thể chỉnh tay ----------
const HISTORY_WINDOW_DAYS = 14;   // "đã ăn trong 2 tuần" tính giảm tỉ lệ
const REPEAT_DECAY = 0.85;        // mỗi lần đã ăn gần đây, tỉ lệ quay ra lại còn 85%
const STAR_BOOST = 1.15;          // ngôi sao hy vọng tăng tỉ lệ thêm 15%
const HISTORY_STORAGE_KEY = "truaNayAnGi_history_v1";

const PRICE_TIERS = [
  { id: "duoi35", label: "Dưới 35k",   min: 0,     max: 34999 },
  { id: "35-50",  label: "35k – 50k",  min: 35000, max: 50000 },
  { id: "tren50", label: "Trên 50k",   min: 50001, max: Infinity },
];

// ---------- State ----------
let currentTab = "quanAn";   // "quanAn" | "quanNuoc"
let currentTiers = new Set();  // rỗng = không lọc, chọn nhiều phân khúc cùng lúc
let currentModes = new Set();   // rỗng = không lọc hình thức; "diAn" | "datApp"
let currentStar = "none";    // "none" | "kho" | "nuoc" | "chacKho" | "chacNuoc" — chỉ áp dụng cho quán ăn
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

function getCurrentList(){
  return window.LUNCH_DATA[currentTab] || [];
}

// ---------- Lịch sử (localStorage) ----------
function loadHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}

function saveHistory(list){
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
}

function withinWindow(dateIso, days){
  const then = new Date(dateIso).getTime();
  const now = Date.now();
  return (now - then) <= days * 24 * 60 * 60 * 1000;
}

function addHistoryEntry(section, item){
  const history = loadHistory();
  history.unshift({
    date: new Date().toISOString(),
    section,
    itemId: item.id,
    ten: item.ten,
    gia: formatPriceRange(item),
    anh: item.anh || "",
    loai: item.loai || "",
    hinhThuc: item.hinhThuc || ""
  });
  saveHistory(history);
}

function removeHistoryEntry(index){
  const history = loadHistory();
  history.splice(index, 1);
  saveHistory(history);
  renderHistory();
}

function renderHistory(){
  const el = document.getElementById("historyList");
  const all = loadHistory().filter(h => withinWindow(h.date, HISTORY_WINDOW_DAYS));

  if (all.length === 0) {
    el.innerHTML = `<div class="empty-list">Chưa chốt món nào trong 2 tuần qua.</div>`;
    return;
  }

  el.innerHTML = all.map((h, idx) => {
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
        <button class="icon-btn" onclick="removeHistoryEntry(${idx})" title="Xóa khỏi lịch sử">✕</button>
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

  if (currentTiers.size > 0) {
    const activeTiers = PRICE_TIERS.filter(t => currentTiers.has(t.id));
    list = list.filter(item =>
      activeTiers.some(tier => item.giaTu <= tier.max && item.giaDen >= tier.min)
    );
  }

  if (currentModes.size > 0) {
    list = list.filter(item => item.hinhThuc && currentModes.has(item.hinhThuc));
  }

  if (currentTab === "quanAn" && (currentStar === "chacKho" || currentStar === "chacNuoc")) {
    const wantLoai = currentStar === "chacKho" ? "kho" : "nuoc";
    list = list.filter(item => item.loai === wantLoai);
  }

  return list;
}

function pickWeighted(pool){
  const history = loadHistory();
  const weighted = pool.map(item => ({ item, weight: computeWeight(item, currentTab, history) }));
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
        <div class="name">${escapeHtml(item.ten)} ${item.loai ? `<span class="tag-mini">${loaiLabel(item.loai)}</span>` : ""} ${item.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(item.hinhThuc)}</span>` : ""}</div>
        <div class="price">${formatPriceRange(item)}</div>
        ${item.ghiChu ? `<div class="note">${escapeHtml(item.ghiChu)}</div>` : ""}
      </div>
    </div>
  `).join("");
}

// ---------- Điều khiển tab / bộ lọc ----------
function switchTab(tab){
  if (spinning) return;
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.getElementById("starRow").style.display = tab === "quanAn" ? "flex" : "none";
  currentStar = "none";
  document.querySelectorAll(".star-chip").forEach(c => c.classList.toggle("active", c.dataset.star === "none"));
  resetFlipCard();
  renderList();
}

function toggleTier(tierId){
  if (spinning) return;
  if (currentTiers.has(tierId)) {
    currentTiers.delete(tierId);
  } else {
    currentTiers.add(tierId);
  }
  document.querySelectorAll(".tier-chip").forEach(c => {
    c.classList.toggle("active", currentTiers.has(c.dataset.tier));
  });
}

function toggleMode(modeId){
  if (spinning) return;
  if (currentModes.has(modeId)) {
    currentModes.delete(modeId);
  } else {
    currentModes.add(modeId);
  }
  document.querySelectorAll(".mode-chip").forEach(c => {
    c.classList.toggle("active", currentModes.has(c.dataset.mode));
  });
}

function setStar(star){
  if (spinning) return;
  currentStar = star;
  document.querySelectorAll(".star-chip").forEach(c => c.classList.toggle("active", c.dataset.star === star));
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
    card.innerHTML = `<div class="placeholder">Không có quán nào khớp phân khúc giá này.</div>`;
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
          <div class="name">${escapeHtml(finalItem.ten)} ${finalItem.loai ? `<span class="tag-mini">${loaiLabel(finalItem.loai)}</span>` : ""} ${finalItem.hinhThuc ? `<span class="tag-mini">${hinhThucLabel(finalItem.hinhThuc)}</span>` : ""}</div>
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
  renderHistory();
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
  document.querySelectorAll(".tier-chip").forEach(chip => {
    chip.addEventListener("click", () => toggleTier(chip.dataset.tier));
  });
  document.querySelectorAll(".mode-chip").forEach(chip => {
    chip.addEventListener("click", () => toggleMode(chip.dataset.mode));
  });
  document.querySelectorAll(".star-chip").forEach(chip => {
    chip.addEventListener("click", () => setStar(chip.dataset.star));
  });
  document.getElementById("spinBtn").addEventListener("click", spin);
  document.getElementById("confirmBtn").addEventListener("click", confirmChoice);
  document.getElementById("lightboxOverlay").addEventListener("click", closeLightbox);

  resetFlipCard();
  renderList();
  renderHistory();
});
