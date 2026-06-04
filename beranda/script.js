document.addEventListener("DOMContentLoaded", async () => {
  try {
    const dashboardData = await loadDashboardData();

    console.log("Dashboard Data dari API:", dashboardData);

    createUserInfoCard();
    createDashboardNotification();

    updateSummaryCards(dashboardData);
    createHealthyCard(dashboardData.healthyProbability);
    createRecommendationCard();

    safeRun(() => createFactorChart(dashboardData.factors), "Statistik Faktor");

    safeRun(
      () => createDistributionChart(dashboardData.distribution),
      "Distribusi Kategori",
    );

    safeRun(
      () => createTopBottomChart(dashboardData.topBottom),
      "Top Bottom UMKM",
    );

    safeRun(() => createBoxplotChart(dashboardData.boxplot), "Boxplot");
  } catch (error) {
    console.error("Error dashboard:", error);
    showErrorState(error.message);
  }
});

async function loadDashboardData() {
  const boxplotResult = await apiRequest("/api/boxplot");
  const dashboardResult = await apiRequest("/api/dashboard");

  if (!boxplotResult.success) {
    throw new Error(boxplotResult.message || "Gagal mengambil data boxplot.");
  }

  if (!dashboardResult.success) {
    throw new Error(
      dashboardResult.message || "Gagal mengambil data dashboard.",
    );
  }

  const factorsObject = boxplotResult.factors || {};

  const factors = Object.keys(factorsObject).map((factorName) => {
    const values = factorsObject[factorName]
      .map(Number)
      .filter((value) => !isNaN(value) && value > 0);

    return {
      name: factorName,
      values,
      mean: average(values),
      stdDev: calculateStdDev(values),
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  });

  const allScores = calculateOverallScoresFromFactors(factorsObject);

  const distribution = createDistributionFromScores(allScores);

  const topBottom = createTopBottomFromScores(allScores);

  const boxplot = Object.keys(factorsObject).map((factorName) => ({
    label: factorName,
    items: factorsObject[factorName]
      .map(Number)
      .filter((value) => !isNaN(value) && value > 0),
  }));

  const healthyCount =
    distribution.find((item) => item.category === "Baik")?.count || 0;

  const veryHealthyCount =
    distribution.find((item) => item.category === "Sangat Baik")?.count || 0;

  const totalCount = boxplotResult.total_data || allScores.length || 0;

  return {
    factors,
    distribution,
    topBottom,
    boxplot,
    healthyProbability: {
      percentage: totalCount
        ? ((healthyCount + veryHealthyCount) / totalCount) * 100
        : 0,
      healthyCount: healthyCount + veryHealthyCount,
      totalCount,
    },
    apiDashboard: dashboardResult.data,
  };
}

function calculateOverallScoresFromFactors(factorsObject) {
  const factorNames = Object.keys(factorsObject);
  if (!factorNames.length) return [];

  const totalRows = factorsObject[factorNames[0]].length;
  const scores = [];

  for (let i = 0; i < totalRows; i++) {
    const rowValues = factorNames
      .map((factorName) => Number(factorsObject[factorName][i]))
      .filter((value) => !isNaN(value) && value > 0);

    scores.push({
      id: i + 1,
      score: average(rowValues),
    });
  }

  return scores;
}

function createDistributionFromScores(scores) {
  return [
    {
      category: "Buruk",
      count: scores.filter((item) => item.score < 2.1).length,
    },
    {
      category: "Cukup",
      count: scores.filter((item) => item.score >= 2.1 && item.score < 3.1)
        .length,
    },
    {
      category: "Baik",
      count: scores.filter((item) => item.score >= 3.1 && item.score < 4.1)
        .length,
    },
    {
      category: "Sangat Baik",
      count: scores.filter((item) => item.score >= 4.1).length,
    },
  ];
}

function createTopBottomFromScores(scores) {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return {
    top3: sortedScores.slice(0, 3),
    bottom3: sortedScores.slice(-3).reverse(),
  };
}

function calculateStdDev(values) {
  if (!values.length) return 0;

  const avg = average(values);

  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));

  return Math.sqrt(average(squareDiffs));
}

function safeRun(callback, chartName) {
  try {
    callback();
  } catch (error) {
    console.error(`Gagal membuat chart ${chartName}:`, error);
  }
}

function showErrorState(message) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div style="margin:16px; padding:12px 16px; background:#fdeaea; color:#c94b4b; border-radius:10px;">
      ${message}
    </div>`,
  );
}

function createUserInfoCard() {
  const container = document.getElementById("userInfoCard");
  if (!container) return;

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));

  if (!isLoggedIn || !activeUser) {
    container.innerHTML = "";
    return;
  }

  const roleLabel =
    activeUser.role === "owner"
      ? "Owner / Pemilik UMKM"
      : "Karyawan / Tim UMKM";

  container.innerHTML = `
    <div class="user-info-card">
      <div>
        <span class="user-greeting">Selamat datang,</span>
        <h3>${activeUser.name}</h3>
        <p>
          UMKM: <b>${activeUser.umkm?.nama_umkm || "-"}</b> · 
          Sektor: <b>${activeUser.umkm?.sektor || "-"}</b> · 
          Role: <b>${roleLabel}</b>
        </p>
      </div>

      <button class="logout-btn" onclick="logoutUser()">Logout</button>
    </div>
  `;
}

function logoutUser() {
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("activeUser");
  window.location.href = "../landing_page/landing.html";
}

async function createDashboardNotification() {
  const notification = document.getElementById("dashboardNotification");
  if (!notification) return;

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));

  if (!isLoggedIn || !activeUser) {
    notification.innerHTML = `
      <div class="notif notif-warning">
        <div>
          <h3>Login untuk Mengisi Kuesioner</h3>
          <p>
            Anda dapat melihat ringkasan dashboard, tetapi perlu login terlebih dahulu
            untuk mengisi kuesioner dan melihat hasil organisasi Anda.
          </p>
        </div>
        <a href="../login/login.html" class="notif-btn">Login Sekarang</a>
      </div>
    `;
    return;
  }

  let assessments = [];

  try {
    const result = await apiRequest("/api/assessments");
    assessments = result.success ? result.data : [];
  } catch (error) {
    console.error("Gagal mengambil assessment:", error);
  }

  const activeUmkmId = activeUser.umkm_id || activeUser.umkm?.umkm_id;
  const activeUmkmName = normalizeText(activeUser.umkm?.nama_umkm);

  const sameUmkmAssessments = assessments.filter((item) => {
    const itemUmkmId = item.umkm_id;
    const itemUmkmName = normalizeText(item.nama_umkm);

    return itemUmkmId == activeUmkmId || itemUmkmName === activeUmkmName;
  });

  const currentUserHasSubmitted = sameUmkmAssessments.some(
    (item) =>
      item.user_id == activeUser.user_id || item.user_id == activeUser.id,
  );

  const isOwner = activeUser.role === "owner";

  if (!currentUserHasSubmitted) {
    notification.innerHTML = `
      <div class="notif notif-success">
        <div>
          <h3>Lengkapi Kuesioner ${isOwner ? "Owner" : "Karyawan"}</h3>
          <p>
            Halo <b>${activeUser.name}</b>, Anda belum mengisi kuesioner untuk UMKM
            <b>${activeUser.umkm?.nama_umkm || "-"}</b>. Silakan isi kuesioner sesuai role Anda
            agar hasil analisis organisasi dapat dihitung.
          </p>
        </div>
        <a href="../kuisioner/kuisioner.html" class="notif-btn">
          Isi Kuesioner
        </a>
      </div>
    `;
    return;
  }

  notification.innerHTML = `
    <div class="notif notif-success">
      <div>
        <h3>Assessment Sudah Tersimpan</h3>
        <p>
          Data kuesioner untuk UMKM
          <b>${activeUser.umkm?.nama_umkm || "-"}</b> sudah tersimpan di database.
          Anda dapat melihat hasil analisis akhir.
        </p>
      </div>
      <a href="../detail/detail_analisis.html" class="notif-btn">
        Lihat Detail Analisis
      </a>
    </div>
  `;
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function updateSummaryCards(data) {
  const statCards = document.querySelectorAll(".stat-card");
  const factors = Array.isArray(data.factors) ? data.factors : [];

  if (!factors.length) return;

  const meanScore = average(factors.map((f) => f.mean));
  const meanStdDev = average(factors.map((f) => f.stdDev));
  const minScore = Math.min(...factors.map((f) => Number(f.min)));
  const maxScore = Math.max(...factors.map((f) => Number(f.max)));

  const values = [meanScore, meanStdDev, minScore, maxScore];

  statCards.forEach((card, i) => {
    const h3 = card.querySelector("h3");
    if (h3 && values[i] !== undefined) {
      h3.textContent = formatNumber(values[i]);
    }
  });
}

function createHealthyCard(data) {
  const card = document.getElementById("healthyCard");
  if (!card) return;

  const healthyData = data || {
    percentage: 0,
    healthyCount: 0,
    totalCount: 0,
  };

  card.innerHTML = `
    <div class="healthy-card">
      <div class="title">Probabilitas UMKM Sehat</div>
      <div class="value">${formatPercent(healthyData.percentage)}</div>
      <div class="desc">
        ${healthyData.healthyCount} dari ${healthyData.totalCount} UMKM termasuk kategori sehat.
      </div>
      <p class="insight" style="margin-bottom:0;">
        Persentase ini dihitung berdasarkan data raw dataset yang tersimpan di MySQL.
      </p>
    </div>
  `;
}

function createRecommendationCard() {
  const card = document.getElementById("recommendationCard");
  if (!card) return;

  card.innerHTML = `
    <div class="recommendation-card">
      <div class="title">Rekomendasi Perbaikan</div>

      <div class="desc" style="margin-top:10px; font-size:14px; color:#5c6d74; line-height:1.6;">
        <p><b>Perkuat Kepemimpinan</b><br>
        Tingkatkan kemampuan leadership untuk pengambilan keputusan yang lebih efektif.</p>

        <p><b>Optimalkan Sumber Daya</b><br>
        Gunakan tenaga kerja dan fasilitas secara lebih efisien.</p>

        <p><b>Perbaiki Operasional</b><br>
        Buat sistem kerja lebih stabil dan terstruktur.</p>

        <p><b>Tingkatkan Kinerja Ekonomi</b><br>
        Fokus pada peningkatan hasil usaha dan profitabilitas.</p>
      </div>
    </div>
  `;
}

function createFactorChart(factors) {
  const ctx = document.getElementById("factorChart");
  if (!ctx || !Array.isArray(factors) || !factors.length) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: factors.map((f) => f.name),
      datasets: [
        {
          label: "Rata-rata Faktor",
          data: factors.map((f) => Number(f.mean)),
          backgroundColor: factors.map((f) =>
            f.name === "WEQ" ? "#1f8a70" : "#8fd3c1",
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
        tooltip: {
          callbacks: {
            label: function (context) {
              const factor = factors[context.dataIndex];
              return [
                `Mean: ${formatNumber(factor.mean)}`,
                `Std. Deviasi: ${formatNumber(factor.stdDev)}`,
                `Minimum: ${formatNumber(factor.min)}`,
                `Maksimum: ${formatNumber(factor.max)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: 5,
        },
      },
    },
  });
}

function createDistributionChart(distribution) {
  const ctx = document.getElementById("distributionChart");
  if (!ctx || !Array.isArray(distribution) || !distribution.length) return;

  const values = distribution.map((d) => Number(d.count));

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: distribution.map((d) => d.category),
      datasets: [
        {
          data: values,
          backgroundColor: ["#ef5350", "#f9c74f", "#1f8a70", "#89d8c3"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            color: "#5c6d74",
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = values.reduce((a, b) => a + b, 0);
              const val = Number(context.raw);
              const pct = total ? ((val / total) * 100).toFixed(2) : 0;
              return `${context.label}: ${val} UMKM (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function createTopBottomChart(topBottom) {
  const ctx = document.getElementById("topBottomChart");
  if (!ctx || !topBottom) return;

  const top3 = Array.isArray(topBottom.top3) ? topBottom.top3 : [];
  const bottom3 = Array.isArray(topBottom.bottom3) ? topBottom.bottom3 : [];

  if (!top3.length && !bottom3.length) return;

  const labels = [
    ...top3.map((x) => `Top ${x.id}`),
    ...bottom3.map((x) => `Bottom ${x.id}`),
  ];

  const values = [
    ...top3.map((x) => Number(x.score)),
    ...bottom3.map((x) => Number(x.score)),
  ];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#1f8a70",
            "#2fa98a",
            "#63c5ad",
            "#f28b82",
            "#ea6b66",
            "#d9534f",
          ],
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          suggestedMax: 5,
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
}

function createBoxplotChart(boxplotData) {
  const ctx = document.getElementById("boxplotChart");
  if (!ctx || !Array.isArray(boxplotData) || !boxplotData.length) return;

  if (typeof Chart === "undefined") {
    console.error("Chart.js belum termuat.");
    return;
  }

  new Chart(ctx, {
    type: "boxplot",
    data: {
      labels: boxplotData.map((x) => x.label),
      datasets: [
        {
          label: "Sebaran Skor",
          data: boxplotData.map((x) => x.items),
          outlierBackgroundColor: "rgba(0, 0, 0, 0.12)",
          itemBackgroundColor: "rgba(0, 0, 0, 0.08)",
          borderColor: "#1f8a70",
          borderWidth: 2,
          outlierRadius: 2,
          itemRadius: 1,
          padding: 12,
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
        x: {
          grid: { display: false },
          ticks: { color: "#5c6d74" },
        },
        y: {
          beginAtZero: true,
          suggestedMax: 5,
          ticks: { color: "#5c6d74" },
          grid: { color: "#e8efec" },
        },
      },
    },
  });
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, n) => sum + Number(n || 0), 0) / arr.length;
}

function formatNumber(value) {
  return Number(value || 0).toFixed(2);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}
