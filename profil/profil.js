document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));
  const assessments = JSON.parse(localStorage.getItem("assessments")) || [];

  if (!isLoggedIn || !activeUser) {
    document.getElementById("profileContent").style.display = "none";
    document.getElementById("guestState").style.display = "block";
    return;
  }

  const sameUmkmAssessments = filterSameUmkmAssessments(assessments, activeUser);
  const userAssessment = sameUmkmAssessments.find(item => item.user_id == activeUser.user_id);
  const combinedScore = calculateCombinedScore(sameUmkmAssessments);

  renderProfile(activeUser);
  renderStats(sameUmkmAssessments, userAssessment, combinedScore);
  renderHistoryTable(sameUmkmAssessments);
});

function renderProfile(user) {
  const roleLabel = user.role === "owner"
    ? "Owner / Pemilik UMKM"
    : "Karyawan / Tim UMKM";

  document.getElementById("avatarInitial").textContent =
    user.name ? user.name.charAt(0).toUpperCase() : "U";

  document.getElementById("roleBadge").textContent = roleLabel;
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;

  document.getElementById("userName").textContent = user.name;
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userRole").textContent = roleLabel;

  document.getElementById("umkmName").textContent = user.umkm.nama_umkm;
  document.getElementById("umkmSector").textContent = user.umkm.sektor;
  document.getElementById("umkmId").textContent = user.umkm_id || user.umkm.umkm_id;
}

function renderStats(assessments, userAssessment, combinedScore) {
  document.getElementById("respondentCount").textContent = assessments.length;
  document.getElementById("myAssessmentStatus").textContent = userAssessment ? "Sudah Isi" : "Belum Isi";
  document.getElementById("combinedScore").textContent = combinedScore.toFixed(2);
}

function renderHistoryTable(assessments) {
  const table = document.getElementById("historyTable");

  if (!assessments.length) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">
          Belum ada riwayat assessment untuk UMKM ini.
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = assessments.map(item => {
    const date = new Date(item.assessment_date).toLocaleDateString("id-ID");
    const role = item.user_role === "owner" ? "Owner" : "Karyawan";

    return `
      <tr>
        <td>${item.user_name}</td>
        <td><span class="badge">${role}</span></td>
        <td>${date}</td>
        <td>${Number(item.total_average_score || 0).toFixed(2)}</td>
        <td>${item.category || "-"}</td>
      </tr>
    `;
  }).join("");
}

function filterSameUmkmAssessments(assessments, activeUser) {
  const activeUmkmId = activeUser.umkm_id || activeUser.umkm?.umkm_id;
  const activeUmkmName = normalizeText(activeUser.umkm?.nama_umkm);

  return assessments.filter(item => {
    const itemUmkmId = item.umkm_id;
    const itemUmkmName = normalizeText(item.nama_umkm);

    return itemUmkmId == activeUmkmId || itemUmkmName === activeUmkmName;
  });
}

function calculateCombinedScore(assessments) {
  const scores = assessments
    .map(item => Number(item.total_average_score))
    .filter(score => !isNaN(score) && score > 0);

  if (!scores.length) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}