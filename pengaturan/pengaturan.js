document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = safeJsonParse(localStorage.getItem("activeUser"));

  if (!isLoggedIn || !activeUser) {
    const settingContent = document.getElementById("settingContent");
    const guestState = document.getElementById("guestState");

    if (settingContent) settingContent.style.display = "none";
    if (guestState) guestState.style.display = "block";

    return;
  }

  const userRole = normalizeRole(activeUser.role);
  const roleLabel =
    userRole === "owner" ? "Owner / Pemilik UMKM" : "Karyawan / Tim UMKM";

  const userUmkm = getUserUmkm(activeUser);

  setText("userName", activeUser.name || "-");
  setText("userEmail", activeUser.email || "-");
  setText("userRole", roleLabel);

  setText("umkmName", userUmkm.nama_umkm || "-");
  setText("umkmSector", userUmkm.sektor || userUmkm.kategori || "-");
  setText("umkmId", userUmkm.umkm_id || userUmkm.id || "-");

  setText("totalUsers", "1");
  setText("loginStatus", "Aktif");

  await loadAssessmentStatus(userUmkm);
});

async function loadAssessmentStatus(userUmkm) {
  try {
    if (typeof apiRequest !== "function") {
      setText("totalAssessments", "0");
      return;
    }

    const result = await apiRequest("/api/assessments");

    if (!result.success || !Array.isArray(result.data)) {
      setText("totalAssessments", "0");
      return;
    }

    const targetUmkmId = userUmkm.umkm_id || userUmkm.id;
    const targetUmkmName = normalizeText(userUmkm.nama_umkm);

    const relatedAssessments = result.data.filter((item) => {
      return (
        item.umkm_id == targetUmkmId ||
        normalizeText(item.nama_umkm) === targetUmkmName
      );
    });

    setText("totalAssessments", relatedAssessments.length);
  } catch (error) {
    console.warn("Gagal mengambil status assessment:", error);
    setText("totalAssessments", "0");
  }
}

function getUserUmkm(activeUser) {
  const umkm = activeUser.umkm || {};

  return {
    umkm_id: activeUser.umkm_id || umkm.umkm_id || umkm.id || activeUser.id_umkm || null,
    id: activeUser.umkm_id || umkm.id || umkm.umkm_id || activeUser.id_umkm || null,
    nama_umkm:
      umkm.nama_umkm ||
      activeUser.nama_umkm ||
      activeUser.umkm_name ||
      "UMKM belum tersedia",
    sektor:
      umkm.sektor ||
      umkm.kategori ||
      activeUser.sektor ||
      activeUser.kategori ||
      "Sektor belum tersedia",
    kategori:
      umkm.kategori ||
      umkm.sektor ||
      activeUser.kategori ||
      activeUser.sektor ||
      "Sektor belum tersedia",
  };
}

const darkModeToggle = document.getElementById("darkModeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  if (darkModeToggle) darkModeToggle.checked = true;
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });
}

function logoutUser() {
  const confirmLogout = confirm("Yakin ingin keluar dari akun ini?");
  if (!confirmLogout) return;

  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("activeUser");
  localStorage.removeItem("selectedUmkm");
  localStorage.removeItem("previewAssessments");

  window.location.href = "/landing_page/landing.html";
}

function goToDashboard() {
  window.location.href = "/beranda/index.html";
}

function normalizeRole(role) {
  const value = normalizeText(role);
  if (value === "employee" || value === "karyawan") return "employee";
  return "owner";
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}