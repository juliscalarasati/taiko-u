# Dokumentasi Back End TAIKO & U

## 1. Deskripsi Back End

Back End pada website TAIKO & U berfungsi sebagai penghubung antara Front End, database, dan proses prediksi kesehatan organisasi UMKM.

Back End menerima data dari halaman website, memproses data tersebut, menyimpan data ke database MySQL, serta mengirimkan hasil kembali ke Front End dalam bentuk JSON.

Alur utama sistem:

```text
Front End
↓
API Back End
↓
Database MySQL
↓
Model Prediksi
↓
Response JSON ke Front End
```

---

## 2. Teknologi yang Digunakan

Back End menggunakan teknologi berikut:

- Node.js
- Express.js
- MySQL
- Laragon
- mysql2
- cors
- Chart.js pada sisi Front End untuk visualisasi data

---

## 3. Struktur Back End

Struktur folder server:

```text
server/
├── server.js
└── db.js
```

Penjelasan:

- `server.js` berisi konfigurasi server, endpoint API, dan fungsi prediksi.
- `db.js` berisi konfigurasi koneksi ke database MySQL Laragon.

---

## 4. Database

Database yang digunakan:

```text
taiko_db
```

Database dibuat melalui phpMyAdmin di Laragon.

Tabel yang digunakan:

```text
users
umkm
assessments
raw_dataset
```

### Tabel `users`

Tabel `users` digunakan untuk menyimpan data akun pengguna.

Kolom utama:

- `id`
- `name`
- `email`
- `password`
- `role`
- `created_at`

### Tabel `umkm`

Tabel `umkm` digunakan untuk menyimpan data UMKM.

Kolom utama:

- `id`
- `user_id`
- `nama_umkm`
- `pemilik`
- `kategori`
- `alamat`
- `created_at`

### Tabel `assessments`

Tabel `assessments` digunakan untuk menyimpan hasil kuesioner dan hasil prediksi.

Kolom utama:

- `id`
- `user_id`
- `umkm_id`
- `nama_umkm`
- `total_score`
- `status_kesehatan`
- `catatan`
- `answers`
- `created_at`

### Tabel `raw_dataset`

Tabel `raw_dataset` digunakan sebagai data pembanding untuk visualisasi statistik dan boxplot.

Kolom penting:

- `OV`
- `LDI`
- `INS`
- `OPS`
- `WEQ`
- `ECT`

Faktor tersebut digunakan untuk menampilkan visualisasi boxplot berdasarkan data 428 UMKM.

---

## 5. Endpoint API

### Cek Server dan Database

```http
GET /api/status
```

Fungsi:

Mengecek apakah server dan database berhasil terhubung.

Contoh response berhasil:

```json
{
  "success": true,
  "message": "API dan database MySQL berhasil terhubung",
  "database_time": "2026-05-30T..."
}
```

---

### Register

```http
POST /api/register
```

Fungsi:

Mendaftarkan akun pengguna baru ke tabel `users`.

Contoh body request:

```json
{
  "name": "Nama User",
  "email": "user@email.com",
  "password": "123456",
  "role": "owner"
}
```

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Register berhasil"
}
```

---

### Login

```http
POST /api/login
```

Fungsi:

Mengecek email dan password pengguna dari database.

Contoh body request:

```json
{
  "email": "user@email.com",
  "password": "123456"
}
```

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Login berhasil",
  "user": {
    "id": 1,
    "name": "Nama User",
    "email": "user@email.com",
    "role": "owner"
  }
}
```

---

### Tambah Data UMKM

```http
POST /api/umkm
```

Fungsi:

Menyimpan data UMKM ke tabel `umkm`.

Contoh body request:

```json
{
  "user_id": 1,
  "nama_umkm": "Teh Jago",
  "pemilik": "Julisca",
  "kategori": "Kuliner",
  "alamat": ""
}
```

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Data UMKM berhasil disimpan",
  "umkm_id": 2
}
```

---

### Ambil Data UMKM

```http
GET /api/umkm
```

Fungsi:

Mengambil seluruh data UMKM dari database.

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Data UMKM berhasil diambil",
  "data": []
}
```

---

### Prediksi Kesehatan UMKM

```http
POST /api/predict
```

Fungsi:

Menghitung skor dan status kesehatan UMKM berdasarkan jawaban kuesioner.

Contoh body request:

```json
{
  "answers": [3, 5, 5, 3, 4, 4, 4, 4, 5, 4]
}
```

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Prediksi berhasil dihitung",
  "prediction": {
    "total_score": 84,
    "status_kesehatan": "Sehat",
    "catatan": "UMKM berada dalam kondisi organisasi yang baik."
  }
}
```

---

### Simpan Assessment

```http
POST /api/assessments
```

Fungsi:

Menyimpan hasil kuesioner dan hasil prediksi ke tabel `assessments`.

Contoh body request:

```json
{
  "user_id": 2,
  "umkm_id": 2,
  "nama_umkm": "Teh Jago",
  "answers": [3, 5, 5, 3, 4, 4, 4, 4, 5, 4]
}
```

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Assessment berhasil disimpan",
  "assessment_id": 2,
  "prediction": {
    "total_score": 84,
    "status_kesehatan": "Sehat",
    "catatan": "UMKM berada dalam kondisi organisasi yang baik."
  }
}
```

---

### Ambil Data Assessment

```http
GET /api/assessments
```

Fungsi:

Mengambil seluruh data hasil assessment dari database.

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Data assessment berhasil diambil",
  "data": []
}
```

---

### Dashboard

```http
GET /api/dashboard
```

Fungsi:

Mengambil data ringkasan dashboard, seperti total user, total UMKM, total assessment, status kesehatan, dan assessment terbaru.

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Data dashboard berhasil diambil",
  "data": {
    "total_users": 2,
    "total_umkm": 2,
    "total_assessments": 1,
    "status_summary": [],
    "latest_assessments": []
  }
}
```

---

### Raw Dataset

```http
GET /api/raw-dataset
```

Fungsi:

Mengambil seluruh data mentah dari tabel `raw_dataset`.

Data ini digunakan sebagai data pembanding untuk visualisasi statistik dan boxplot.

---

### Boxplot

```http
GET /api/boxplot
```

Fungsi:

Mengambil data faktor dari tabel `raw_dataset` untuk visualisasi boxplot.

Faktor yang digunakan:

- `OV`
- `LDI`
- `INS`
- `OPS`
- `WEQ`
- `ECT`

Contoh response berhasil:

```json
{
  "success": true,
  "message": "Data boxplot berhasil diambil",
  "total_data": 428,
  "factors": {
    "OV": [],
    "LDI": [],
    "INS": [],
    "OPS": [],
    "WEQ": [],
    "ECT": []
  }
}
```

---

## 6. Model Prediksi

Model prediksi pada Back End menggunakan pendekatan rule-based sederhana.

Jawaban kuesioner dikonversi menjadi skor angka, kemudian dihitung menjadi persentase.

Aturan prediksi:

```text
Skor >= 80  → Sehat
Skor >= 60  → Cukup Sehat
Skor < 60   → Perlu Perbaikan
```

Contoh fungsi prediksi:

```js
function hitungPrediksi(answers) {
  let totalScore = 0;

  answers.forEach((answer) => {
    totalScore += Number(answer) || 0;
  });

  const maxScore = answers.length * 5;
  const percentage = Math.round((totalScore / maxScore) * 100);

  if (percentage >= 80) {
    return "Sehat";
  } else if (percentage >= 60) {
    return "Cukup Sehat";
  } else {
    return "Perlu Perbaikan";
  }
}
```

---

## 7. Alur Komunikasi Front End dan Back End

### Register

```text
User mengisi form register
↓
Front End mengirim data ke POST /api/register
↓
Back End menyimpan data ke tabel users
↓
Front End mengirim data UMKM ke POST /api/umkm
↓
Database menyimpan data UMKM
```

### Login

```text
User memasukkan email dan password
↓
Front End mengirim data ke POST /api/login
↓
Back End mengecek data user di database
↓
Jika berhasil, data user disimpan sementara di localStorage
↓
User diarahkan ke dashboard
```

### Kuesioner

```text
User mengisi kuesioner
↓
Front End mengubah jawaban menjadi skor
↓
Front End mengirim jawaban ke POST /api/predict
↓
Back End menghitung hasil prediksi
↓
Front End mengirim data ke POST /api/assessments
↓
Back End menyimpan hasil ke tabel assessments
```

### Dashboard dan Boxplot

```text
Front End membuka halaman dashboard
↓
Front End memanggil GET /api/dashboard
↓
Front End memanggil GET /api/boxplot
↓
Back End mengambil data dari MySQL
↓
Front End menampilkan visualisasi data
```

### Detail Analisis dan Rekomendasi

```text
User membuka halaman detail analisis atau saran rekomendasi
↓
Front End memanggil GET /api/assessments
↓
Back End mengambil data assessment dari database
↓
Front End mengolah skor faktor
↓
Front End menampilkan hasil analisis dan rekomendasi
```

---

## 8. Cara Menjalankan Project

Pastikan Laragon sudah aktif.

Langkah menjalankan project:

1. Buka Laragon.
2. Klik `Start All`.
3. Pastikan MySQL aktif.
4. Buka terminal di folder project.
5. Jalankan server:

```bash
node server/server.js
```

6. Buka website melalui browser:

```text
http://localhost:3000/landing_page/landing.html
```

---

## 9. Cara Testing API

Endpoint yang dapat diuji melalui browser:

```text
http://localhost:3000/api/status
http://localhost:3000/api/dashboard
http://localhost:3000/api/boxplot
http://localhost:3000/api/assessments
http://localhost:3000/api/umkm
```

Testing akhir yang dilakukan:

- Server berhasil berjalan di `localhost:3000`
- Database MySQL berhasil terhubung
- Register berhasil menyimpan data user
- Login berhasil membaca data user
- Data UMKM berhasil disimpan
- Kuesioner berhasil disimpan ke tabel `assessments`
- Model prediksi berhasil mengembalikan status kesehatan UMKM
- Dashboard berhasil mengambil data dari API
- Boxplot berhasil membaca data dari tabel `raw_dataset`
- Detail analisis berhasil menampilkan data dari database
- Saran rekomendasi berhasil menampilkan hasil berdasarkan data assessment

---

## 10. Hubungan dengan Tugas Back End

### Manajemen Komunikasi API

Back End menyediakan endpoint API yang digunakan oleh Front End untuk melakukan register, login, menyimpan data UMKM, menyimpan hasil kuesioner, mengambil data dashboard, dan mengambil data boxplot.

Endpoint API tersebut memastikan alur data masuk dan keluar dari Front End dapat berjalan dengan lancar.

### Eksekusi Model Prediksi

Back End memiliki fungsi prediksi yang menghitung skor dari jawaban kuesioner. Hasil prediksi berupa skor dan status kesehatan organisasi UMKM.

Status kesehatan yang digunakan adalah:

```text
Sehat
Cukup Sehat
Perlu Perbaikan
```

### Testing Akhir API dan Server

Testing dilakukan dengan menjalankan server lokal menggunakan Node.js dan Laragon. Pengujian dilakukan pada endpoint API, koneksi database, proses register, login, pengisian kuesioner, penyimpanan assessment, dashboard, boxplot, detail analisis, dan saran rekomendasi.

---

## 11. Kesimpulan

Back End pada sistem TAIKO & U telah berhasil menjalankan fungsi utama, yaitu menghubungkan Front End dengan database MySQL, menyediakan endpoint API, menjalankan model prediksi sederhana, menyimpan hasil kuesioner, serta menyediakan data visualisasi untuk dashboard dan boxplot.

Sistem telah diuji secara lokal menggunakan Laragon dan Node.js. Seluruh alur utama dari register, login, pengisian kuesioner, prediksi, penyimpanan database, hingga visualisasi data telah berjalan dengan baik.
