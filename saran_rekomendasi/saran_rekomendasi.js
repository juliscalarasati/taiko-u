document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const activeUser = JSON.parse(localStorage.getItem("activeUser"));

  if (!isLoggedIn || !activeUser) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "../login/login.html";
    return;
  }

  try {
    const assessmentResult = await apiRequest("/api/assessments");

    if (!assessmentResult.success) {
      throw new Error(
        assessmentResult.message || "Gagal mengambil data assessment.",
      );
    }

    const assessmentsFromDb = assessmentResult.data || [];

    const activeUmkmId = activeUser.umkm_id || activeUser.umkm?.umkm_id;
    const activeUmkmName = normalizeText(activeUser.umkm?.nama_umkm);

    const sameUmkmAssessments = assessmentsFromDb
      .filter((item) => {
        const itemUmkmId = item.umkm_id;
        const itemUmkmName = normalizeText(item.nama_umkm);

        return itemUmkmId == activeUmkmId || itemUmkmName === activeUmkmName;
      })
      .map((item) => convertDatabaseAssessment(item, activeUser));

    document.getElementById("umkmInfo").textContent =
      `${activeUser.umkm?.nama_umkm || "UMKM"} · ${activeUser.umkm?.sektor || "Sektor belum tersedia"}`;

    if (!sameUmkmAssessments.length) {
      showEmptyState(
        "Belum Ada Data Kuesioner",
        "Isi kuesioner terlebih dahulu agar sistem dapat membuat rekomendasi.",
      );
      return;
    }

    const result = calculateCombinedResult(sameUmkmAssessments);
    const weakest = getWeakestFactor(result.factor_scores);

    const sortedFactors = Object.entries(result.factor_scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => a[1] - b[1]);

    renderSideCards(result);
    renderPriorityCard(weakest);
    renderFactorCards(sortedFactors, weakest.factor);

    console.log("Saran rekomendasi dari API:", {
      assessmentsFromDb,
      sameUmkmAssessments,
      result,
      weakest,
    });
  } catch (error) {
    console.error("Error saran rekomendasi:", error);
    showEmptyState(
      "Gagal Memuat Rekomendasi",
      error.message || "Terjadi kesalahan saat mengambil data dari server.",
    );
  }
});

function showEmptyState(title, message) {
  const emptyState = document.getElementById("emptyState");
  const content = document.getElementById("recommendationContent");

  if (content) content.style.display = "none";

  if (emptyState) {
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <h2>${title}</h2>
      <p>${message}</p>
      <a href="/kuisioner/kuisioner.html">Isi Kuesioner</a>
    `;
  }
}

function convertDatabaseAssessment(item, activeUser) {
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

  const role = activeUser.role === "owner" ? "owner" : "employee";
  const factorScores = calculateFactorScoresFromAnswers(answers, role);

  const totalAverageScore = average(
    Object.values(factorScores).filter((score) => score > 0),
  );

  return {
    assessment_id: item.id,
    user_id: item.user_id,
    user_name: activeUser.name || "User",
    user_role: role,
    umkm_id: item.umkm_id,
    nama_umkm: item.nama_umkm,
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

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

  return {
    factor_scores: factorScores,
    total_average_score: totalAverage,
    category: calculateCategory(totalAverage),
  };
}

function getWeakestFactor(factorScores) {
  const entries = Object.entries(factorScores).filter(([, score]) => score > 0);

  if (!entries.length) {
    return {
      factor: "OPS",
      score: 0,
      meta: factorMeta.OPS,
    };
  }

  const weakest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));

  return {
    factor: weakest[0],
    score: weakest[1],
    meta: factorMeta[weakest[0]],
  };
}

function renderSideCards(result) {
  const percent = Math.round((result.total_average_score / 5) * 100);
  const audit = calculateAuditTime(result.total_average_score);

  document.getElementById("sustainabilityScore").textContent = `${percent}%`;
  document.getElementById("scoreDesc").textContent =
    `Kategori ${result.category} berdasarkan skor ${result.total_average_score.toFixed(2)}.`;

  document.getElementById("auditTime").textContent = audit.time;
  document.getElementById("auditDesc").textContent = audit.desc;
}

function calculateAuditTime(score) {
  if (score < 2.1) {
    return {
      time: "30 Hari",
      desc: "Dibutuhkan waktu evaluasi lebih panjang karena kondisi organisasi masih berada pada kategori Buruk.",
    };
  }

  if (score < 3.1) {
    return {
      time: "21 Hari",
      desc: "Dibutuhkan waktu perbaikan bertahap karena kondisi organisasi masih berada pada kategori Cukup.",
    };
  }

  if (score < 4.1) {
    return {
      time: "14 Hari",
      desc: "Waktu ini cukup untuk menjalankan evaluasi awal pada faktor prioritas perbaikan.",
    };
  }

  return {
    time: "7 Hari",
    desc: "Organisasi sudah berada pada kondisi sangat baik, sehingga evaluasi dapat dilakukan dalam waktu lebih singkat.",
  };
}

function renderPriorityCard(priority) {
  const card = document.getElementById("priorityCard");
  if (!card) return;

  const meta = priority.meta || factorMeta[priority.factor];
  const recs = recommendationData[priority.factor] || recommendationData.OPS;

  card.innerHTML = `
    <div class="priority-head">
      <div class="factor-title">
        <div class="factor-icon">≈</div>
        <div>
          <h2>${meta.name} (${priority.factor})</h2>
          <span class="priority-badge">Prioritas Utama</span>
        </div>
      </div>
      <span class="ref">REF: ${priority.factor}-TAIKO</span>
    </div>

    <div class="priority-body">
      <div class="diagnosis">
        <h3><i>Temuan Diagnosis:</i></h3>
        <p>
          Faktor <b>${meta.name}</b> memiliki skor paling rendah yaitu
          <b>${priority.score.toFixed(2)}</b>. Faktor ini dapat menjadi fokus awal
          agar kondisi organisasi UMKM semakin meningkat.
        </p>

        <div class="effect-box">
          ⚠ Efek: Jika tidak diperbaiki, faktor ini dapat menghambat stabilitas kerja,
          produktivitas, dan kemampuan organisasi untuk berkembang.
        </div>
      </div>

      <div class="solution-box">
        <h3>Solusi Perbaikan</h3>
        <ul>
          ${recs.map((item) => `<li>${item.desc}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderFactorCards(sortedFactors, weakestFactor) {
  const container = document.getElementById("factorCards");
  if (!container) return;

  const otherFactors = sortedFactors
    .filter(([factor]) => factor !== weakestFactor)
    .slice(0, 2);

  container.innerHTML = otherFactors
    .map(([factor, score]) => {
      const meta = factorMeta[factor];
      const status = score >= 3.1 ? "good" : "warning";
      const label = score >= 3.1 ? "Faktor Pendukung" : "Saran Tambahan";

      return `
        <article class="factor-card ${status}">
          <span class="mini-label">${label}</span>
          <h3>${meta.name} (${factor})</h3>
          <p>
            Skor faktor ini berada pada nilai <b>${score.toFixed(2)}</b>.
            ${meta.shortInsight}
          </p>
        </article>
      `;
    })
    .join("");
}

const factorMeta = {
  OV: {
    name: "Budaya & Nilai",
    shortInsight:
      "Budaya yang kuat membantu membangun komitmen, kedisiplinan, dan kepercayaan dalam organisasi.",
  },
  LDI: {
    name: "Kepemimpinan",
    shortInsight:
      "Kepemimpinan yang baik membantu tim bekerja lebih terarah dan mengambil keputusan dengan lebih efektif.",
  },
  INS: {
    name: "Sumber Daya & Legalitas",
    shortInsight:
      "Kesiapan sumber daya dan legalitas membuat operasional lebih aman, tertata, dan mudah dikembangkan.",
  },
  OPS: {
    name: "Stabilitas Operasional",
    shortInsight:
      "Operasional yang stabil membantu menjaga kualitas layanan dan mengurangi hambatan kerja harian.",
  },
  WEQ: {
    name: "Lingkungan Kerja",
    shortInsight:
      "Lingkungan kerja yang baik mendukung kenyamanan, produktivitas, dan keselamatan anggota organisasi.",
  },
  ECT: {
    name: "Kinerja Keuangan",
    shortInsight:
      "Kinerja keuangan yang sehat membantu organisasi bertahan dan berkembang secara berkelanjutan.",
  },
};

const recommendationData = {
  OV: [
    {
      desc: "Susun nilai utama organisasi agar seluruh anggota memahami arah dan standar perilaku kerja.",
    },
    {
      desc: "Lakukan briefing rutin agar visi, target, dan budaya kerja positif dipahami bersama.",
    },
    {
      desc: "Bangun kebiasaan apresiasi agar anggota tim merasa dihargai dan lebih terlibat.",
    },
  ],
  LDI: [
    {
      desc: "Pimpinan perlu memberi arahan kerja yang lebih jelas dan konsisten.",
    },
    {
      desc: "Buat ruang evaluasi agar karyawan dapat menyampaikan kendala dan masukan.",
    },
    {
      desc: "Tingkatkan keterlibatan pemimpin dalam memantau proses operasional harian.",
    },
  ],
  INS: [
    {
      desc: "Lengkapi dokumen legalitas dan sertifikasi usaha yang masih belum tersedia.",
    },
    { desc: "Rapikan pencatatan keuangan dan dokumen pendukung operasional." },
    {
      desc: "Pastikan fasilitas dan alat kerja utama tersedia untuk mendukung aktivitas usaha.",
    },
  ],
  OPS: [
    {
      desc: "Buat SOP sederhana untuk menjaga konsistensi proses kerja harian.",
    },
    {
      desc: "Pantau hambatan operasional seperti pasokan, produksi, pengiriman, dan kualitas.",
    },
    {
      desc: "Gunakan checklist kerja agar standar operasional lebih mudah dikontrol.",
    },
  ],
  WEQ: [
    { desc: "Tingkatkan kebersihan, kenyamanan, dan keamanan area kerja." },
    { desc: "Pastikan alat kerja dalam kondisi aman dan terawat." },
    {
      desc: "Identifikasi risiko tersembunyi yang dapat mengganggu produktivitas tim.",
    },
  ],
  ECT: [
    {
      desc: "Pantau penjualan, keuntungan, dana cadangan, dan arus kas secara rutin.",
    },
    {
      desc: "Tentukan target keuangan bertahap untuk menjaga pertumbuhan usaha.",
    },
    { desc: "Evaluasi biaya operasional agar profitabilitas lebih stabil." },
  ],
};

function calculateCategory(score) {
  if (score >= 4.1) return "Sangat Baik";
  if (score >= 3.1) return "Baik";
  if (score >= 2.1) return "Cukup";
  if (score > 0) return "Buruk";
  return "Belum Dinilai";
}

function average(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((sum, value) => sum + Number(value || 0), 0) / arr.length;
}
