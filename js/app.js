// HemaApp - logika aplikasi
const $ = (id) => document.getElementById(id);
const store = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem("hema_" + k) || "[]");
    } catch (e) {
      return [];
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("hema_" + k, JSON.stringify(v));
    } catch (e) {}
  },
};
let hbData = store.get("hb"),
  ttdData = store.get("ttd"),
  scData = store.get("schedule");
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
["hbDate", "scDate"].forEach((id) => ($(id).value = localDate));
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => (t.style.display = "none"), 2600);
}
const titles = {
  home: "Selamat datang di HemaApp!",
  hb: "Hb Tracker",
  ttd: "Pengingat Tablet Tambah Darah",
  education: "Edukasi Gizi & Anemia",
  schedule: "Jadwal Pemeriksaan",
  ask: "Tanya Hema",
};
function go(page) {
  document.querySelectorAll(".page").forEach((el) => el.classList.remove("active"));
  $("page-" + page).classList.add("active");
  document
    .querySelectorAll("#nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $("pageHeading").textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document
  .querySelectorAll("#nav button")
  .forEach((b) => b.addEventListener("click", () => go(b.dataset.page)));
document
  .querySelectorAll("[data-goto]")
  .forEach((b) => b.addEventListener("click", () => go(b.dataset.goto)));
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
function dateFmt(d) {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function renderHb() {
  $("statHb").textContent = hbData.length;
  $("hbRows").innerHTML = hbData.length
    ? hbData
        .slice()
        .reverse()
        .map(
          (x) =>
            `<tr><td>${dateFmt(x.date)}</td><td><strong>${esc(x.value)} g/dL</strong></td><td>${esc(x.place)}</td><td>${esc(x.note || "-")}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="empty">Belum ada data pemeriksaan.</td></tr>';
}
function renderTtd() {
  $("statTtd").textContent = ttdData.length;
  $("ttdCount").textContent = ttdData.length + " jadwal";
  $("ttdList").innerHTML = ttdData.length
    ? ttdData
        .map(
          (x, i) =>
            `<div class="reminder-row"><div><strong>⏰ ${esc(x.name)}</strong><small>${esc(x.days)} • ${esc(x.time)}${x.note ? " • " + esc(x.note) : ""}</small></div><div style="display:flex;gap:7px;align-items:center"><button class="btn-secondary" data-done="${i}">${x.done ? "Sudah" : "Tandai selesai"}</button><button class="btn-secondary" data-delttd="${i}" aria-label="Hapus">×</button></div></div>`,
        )
        .join("")
    : '<div class="empty">Belum ada pengingat yang dibuat.</div>';
  $("homeReminders").innerHTML = ttdData.length
    ? ttdData
        .slice(0, 3)
        .map(
          (x) =>
            `<div class="reminder"><div class="reminder-icon">⏰</div><div class="reminder-text"><strong>${esc(x.name)}</strong><small>${esc(x.days)} • ${esc(x.time)}</small></div><span class="tag ${x.done ? "done" : ""}">${x.done ? "Selesai" : "Terjadwal"}</span></div>`,
        )
        .join("")
    : '<div class="empty">Belum ada pengingat. Kamu bisa membuatnya di menu Pengingat TTD.</div>';
  document.querySelectorAll("[data-done]").forEach(
    (b) =>
      (b.onclick = () => {
        ttdData[+b.dataset.done].done = !ttdData[+b.dataset.done].done;
        store.set("ttd", ttdData);
        renderTtd();
        toast("Status pengingat diperbarui.");
      }),
  );
  document.querySelectorAll("[data-delttd]").forEach(
    (b) =>
      (b.onclick = () => {
        ttdData.splice(+b.dataset.delttd, 1);
        store.set("ttd", ttdData);
        renderTtd();
        toast("Pengingat dihapus.");
      }),
  );
}
function renderSchedule() {
  $("statSchedule").textContent = scData.length;
  $("scCount").textContent = scData.length + " jadwal";
  $("scRows").innerHTML = scData.length
    ? scData
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(
          (x) =>
            `<tr><td>${dateFmt(x.date)}</td><td><strong>${esc(x.name)}</strong></td><td>${esc(x.place)}</td><td>${esc(x.note || "-")}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="empty">Belum ada jadwal.</td></tr>';
}
$("hbForm").addEventListener("submit", (e) => {
  e.preventDefault();
  hbData.push({
    value: $("hbValue").value,
    date: $("hbDate").value,
    place: $("hbPlace").value,
    note: $("hbNote").value,
  });
  store.set("hb", hbData);
  e.target.reset();
  $("hbDate").value = localDate;
  renderHb();
  toast("Hasil pemeriksaan berhasil disimpan.");
});
$("clearHb").addEventListener("click", () => {
  if (confirm("Hapus semua riwayat Hb yang tersimpan di browser ini?")) {
    hbData = [];
    store.set("hb", hbData);
    renderHb();
    toast("Riwayat Hb dihapus.");
  }
});
$("ttdForm").addEventListener("submit", (e) => {
  e.preventDefault();
  ttdData.push({
    name: $("ttdName").value,
    time: $("ttdTime").value,
    days: $("ttdDays").value,
    note: $("ttdNote").value,
    done: false,
  });
  store.set("ttd", ttdData);
  renderTtd();
  toast("Pengingat berhasil disimpan.");
});
$("scheduleForm").addEventListener("submit", (e) => {
  e.preventDefault();
  scData.push({
    name: $("scName").value,
    date: $("scDate").value,
    place: $("scPlace").value,
    note: $("scNote").value,
  });
  store.set("schedule", scData);
  e.target.reset();
  $("scDate").value = localDate;
  renderSchedule();
  toast("Jadwal pemeriksaan berhasil disimpan.");
});
const answers = [
  [
    /anemia|apa itu/i,
    "Anemia adalah kondisi ketika kadar hemoglobin dalam darah berada di bawah batas normal sesuai usia, jenis kelamin, dan kondisi seseorang. Pemeriksaan Hb dan penilaian tenaga kesehatan membantu memastikan kondisi tersebut.",
  ],
  [
    /makanan|zat besi|gizi/i,
    "Contoh makanan sumber zat besi antara lain daging, ikan, telur, kacang-kacangan, dan sayuran hijau. Makanan sumber vitamin C seperti jeruk atau jambu biji dapat membantu penyerapan zat besi dari makanan nabati. Usahakan makan beragam dan seimbang.",
  ],
  [
    /tablet|ttd|tambah darah/i,
    "Tablet Tambah Darah digunakan untuk membantu memenuhi kebutuhan zat besi sesuai indikasi dan anjuran program kesehatan. Ikuti jadwal dari tenaga kesehatan. Jika ada efek samping atau pertanyaan tentang pemakaian, konsultasikan dengan petugas kesehatan.",
  ],
  [
    /hb|periksa|pemeriksaan/i,
    "Jadwal pemeriksaan Hb bergantung pada kondisi dan kebutuhanmu. Ikuti anjuran tenaga kesehatan atau jadwal layanan puskesmas. Jika hasil Hb rendah atau kamu mengalami keluhan yang mengkhawatirkan, konsultasikan dengan tenaga kesehatan.",
  ],
  [
    /gejala|pusing|lemas|capek|lelah/i,
    "Sebagian orang dengan anemia dapat merasa lemas, mudah lelah, pusing, atau sulit berkonsentrasi. Gejala tersebut juga bisa disebabkan hal lain, jadi jangan menyimpulkan diagnosis sendiri. Konsultasikan dengan tenaga kesehatan untuk pemeriksaan.",
  ],
  [
    /hamil|kehamilan/i,
    "Pada kehamilan, kebutuhan zat besi meningkat. Ibu hamil sebaiknya mengikuti pemeriksaan antenatal dan anjuran konsumsi suplemen dari tenaga kesehatan. Jangan mengubah dosis obat atau suplemen hanya berdasarkan informasi di website.",
  ],
];
function sendQuestion(q) {
  const box = $("chatMessages");
  const user = document.createElement("div");
  user.className = "bubble user";
  user.textContent = q;
  box.appendChild(user);
  const found = answers.find((a) => a[0].test(q));
  const response = found
    ? found[1]
    : "Aku bisa memberikan informasi umum tentang anemia, makanan sumber zat besi, TTD, dan pemeriksaan Hb. Untuk diagnosis, hasil laboratorium, atau saran pengobatan pribadi, silakan konsultasikan dengan tenaga kesehatan.";
  const bot = document.createElement("div");
  bot.className = "bubble";
  bot.textContent = response;
  box.appendChild(bot);
  box.scrollTop = box.scrollHeight;
  $("chatInput").value = "";
}
$("sendChat").addEventListener("click", () => {
  const q = $("chatInput").value.trim();
  if (q) sendQuestion(q);
});
$("chatInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = e.target.value.trim();
    if (q) sendQuestion(q);
  }
});
document
  .querySelectorAll(".question")
  .forEach((el) => el.addEventListener("click", () => sendQuestion(el.dataset.question)));
renderHb();
renderTtd();
renderSchedule();
