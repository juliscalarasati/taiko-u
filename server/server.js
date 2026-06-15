const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

let schemaReady = null;

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeSector(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return "Sektor belum tersedia";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function safeQuery(sql, params = []) {
  try {
    return await db.query(sql, params);
  } catch (error) {
    console.warn("Safe query warning:", error.message);
    return [[], []];
  }
}

async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await db.query("ALTER TABLE users ADD COLUMN umkm_id INT NULL");
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        console.warn("Skip add users.umkm_id:", error.message);
      }
    }

    try {
      await db.query("ALTER TABLE assessments ADD COLUMN user_name VARCHAR(150) NULL");
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        console.warn("Skip add assessments.user_name:", error.message);
      }
    }

    try {
      await db.query("ALTER TABLE assessments ADD COLUMN user_role VARCHAR(50) NULL");
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        console.warn("Skip add assessments.user_role:", error.message);
      }
    }
  })();

  return schemaReady;
}

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

async function findUmkmByName(connection, namaUmkm) {
  const [rows] = await connection.query(
    `SELECT *
     FROM umkm
     WHERE LOWER(TRIM(nama_umkm)) = LOWER(TRIM(?))
     ORDER BY id ASC
     LIMIT 1`,
    [namaUmkm]
  );

  return rows[0] || null;
}

async function findOrCreateUmkm(connection, payload) {
  const namaUmkm = String(payload.nama_umkm || "").trim();
  const kategori = normalizeSector(payload.kategori);
  const pemilik = payload.pemilik || null;
  const alamat = payload.alamat || null;
  const userId = payload.user_id || null;

  if (!namaUmkm) {
    throw new Error("Nama UMKM wajib diisi.");
  }

  const existingUmkm = await findUmkmByName(connection, namaUmkm);

  if (existingUmkm) {
    if (userId) {
      await connection.query("UPDATE users SET umkm_id = ? WHERE id = ?", [
        existingUmkm.id,
        userId,
      ]);
    }

    return {
      created: false,
      umkm: {
        id: existingUmkm.id,
        user_id: existingUmkm.user_id,
        nama_umkm: existingUmkm.nama_umkm,
        pemilik: existingUmkm.pemilik,
        kategori: existingUmkm.kategori,
        alamat: existingUmkm.alamat,
      },
    };
  }

  const [result] = await connection.query(
    `INSERT INTO umkm 
    (user_id, nama_umkm, pemilik, kategori, alamat)
    VALUES (?, ?, ?, ?, ?)`,
    [userId, namaUmkm, pemilik, kategori, alamat]
  );

  if (userId) {
    await connection.query("UPDATE users SET umkm_id = ? WHERE id = ?", [
      result.insertId,
      userId,
    ]);
  }

  return {
    created: true,
    umkm: {
      id: result.insertId,
      user_id: userId,
      nama_umkm: namaUmkm,
      pemilik,
      kategori,
      alamat,
    },
  };
}

async function getUserWithUmkm(user) {
  let umkm = null;

  if (user.umkm_id) {
    const [rows] = await db.query("SELECT * FROM umkm WHERE id = ? LIMIT 1", [
      user.umkm_id,
    ]);
    umkm = rows[0] || null;
  }

  if (!umkm) {
    const [rows] = await db.query(
      "SELECT * FROM umkm WHERE user_id = ? ORDER BY id ASC LIMIT 1",
      [user.id]
    );
    umkm = rows[0] || null;
  }

  if (umkm && !user.umkm_id) {
    await safeQuery("UPDATE users SET umkm_id = ? WHERE id = ?", [
      umkm.id,
      user.id,
    ]);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    umkm_id: umkm ? umkm.id : null,
    umkm: umkm
      ? {
          umkm_id: umkm.id,
          nama_umkm: umkm.nama_umkm,
          sektor: umkm.kategori || "Sektor belum tersedia",
          pemilik: umkm.pemilik || "-",
          alamat: umkm.alamat || "-",
        }
      : null,
  };
}

function dedupeUmkmRows(rows) {
  const map = new Map();

  rows.forEach((item) => {
    const key = normalizeText(item.nama_umkm);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        kategori: normalizeSector(item.kategori),
      });
      return;
    }

    const existing = map.get(key);

    map.set(key, {
      ...existing,
      pemilik: existing.pemilik || item.pemilik,
      kategori: existing.kategori || normalizeSector(item.kategori),
      alamat: existing.alamat || item.alamat,
      created_at: existing.created_at || item.created_at,
    });
  });

  return Array.from(map.values());
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server TAIKO berhasil jalan",
  });
});

app.get("/api/status", async (req, res) => {
  try {
    await ensureSchema();
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

app.post("/api/register", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await ensureSchema();

    const {
      name,
      email,
      password,
      role,
      nama_umkm,
      pemilik,
      kategori,
      alamat,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();
    const cleanRole = role === "employee" ? "employee" : "owner";

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    if (!nama_umkm) {
      return res.status(400).json({
        success: false,
        message: "Nama UMKM wajib diisi",
      });
    }

    await connection.beginTransaction();

    const [existingUser] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [cleanName, cleanEmail, cleanPassword, cleanRole]
    );

    const userId = userResult.insertId;

    const umkmResult = await findOrCreateUmkm(connection, {
      user_id: userId,
      nama_umkm,
      pemilik: cleanRole === "owner" ? cleanName : pemilik || null,
      kategori,
      alamat,
    });

    await connection.commit();

    const user = await getUserWithUmkm({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      umkm_id: umkmResult.umkm.id,
    });

    res.status(201).json({
      success: true,
      message: umkmResult.created
        ? "Registrasi berhasil. UMKM baru berhasil dibuat."
        : "Registrasi berhasil. Akun terhubung ke UMKM yang sudah ada.",
      user,
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Register gagal",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

app.post("/api/login", async (req, res) => {
  try {
    await ensureSchema();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const [users] = await db.query(
      `SELECT id, name, email, role, umkm_id
       FROM users
       WHERE email = ? AND password = ?
       LIMIT 1`,
      [String(email).trim().toLowerCase(), String(password).trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const user = await getUserWithUmkm(users[0]);

    res.json({
      success: true,
      message: "Login berhasil",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login gagal",
      error: error.message,
    });
  }
});

app.post("/api/umkm", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await ensureSchema();

    const { user_id, nama_umkm, pemilik, kategori, alamat } = req.body;

    if (!nama_umkm) {
      return res.status(400).json({
        success: false,
        message: "Nama UMKM wajib diisi",
      });
    }

    await connection.beginTransaction();

    const result = await findOrCreateUmkm(connection, {
      user_id,
      nama_umkm,
      pemilik,
      kategori,
      alamat,
    });

    await connection.commit();

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Data UMKM berhasil disimpan"
        : "UMKM sudah ada. Data user dihubungkan ke UMKM tersebut.",
      umkm_id: result.umkm.id,
      data: result.umkm,
      created: result.created,
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data UMKM",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

app.get("/api/umkm", async (req, res) => {
  try {
    await ensureSchema();

    const [rows] = await db.query("SELECT * FROM umkm ORDER BY created_at DESC");
    const uniqueRows = dedupeUmkmRows(rows);

    res.json({
      success: true,
      message: "Data UMKM berhasil diambil",
      data: uniqueRows,
      raw_total: rows.length,
      unique_total: uniqueRows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data UMKM",
      error: error.message,
    });
  }
});

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

app.post("/api/assessments", async (req, res) => {
  try {
    await ensureSchema();

    let { user_id, umkm_id, nama_umkm, answers, user_name, user_role } =
      req.body;

    if (!nama_umkm || !answers) {
      return res.status(400).json({
        success: false,
        message: "Nama UMKM dan jawaban kuesioner wajib diisi",
      });
    }

    if (!umkm_id && nama_umkm) {
      const [umkmRows] = await db.query(
        `SELECT id FROM umkm 
         WHERE LOWER(TRIM(nama_umkm)) = LOWER(TRIM(?))
         ORDER BY id ASC LIMIT 1`,
        [nama_umkm]
      );

      if (umkmRows.length) {
        umkm_id = umkmRows[0].id;
      }
    }

    if (user_id && (!user_name || !user_role)) {
      const [userRows] = await db.query(
        "SELECT name, role FROM users WHERE id = ? LIMIT 1",
        [user_id]
      );

      if (userRows.length) {
        user_name = user_name || userRows[0].name;
        user_role = user_role || userRows[0].role;
      }
    }

    const hasilPrediksi = hitungPrediksi(answers);

    const [result] = await db.query(
      `INSERT INTO assessments 
      (user_id, umkm_id, nama_umkm, total_score, status_kesehatan, catatan, answers, user_name, user_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        umkm_id || null,
        nama_umkm,
        hasilPrediksi.total_score,
        hasilPrediksi.status_kesehatan,
        hasilPrediksi.catatan,
        JSON.stringify(answers),
        user_name || null,
        user_role || null,
      ]
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

app.get("/api/assessments", async (req, res) => {
  try {
    await ensureSchema();

    const [rows] = await db.query(
      `SELECT 
        a.*,
        COALESCE(a.user_name, u.name, 'User') AS user_name,
        COALESCE(a.user_role, u.role, 'user') AS user_role,
        COALESCE(um.nama_umkm, a.nama_umkm) AS nama_umkm,
        um.kategori AS sektor
       FROM assessments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN umkm um ON a.umkm_id = um.id
       ORDER BY a.created_at DESC`
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

app.get("/api/dashboard", async (req, res) => {
  try {
    await ensureSchema();

    const [totalUsers] = await db.query("SELECT COUNT(*) AS total FROM users");
    const [umkmRows] = await db.query("SELECT * FROM umkm");
    const [totalAssessments] = await db.query(
      "SELECT COUNT(*) AS total FROM assessments"
    );

    const uniqueUmkm = dedupeUmkmRows(umkmRows);

    const [statusData] = await db.query(
      `SELECT status_kesehatan, COUNT(*) AS total
       FROM assessments
       GROUP BY status_kesehatan`
    );

    const [latestAssessments] = await db.query(
      `SELECT id, nama_umkm, total_score, status_kesehatan, catatan, created_at
       FROM assessments
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      message: "Data dashboard berhasil diambil",
      data: {
        total_users: totalUsers[0].total,
        total_umkm: uniqueUmkm.length,
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

app.post("/api/delete-my-umkm", async (req, res) => {
  const { user_id, umkm_id } = req.body;

  if (!user_id || !umkm_id) {
    return res.status(400).json({
      success: false,
      message: "User ID dan UMKM ID wajib dikirim.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();

    const [users] = await connection.query(
      "SELECT id, role, umkm_id FROM users WHERE id = ? LIMIT 1",
      [user_id]
    );

    if (!users.length) {
      connection.release();

      return res.status(404).json({
        success: false,
        message: "Akun tidak ditemukan.",
      });
    }

    const user = users[0];
    const role = String(user.role || "").toLowerCase();

    if (role !== "owner") {
      connection.release();

      return res.status(403).json({
        success: false,
        message: "Hanya Owner yang dapat menghapus akun dan data UMKM.",
      });
    }

    if (Number(user.umkm_id) !== Number(umkm_id)) {
      connection.release();

      return res.status(403).json({
        success: false,
        message: "Akun ini tidak terhubung dengan UMKM yang ingin dihapus.",
      });
    }

    await connection.beginTransaction();

    await connection.query("DELETE FROM assessments WHERE umkm_id = ?", [umkm_id]);
    await connection.query("DELETE FROM users WHERE umkm_id = ?", [umkm_id]);
    await connection.query("DELETE FROM umkm WHERE id = ?", [umkm_id]);

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: "Akun, data UMKM, dan hasil assessment berhasil dihapus.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch {}
    }

    console.error("Delete UMKM error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus data UMKM.",
      error: error.message,
    });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;