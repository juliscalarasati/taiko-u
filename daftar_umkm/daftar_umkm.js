document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const sectorFilter = document.getElementById("sectorFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");

  let savedUmkms = [];
  let savedAssessments = [];

  try {
    const umkmRes = await fetch("/api/umkm");
    const umkmJson = await umkmRes.json();

    if (umkmJson.success && Array.isArray(umkmJson.data)) {
      savedUmkms = umkmJson.data.map((item) => ({
        umkm_id: item.umkm_id || item.id,
        id: item.umkm_id || item.id,
        nama_umkm: item.nama_umkm || "UMKM tanpa nama",
        sektor: formatText(item.sektor || item.kategori || "Sektor belum tersedia"),
        kategori: formatText(item.kategori || item.sektor || "Sektor belum tersedia"),
        pemilik: item.pemilik || "-",
        alamat: item.alamat || "-",
        created_at: item.created_at || null,
      }));
    }
  } catch (error) {
    console.error("Gagal mengambil data UMKM:", error);
  }

  try {
    const assessmentRes = await fetch("/api/assessments");

    if (assessmentRes.ok) {
      const assessmentJson = await assessmentRes.json();

      if (assessmentJson.success && Array.isArray(assessmentJson.data)) {
        savedAssessments = assessmentJson.data.map((item) => {
          const answers = parseAnswers(item.answers);
          const role = normalizeRole(item.user_role || item.role || "owner");
          const factorScores = calculateFactorScoresFromAnswers(answers, role);
          const validScores = Object.values(factorScores).filter(
            (score) => Number(score) > 0
          );
          const totalAverageScore = average(validScores);

          return {
            assessment_id: item.id,
            user_id: item.user_id,
            user_name: item.user_name || item.name || "User",
            user_role: role,
            umkm_id: item.umkm_id,
            nama_umkm: item.nama_umkm,
            total_average_score: totalAverageScore,
            category: calculateCategory(totalAverageScore),
            assessment_date: item.created_at,
            factor_scores: factorScores,
          };
        });
      }
    }
  } catch (error) {
    console.warn("Data assessment belum tersedia:", error);
  }

  const uniqueUmkms = dedupeUmkms(savedUmkms);

  const enrichedUmkms = uniqueUmkms.map((umkm) => {
    const result = calculateUmkmHealth(umkm, savedAssessments);

    return {
      ...umkm,
      score: result.score,
      percentage: result.percentage,
      category: result.category,
      assessed: result.assessed,
      statusText: result.statusText,
      statusClass: result.statusClass,
      ownerFilled: result.ownerFilled,
      employeeFilled: result.employeeFilled,
      respondentCount: result.respondentCount,
    };
  });

  populateSectorFilter(enrichedUmkms);
  renderSummary(enrichedUmkms);
  renderUmkmCards(enrichedUmkms);

  function applyFilters() {
    const keyword = normalizeText(searchInput?.value || "");
    const selectedSector = sectorFilter?.value || "all";
    const selectedCategory = categoryFilter?.value || "all";
    const selectedSort = sortFilter?.value || "default";

    let filtered = enrichedUmkms.filter((umkm) => {
      const matchKeyword =
        normalizeText(umkm.nama_umkm).includes(keyword) ||
        normalizeText(umkm.sektor).includes(keyword) ||
        normalizeText(umkm.pemilik).includes(keyword);

      const matchSector = selectedSector === "all" || umkm.sektor === selectedSector;

      const matchCategory =
        selectedCategory === "all" || umkm.category === selectedCategory;

      return matchKeyword && matchSector && matchCategory;
    });

    if (selectedSort === "highest") {
      filtered.sort((a, b) => b.percentage - a.percentage);
    }

    if (selectedSort === "lowest") {
      filtered.sort((a, b) => a.percentage - b.percentage);
    }

    if (selectedSort === "name") {
      filtered.sort((a, b) =>
        String(a.nama_umkm).localeCompare(String(b.nama_umkm))
      );
    }

    renderSummary(filtered);
    renderUmkmCards(filtered);
  }

  searchInput?.addEventListener("input", applyFilters);
  sectorFilter?.addEventListener("change", applyFilters);
  categoryFilter?.addEventListener("change", applyFilters);
  sortFilter?.addEventListener("change", applyFilters);
});

function populateSectorFilter(umkms) {
  const sectorFilter = document.getElementById("sectorFilter");
  if (!sectorFilter) return;

  const sectors = [...new Set(umkms.map((umkm) => umkm.sektor).filter(Boolean))].sort();

  sectorFilter.innerHTML = `
    <option value="all">Semua Sektor</option>
    ${sectors
      .map(
        (sector) => `
      <option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>
    `
      )
      .join("")}
  `;
}

function calculateUmkmHealth(umkm, assessments) {
  const relatedAssessments = getRelatedAssessments(umkm, assessments);

  if (!relatedAssessments.length) {
    return {
      score: 0,
      percentage: 0,
      category: "Belum Dinilai",
      assessed: false,
      statusText: "BELUM DINILAI",
      statusClass: "empty",
      ownerFilled: false,
      employeeFilled: false,
      respondentCount: 0,
    };
  }

  const scores = relatedAssessments
    .map((item) => Number(item.total_average_score))
    .filter((score) => !isNaN(score) && score > 0);

  if (!scores.length) {
    return {
      score: 0,
      percentage: 0,
      category: "Belum Dinilai",
      assessed: false,
      statusText: "BELUM DINILAI",
      statusClass: "empty",
      ownerFilled: false,
      employeeFilled: false,
      respondentCount: relatedAssessments.length,
    };
  }

  const ownerFilled = relatedAssessments.some((item) => item.user_role === "owner");
  const employeeFilled = relatedAssessments.some((item) => item.user_role === "employee");

  let statusText = "SUDAH DINILAI";
  let statusClass = "done";

  if (ownerFilled && employeeFilled) {
    statusText = "LENGKAP";
  } else if (ownerFilled) {
    statusText = "OWNER SUDAH ISI";
  } else if (employeeFilled) {
    statusText = "KARYAWAN SUDAH ISI";
  }

  const score = average(scores);
  const percentage = Math.round((score / 5) * 100);

  return {
    score,
    percentage,
    category: calculateCategory(score),
    assessed: true,
    statusText,
    statusClass,
    ownerFilled,
    employeeFilled,
    respondentCount: relatedAssessments.length,
  };
}

function renderSummary(umkms) {
  const assessed = umkms.filter((item) => item.assessed);
  const scores = assessed.map((item) => item.percentage).filter((score) => score > 0);
  const avg = scores.length ? Math.round(average(scores)) : 0;

  const needAttention = assessed.filter(
    (item) => item.category === "Buruk" || item.category === "Cukup"
  ).length;

  setText("totalUmkm", umkms.length);
  setText("averageScore", `${avg}%`);
  setText("needAttention", needAttention);
}

function renderUmkmCards(umkms) {
  const grid = document.getElementById("umkmGrid");
  if (!grid) return;

  if (!umkms.length) {
    grid.innerHTML = `
      <div class="empty-message">
        Tidak ada UMKM yang cocok dengan filter atau pencarian.
      </div>
    `;
    return;
  }

  grid.innerHTML = umkms
    .map((umkm) => {
      const scoreText = umkm.assessed ? `${umkm.percentage}%` : "Belum Dinilai";
      const progressWidth = umkm.assessed ? Math.min(100, umkm.percentage) : 0;
      const encodedUmkm = encodeURIComponent(JSON.stringify(umkm));

      return `
      <article class="umkm-card" onclick="openUmkmDetail('${encodedUmkm}')">
        <div class="card-top">
          <div class="umkm-icon">${escapeHtml(getInitial(umkm.nama_umkm))}</div>
          <span class="status ${escapeHtml(umkm.statusClass)}">${escapeHtml(umkm.statusText)}</span>
        </div>

        <h3>${escapeHtml(umkm.nama_umkm)}</h3>
        <p>Pemilik: ${escapeHtml(umkm.pemilik || "-")}</p>
        <span class="sector">${escapeHtml(umkm.sektor || "Sektor belum tersedia")}</span>

        <div class="score-row">
          <strong>Kesehatan Organisasi</strong>
          <strong>${escapeHtml(scoreText)}</strong>
        </div>

        <div class="progress">
          <div class="progress-fill" style="width:${progressWidth}%"></div>
        </div>

        <div class="category">
          Kategori: <b>${escapeHtml(umkm.category)}</b>
        </div>

        <div class="category">
          Responden: <b>${umkm.respondentCount || 0}</b>
        </div>
      </article>
    `;
    })
    .join("");
}

function openUmkmDetail(encodedUmkm) {
  const umkm = JSON.parse(decodeURIComponent(encodedUmkm));
  localStorage.setItem("selectedUmkm", JSON.stringify(umkm));
  localStorage.removeItem("previewAssessments");
  window.location.href = "../detail/detail_analisis.html";
}

function getRelatedAssessments(umkm, assessments) {
  const umkmId = umkm.umkm_id || umkm.id;
  const umkmName = normalizeText(umkm.nama_umkm);

  return assessments.filter((item) => {
    return item.umkm_id == umkmId || normalizeText(item.nama_umkm) === umkmName;
  });
}

function dedupeUmkms(umkms) {
  const map = new Map();

  umkms.forEach((item) => {
    const key = normalizeText(item.nama_umkm);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, { ...item });
      return;
    }

    const existing = map.get(key);

    map.set(key, {
      ...existing,
      umkm_id: existing.umkm_id || item.umkm_id,
      id: existing.id || item.id,
      pemilik: existing.pemilik && existing.pemilik !== "-" ? existing.pemilik : item.pemilik || "-",
      sektor:
        existing.sektor && existing.sektor !== "Sektor Belum Tersedia"
          ? existing.sektor
          : item.sektor,
      kategori:
        existing.kategori && existing.kategori !== "Sektor Belum Tersedia"
          ? existing.kategori
          : item.kategori,
      alamat: existing.alamat && existing.alamat !== "-" ? existing.alamat : item.alamat || "-",
    });
  });

  return Array.from(map.values());
}

function parseAnswers(rawAnswers) {
  if (typeof rawAnswers === "string") {
    try {
      const parsed = JSON.parse(rawAnswers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(rawAnswers) ? rawAnswers : [];
}

function calculateFactorScoresFromAnswers(answers, role) {
  if (role === "owner") {
    return {
      INS: average(answers.slice(0, 6)),
      OV: average(answers.slice(6, 7)),
      OPS: average(answers.slice(7, 12)),
      ECT: average(answers.slice(12, 16)),
      LDI: 0,
      WEQ: 0,
    };
  }

  return {
    LDI: average(answers.slice(0, 6)),
    WEQ: average(answers.slice(6, 11)),
    OV: average(answers.slice(11, 19)),
    INS: 0,
    OPS: 0,
    ECT: 0,
  };
}

function normalizeRole(role) {
  const value = normalizeText(role);
  if (value === "employee" || value === "karyawan") return "employee";
  return "owner";
}

function calculateCategory(score) {
  if (score >= 4.1) return "Sangat Baik";
  if (score >= 3.1) return "Baik";
  if (score >= 2.1) return "Cukup";
  if (score > 0) return "Buruk";
  return "Belum Dinilai";
}

function getInitial(name) {
  return String(name || "U").charAt(0).toUpperCase();
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return "Sektor Belum Tersedia";
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function average(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((sum, value) => sum + Number(value || 0), 0) / arr.length;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}