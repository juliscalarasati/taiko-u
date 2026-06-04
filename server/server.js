const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Fungsi model prediksi sederhana
function hitungPrediksi(answers) {
  let totalScore = 0;

  if (!Array.isArray(answers)) {
    return {
      total_score: 0,
      status_kesehatan: "Data Tidak Valid",
      catatan: "Jawaban kuesioner harus berbentuk array.",
    };
  }

  answers.forEach((answer) => {
    totalScore += Number(answer) || 0;
  });

  const maxScore = answers.length * 5;
  const percentage =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let statusKesehatan = "";
  let catatan = "";

  if (percentage >= 80) {
    statusKesehatan = "Sehat";
    catatan = "UMKM berada dalam kondisi organisasi yang baik.";
  } else if (percentage >= 60) {
    statusKesehatan = "Cukup Sehat";
    catatan =
      "UMKM cukup baik, namun masih ada beberapa aspek yang perlu ditingkatkan.";
  } else {
    statusKesehatan = "Perlu Perbaikan";
    catatan = "UMKM membutuhkan perhatian dan perbaikan pada aspek organisasi.";
  }

  return {
    total_score: percentage,
    status_kesehatan: statusKesehatan,
    catatan,
  };
}

// Cek server
app.get("/", (req, res) => {
  res.json({
    message: "Server TAIKO berhasil jalan",
  });
});

// Cek koneksi API dan database
app.get("/api/status", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS waktu_database");

    res.json({
      success: true,
      message: "API dan database MySQL berhasil terhubung",
      database_time: rows[0].waktu_database,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal terhubung ke database",
      error: error.message,
    });
  }
});

// Register user
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role || "user"],
    );

    res.status(201).json({
      success: true,
      message: "Register berhasil",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Register gagal",
      error: error.message,
    });
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const [users] = await db.query(
      "SELECT id, name, email, role FROM users WHERE email = ? AND password = ?",
      [email, password],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    res.json({
      success: true,
      message: "Login berhasil",
      user: users[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login gagal",
      error: error.message,
    });
  }
});

// Tambah data UMKM
app.post("/api/umkm", async (req, res) => {
  try {
    const { user_id, nama_umkm, pemilik, kategori, alamat } = req.body;

    if (!nama_umkm) {
      return res.status(400).json({
        success: false,
        message: "Nama UMKM wajib diisi",
      });
    }

    const [result] = await db.query(
      `INSERT INTO umkm 
      (user_id, nama_umkm, pemilik, kategori, alamat)
      VALUES (?, ?, ?, ?, ?)`,
      [
        user_id || null,
        nama_umkm,
        pemilik || null,
        kategori || null,
        alamat || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Data UMKM berhasil disimpan",
      umkm_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data UMKM",
      error: error.message,
    });
  }
});

// Ambil semua data UMKM
app.get("/api/umkm", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM umkm ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      message: "Data UMKM berhasil diambil",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data UMKM",
      error: error.message,
    });
  }
});

// Prediksi saja tanpa menyimpan ke database
app.post("/api/predict", async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: "Jawaban kuesioner wajib diisi",
      });
    }

    const prediction = hitungPrediksi(answers);

    res.json({
      success: true,
      message: "Prediksi berhasil dihitung",
      prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Prediksi gagal",
      error: error.message,
    });
  }
});

// Simpan hasil assessment/kuesioner + hasil prediksi
app.post("/api/assessments", async (req, res) => {
  try {
    const { user_id, umkm_id, nama_umkm, answers } = req.body;

    if (!nama_umkm || !answers) {
      return res.status(400).json({
        success: false,
        message: "Nama UMKM dan jawaban kuesioner wajib diisi",
      });
    }

    const hasilPrediksi = hitungPrediksi(answers);

    const [result] = await db.query(
      `INSERT INTO assessments 
      (user_id, umkm_id, nama_umkm, total_score, status_kesehatan, catatan, answers)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        umkm_id || null,
        nama_umkm,
        hasilPrediksi.total_score,
        hasilPrediksi.status_kesehatan,
        hasilPrediksi.catatan,
        JSON.stringify(answers),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Assessment berhasil disimpan",
      assessment_id: result.insertId,
      prediction: hasilPrediksi,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan assessment",
      error: error.message,
    });
  }
});

// Ambil semua hasil assessment
app.get("/api/assessments", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM assessments ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      message: "Data assessment berhasil diambil",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data assessment",
      error: error.message,
    });
  }
});

// Data ringkas untuk dashboard
app.get("/api/dashboard", async (req, res) => {
  try {
    const [totalUsers] = await db.query("SELECT COUNT(*) AS total FROM users");
    const [totalUmkm] = await db.query("SELECT COUNT(*) AS total FROM umkm");
    const [totalAssessments] = await db.query(
      "SELECT COUNT(*) AS total FROM assessments",
    );

    const [statusData] = await db.query(
      `SELECT status_kesehatan, COUNT(*) AS total
       FROM assessments
       GROUP BY status_kesehatan`,
    );

    const [latestAssessments] = await db.query(
      `SELECT id, nama_umkm, total_score, status_kesehatan, catatan, created_at
       FROM assessments
       ORDER BY created_at DESC
       LIMIT 5`,
    );

    res.json({
      success: true,
      message: "Data dashboard berhasil diambil",
      data: {
        total_users: totalUsers[0].total,
        total_umkm: totalUmkm[0].total,
        total_assessments: totalAssessments[0].total,
        status_summary: statusData,
        latest_assessments: latestAssessments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard",
      error: error.message,
    });
  }
});

// Ambil data mentah untuk visualisasi faktor
app.get("/api/raw-dataset", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM raw_dataset");

    res.json({
      success: true,
      message: "Raw dataset berhasil diambil",
      total_data: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil raw dataset",
      error: error.message,
    });
  }
});

// Ambil data faktor untuk boxplot
app.get("/api/boxplot", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        OV,
        LDI,
        INS,
        OPS,
        WEQ,
        ECT
      FROM raw_dataset
    `);

    const factors = {
      OV: [],
      LDI: [],
      INS: [],
      OPS: [],
      WEQ: [],
      ECT: [],
    };

    rows.forEach((row) => {
      factors.OV.push(Number(row.OV));
      factors.LDI.push(Number(row.LDI));
      factors.INS.push(Number(row.INS));
      factors.OPS.push(Number(row.OPS));
      factors.WEQ.push(Number(row.WEQ));
      factors.ECT.push(Number(row.ECT));
    });

    res.json({
      success: true,
      message: "Data boxplot berhasil diambil",
      total_data: rows.length,
      factors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data boxplot",
      error: error.message,
    });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
