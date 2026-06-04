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
      savedUmkms = umkmJson.data.map(item => ({
        umkm_id: item.id,
        id: item.id,
        nama_umkm: item.nama_umkm,
        sektor: formatText(item.kategori || "Sektor belum tersedia"),
        kategori: formatText(item.kategori || "Sektor belum tersedia"),
        pemilik: item.pemilik || "-",
        alamat: item.alamat || "-"
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
        savedAssessments = assessmentJson.data.map(item => {
          let answers = item.answers;

          if (typeof answers === "string") {
            try {
              answers = JSON.parse(answers);
            } catch {
              answers = [];
            }
          }

          if (!Array.isArray(answers)) {
            answers = [];
          }

          const validAnswers = answers
            .map(Number)
            .filter(value => !isNaN(value) && value > 0);

          const scoreFromAnswers = validAnswers.length
            ? average(validAnswers)
            : 0;

          return {
            umkm_id: item.umkm_id,
            nama_umkm: item.nama_umkm,
            total_average_score: scoreFromAnswers,
            category: item.status_kesehatan || item.category,
            assessment_date: item.created_at
          };
        });
      }
    }
  } catch (error) {
    console.warn("Data assessment belum tersedia:", error);
  }

  const enrichedUmkms = savedUmkms.map(umkm => {
    const result = calculateUmkmHealth(umkm, savedAssessments);

    return {
      ...umkm,
      score: result.score,
      percentage: result.percentage,
      category: result.category,
      assessed: result.assessed
    };
  });

  populateSectorFilter(enrichedUmkms);
  renderSummary(enrichedUmkms);
  renderUmkmCards(enrichedUmkms);

  function applyFilters() {
    const keyword = normalizeText(searchInput.value);
    const selectedSector = sectorFilter.value;
    const selectedCategory = categoryFilter.value;
    const selectedSort = sortFilter.value;

    let filtered = enrichedUmkms.filter(umkm => {
      const matchKeyword =
        normalizeText(umkm.nama_umkm).includes(keyword) ||
        normalizeText(umkm.sektor).includes(keyword) ||
        normalizeText(umkm.pemilik).includes(keyword);

      const matchSector =
        selectedSector === "all" || umkm.sektor === selectedSector;

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

  searchInput.addEventListener("input", applyFilters);
  sectorFilter.addEventListener("change", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);
});

function populateSectorFilter(umkms) {
  const sectorFilter = document.getElementById("sectorFilter");
  if (!sectorFilter) return;

  const sectors = [...new Set(
    umkms.map(umkm => umkm.sektor).filter(Boolean)
  )].sort();

  sectorFilter.innerHTML = `
    <option value="all">Semua Sektor</option>
    ${sectors.map(sector => `
      <option value="${sector}">${sector}</option>
    `).join("")}
  `;
}

function calculateUmkmHealth(umkm, assessments) {
  const umkmId = umkm.umkm_id;
  const umkmName = normalizeText(umkm.nama_umkm);

  const relatedAssessments = assessments.filter(item => {
    return item.umkm_id == umkmId || normalizeText(item.nama_umkm) === umkmName;
  });

  if (!relatedAssessments.length) {
    return {
      score: 0,
      percentage: 0,
      category: "Belum Dinilai",
      assessed: false
    };
  }

  const scores = relatedAssessments
    .map(item => Number(item.total_average_score))
    .filter(score => !isNaN(score) && score > 0);

  if (!scores.length) {
    return {
      score: 0,
      percentage: 0,
      category: "Belum Dinilai",
      assessed: false
    };
  }

  const score = average(scores);
  const percentage = Math.round((score / 5) * 100);

  return {
    score,
    percentage,
    category: calculateCategory(score),
    assessed: true
  };
}

function renderSummary(umkms) {
  const assessed = umkms.filter(item => item.assessed);
  const scores = assessed
    .map(item => item.percentage)
    .filter(score => score > 0);

  const avg = scores.length ? Math.round(average(scores)) : 0;

  const needAttention = assessed.filter(item =>
    item.category === "Buruk" || item.category === "Cukup"
  ).length;

  document.getElementById("totalUmkm").textContent = umkms.length;
  document.getElementById("averageScore").textContent = `${avg}%`;
  document.getElementById("needAttention").textContent = needAttention;
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

  grid.innerHTML = umkms.map(umkm => {
    const statusClass = umkm.assessed ? "done" : "empty";
    const statusText = umkm.assessed ? "SUDAH DINILAI" : "BELUM DINILAI";
    const scoreText = umkm.assessed ? `${umkm.percentage}%` : "Belum Dinilai";
    const progressWidth = umkm.assessed ? umkm.percentage : 0;
    const encodedUmkm = encodeURIComponent(JSON.stringify(umkm));

    return `
      <article class="umkm-card" onclick="openUmkmDetail('${encodedUmkm}')">
        <div class="card-top">
          <div class="umkm-icon">${getInitial(umkm.nama_umkm)}</div>
          <span class="status ${statusClass}">${statusText}</span>
        </div>

        <h3>${umkm.nama_umkm}</h3>
        <p>Pemilik: ${umkm.pemilik || "-"}</p>
        <span class="sector">${umkm.sektor || "Sektor belum tersedia"}</span>

        <div class="score-row">
          <strong>Kesehatan Organisasi</strong>
          <strong>${scoreText}</strong>
        </div>

        <div class="progress">
          <div class="progress-fill" style="width:${progressWidth}%"></div>
        </div>

        <div class="category">
          Kategori: <b>${umkm.category}</b>
        </div>
      </article>
    `;
  }).join("");
}

function openUmkmDetail(encodedUmkm) {
  const umkm = JSON.parse(decodeURIComponent(encodedUmkm));
  localStorage.setItem("selectedUmkm", JSON.stringify(umkm));
  window.location.href = "../detail/detail_analisis.html";
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
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function average(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((sum, value) => sum + Number(value || 0), 0) / arr.length;
}