const questionnaireData = {
  owner: [
    {
      menu: "Sumber Daya",
      label: "KUESIONER OWNER",
      title: "Bagian 1: Sumber Daya & Legalitas",
      desc: "Jawab pertanyaan mengenai legalitas, dukungan usaha, pemasaran, dan sumber modal bisnis.",
      factor: "INS",
      questions: [
        {
          id: "OH1",
          text: "Apakah bisnis Anda sudah memiliki izin usaha resmi (NIB/SIUP)?",
          type: "choice",
          options: ["Tidak", "Sedang Proses", "Ya"],
        },
        {
          id: "OH2",
          text: "Apakah bisnis Anda pernah menerima bantuan pendanaan dari pemerintah atau lembaga terkait?",
          type: "choice",
          options: ["Tidak", "Sedang Proses", "Ya"],
        },
        {
          id: "OH3",
          text: "Apakah bisnis Anda pernah mengikuti pelatihan atau program pengembangan usaha?",
          type: "choice",
          options: ["Tidak", "Sedang Proses", "Ya"],
        },
        {
          id: "OH4",
          text: "Apakah bisnis Anda pernah bekerja sama atau berkolaborasi dengan bisnis lain dalam menjalankan usaha?",
          type: "choice",
          options: ["Tidak", "Sedang Proses", "Ya"],
        },
        {
          id: "OH5",
          text: "Apakah bisnis Anda sudah menggunakan media digital atau media sosial untuk pemasaran?",
          type: "choice",
          options: ["Tidak", "Sedang Proses", "Ya"],
        },
        {
          id: "OH6",
          text: "Dari mana sumber modal utama bisnis Anda saat ini?",
          type: "card",
          options: ["Modal Sendiri", "Keluarga/Teman", "Pinjaman Bank"],
        },
      ],
    },
    {
      menu: "Budaya",
      label: "KUESIONER OWNER",
      title: "Bagian 2: Budaya & Dukungan Operasional",
      desc: "Menilai kesiapan sumber daya operasional dalam menjalankan aktivitas bisnis sehari-hari.",
      factor: "OV",
      questions: [
        {
          id: "OH26",
          text: "Bisnis memiliki sumber daya operasional yang cukup untuk menjalankan aktivitas sehari-hari.",
          type: "scale",
        },
      ],
    },
    {
      menu: "Operasional",
      label: "KUESIONER OWNER",
      title: "Bagian 3: Stabilitas Operasional",
      desc: "Menilai kestabilan operasional bisnis dari sisi kewajiban, peralatan, pasokan, pelanggan, dan hubungan jangka panjang.",
      factor: "OPS",
      questions: [
        {
          id: "OH27",
          text: "Bisnis mampu memenuhi kewajiban kepada karyawan tepat waktu.",
          type: "scale",
        },
        {
          id: "OH28",
          text: "Mesin atau peralatan operasional bekerja dengan baik dan optimal.",
          type: "scale",
        },
        {
          id: "OH29",
          text: "Pasokan bahan baku atau kebutuhan operasional tersedia dengan lancar.",
          type: "scale",
        },
        {
          id: "OH30",
          text: "Permintaan pelanggan terhadap produk/jasa dapat diprediksi dengan baik.",
          type: "scale",
        },
        {
          id: "OH31",
          text: "Bisnis memiliki hubungan pelanggan yang baik dalam jangka panjang.",
          type: "scale",
        },
      ],
    },
    {
      menu: "Keuangan",
      label: "KUESIONER OWNER",
      title: "Bagian 4: Kinerja Keuangan",
      desc: "Menilai kondisi pasar, omzet, kewajiban keuangan, dan kesehatan operasional bisnis.",
      factor: "ECT",
      questions: [
        {
          id: "OH32",
          text: "Bisnis memiliki kemampuan untuk menjangkau pasar atau pelanggan baru.",
          type: "scale",
        },
        {
          id: "OH33",
          text: "Penjualan atau omzet bisnis mengalami peningkatan dalam satu tahun terakhir.",
          type: "scale",
        },
        {
          id: "OH34",
          text: "Bisnis mampu memenuhi kewajiban operasional dan keuangan dengan baik.",
          type: "scale",
        },
        {
          id: "OH35",
          text: "Kondisi operasional bisnis berjalan sehat dan lancar secara keseluruhan.",
          type: "scale",
        },
      ],
    },
  ],

  karyawan: [
    {
      menu: "Kepemimpinan",
      label: "KUESIONER KARYAWAN",
      title: "Bagian 1: Gaya Kepemimpinan",
      desc: "Menilai gaya kepemimpinan pemilik usaha dari sudut pandang pegawai/karyawan.",
      factor: "LDI",
      questions: [
        {
          id: "OH7",
          text: "Pemilik usaha memiliki hubungan yang dekat dan baik dengan karyawan.",
          type: "scale",
        },
        {
          id: "OH8",
          text: "Pemilik usaha memberikan contoh etos kerja yang baik kepada bawahannya.",
          type: "scale",
        },
        {
          id: "OH9",
          text: "Pemilik usaha terbuka terhadap ide dan masukan dari karyawan.",
          type: "scale",
        },
        {
          id: "OH10",
          text: "Pemilik usaha terlibat langsung dalam kegiatan operasional bisnis.",
          type: "scale",
        },
        {
          id: "OH11",
          text: "Pemilik usaha ikut membimbing atau melatih karyawan baru.",
          type: "scale",
        },
        {
          id: "OH12",
          text: "Pemilik usaha bersikap adil dalam memberikan penghargaan maupun teguran kepada karyawan.",
          type: "scale",
        },
      ],
    },
    {
      menu: "Lingkungan Kerja",
      label: "KUESIONER KARYAWAN",
      title: "Bagian 2: Lingkungan Kerja",
      desc: "Menilai keamanan, kenyamanan, jam kerja, beban kerja, dan kondisi tempat kerja.",
      factor: "WEQ",
      questions: [
        {
          id: "OH13",
          text: "Tempat kerja memiliki kondisi yang aman dan minim risiko kecelakaan kerja.",
          type: "scale",
        },
        {
          id: "OH14",
          text: "Saya merasa puas dengan pengaturan jam kerja di tempat usaha ini.",
          type: "scale",
        },
        {
          id: "OH15",
          text: "Beban kerja yang diberikan masih sesuai dan dapat ditangani dengan baik.",
          type: "scale",
        },
        {
          id: "OH16",
          text: "Kondisi fisik tempat kerja seperti pencahayaan, suhu, dan kebersihan terasa nyaman.",
          type: "scale",
        },
        {
          id: "OH17",
          text: "Karyawan jarang mengalami ketidakhadiran atau absen kerja.",
          type: "scale",
        },
      ],
    },
    {
      menu: "Budaya Organisasi",
      label: "KUESIONER KARYAWAN",
      title: "Bagian 3: Budaya Organisasi",
      desc: "Menilai hubungan kerja, komunikasi, tanggung jawab, disiplin, dan kerja sama tim.",
      factor: "OV",
      questions: [
        {
          id: "OH18",
          text: "Karyawan saling membantu ketika ada rekan kerja yang mengalami kesulitan.",
          type: "scale",
        },
        {
          id: "OH19",
          text: "Hubungan antar karyawan berjalan dengan baik dan harmonis.",
          type: "scale",
        },
        {
          id: "OH20",
          text: "Komunikasi antar sesama rekan kerja berjalan dengan terbuka.",
          type: "scale",
        },
        {
          id: "OH21",
          text: "Karyawan merasa nyaman bekerja di lingkungan usaha ini.",
          type: "scale",
        },
        {
          id: "OH22",
          text: "Karyawan memiliki rasa tanggung jawab terhadap pekerjaannya.",
          type: "scale",
        },
        {
          id: "OH23",
          text: "Karyawan disiplin terhadap aturan dan waktu kerja.",
          type: "scale",
        },
        {
          id: "OH24",
          text: "Karyawan saling menghormati tanpa membedakan latar belakang.",
          type: "scale",
        },
        {
          id: "OH25",
          text: "Karyawan mampu bekerja sama dengan baik dalam tim.",
          type: "scale",
        },
      ],
    },
  ],
};

let currentStep = 0;

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!isLoggedIn || !activeUser) {
  alert("Silakan login terlebih dahulu untuk mengisi kuesioner.");
  window.location.href = "../login/login.html";
}

const userRole = activeUser.role === "owner" ? "owner" : "karyawan";
const sections = questionnaireData[userRole];

const answerKey = `kuesionerAnswers_${activeUser.user_id || activeUser.id}`;
const answers = JSON.parse(localStorage.getItem(answerKey)) || {};

const questionContainer = document.getElementById("questionContainer");
const sectionTitle = document.getElementById("sectionTitle");
const sectionDesc = document.getElementById("sectionDesc");
const phaseLabel = document.getElementById("phaseLabel");
const progressNumber = document.getElementById("progressNumber");
const progressFill = document.getElementById("progressFill");
const stepMenu = document.getElementById("stepMenu");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function renderMenu() {
  stepMenu.innerHTML = sections
    .map(
      (section, index) => `
    <button class="${index === currentStep ? "active" : ""}" onclick="goToStep(${index})">
      ${section.menu}
    </button>
  `,
    )
    .join("");
}

function renderStep() {
  const section = sections[currentStep];
  const progress = Math.round(((currentStep + 1) / sections.length) * 100);

  phaseLabel.textContent = section.label;
  sectionTitle.textContent = section.title;
  sectionDesc.textContent = section.desc;
  progressNumber.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;

  questionContainer.innerHTML = section.questions
    .map((q) => renderQuestion(q))
    .join("");

  prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
  nextBtn.textContent =
    currentStep === sections.length - 1 ? "Selesai & Simpan" : "Selanjutnya →";

  renderMenu();
}

function renderQuestion(q) {
  if (q.type === "choice") {
    return `
      <div class="question-card">
        <div>
          <span class="qid">${q.id}</span>
          <h3>${q.text}</h3>
        </div>
        <div class="choice-group">
          ${q.options
            .map(
              (opt) => `
            <label>
              <input type="radio" name="${q.id}" value="${opt}" ${answers[q.id] === opt ? "checked" : ""} onchange="saveAnswer('${q.id}', this.value)">
              <span>${opt}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (q.type === "card") {
    return `
      <div class="question-card vertical">
        <span class="qid">${q.id}</span>
        <h3>${q.text}</h3>
        <div class="option-cards">
          ${q.options
            .map(
              (opt) => `
            <label class="option-card ${answers[q.id] === opt ? "selected" : ""}">
              <input type="radio" name="${q.id}" value="${opt}" ${answers[q.id] === opt ? "checked" : ""} onchange="saveAnswer('${q.id}', this.value)">
              <strong>${opt}</strong>
              <p>${getOptionDesc(opt)}</p>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="question-card">
      <div>
        <span class="qid">${q.id}</span>
        <h3>${q.text}</h3>
      </div>
      <div class="scale-group">
        ${[1, 2, 3, 4, 5]
          .map(
            (num) => `
          <button class="${Number(answers[q.id]) === num ? "selected" : ""}" onclick="saveAnswer('${q.id}', ${num})">
            ${num}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function getOptionDesc(option) {
  if (option === "Modal Sendiri") return "Simpanan pribadi atau laba ditahan.";
  if (option === "Keluarga/Teman")
    return "Pinjaman non-formal tanpa bunga tinggi.";
  if (option === "Pinjaman Bank")
    return "Kredit usaha atau fasilitas perbankan.";
  return "";
}

function saveAnswer(id, value) {
  answers[id] = value;
  localStorage.setItem(answerKey, JSON.stringify(answers));
  renderStep();
}

function goToStep(index) {
  currentStep = index;
  renderStep();
}

function validateCurrentSection() {
  const section = sections[currentStep];

  const emptyQuestion = section.questions.find(
    (q) =>
      answers[q.id] === undefined ||
      answers[q.id] === null ||
      answers[q.id] === "",
  );

  if (emptyQuestion) {
    alert(`Pertanyaan ${emptyQuestion.id} belum dijawab.`);
    return false;
  }

  return true;
}

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
});

nextBtn.addEventListener("click", async () => {
  if (!validateCurrentSection()) return;

  if (currentStep < sections.length - 1) {
    currentStep++;
    renderStep();
    return;
  }

  const assessmentResult = calculateAssessmentResult();
  if (!assessmentResult) return;

  const backendPayload = createBackendPayload(assessmentResult);
  const validationResult = validateBackendPayload(backendPayload, userRole);

  if (!validationResult.isValid) {
    alert(validationResult.errors.join("\n"));
    return;
  }

  try {
    nextBtn.disabled = true;
    nextBtn.textContent = "Menyimpan...";

    const predictionResult = await getPredictionFromAPI(assessmentResult);

    assessmentResult.prediction = predictionResult.prediction;
    assessmentResult.probability = predictionResult.probability;
    assessmentResult.recommendation = predictionResult.recommendation;

    const answersArray = createAnswersArrayFromAssessment(assessmentResult);

    const saveResult = await apiRequest("/api/assessments", "POST", {
      user_id: activeUser.user_id || activeUser.id,
      umkm_id: activeUser.umkm_id || activeUser.umkm?.umkm_id,
      nama_umkm: activeUser.umkm?.nama_umkm || assessmentResult.nama_umkm,
      answers: answersArray,
    });

    if (!saveResult.success) {
      alert(saveResult.message || "Gagal menyimpan kuesioner ke database.");
      nextBtn.disabled = false;
      nextBtn.textContent = "Selesai & Simpan";
      return;
    }

    assessmentResult.assessment_id = saveResult.assessment_id;
    assessmentResult.backend_prediction = saveResult.prediction;

    console.log("Payload format faktor:", backendPayload);
    console.log("Hasil prediksi dari API:", predictionResult);
    console.log("Hasil simpan assessment ke database:", saveResult);

    localStorage.setItem(
      "latestBackendPayload",
      JSON.stringify(backendPayload),
    );
    localStorage.setItem("latestPrediction", JSON.stringify(predictionResult));

    const assessments = JSON.parse(localStorage.getItem("assessments")) || [];

    const filteredAssessments = assessments.filter(
      (item) =>
        !(
          item.user_id == (activeUser.user_id || activeUser.id) &&
          item.user_role === activeUser.role
        ),
    );

    filteredAssessments.push(assessmentResult);

    localStorage.setItem("assessments", JSON.stringify(filteredAssessments));
    localStorage.setItem("latestAssessment", JSON.stringify(assessmentResult));
    localStorage.setItem("assessmentCompleted", "true");
    localStorage.removeItem("selectedUmkm");
    localStorage.removeItem("previewAssessments");
    localStorage.removeItem(answerKey);

    alert(
      `Kuesioner berhasil disimpan ke database.\n\nPrediksi: ${predictionResult.prediction}\nSkor: ${predictionResult.probability}%`,
    );

    window.location.href = "../detail/detail_analisis.html";
  } catch (error) {
    console.error("Gagal submit kuesioner:", error);
    alert("Terjadi kesalahan saat menyimpan kuesioner ke server.");
    nextBtn.disabled = false;
    nextBtn.textContent = "Selesai & Simpan";
  }
});

function calculateAssessmentResult() {
  const factorGroups = getFactorGroupsByRole(userRole);
  const factorScores = {};

  Object.keys(factorGroups).forEach((factor) => {
    const questionIds = factorGroups[factor];

    const scores = questionIds
      .map((id) => convertAnswerToScore(answers[id]))
      .filter((score) => score !== null);

    factorScores[factor] = scores.length ? average(scores) : 0;
  });

  const allScores = Object.values(factorScores).filter((score) => score > 0);
  const totalAverageScore = average(allScores);
  const category = calculateCategory(totalAverageScore);

  return {
    assessment_id: Date.now(),
    assessment_type: userRole,
    user_id: activeUser.user_id || activeUser.id,
    user_name: activeUser.name,
    user_role: activeUser.role,
    umkm_id: activeUser.umkm_id || activeUser.umkm?.umkm_id,
    nama_umkm: activeUser.umkm?.nama_umkm || "UMKM belum tersedia",
    sektor: activeUser.umkm?.sektor || "Sektor belum tersedia",
    assessment_date: new Date().toISOString(),
    answers: { ...answers },
    factor_scores: factorScores,
    total_average_score: totalAverageScore,
    category: category,
  };
}

function createBackendPayload(assessmentResult) {
  return {
    id_umkm: formatBackendUmkmId(assessmentResult.umkm_id),

    organizational_values: Number(assessmentResult.factor_scores.OV || 0),
    leader_involvement: Number(assessmentResult.factor_scores.LDI || 0),
    institutional_resources: Number(assessmentResult.factor_scores.INS || 0),
    operational_stability: Number(assessmentResult.factor_scores.OPS || 0),
    work_environment_quality: Number(assessmentResult.factor_scores.WEQ || 0),
    economics_performance: Number(assessmentResult.factor_scores.ECT || 0),

    submitted_by: assessmentResult.user_name,
    submitted_role: assessmentResult.user_role,
    submitted_at: assessmentResult.assessment_date,
  };
}

function formatBackendUmkmId(umkmId) {
  const rawId = String(umkmId || "").replace(/\D/g, "");
  const lastThreeDigits = rawId.slice(-3).padStart(3, "0");

  return `UMKM${lastThreeDigits}`;
}

function validateBackendPayload(payload, role) {
  const errors = [];
  const idPattern = /^UMKM[0-9]{3}$/;

  if (!payload.id_umkm) {
    errors.push("ID UMKM tidak boleh kosong.");
  } else if (!idPattern.test(payload.id_umkm)) {
    errors.push("Format ID UMKM harus seperti UMKM001.");
  }

  const requiredFieldsByRole = {
    owner: [
      "organizational_values",
      "institutional_resources",
      "operational_stability",
      "economics_performance",
    ],
    karyawan: [
      "organizational_values",
      "leader_involvement",
      "work_environment_quality",
    ],
  };

  const requiredFields = requiredFieldsByRole[role] || [];

  requiredFields.forEach((field) => {
    const value = payload[field];

    if (value === undefined || value === null || value === "") {
      errors.push(`Field ${field} tidak boleh kosong.`);
    } else if (isNaN(value)) {
      errors.push(`Field ${field} harus berupa angka.`);
    } else if (value < 1) {
      errors.push(`Skor ${field} minimal adalah 1.`);
    } else if (value > 5) {
      errors.push(`Skor ${field} maksimal adalah 5.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function createAnswersArrayFromAssessment(assessmentResult) {
  return Object.values(assessmentResult.answers)
    .map((answer) => convertAnswerToScore(answer))
    .filter((score) => score !== null && score > 0);
}

async function getPredictionFromAPI(assessmentResult) {
  console.log("Mengirim jawaban ke API prediksi backend:", assessmentResult);

  const answersArray = createAnswersArrayFromAssessment(assessmentResult);

  const result = await apiRequest("/api/predict", "POST", {
    answers: answersArray,
  });

  if (!result.success) {
    throw new Error(result.message || "Prediksi gagal diproses server.");
  }

  const prediction = result.prediction;

  return {
    status: "success",
    source: "backend-api",
    prediction: prediction.status_kesehatan,
    probability: prediction.total_score,
    recommendation: prediction.catatan,
    received_answers: answersArray,
    predicted_at: new Date().toISOString(),
  };
}

function getFactorGroupsByRole(role) {
  if (role === "owner") {
    return {
      INS: ["OH1", "OH2", "OH3", "OH4", "OH5", "OH6"],
      OV: ["OH26"],
      OPS: ["OH27", "OH28", "OH29", "OH30", "OH31"],
      ECT: ["OH32", "OH33", "OH34", "OH35"],
    };
  }

  return {
    LDI: ["OH7", "OH8", "OH9", "OH10", "OH11", "OH12"],
    WEQ: ["OH13", "OH14", "OH15", "OH16", "OH17"],
    OV: ["OH18", "OH19", "OH20", "OH21", "OH22", "OH23", "OH24", "OH25"],
  };
}

function convertAnswerToScore(answer) {
  if (!answer) return null;
  if (typeof answer === "number") return answer;

  const choiceMap = {
    Tidak: 1,
    "Sedang Proses": 3,
    Ya: 5,
    "Modal Sendiri": 4,
    "Keluarga/Teman": 3,
    "Pinjaman Bank": 4,
  };

  return choiceMap[answer] || null;
}

function calculateCategory(score) {
  if (score >= 4.1) return "Sangat Baik";
  if (score >= 3.1) return "Baik";
  if (score >= 2.1) return "Cukup";
  if (score > 0) return "Buruk";
  return "Belum Dinilai";
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, value) => sum + Number(value), 0) / arr.length;
}

renderStep();
