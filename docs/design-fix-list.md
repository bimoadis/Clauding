# DESIGN FIX LIST — claudingagent.tech

Berdasarkan review scroll (video, 13 Agu 2026). Diurutkan berdasarkan **dampak per jam kerja**. Nomor 1–4 mengubah 80% kesan situs.

---

## TIER 1 — kerjakan minggu ini

### 1. Buang background fantasy AI

Ini perubahan tunggal terbesar. Background pulau melayang / menara kristal / sunset adalah tell Midjourney dan satu-satunya alasan terbesar situs terasa tidak serius.

**Ganti dengan salah satu:**
- Warna solid dekat-putih (`#FAFAF9` / `#F8F7F5`) dengan noise grain halus 2–3%
- Gradient satu arah yang sangat lembut, maksimal 2 stop, tanpa objek
- Grid tipis atau dot pattern dengan opacity < 5%

**Yang hilang otomatis begitu background diganti:**
- [ ] Glassmorphism / backdrop-blur di kartu skill — tidak lagi diperlukan, dan kontras teks langsung naik
- [ ] Transparansi kartu di halaman compile — buat solid putih dengan border 1px
- [ ] Semua drop shadow besar yang dipakai untuk "mengangkat" konten dari background

Kalau ingin tetap ada visual, letakkan **satu** gambar di satu tempat saja, dan biarkan itu screenshot produk asli — bukan ilustrasi.

### 2. Tambahkan bukti, hapus deskripsi

Sekarang halaman ini menjelaskan produknya tanpa pernah menunjukkannya. Console di hero adalah gambar statis. Bagi developer, itu terbaca sebagai "belum ada".

Urutan prioritas bukti:

- [ ] **Output spec asli.** Ini produk Anda. Tampilkan JSON/YAML yang benar-benar dikeluarkan compiler dari satu prompt. Satu blok kode nyata lebih meyakinkan daripada seluruh hero sekarang.
  ```
  prompt: "monitor high-value spl swaps and alert me"
  ↓
  { name, systemPrompt, tools: [...], maxSteps, model }
  ```
- [ ] **Blok kode / curl.** Situs developer tool tanpa satu baris kode pun terasa seperti landing page afiliasi.
- [ ] **Link Docs di nav.** Absennya Docs adalah sinyal kepercayaan negatif yang paling murah untuk diperbaiki.
- [ ] Hero console harus jadi animasi DOM asli (lihat `devbrief-hero-skills.md`), bukan gambar.

### 3. Naikkan Solana safety tools ke homepage

Rugpull Scanner, LP Lock Inspector, Contract Ownership Verifier, DEX & Liquidity Tracker — ini konten terbaik yang Anda punya dan sekarang terkubur di bawah halaman compile.

Itu spesifik, langsung dipahami, dan memberi alasan konkret kenapa agent ini ada. "Launch any AI agent" tidak memberi alasan apa pun.

- [ ] Pindahkan 4 tool ini ke section kedua homepage, di atas pricing
- [ ] Ganti heading generik dengan yang menyebut hasil nyata, mis. "Your agent checks the contract before you buy."

### 4. Pindahkan tombol Pump.fun

Sekarang blok "LAUNCH OFFER + Buy on Pump.fun" adalah elemen dengan bobot visual tertinggi di section pricing — lebih menonjol dari produknya sendiri. Untuk audiens developer, itu langsung membaca sebagai token-first.

- [ ] Turunkan jadi teks link kecil di kartu Pro: "How $CLDG access works →"
- [ ] Pindahkan detail token ke halaman `/token` terpisah
- [ ] Hapus badge "LAUNCH OFFER" — bahasa urgensi menurunkan kredibilitas di kategori ini

---

## TIER 2 — minggu berikutnya

### 5. Hentikan template loop

Keempat section punya struktur identik: eyebrow oranye kapital → heading tebal + titik → subtitle → grid kartu. Itu pola yang paling cepat dikenali sebagai output generator.

- [ ] Hapus eyebrow label di minimal dua section
- [ ] Variasikan layout: satu section pakai layout dua kolom (teks kiri, visual kanan), satu pakai daftar vertikal, jangan semuanya grid kartu
- [ ] Variasikan kepadatan: section "How it works" sekarang punya ruang kosong raksasa setelah tiga kartu kecil. Rapatkan.

### 6. Hapus titik di akhir heading

Semua heading diakhiri titik: "One prompt." / "Access built for compilers." / "Everything you need to know." / "Ship agents without burning credits." Konsistensi ini adalah tic copy generator.

- [ ] Sisakan titik hanya di headline hero, hapus di semua heading section

### 7. Ganti ikon

- [ ] **Ikon roket untuk "Deploy & Run"** — ikon paling klise di industri. Ganti dengan sesuatu yang menggambarkan aksinya (terminal prompt, play, arrow-up-right)
- [ ] Ikon pensil dan person juga generik. Kalau tidak ada waktu bikin custom, pakai satu set konsisten (Lucide) tanpa kotak pastel di belakangnya
- [ ] Hapus kotak rounded pastel di belakang ikon — itu default template shadcn

### 8. Perbaiki spacing

- [ ] Jangan pakai satu nilai padding vertikal untuk semua section. Section padat (pricing, skills) butuh napas lebih sedikit daripada section transisi
- [ ] Kartu Free Trial punya jarak kosong besar sebelum tombol "Get Started" — samakan tinggi kedua kartu pricing atau biarkan tingginya berbeda secara natural, jangan setengah-setengah

### 9. Perbaiki copy yang kosong

Kalimat berikut tidak menyampaikan informasi apa pun dan terbaca sebagai isian:

| Sekarang | Masalah |
|---|---|
| "Ship agents without burning credits." | Credit apa? Kita tidak menjual credit |
| "Unlock autonomous agentic dev powered by $CLDG compilation loops." | Word salad. Tiga buzzword tanpa objek |
| "Access built for compilers." | Compiler adalah produknya, bukan penggunanya |
| "describe what you want and launch an agent powered by the best AI models" | "best AI models" adalah klaim kosong |

Aturan penggantinya: setiap kalimat harus menyebut **satu hal konkret yang agent lakukan.**

---

## TIER 3 — polish

- [ ] **Logo** — bentuk kucing/rubah oranye tidak terbaca di ukuran nav. Uji di 24px; kalau tidak terbaca, sederhanakan jadi mark geometris atau wordmark saja
- [ ] **Widget chat ungu di kanan bawah** — terlihat seperti tempelan pihak ketiga dan warnanya di luar palet. Samakan warnanya atau hapus
- [ ] **Nav terlalu tipis** — "How it works / Pricing / FAQ" saja. Tambah Docs, dan Changelog kalau ada
- [ ] **Type scale seragam** — semua teks hanya dua ukuran: heading besar tebal, body abu-abu kecil. Tambahkan tingkat menengah (subhead, label data, caption kode) supaya halaman punya tekstur
- [ ] **Hover state kartu skill tidak konsisten** — di frame terlihat beberapa kartu ter-highlight berbeda. Samakan
- [ ] **Footer** — "Ship agents without burning credits" diulang sebagai heading footer. Ganti atau hapus

---

## Prinsip yang mendasari semua ini

Situs developer tool tidak membangun kepercayaan lewat estetika. Kepercayaan datang dari **menunjukkan barangnya bekerja**: output nyata, kode nyata, dokumentasi, angka.

Setiap kali ada pilihan antara menambahkan dekorasi atau menambahkan bukti, pilih bukti. Halaman yang polos tapi menampilkan spec asli yang dikompilasi dari satu prompt akan terasa jauh lebih kredibel daripada halaman sekarang, dan lebih murah dibuat.

---

## Urutan eksekusi

| Hari | Kerjaan |
|---|---|
| 1 | Ganti background (item 1) — termasuk hapus glassmorphism dan transparansi kartu |
| 2 | Tambah blok output spec asli + link Docs di nav (item 2) |
| 3 | Naikkan safety tools ke homepage, turunkan blok Pump.fun (item 3, 4) |
| 4 | Rombak struktur section + hapus titik heading + ganti ikon (item 5, 6, 7) |
| 5 | Spacing, copy, polish (item 8, 9, Tier 3) |

Setelah hari 1 saja, minta pendapat 3 orang yang belum pernah melihat situs ini. Perubahan background biasanya sudah cukup untuk mengubah jawaban mereka.
