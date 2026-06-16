const factorInfo = {
  OV: { full: "Organizational Values", id: "Nilai Organisasi" },
  LDI: { full: "Leadership", id: "Kepemimpinan" },
  INS: { full: "Infrastructure", id: "Sumber Daya" },
  OPS: { full: "Operational Stability", id: "Stabilitas Operasional" },
  WEQ: { full: "Work Environment Quality", id: "Kualitas Lingkungan Kerja" },
  ECT: { full: "Economic Performance", id: "Kinerja Ekonomi" },
};

let factorChartInstance = null;
let radarChartInstance = null;
let boxplotChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = safeJsonParse(localStorage.getItem("activeUser"));
  const selectedUmkm = safeJsonParse(localStorage.getItem("selectedUmkm"));

  if (!isLoggedIn || !activeUser) {
    alert("Silakan login terlebih dahulu untuk melihat detail analisis.");
    window.location.href = "/login/login.html";
    return;
  }

  const targetUmkm = resolveTargetUmkm(selectedUmkm, activeUser);

  if (!targetUmkm || !getUmkmName(targetUmkm)) {
    showEmptyState(
      "UMKM Belum Tersedia",
      "Akun ini belum terhubung ke data UMKM. Silakan daftar atau login ulang.",
      "../daftar_umkm/daftar_umkm.html",
      "Ke Daftar UMKM"
    );
    return;
  }

  localStorage.setItem("selectedUmkm", JSON.stringify(targetUmkm));

  try {
    const assessmentResult = await apiRequest("/api/assessments");

    const boxplotResult = await apiRequest("/api/boxplot").catch((error) => {
      console.warn("Boxplot API gagal, memakai data dummy 428 UMKM:", error);

      return {
        success: false,
        factors: null,
      };
    });

    if (!assessmentResult.success) {
      throw new Error(
        assessmentResult.message || "Gagal mengambil data assessment."
      );
    }

    const allAssessments = Array.isArray(assessmentResult.data)
      ? assessmentResult.data
      : [];

    const relatedAssessments = getRelatedAssessments(
      targetUmkm,
      allAssessments
    );

    setText(
      "umkmInfo",
      `${getUmkmName(targetUmkm)} · ${getUmkmSector(targetUmkm)}`
    );

    if (!relatedAssessments.length) {
      showEmptyState(
        "UMKM Ini Belum Dinilai",
        `Belum ada hasil kuesioner untuk ${getUmkmName(targetUmkm)}.`,
        "../kuisioner/kuisioner.html",
        "Isi Kuesioner"
      );
      return;
    }

    const formattedAssessments = relatedAssessments.map((item) => {
      return convertDatabaseAssessment(item, activeUser, targetUmkm);
    });

    const validAssessments = formattedAssessments.filter((item) => {
      return Number(item.total_average_score) > 0;
    });

    if (!validAssessments.length) {
      showEmptyState(
        "Data Belum Lengkap",
        `Hasil kuesioner untuk ${getUmkmName(targetUmkm)} belum memiliki skor valid.`,
        "../kuisioner/kuisioner.html",
        "Isi Kuesioner"
      );
      return;
    }

    const combinedResult = calculateCombinedResult(validAssessments);
    const benchmarkBoxplotData = convertBoxplotApiData(boxplotResult.factors);

    renderSummary(combinedResult, validAssessments);
    renderFactorChart(combinedResult.factor_scores);
    renderRadarChart(combinedResult.factor_scores);
    renderBenchmarkBoxplot(combinedResult.factor_scores, benchmarkBoxplotData);
    renderBenchmarkInsight(combinedResult.factor_scores);
    renderInsights(combinedResult, validAssessments);
    renderAssessmentTable(validAssessments);
  } catch (error) {
    console.error("Error detail analisis:", error);

    showEmptyState(
      "Gagal Memuat Detail Analisis",
      error.message,
      "../beranda/index.html",
      "Kembali ke Beranda"
    );
  }
});

/* =========================================================
   1. TARGET UMKM
========================================================= */

function resolveTargetUmkm(selectedUmkm, activeUser) {
  if (selectedUmkm && getUmkmName(selectedUmkm)) {
    return normalizeUmkmObject(selectedUmkm);
  }

  if (activeUser?.umkm && getUmkmName(activeUser.umkm)) {
    return normalizeUmkmObject(activeUser.umkm);
  }

  if (activeUser?.umkm_id && activeUser?.nama_umkm) {
    return normalizeUmkmObject(activeUser);
  }

  return null;
}

function normalizeUmkmObject(umkm) {
  return {
    umkm_id:
      umkm.umkm_id ||
      umkm.id ||
      umkm.umkm?.umkm_id ||
      umkm.umkm?.id ||
      null,

    id:
      umkm.id ||
      umkm.umkm_id ||
      umkm.umkm?.id ||
      umkm.umkm?.umkm_id ||
      null,

    nama_umkm:
      umkm.nama_umkm ||
      umkm.umkm?.nama_umkm ||
      umkm.name ||
      "UMKM belum tersedia",

    sektor:
      umkm.sektor ||
      umkm.kategori ||
      umkm.umkm?.sektor ||
      umkm.umkm?.kategori ||
      "Sektor belum tersedia",

    kategori:
      umkm.kategori ||
      umkm.sektor ||
      umkm.umkm?.kategori ||
      umkm.umkm?.sektor ||
      "Sektor belum tersedia",

    pemilik: umkm.pemilik || umkm.umkm?.pemilik || "-",
    alamat: umkm.alamat || umkm.umkm?.alamat || "-",
  };
}

/* =========================================================
   2. CARI ASSESSMENT SESUAI UMKM
   Cari pakai ID dulu. Kalau tidak ketemu, baru pakai nama.
========================================================= */

function getRelatedAssessments(targetUmkm, assessments) {
  const targetUmkmId = targetUmkm.umkm_id || targetUmkm.id;
  const targetUmkmName = normalizeText(getUmkmName(targetUmkm));

  const matchedById = assessments.filter((item) => {
    return targetUmkmId && item.umkm_id == targetUmkmId;
  });

  if (matchedById.length) {
    return matchedById;
  }

  return assessments.filter((item) => {
    return normalizeText(item.nama_umkm) === targetUmkmName;
  });
}

/* =========================================================
   3. KONVERSI ASSESSMENT DATABASE
========================================================= */

function convertDatabaseAssessment(item, activeUser, targetUmkm) {
  const answers = parseAnswers(item.answers);
  const role = normalizeRole(item.user_role || item.role || activeUser.role);
  const factorScores = calculateFactorScoresFromAnswers(answers, role);

  const validScores = Object.values(factorScores).filter((score) => {
    return Number(score) > 0;
  });

  const totalAverageScore = average(validScores);

  return {
    assessment_id: item.id,
    user_id: item.user_id,
    user_name: item.user_name || item.name || activeUser.name || "User",
    user_role: role,
    umkm_id: item.umkm_id || targetUmkm.umkm_id || targetUmkm.id,
    nama_umkm: item.nama_umkm || getUmkmName(targetUmkm),
    assessment_date: item.created_at,
    answers,
    factor_scores: factorScores,
    total_average_score: totalAverageScore,
    category: calculateCategory(totalAverageScore),
    backend_status: item.status_kesehatan,
    backend_score: item.total_score,
    catatan: item.catatan,
  };
}

function calculateFactorScoresFromAnswers(answers, role) {
  if (!Array.isArray(answers) || !answers.length) {
    return {
      OV: 0,
      LDI: 0,
      INS: 0,
      OPS: 0,
      WEQ: 0,
      ECT: 0,
    };
  }

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

/* =========================================================
   4. DATA BENCHMARK BOXPLOT 428 UMKM
========================================================= */

function convertBoxplotApiData(factors) {
  const result = {};
  const keys = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];

  keys.forEach((factor) => {
    const values = Array.isArray(factors?.[factor])
      ? factors[factor]
          .map(Number)
          .filter((value) => !isNaN(value) && value > 0)
      : [];

    result[factor] =
      values.length >= 10 ? values : generateDummyBenchmarkScores(factor);
  });

  return result;
}

function generateDummyBenchmarkScores(factor) {
  const baseByFactor = {
    OV: 3.25,
    LDI: 3.05,
    INS: 2.95,
    OPS: 3.15,
    WEQ: 3.35,
    ECT: 3.1,
  };

  const base = baseByFactor[factor] || 3.1;
  const scores = [];

  for (let i = 0; i < 428; i++) {
    const wave = Math.sin(i * 0.37) * 0.55;
    const spread = ((i % 17) - 8) * 0.045;
    const variation = wave + spread;

    let score = base + variation;

    if (i % 41 === 0) score -= 0.75;
    if (i % 53 === 0) score += 0.65;

    score = Math.max(1, Math.min(5, score));
    scores.push(Number(score.toFixed(2)));
  }

  return scores;
}

/* =========================================================
   5. HITUNG HASIL GABUNGAN
========================================================= */

function calculateCombinedResult(assessments) {
  const factors = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];
  const factorScores = {};
  const factorCounts = {};

  factors.forEach((factor) => {
    const values = assessments
      .map((item) => Number(item.factor_scores?.[factor]))
      .filter((value) => !isNaN(value) && value > 0);

    factorScores[factor] = average(values);
    factorCounts[factor] = values.length;
  });

  const validScores = Object.values(factorScores).filter((score) => {
    return score > 0;
  });

  const totalAverage = average(validScores);
  const category = calculateCategory(totalAverage);

  return {
    factor_scores: factorScores,
    factor_counts: factorCounts,
    total_average_score: totalAverage,
    category,
  };
}

/* =========================================================
   6. RENDER RINGKASAN
========================================================= */

function renderSummary(result, assessments) {
  setText("respondentCount", assessments.length);
  setText("averageScore", result.total_average_score.toFixed(2));
  setText("categoryResult", result.category);
}

/* =========================================================
   7. CHART SKOR PER FAKTOR
========================================================= */

function renderFactorChart(factorScores) {
  const ctx = document.getElementById("factorResultChart");
  if (!ctx) return;

  if (factorChartInstance) {
    factorChartInstance.destroy();
  }

  const labels = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];
  const values = labels.map((label) => Number(factorScores[label] || 0));

  factorChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Skor Faktor",
          data: values,
          backgroundColor: values.map((value) =>
            value >= 4 ? "#1f8a70" : value >= 3 ? "#8fd3c1" : "#d9534f"
          ),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw || 0);

              return value > 0
                ? `Skor: ${value.toFixed(2)}`
                : "Belum ada data";
            },
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5,
        },

        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

/* =========================================================
   8. CHART RADAR
========================================================= */

function renderRadarChart(factorScores) {
  const ctx = document.getElementById("radarChart");
  if (!ctx) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const labels = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];
  const values = labels.map((label) => Number(factorScores[label] || 0));

  radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Skor Faktor UMKM",
          data: values,
          fill: true,
          backgroundColor: "rgba(31, 138, 112, 0.18)",
          borderColor: "#1f8a70",
          borderWidth: 3,
          pointBackgroundColor: "#1f8a70",
          pointBorderColor: "#ffffff",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        r: {
          min: 0,
          max: 5,

          ticks: {
            stepSize: 1,
            backdropColor: "transparent",
          },
        },
      },
    },
  });
}

/* =========================================================
   9. BOXPLOT BENCHMARK
========================================================= */

function renderBenchmarkBoxplot(userFactorScores, benchmarkBoxplotData) {
  const ctx = document.getElementById("factorBoxplotChart");
  if (!ctx) return;

  if (boxplotChartInstance) {
    boxplotChartInstance.destroy();
  }

  const labels = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];

  boxplotChartInstance = new Chart(ctx, {
    type: "boxplot",
    data: {
      labels,
      datasets: [
        {
          label: "Distribusi 428 UMKM Pembanding",
          data: labels.map((key) => benchmarkBoxplotData[key] || []),
          backgroundColor: "rgba(143, 211, 193, 0.45)",
          borderColor: "#1f8a70",
          borderWidth: 1.5,
          itemRadius: 2,
          outlierRadius: 2,
        },
        {
          type: "scatter",
          label: "Skor UMKM Ini",
          data: labels
            .filter((key) => Number(userFactorScores[key]) > 0)
            .map((key) => ({
              x: key,
              y: Number(userFactorScores[key]),
            })),
          backgroundColor: "#0b4f45",
          borderColor: "#0b4f45",
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true,
        },
      },

      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5,
        },

        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

/* =========================================================
   10. INSIGHT BOXPLOT
========================================================= */

function renderBenchmarkInsight(userFactorScores) {
  const insightEl = document.getElementById("benchmarkInsight");
  if (!insightEl) return;

  const entries = Object.entries(userFactorScores).filter(([, score]) => {
    return Number(score) > 0;
  });

  if (!entries.length) {
    insightEl.innerHTML = `
      <div class="analysis-action">
        Data faktor belum cukup untuk dibandingkan dengan benchmark.
      </div>
    `;
    return;
  }

  const highest = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lowest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));

  insightEl.innerHTML = `
    <div class="insight-intro">
      <span class="insight-label">Interpretasi Boxplot</span>
      <h3>Posisi UMKM dibandingkan 428 UMKM pembanding</h3>
      <p>
        Boxplot menampilkan sebaran skor 428 UMKM pembanding, sedangkan titik
        “Skor UMKM Ini” menunjukkan posisi hasil kuesioner UMKM yang sedang dianalisis.
      </p>
    </div>

    <div class="insight-grid">
      <div class="insight-mini-card success">
        <small>Faktor Terkuat</small>
        <div>
          <span class="factor-code">${escapeHtml(highest[0])}</span>
          <span class="factor-name">
            ${escapeHtml(factorInfo[highest[0]]?.id || highest[0])}
          </span>
        </div>
        <p>
          Skor <b>${Number(highest[1]).toFixed(2)}</b>.
          Faktor ini menjadi kekuatan utama UMKM.
        </p>
      </div>

      <div class="insight-mini-card warning">
        <small>Prioritas Perbaikan</small>
        <div>
          <span class="factor-code">${escapeHtml(lowest[0])}</span>
          <span class="factor-name">
            ${escapeHtml(factorInfo[lowest[0]]?.id || lowest[0])}
          </span>
        </div>
        <p>
          Skor <b>${Number(lowest[1]).toFixed(2)}</b>.
          Faktor ini perlu mendapat perhatian lebih dulu.
        </p>
      </div>
    </div>
  `;
}

/* =========================================================
   11. INSIGHT ANALISIS
========================================================= */

function renderInsights(result, assessments) {
  const insightBox = document.getElementById("insightBox");
  if (!insightBox) return;

  const scores = result.factor_scores;

  const entries = Object.entries(scores).filter(([, score]) => {
    return Number(score) > 0;
  });

  if (!entries.length) {
    insightBox.innerHTML = `
      <div class="analysis-action">Data faktor belum tersedia.</div>
    `;
    return;
  }

  const ownerFilled = assessments.some((item) => item.user_role === "owner");
  const employeeFilled = assessments.some(
    (item) => item.user_role === "employee"
  );

  const values = entries.map(([, score]) => Number(score));
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const gap = highest - lowest;

  const lowFactors = entries
    .filter(([, score]) => Number(score) < 3.5)
    .map(([factor]) => factor);

  const highFactors = entries
    .filter(([, score]) => Number(score) >= 4)
    .map(([factor]) => factor);

  let balanceStatus = "";
  let balanceDesc = "";

  if (gap <= 0.75) {
    balanceStatus = "Stabil";
    balanceDesc = "Skor antar faktor relatif merata.";
  } else if (gap <= 1.5) {
    balanceStatus = "Cukup Seimbang";
    balanceDesc = "Ada perbedaan antar faktor, namun masih cukup wajar.";
  } else {
    balanceStatus = "Belum Seimbang";
    balanceDesc = "Ada selisih cukup besar antar faktor organisasi.";
  }

  insightBox.innerHTML = `
    <div class="analysis-summary-card">
      <span class="analysis-label">Keseimbangan Faktor</span>
      <h3>${escapeHtml(balanceStatus)}</h3>
      <p>${escapeHtml(balanceDesc)}</p>
    </div>

    <div class="analysis-metric-grid">
      <div class="analysis-metric-card">
        <span>Selisih Skor</span>
        <strong>${gap.toFixed(2)}</strong>
        <p>Tertinggi - terendah</p>
      </div>

      <div class="analysis-metric-card">
        <span>Faktor Rendah</span>
        <strong>${lowFactors.length}</strong>
        <p>${lowFactors.length ? escapeHtml(lowFactors.join(", ")) : "Tidak ada"}</p>
      </div>

      <div class="analysis-metric-card">
        <span>Faktor Kuat</span>
        <strong>${highFactors.length}</strong>
        <p>${highFactors.length ? escapeHtml(highFactors.join(", ")) : "Belum ada"}</p>
      </div>
    </div>

    <div class="analysis-action">
      <b>Kelengkapan Data</b><br>
      Owner: <b>${ownerFilled ? "Sudah isi" : "Belum isi"}</b><br>
      Karyawan: <b>${employeeFilled ? "Sudah isi" : "Belum isi"}</b>
    </div>

    <div class="analysis-action">
      <b>Saran Strategi</b><br>
      Fokus perbaikan dapat dimulai dari faktor dengan skor paling rendah,
      lalu dilakukan evaluasi ulang melalui kuesioner berikutnya.
    </div>

    <div class="analysis-action recommendation-cta">
      <b>Butuh Rekomendasi Perbaikan?</b>
      <p>
        Sistem telah menyiapkan saran pengembangan organisasi berdasarkan
        hasil analisis UMKM ini.
      </p>
      <a href="../saran_rekomendasi/saran_rekomendasi.html" class="recommendation-btn">
        Lihat Saran & Rekomendasi
      </a>
    </div>
  `;
}

/* =========================================================
   12. TABEL PENGISI KUESIONER
========================================================= */

function renderAssessmentTable(assessments) {
  const table = document.getElementById("assessmentTable");
  if (!table) return;

  table.innerHTML = assessments
    .map((item) => {
      const date = item.assessment_date
        ? new Date(item.assessment_date).toLocaleDateString("id-ID")
        : "-";

      const role = item.user_role === "owner" ? "Owner" : "Karyawan";
      const score = Number(item.total_average_score || 0).toFixed(2);
      const category = item.category || calculateCategory(Number(score));

      return `
        <tr>
          <td>${escapeHtml(item.user_name || "User")}</td>
          <td><span class="badge">${escapeHtml(role)}</span></td>
          <td>${escapeHtml(date)}</td>
          <td>${escapeHtml(score)}</td>
          <td>${escapeHtml(category)}</td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   13. EMPTY STATE
========================================================= */

function showEmptyState(title, message, href, linkText) {
  const analysisContent = document.getElementById("analysisContent");
  const emptyState = document.getElementById("emptyState");

  if (analysisContent) {
    analysisContent.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      <a href="${escapeHtml(href)}">${escapeHtml(linkText)}</a>
    `;
  }
}

/* =========================================================
   14. HELPER
========================================================= */

function getUmkmName(umkm) {
  return umkm?.nama_umkm || umkm?.umkm?.nama_umkm || "";
}

function getUmkmSector(umkm) {
  return (
    umkm?.sektor ||
    umkm?.kategori ||
    umkm?.umkm?.sektor ||
    umkm?.umkm?.kategori ||
    "Sektor belum tersedia"
  );
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

function normalizeRole(role) {
  const value = normalizeText(role);

  if (value === "employee" || value === "karyawan") {
    return "employee";
  }

  return "owner";
}

function calculateCategory(score) {
  if (score >= 4.1) return "Sangat Baik";
  if (score >= 3.1) return "Baik";
  if (score >= 2.1) return "Cukup";
  if (score > 0) return "Buruk";

  return "Belum Dinilai";
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function average(arr) {
  if (!arr || !arr.length) return 0;

  return arr.reduce((sum, value) => {
    return sum + Number(value || 0);
  }, 0) / arr.length;
}

function setText(id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}