document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const assessments = JSON.parse(localStorage.getItem("assessments")) || [];

  if (!isLoggedIn || !activeUser) {
    document.getElementById("settingContent").style.display = "none";
    document.getElementById("guestState").style.display = "block";
    return;
  }

  const roleLabel = activeUser.role === "owner"
    ? "Owner / Pemilik UMKM"
    : "Karyawan / Tim UMKM";

  document.getElementById("userName").textContent = activeUser.name;
  document.getElementById("userEmail").textContent = activeUser.email;
  document.getElementById("userRole").textContent = roleLabel;

  document.getElementById("umkmName").textContent = activeUser.umkm.nama_umkm;
  document.getElementById("umkmSector").textContent = activeUser.umkm.sektor;
  document.getElementById("umkmId").textContent = activeUser.umkm_id || activeUser.umkm.umkm_id;

  document.getElementById("totalUsers").textContent = users.length;
  document.getElementById("totalAssessments").textContent = assessments.length;
  document.getElementById("loginStatus").textContent = "Aktif";
});

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
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("activeUser");
  window.location.href = "../landing_page/landing.html";
}

function resetDemoData() {
  const confirmReset = confirm(
    "Yakin ingin menghapus semua data demo? Akun, login, dan hasil kuesioner akan hilang."
  );

  if (!confirmReset) return;

  localStorage.clear();
  alert("Semua data demo berhasil dihapus.");
  window.location.href = "../landing page/landing.html";
}

function goToDashboard() {
  window.location.href = "../beranda/index.html";
}

