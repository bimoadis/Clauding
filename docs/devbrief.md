# DEV BRIEF — CLAUDING

**Tanggal:** 9 Agustus 2026
**Repo:** `github.com/bimoadis/CLAUDING` → akan di-rename ke `CLAUDING`
**Live:** `clauding-frontend.vercel.app` → akan pindah domain
**Stack:** pnpm monorepo · NestJS + Temporal + Drizzle + PostgreSQL/pgvector · Next.js 14 · Solana Wallet Adapter

---

## 0. Konteks & cara membaca brief ini

Brief ini disusun dari review README + landing page produksi. **Source code backend belum diaudit langsung**, jadi sebagian item ditulis sebagai *"verifikasi dulu, lalu perbaiki"*. Lihat bagian akhir — ada empat pertanyaan yang harus dijawab sebelum mulai coding, karena jawabannya menentukan apakah timeline di sini realistis atau perlu dipercepat.

Prioritas ditentukan oleh satu prinsip: **apa yang bisa membuat kita rugi uang, kena masalah hukum, atau kehilangan kepercayaan user secara permanen** dikerjakan lebih dulu daripada fitur.

| Prioritas | Tema | Target |
|---|---|---|
| **P0** | Security & pengendalian biaya | Wajib selesai sebelum promosi publik apa pun |
| **P1** | Klaim produk vs realita | Sprint yang sama dengan P0 |
| **P2** | Rename CLAUDING → CLAUDING | Sudah diputuskan, siap dieksekusi |
| **P3** | Arsitektur, deploy, DX | Berkelanjutan |

---

## P0 — BLOCKER

### P0-1 · Verifikasi & perbaiki autentikasi wallet Solana

**Risiko:** Jika backend menerima `publicKey` mentah dari client sebagai identitas, siapa pun bisa membaca dan menghapus thread chat wallet lain hanya dengan mengganti satu string di request body. Ini kebocoran data total.

**Langkah:**

1. Audit semua endpoint di `backend/src/agents` dan `backend/src/chat`. Cari setiap tempat yang mengambil `wallet` / `publicKey` / `address` dari `@Body()`, `@Query()`, atau header tanpa verifikasi.
2. Jika ditemukan, implementasikan flow challenge–response:

```
POST /auth/nonce   { publicKey }                      → { nonce, expiresAt }
POST /auth/verify  { publicKey, nonce, signature }    → { accessToken, refreshToken }
```

Simpan nonce di DB atau Redis dengan TTL 5 menit.

3. Verifikasi signature di server:

```ts
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const ok = nacl.sign.detached.verify(
  new TextEncoder().encode(message),   // message wajib memuat nonce + domain + timestamp
  bs58.decode(signature),
  bs58.decode(publicKey),
);
```

4. Terbitkan JWT berisi `sub = publicKey`. Semua endpoint agent/chat pakai `AuthGuard`, dan **ambil wallet dari `req.user.sub`, tidak pernah dari payload request.**
5. Nonce sekali pakai — hapus setelah dipakai untuk mencegah replay attack.

**Acceptance criteria**
- [ ] Tidak ada satu pun endpoint yang mempercayai identitas wallet dari body/query
- [ ] Ada test otomatis: JWT wallet A mencoba akses thread wallet B → **403**
- [ ] Nonce kedaluwarsa dan tidak bisa dipakai ulang

---

### P0-2 · Verifikasi isolasi Python Sandbox

**Risiko:** README menyebut *"safe code execution on the backend sandbox"*. Jika implementasinya `exec()` atau `child_process` di dalam proses NestJS, itu **Remote Code Execution terbuka**. Penyerang bisa membaca `.env` (OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL) dan mengambil alih server.

**Langkah:**

1. Buka `backend/src/temporal` dan telusuri implementasi tool Python. Lapor: eksekusi terjadi in-process atau di container terpisah?
2. Jika in-process — **matikan tool ini sekarang** sampai perbaikan selesai.
3. Target arsitektur: container ephemeral terpisah dengan batasan berikut.

| Kontrol | Nilai |
|---|---|
| Runtime | Container terpisah (Docker / gVisor / Firecracker), bukan proses NestJS |
| Network | `--network=none` |
| Filesystem | read-only + `tmpfs` kecil untuk `/tmp` |
| User | non-root, `--cap-drop=ALL`, `--security-opt=no-new-privileges` |
| Memory | `--memory=256m` |
| CPU | `--cpus=0.5` |
| Wall-clock timeout | 10 detik, kill paksa |
| Env vars | **kosong** — tidak ada satu pun secret yang masuk container |

4. Whitelist package Python. Jangan izinkan `pip install` saat runtime.

**Acceptance criteria**
- [ ] Kode yang mencoba `os.environ`, akses internet, atau menulis di luar `/tmp` gagal
- [ ] Infinite loop di-kill dalam ≤10 detik tanpa mengganggu proses lain
- [ ] Tidak ada secret yang bisa dibaca dari dalam sandbox

---

### P0-3 · Rate limiting & cost cap

**Risiko:** Endpoint LLM tanpa batas = tagihan tak terbatas. Satu script sederhana bisa menghabiskan budget dalam hitungan jam.

**Langkah:**

1. Pasang `@nestjs/throttler` — batas **per JWT (wallet)**, bukan per IP. IP mudah dirotasi.
2. Batas awal (kalibrasi ulang setelah ada data):
   - Free: 20 pesan/jam, 100/hari, max **5** iterasi ReAct per run
   - Pro: 300/hari, max **15** iterasi ReAct per run
3. **Hard cap iterasi ReAct loop.** Loop yang terus memanggil tool tanpa batas adalah sumber kebocoran biaya terbesar di arsitektur agent. Wajib ada `maxSteps` dan `maxTokensPerRun`.
4. Catat biaya per run ke DB — tabel `usage_logs`:
   `run_id, wallet, model, input_tokens, output_tokens, estimated_cost_usd, created_at`
   Tanpa ini kita buta terhadap unit economics, dan angka di landing page tidak akan pernah bisa dibuktikan.
5. Pasang budget alert di dashboard OpenAI dan Anthropic (alert di 50% dan 80% budget bulanan).

**Acceptance criteria**
- [ ] Request ke-21 dalam satu jam dari wallet free → **429**
- [ ] Tabel `usage_logs` terisi setiap run
- [ ] Budget alert aktif di kedua provider

---

### P0-4 · Higiene secret

- [ ] Konfirmasi `.env` ada di `.gitignore` dan tidak pernah ter-commit:
      `git log --all --full-history -- "**/.env"`
      Jika pernah masuk — **rotate semua key sekarang juga.** Menghapus file tidak cukup, key sudah bocor.
- [ ] Konfirmasi tidak ada key LLM di bundle frontend. Semua panggilan model lewat backend:
      `grep -rn "sk-\|sk-ant-" frontend/`
- [ ] Buat `backend/.env.example` dan `frontend/.env.example` berisi nama variabel tanpa nilai

---

## P1 — KREDIBILITAS PRODUK

Bukan soal kode, tapi soal selisih antara apa yang dijanjikan landing page dan apa yang benar-benar berjalan. Selisih ini yang paling cepat menghancurkan kepercayaan — terutama karena target user kita adalah developer, yang akan langsung mengecek.

### P1-1 · Perbaiki section "Benchmarks"

Section saat ini menampilkan *"Proven engineering metrics"* dengan klaim:
- Compile agent **instant** vs Traditional Dev **72 jam** vs Visual Builder **48 jam**
- Biaya 1.000 runs: kita **$0.00** vs SaaS **$150** vs No-Code **$220**

**Masalah:** tidak ada metodologi di balik angka-angka ini, dan **$0.00 secara faktual tidak mungkin** — setiap run memanggil API berbayar. Klaim "proven" tanpa data adalah risiko iklan menyesatkan.

**Aksi — pilih satu:**
- **A (disarankan):** Hapus section. Ganti dengan metrik nyata setelah `usage_logs` (P0-3) aktif — median waktu prompt→agent live, dan biaya rata-rata per run.
- **B:** Pertahankan tapi hapus kata "proven", ganti $0.00 dengan biaya aktual, tambahkan catatan metodologi.

### P1-2 · Sinkronkan landing page dengan kapabilitas nyata

| Klaim di landing | Status | Aksi |
|---|---|---|
| "Claude, GPT, Gemini, Grok, Llama" | README hanya menyebut adapter OpenAI & Anthropic | Implementasikan atau hapus provider yang belum ada |
| "Is my agent always online? **Yes**" | Belum jelas ada worker persisten | Implementasikan (P3-1) atau ubah jadi klaim akurat |
| "Top up once with crypto, spend across every model" | Belum ada bukti billing engine | Hapus sampai benar-benar ada |
| "charges in micro-USD" | Perlu verifikasi | Sama |
| Model "Claude 3.5" | Usang per Agustus 2026 | Perbarui ke model yang benar-benar dipanggil |

**Aturan main ke depan: landing page tidak boleh menyebut fitur yang belum ada di `main`.** Kalau ingin menampilkan roadmap, beri label "Coming soon" secara eksplisit.

### P1-3 · Halaman legal

Link **Privacy Policy** dan **EULA** mengarah ke `#` (kosong), padahal kita menyimpan wallet address dan riwayat chat user.

- [ ] Privacy Policy: data apa yang disimpan (wallet address, isi thread, usage log), berapa lama, dikirim ke pihak ketiga mana (OpenAI, Anthropic), cara request penghapusan
- [ ] Terms of Service / EULA
- [ ] Endpoint penghapusan akun + data (`DELETE /me`)

### P1-4 · Batasan copy setelah rebranding

Nama produk berubah jadi CLAUDING. Ini keputusan owner dan sudah final — developer tidak perlu membahas ulang. Tapi ada satu batasan teknis yang wajib dipatuhi di semua copy:

**Jangan pernah menulis atau menyiratkan bahwa produk ini afiliasi, partner, endorsed, atau official dari Anthropic.** Nama yang mirip sudah menimbulkan ambiguitas; copy yang menegaskan afiliasi adalah hal yang mengubahnya jadi masalah nyata.

- [ ] Tidak ada frasa seperti "official", "partnered with", "in collaboration with", "backed by" yang mengarah ke Anthropic
- [ ] Jangan pakai logo, warna brand, atau aset visual Anthropic
- [ ] Menyebut model yang dipakai itu boleh dan akurat — tulis apa adanya, mis. "runs on Anthropic and OpenAI models", bukan "an Anthropic product"
- [ ] Tambahkan disclaimer di footer: produk independen, tidak berafiliasi dengan Anthropic atau OpenAI

### P1-5 · Catatan compliance untuk owner

Bukan tugas developer, tapi harus diputuskan sebelum promosi:

- Skema "hold 50.000 token untuk akses" bisa dianggap penawaran investasi di banyak yurisdiksi. Konsultasikan ke penasihat hukum.
- Cek terms komersial OpenAI & Anthropic soal menyediakan akses model ke pihak ketiga.
- Tanpa P1-3, listing dan pembayaran berisiko diblokir.

---

## P2 — RENAME CLAUDING → CLAUDING

**Status: diputuskan, siap dieksekusi.** Gunakan `rename-to-clauding.sh` — script punya dry-run default dan menolak jalan di branch `main` atau di working tree kotor.

```bash
chmod +x rename-to-clauding.sh
git checkout -b chore/rename-clauding
./rename-to-clauding.sh            # dry run, lihat file mana yang kena
./rename-to-clauding.sh --apply    # eksekusi
```

Script mengurus semua file teks (tiga varian case: `CLAUDING` / `Clauding` / `clauding`) dan regenerate lockfile. Sisanya manual:

### Aset biner
- [ ] `frontend/public/logo.png`
- [ ] `favicon.ico`
- [ ] OG image / social preview
- [ ] Verifikasi hasil di `frontend/public/icons/*.svg` — SVG adalah teks, jadi sudah tersentuh script

### Database — jangan rename in-place di produksi
```bash
createdb clauding
pg_dump clauding | psql clauding
psql clauding -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```
- [ ] Update `DATABASE_URL` di `backend/.env` dan di host produksi
- [ ] Deploy → verifikasi end-to-end → **baru** drop DB lama (tunggu 30 hari)

### Infrastruktur
- [ ] Rename repo GitHub, lalu `git remote set-url origin <url-baru>`
- [ ] Rename project Vercel + domain baru
- [ ] Update `NEXT_PUBLIC_API_URL` di env Vercel
- [ ] **Update CORS allowlist di backend.** Ini item yang paling sering terlewat — begitu domain frontend berubah, backend menolak semua request dan gejalanya terlihat seperti bug auth padahal bukan.
- [ ] Update nama service + env di host backend

### Token — keputusan owner, blocking untuk deploy
Script mengubah string `$CLAUDING` → `$CLAUDING` di landing page. **Token on-chain tidak ikut berubah** — nama dan ticker Pump.fun bersifat permanen setelah launch.

Artinya landing page akan menyuruh user membeli `$CLAUDING` sementara token yang benar-benar ada adalah `$CLAUDING`. Selain tidak berfungsi, ini membuka celah: orang lain bisa membuat token `$CLAUDING` palsu dan user kita yang tertipu.

Pilih satu **sebelum** deploy:
- [ ] **(a)** Revert string ticker ke `$CLAUDING`, jelaskan di UI bahwa nama produk berubah tapi ticker tetap
- [ ] **(b)** Launch token baru + tulis pengumuman migrasi yang jelas

Jangan deploy dengan mismatch dibiarkan.

### Verifikasi akhir
- [ ] `pnpm build:backend` hijau
- [ ] `pnpm build:frontend` hijau
- [ ] Staging: connect wallet → create agent → kirim pesan → berhasil
- [ ] Satu PR, satu review, jangan dicicil

---

## P3 — ARSITEKTUR & DX

### P3-1 · Manfaatkan Temporal secara serius

**Prioritas tertinggi di P3.** Ini pembeda terkuat kita — builder no-code tidak bisa menandingi agentic loop yang benar-benar durable. Saat ini folder `temporal/` hanya berisi tool catalog dan trigger, yang belum memanfaatkan Temporal sama sekali.

**Target:** setiap agent run = Temporal Workflow, setiap pemanggilan tool = Activity.

Yang kita dapat: run bisa resume setelah backend restart atau deploy, retry otomatis per tool dengan backoff, agent yang berjalan berjam-jam tanpa memblokir request HTTP, dan riwayat eksekusi yang bisa di-replay untuk debugging.

Ini juga yang membuat klaim *"agent always online"* di P1-2 jadi benar, bukan sekadar janji.

### P3-2 · Putuskan nasib pgvector

pgvector ada di schema tapi fungsinya tidak terdokumentasi. Dua pilihan, jangan digantung:
- **Pakai** untuk memory jangka panjang per agent atau retrieval dokumen — tulis desainnya dulu
- **Hapus** untuk mengurangi kompleksitas infra dan dependency deployment

### P3-3 · Deploy & dokumentasi backend

README hanya membahas setup lokal. Frontend di Vercel, backend tidak disebut di mana.

- [ ] **Konfirmasi backend produksi live dan dashboard benar-benar bisa connect. Jika belum, demo publik saat ini rusak — item ini naik jadi P0.**
- [ ] Dokumentasikan host backend (Railway / Fly.io / Render), cara deploy, cara rollback
- [ ] Section environment variables lengkap di README, termasuk `NEXT_PUBLIC_API_URL` yang saat ini tidak terdokumentasi sama sekali
- [ ] CORS allowlist eksplisit, bukan `*`
- [ ] Health check `GET /health`

### P3-4 · Kualitas & CI

- [ ] GitHub Actions: lint + typecheck + build di setiap PR
- [ ] Test untuk jalur kritis: auth guard, batas iterasi ReAct, isolasi sandbox
- [ ] Error tracking (Sentry) di backend dan frontend
- [ ] Structured logging dengan `run_id` supaya satu agent run bisa ditelusuri utuh

### P3-5 · Housekeeping

- [ ] Tambahkan file `LICENSE`. README bilang "developed and maintained privately" tapi repo publik — tanpa file lisensi, statusnya ambigu bagi orang luar
- [ ] Diagram arsitektur di `docs/`: prompt → spec compiler → ReAct loop → tool → response
- [ ] Dokumentasi API (OpenAPI/Swagger dari NestJS)

---

## Definition of Done — sprint ini

Sebelum promosi publik berikutnya, semua ini harus hijau:

1. Wallet A tidak bisa mengakses data wallet B (test otomatis lulus)
2. Python sandbox terisolasi — tanpa network, tanpa akses secret
3. Rate limit + hard cap iterasi ReAct aktif; `usage_logs` terisi
4. Tidak ada secret di git history maupun bundle frontend
5. Landing page tidak memuat satu pun klaim yang belum terimplementasi
6. Privacy Policy dan EULA live, tidak lagi `#`
7. Tidak ada copy yang menyiratkan afiliasi dengan Anthropic; disclaimer footer terpasang
8. Ticker token konsisten antara landing page dan token yang benar-benar ada
9. Backend produksi live, dashboard berfungsi end-to-end

---

## Urutan kerja yang disarankan

| Minggu | Fokus |
|---|---|
| **1** | P0-1 audit + fix auth · P0-4 audit secret · P0-2 audit sandbox (matikan tool jika berbahaya) |
| **2** | P0-2 containerization · P0-3 rate limit + usage logging |
| **3** | P1-1 s/d P1-4 (landing page + legal + copy) · P3-3 deploy backend |
| **4** | P2 rename + cutover domain |
| **5+** | P3-1 Temporal |

Rename sengaja ditaruh setelah P0/P1: mengganti nama sambil ada lubang auth hanya membuat lubangnya lebih ramai dikunjungi.

---

## Laporkan balik sebelum mulai coding

Kirim jawaban singkat untuk empat pertanyaan ini. Jawabannya menentukan apakah timeline di atas realistis atau perlu dipercepat.

1. Apakah endpoint agent/chat memverifikasi signature wallet? (ya/tidak + lokasi kode)
2. Python sandbox berjalan in-process atau di container terpisah?
3. Apakah `.env` pernah ter-commit di riwayat git?
4. Apakah backend produksi sudah live? Di mana?
