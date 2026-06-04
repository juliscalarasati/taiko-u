const factorInfo = {
  OV: { full: "Organizational Values", id: "Nilai Organisasi" },
  LDI: { full: "Leadership", id: "Kepemimpinan" },
  INS: { full: "Infrastructure", id: "Sumber Daya" },
  OPS: { full: "Operational Stability", id: "Stabilitas Operasional" },
  WEQ: { full: "Work Environment Quality", id: "Kualitas Lingkungan Kerja" },
  ECT: { full: "Economic Performance", id: "Kinerja Ekonomi" },
};

document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));
  const selectedUmkm = JSON.parse(localStorage.getItem("selectedUmkm"));

  if (!isLoggedIn || !activeUser) {
    alert("Silakan login terlebih dahulu untuk melihat detail analisis.");
    window.location.href = "/login/login.html";
    return;
  }

  // Ini yang penting:
  // Kalau masuk dari Daftar UMKM, pakai selectedUmkm.
  // Kalau masuk dari Beranda akun sendiri, baru fallback ke activeUser.umkm.
  const targetUmkm = selectedUmkm || activeUser.umkm;

  if (!targetUmkm) {
    alert("UMKM belum dipilih.");
    window.location.href = "../daftar_umkm/daftar_umkm.html";
    return;
  }

  try {
    const assessmentResult = await apiRequest("/api/assessments");
    const boxplotResult = await apiRequest("/api/boxplot");

    if (!assessmentResult.success) {
      throw new Error(
        assessmentResult.message || "Gagal mengambil data assessment."
      );
    }

    if (!boxplotResult.success) {
      throw new Error(boxplotResult.message || "Gagal mengambil data boxplot.");
    }

    const allAssessments = assessmentResult.data || [];

    const targetUmkmId =
      targetUmkm.umkm_id ||
      targetUmkm.id ||
      targetUmkm.umkm?.umkm_id ||
      targetUmkm.umkm?.id;

    const targetUmkmName = normalizeText(
      targetUmkm.nama_umkm ||
      targetUmkm.umkm?.nama_umkm
    );

    const targetSector =
      targetUmkm.sektor ||
      targetUmkm.kategori ||
      targetUmkm.umkm?.sektor ||
      targetUmkm.umkm?.kategori ||
      "Sektor belum tersedia";

    const sameUmkmAssessments = allAssessments.filter((item) => {
      return (
        item.umkm_id == targetUmkmId ||
        normalizeText(item.nama_umkm) === targetUmkmName
      );
    });

    document.getElementById("umkmInfo").textContent =
      `${targetUmkm.nama_umkm || targetUmkm.umkm?.nama_umkm || "UMKM"} · ${targetSector}`;

    if (!sameUmkmAssessments.length) {
      document.getElementById("analysisContent").style.display = "none";
      document.getElementById("emptyState").style.display = "block";

      document.getElementById("emptyState").innerHTML = `
        <h2>UMKM Ini Belum Dinilai</h2>
        <p>Belum ada hasil kuesioner untuk ${
          targetUmkm.nama_umkm || targetUmkm.umkm?.nama_umkm || "UMKM ini"
        }.</p>
        <a href="../daftar_umkm/daftar_umkm.html">Kembali ke Daftar UMKM</a>
      `;
      return;
    }

    const formattedAssessments = sameUmkmAssessments.map((item) =>
      convertDatabaseAssessment(item, activeUser, targetUmkm)
    );

    const combinedResult = calculateCombinedResult(formattedAssessments);
    const benchmarkBoxplotData = convertBoxplotApiData(boxplotResult.factors);

    renderSummary(combinedResult, formattedAssessments);
    renderFactorChart(combinedResult.factor_scores);
    renderRadarChart(combinedResult.factor_scores);
    renderBenchmarkBoxplot(combinedResult.factor_scores, benchmarkBoxplotData);
    renderBenchmarkInsight(combinedResult.factor_scores);
    renderInsights(combinedResult);
    renderAssessmentTable(formattedAssessments);

    console.log("Detail assessment dari API:", {
      targetUmkm,
      targetUmkmId,
      targetUmkmName,
      allAssessments,
      sameUmkmAssessments,
      formattedAssessments,
      combinedResult,
      benchmarkBoxplotData,
    });
  } catch (error) {
    console.error("Error detail analisis:", error);
    document.getElementById("analysisContent").style.display = "none";
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("emptyState").innerHTML = `
      <h2>Gagal Memuat Detail Analisis</h2>
      <p>${error.message}</p>
      <a href="../beranda/index.html">Kembali ke Beranda</a>
    `;
  }
});

function convertDatabaseAssessment(item, activeUser, targetUmkm) {
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

  const role =
    item.user_role ||
    item.role ||
    activeUser.role ||
    "owner";

  const normalizedRole =
    role === "employee" || role === "karyawan" ? "employee" : "owner";

  const factorScores = calculateFactorScoresFromAnswers(answers, normalizedRole);

  const totalAverageScore = average(
    Object.values(factorScores).filter((score) => score > 0)
  );

  return {
    assessment_id: item.id,
    user_id: item.user_id,
    user_name:
      item.user_name ||
      item.name ||
      item.pemilik ||
      targetUmkm.pemilik ||
      activeUser.name ||
      "User",
    user_role: normalizedRole,
    umkm_id: item.umkm_id,
    nama_umkm:
      item.nama_umkm ||
      targetUmkm.nama_umkm ||
      targetUmkm.umkm?.nama_umkm,
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

function convertBoxplotApiData(factors) {
  const result = {};

  Object.keys(factors || {}).forEach((factor) => {
    result[factor] = factors[factor]
      .map(Number)
      .filter((value) => !isNaN(value) && value > 0);
  });

  return result;
}

function calculateCombinedResult(assessments) {
  const factors = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];
  const factorScores = {};

  factors.forEach((factor) => {
    const values = assessments
      .map((item) => Number(item.factor_scores?.[factor]))
      .filter((value) => !isNaN(value) && value > 0);

    factorScores[factor] = average(values);
  });

  const validScores = Object.values(factorScores).filter((score) => score > 0);
  const totalAverage = average(validScores);
  const category = calculateCategory(totalAverage);

  return {
    factor_scores: factorScores,
    total_average_score: totalAverage,
    category,
  };
}

function renderSummary(result, assessments) {
  document.getElementById("respondentCount").textContent = assessments.length;
  document.getElementById("averageScore").textContent =
    result.total_average_score.toFixed(2);
  document.getElementById("categoryResult").textContent = result.category;
}

function renderFactorChart(factorScores) {
  const ctx = document.getElementById("factorResultChart");
  if (!ctx) return;

  const labels = Object.keys(factorScores);
  const values = Object.values(factorScores);

  new Chart(ctx, {
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
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5,
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

function renderRadarChart(factorScores) {
  const ctx = document.getElementById("radarChart");
  if (!ctx) return;

  const labels = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];
  const values = labels.map((label) => Number(factorScores[label] || 0));

  new Chart(ctx, {
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

function renderBenchmarkBoxplot(userFactorScores, benchmarkBoxplotData) {
  const ctx = document.getElementById("factorBoxplotChart");
  if (!ctx) return;

  const labels = ["OV", "LDI", "INS", "OPS", "WEQ", "ECT"];

  new Chart(ctx, {
    type: "boxplot",
    data: {
      labels,
      datasets: [
        {
          label: "Distribusi 428 UMKM",
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
          data: labels.map((key) => ({
            x: key,
            y: Number(userFactorScores[key] || 0),
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
        legend: { display: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5,
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

function renderBenchmarkInsight(userFactorScores) {
  const insightEl = document.getElementById("benchmarkInsight");
  if (!insightEl) return;

  const entries = Object.entries(userFactorScores).filter(
    ([, score]) => Number(score) > 0
  );

  if (!entries.length) return;

  const highest = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lowest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));

  insightEl.innerHTML = `
    <div class="insight-intro">
      <span class="insight-label">Interpretasi Boxplot</span>
      <h3>Posisi UMKM dibandingkan 428 UMKM pembanding</h3>
      <p>
        Boxplot menampilkan sebaran skor faktor dari raw dataset, sedangkan titik
        “Skor UMKM Ini” menunjukkan posisi hasil kuesioner UMKM yang sedang dianalisis.
      </p>
    </div>

    <div class="insight-grid">
      <div class="insight-mini-card success">
        <small>Faktor Terkuat</small>
        <div>
          <span class="factor-code">${highest[0]}</span>
          <span class="factor-name">${factorInfo[highest[0]]?.id || highest[0]}</span>
        </div>
        <p>Skor <b>${Number(highest[1]).toFixed(2)}</b>. Faktor ini menjadi kekuatan utama UMKM.</p>
      </div>

      <div class="insight-mini-card warning">
        <small>Prioritas Perbaikan</small>
        <div>
          <span class="factor-code">${lowest[0]}</span>
          <span class="factor-name">${factorInfo[lowest[0]]?.id || lowest[0]}</span>
        </div>
        <p>Skor <b>${Number(lowest[1]).toFixed(2)}</b>. Faktor ini perlu mendapat perhatian lebih dulu.</p>
      </div>
    </div>
  `;
}

function renderInsights(result) {
  const insightBox = document.getElementById("insightBox");
  const scores = result.factor_scores;

  const entries = Object.entries(scores).filter(([, score]) => score > 0);

  if (!entries.length) {
    insightBox.innerHTML = `<div class="analysis-action">Data faktor belum tersedia.</div>`;
    return;
  }

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
      <h3>${balanceStatus}</h3>
      <p>${balanceDesc}</p>
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
        <p>${lowFactors.length ? lowFactors.join(", ") : "Tidak ada"}</p>
      </div>

      <div class="analysis-metric-card">
        <span>Faktor Kuat</span>
        <strong>${highFactors.length}</strong>
        <p>${highFactors.length ? highFactors.join(", ") : "Belum ada"}</p>
      </div>
    </div>

    <div class="analysis-action">
      <b>Saran Strategi</b><br>
      Fokus perbaikan dapat dimulai dari faktor dengan skor paling rendah, lalu dilakukan evaluasi ulang melalui kuesioner berikutnya.
    </div>

    <div class="analysis-action recommendation-cta">
      <b>Butuh Rekomendasi Perbaikan?</b>
      <p>Sistem telah menyiapkan saran pengembangan organisasi berdasarkan hasil analisis UMKM ini.</p>
      <a href="../saran_rekomendasi/saran_rekomendasi.html" class="recommendation-btn">
        Lihat Saran & Rekomendasi
      </a>
    </div>
  `;
}

function renderAssessmentTable(assessments) {
  const table = document.getElementById("assessmentTable");

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
        <td>${item.user_name || "User"}</td>
        <td><span class="badge">${role}</span></td>
        <td>${date}</td>
        <td>${score}</td>
        <td>${category}</td>
      </tr>
    `;
    })
    .join("");
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
  return arr.reduce((sum, value) => sum + Number(value || 0), 0) / arr.length;
}