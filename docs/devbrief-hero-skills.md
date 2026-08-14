# DEV BRIEF — Hero Animation & Skill Palette

**Tanggal:** 13 Agustus 2026
**Site:** claudingagent.tech
**Scope:** (A) animasi hero console, (B) sistem skill: drag + slash command
**Catatan:** Brief ini TIDAK menggantikan `devbrief.md` (security & klaim produk). Item P0 di sana tetap prioritas lebih tinggi dari semua yang ada di file ini.

---

## Ringkasan keputusan

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Format animasi hero | **DOM + CSS**, bukan GIF | Tajam di semua resolusi, ~2KB vs ~5MB, teks tetap teks (bisa dibaca screen reader & mesin pencari) |
| Format untuk sosial | **MP4 H.264**, bukan GIF | X mengonversi GIF ke MP4 secara otomatis; upload MP4 langsung = kualitas lebih baik, file lebih kecil |
| Urutan build skill | **Slash command dulu, drag kemudian** | Slash = 90% nilai, 20% effort, jalan di mobile & keyboard |
| Arti "drop skill" | **Pin sebagai hard constraint** | Satu makna, dapat diprediksi. Izin/scope tool ada di tahap compile, bukan di chat |
| Library drag | **@dnd-kit/core** | Sensor sentuh dengan activation constraint — satu-satunya cara bersih menghindari tabrakan dengan scroll |

---

# BAGIAN A — HERO CONSOLE ANIMATION

## A-1 · Kenapa bukan GIF

Mockup di hero punya background gradient dan teks kecil. GIF dibatasi 256 warna, jadi gradient akan banding parah, dan file-nya akan 4–8MB untuk animasi 10 detik. Itu masuk ke LCP dan merusak skor mobile.

Yang benar-benar dibutuhkan ada dua aset berbeda dari **satu sumber yang sama**:

1. **Di website** → animasi DOM/CSS. Tajam, ringan, teks asli, bisa hormati `prefers-reduced-motion`.
2. **Untuk X & Telegram** → MP4 hasil rekaman dari animasi DOM yang sama.

Jangan buat dua-duanya terpisah. Satu implementasi, satu recorder.

## A-2 · Storyboard

Loop total ~10 detik. Semua timing relatif dari awal loop.

| Waktu | Kejadian |
|---|---|
| 0.0s | Console idle, composer kosong, cursor berkedip |
| 0.3s | Typewriter di composer: `check solana balance and search the web` (~45ms/karakter) |
| 2.0s | Teks commit → bubble user oranye slide-in dari kanan, composer kosong lagi |
| 2.3s | Agent card fade-in, label `AGENT (CLAUDING-V1.0-PRO)` |
| 2.6s | `Analyzing query...` muncul dengan dot berdenyut |
| 3.4s | Chip tool `[solana_balance]` muncul + spinner |
| 4.2s | Spinner → checkmark, teks `Balance is 50.4 SOL` |
| 5.0s | Chip tool `[web_search]` muncul + spinner |
| 6.0s | Spinner → checkmark |
| 6.6s | `Finished task!` + badge hijau |
| 8.5s | Hold |
| 9.0s | Cross-fade ke frame 0, loop |

**Aturan:** jangan pakai `setTimeout` berantai. Pakai satu timeline (CSS `animation-delay` atau Web Animations API) supaya rekaman video-nya deterministik frame-by-frame.

## A-3 · Implementasi

```tsx
// Satu komponen, dua mode
<HeroConsole
  mode="live"        // 'live' untuk website, 'capture' untuk recorder
  loop={true}
  speed={1}          // recorder set 1, tidak boleh drift
/>
```

Requirement:

- [ ] Semua step didefinisikan dalam satu array `SEQUENCE`, bukan hardcode di JSX. Recorder membaca `SEQUENCE.duration` untuk tahu kapan berhenti.
- [ ] Mode `capture` mematikan `prefers-reduced-motion` dan semua randomness (cursor blink pakai timing tetap).
- [ ] Animasi baru mulai saat komponen masuk viewport (`IntersectionObserver`) — jangan jalan di background dan buang CPU mobile.
- [ ] `prefers-reduced-motion: reduce` → tampilkan frame akhir statis, tanpa animasi. Ini bukan opsional, ada user yang mual karena motion.
- [ ] Tidak ada layout shift. Tinggi container dikunci ke tinggi frame terpanjang sejak awal.

## A-4 · Export MP4 untuk sosial

Rekam dari halaman yang sama, jangan bikin ulang di After Effects — nanti divergen.

```bash
# 1. Render frame-by-frame via Playwright (deterministik, tidak drop frame)
node scripts/capture-hero.mjs   # → frames/0001.png ... 0300.png

# 2. Encode
ffmpeg -framerate 30 -i frames/%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 20 \
  -vf "scale=1200:-2" -movflags +faststart \
  public/hero-clauding.mp4
```

`scripts/capture-hero.mjs` — pola yang dipakai:

```js
// jangan pakai page.video(), timing-nya tidak akurat
// screenshot per frame pakai clock yang dikontrol manual
await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.evaluate(() => window.__heroSetTime(0));
for (let f = 0; f < totalFrames; f++) {
  await page.evaluate((t) => window.__heroSetTime(t), f / 30);
  await el.screenshot({ path: `frames/${pad(f)}.png` });
}
```

Artinya komponen hero harus expose `window.__heroSetTime(seconds)` di mode capture. Ini yang membuat rekaman bebas drift.

**Spesifikasi output:**

| Target | Rasio | Ukuran | Catatan |
|---|---|---|---|
| X (timeline) | 16:9 | 1200×675 | < 5MB, H.264, `+faststart` |
| Telegram | 16:9 | 1200×675 | Sama, TG putar inline |
| Fallback GIF | 16:9 | 800×450 | Hanya kalau ada platform yang menolak MP4. Batasi 8 detik, palette-optimized |

Perintah GIF fallback (kalau benar-benar perlu):
```bash
ffmpeg -i hero-clauding.mp4 -vf "fps=15,scale=800:-1:flags=lanczos,palettegen=stats_mode=diff" -y palette.png
ffmpeg -i hero-clauding.mp4 -i palette.png -lavfi "fps=15,scale=800:-1:flags=lanczos,paletteuse=dither=bayer:bayer_scale=3" -y hero-clauding.gif
```

## A-5 · Label model — Fable 5

Badge di hero dan jawaban FAQ akan diganti dari "Claude 3.5" ke "Fable 5". Tiga hal yang wajib dicek sebelum label itu naik:

1. **Konfirmasi kita punya akses API ke `claude-fable-5`.** Kalau backend masih memanggil model lain, label ini jadi klaim palsu di surface paling terlihat di situs.
2. **Fable 5 punya safeguards routing.** Sebagian kecil query (Anthropic menyebut rata-rata di bawah 5% sesi) akan otomatis dijawab oleh Claude Opus 5, bukan Fable 5. Artinya UI kita akan bilang "Fable 5" sementara respons datang dari model lain. Tangani ini: tampilkan model aktual per-response dari field yang dikembalikan API, jangan hardcode label.
3. **Jangan hapus disclaimer.** Menampilkan nama model Anthropic secara spesifik membuat disclaimer di footer makin penting, bukan makin tidak perlu.

**Acceptance criteria Bagian A**
- [ ] Hero animasi jalan di DOM, tidak ada file GIF/video di jalur render hero
- [ ] Lighthouse mobile tidak turun dibanding baseline sekarang
- [ ] `prefers-reduced-motion` menampilkan frame statis
- [ ] `pnpm capture:hero` menghasilkan MP4 < 5MB, 1200×675, dari sumber yang sama
- [ ] Label model diambil dari response API, bukan string statis

---

# BAGIAN B — SKILL PALETTE: DRAG + SLASH

## B-1 · Satu makna, bukan tiga

Sebelum coding, kunci definisi ini:

> **Menjatuhkan skill ke composer = memaksa agent memakai tool itu untuk pesan ini.**

Bukan "memberi izin", bukan "menyisipkan template". Satu makna, dapat diprediksi.

Pemberian izin/scope tool tetap ada, tapi tempatnya di tahap **Review Spec & Tools** saat compile agent — bukan di chat. Jangan campur dua konsep ini di satu permukaan.

## B-2 · Tiga jalur input, satu state

Ini aturan arsitektur terpenting di bagian B. Ketiga cara di bawah **wajib** menghasilkan state yang identik:

| Jalur | Aksi | Prioritas build |
|---|---|---|
| Slash | ketik `/wallet` → autocomplete → Enter | **1 — bangun duluan** |
| Tap | tap kartu skill | **2** |
| Drag | drag kartu → drop ke composer | **3 — polish** |

```ts
type ComposerState = {
  text: string;
  pinnedSkills: SkillId[];   // urutan = urutan eksekusi yang disarankan
};
```

Kalau ketiganya menulis ke `pinnedSkills` yang sama, drag jadi murni lapisan presentasi dan bisa gagal tanpa merusak apa pun.

## B-3 · Data model skill

```ts
type Skill = {
  id: SkillId;                    // 'solana_balance'
  label: string;                  // 'Wallet Balance Checker'
  icon: string;
  category: 'solana' | 'web' | 'compute';
  description: string;
  tier: 'free' | 'pro';           // gate 'EXPERT TOOLS'
  estimatedSteps: number;         // untuk indikator budget, lihat B-6
  aliases: string[];              // ['wallet','balance','sol'] untuk fuzzy search slash
};
```

Simpan katalog di satu tempat (`shared/skills.ts`) dan konsumsi dari landing page, dashboard, dan slash autocomplete. Sekarang daftar skill kemungkinan ter-hardcode di landing — jangan duplikasi.

## B-4 · Payload API

```json
POST /chat
{
  "threadId": "...",
  "message": "check my wallet",
  "forcedTools": ["solana_balance"],
  "toolMode": "required"
}
```

**Kontrak yang tidak boleh dilanggar:** kalau `forcedTools` terisi, tool itu **harus** dipanggil. Kalau backend memutuskan tidak memanggilnya, kembalikan alasan eksplisit dan tampilkan di UI:

> `solana_balance` tidak dijalankan — wallet belum terhubung.

User yang men-drag ikon lalu tidak melihat tool-nya jalan, tanpa penjelasan, akan berhenti memakai fitur ini selamanya. Ini bug kepercayaan, bukan bug kosmetik.

## B-5 · Interaksi drag

Pakai `@dnd-kit/core`. Jangan HTML5 drag-and-drop native — tidak bisa di-style dan payah di sentuh.

```ts
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },          // desktop: 8px gerak baru mulai drag
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 }, // mobile: tahan 200ms
  }),
);
```

Delay 200ms di sentuh itu wajib. Tanpa itu, setiap kali user mencoba scroll melewati grid skill, mereka malah tidak sengaja men-drag.

Requirement:
- [ ] Drop zone = seluruh area composer, bukan cuma ikon kecil. Target kecil = frustrasi.
- [ ] Composer highlight saat ada drag aktif di atasnya (border oranye + label "drop to pin")
- [ ] Drop di luar zone = batal dengan animasi kembali ke posisi asal, bukan hilang
- [ ] Skill `tier: 'pro'` saat user free: tetap bisa di-drag, tapi drop menghasilkan chip terkunci + CTA upgrade. Jangan blokir drag-nya — orang perlu tahu apa yang mereka lewatkan.
- [ ] `prefers-reduced-motion` → matikan animasi transform, drag tetap fungsional

## B-6 · Chip di composer

Skill yang sudah di-pin muncul sebagai chip di atas textarea:

```
┌─────────────────────────────────────────┐
│ [⬢ Wallet Balance ×] [⬢ Web Search ×]   │
│ ─────────────────────────────────────── │
│ check my wallet and find recent news    │
│                              [Send]      │
└─────────────────────────────────────────┘
```

- [ ] Chip bisa di-reorder (drag antar chip) — urutan dikirim ke `forcedTools`
- [ ] Chip bisa dihapus: klik `×`, atau **Backspace saat kursor di awal textarea** (perilaku yang diharapkan orang dari email client)
- [ ] Maksimal chip = sisa budget step tier user. Free tier 5-step ReAct: pin ke-6 ditolak dengan pesan jelas
- [ ] Tampilkan sisa budget: `3 of 5 steps` — ini mencegah user free membakar seluruh loop dalam satu pesan lalu bingung kenapa agent berhenti di tengah

## B-7 · Slash command

Bangun ini lebih dulu dari drag.

- [ ] `/` di awal baris kosong membuka palette
- [ ] Fuzzy search terhadap `label` + `aliases`
- [ ] Panah atas/bawah untuk navigasi, Enter untuk pilih, Esc untuk tutup
- [ ] Memilih skill menghapus teks `/xxx` dan menambah chip — bukan menyisipkan teks mentah
- [ ] Palette yang sama juga bisa dibuka via tombol `+` di composer (jalur untuk user mobile yang tidak mau mengetik slash)

## B-8 · Discoverability

Ini alasan sebenarnya fitur ini dibangun. Jangan sampai terlewat:

- [ ] Saat thread kosong, tampilkan 4–6 kartu skill sebagai starter di area chat, bisa di-tap langsung
- [ ] Hint sekali seumur user di composer: `Drag a skill here, or type /`
- [ ] Kartu skill di landing page bisa di-klik dan membawa user ke dashboard dengan skill itu sudah ter-pin. Ini jalur konversi paling langsung yang Anda punya dan biayanya hampir nol

**Acceptance criteria Bagian B**
- [ ] Slash, tap, dan drag menghasilkan `pinnedSkills` yang identik (ada test)
- [ ] Drag di mobile tidak pernah memicu saat user scroll (tes manual di iOS Safari + Chrome Android)
- [ ] Seluruh alur bisa diselesaikan tanpa mouse (keyboard-only)
- [ ] Tool yang di-pin tapi tidak dijalankan selalu memunculkan alasan di UI
- [ ] Indikator sisa step akurat dan tampil sebelum user menekan Send

---

## Urutan kerja

| Tahap | Isi | Estimasi |
|---|---|---|
| 1 | Katalog skill terpusat (`shared/skills.ts`) + `forcedTools` di API | 2 hari |
| 2 | Chip composer + slash command | 3 hari |
| 3 | Hero animation DOM/CSS | 2 hari |
| 4 | Script capture → MP4 | 1 hari |
| 5 | Drag layer (@dnd-kit) | 2 hari |
| 6 | Discoverability (starter cards, deep-link dari landing) | 1 hari |

Kalau harus memotong scope: **buang tahap 5**. Slash + tap sudah memberi hampir seluruh nilai fiturnya. Drag adalah yang paling terlihat tapi paling sedikit dipakai setelah minggu pertama.

---

## Satu catatan yang belum tuntas

Badge `24/7 Autonomous Loops` di halaman compile dan jawaban FAQ "Is my agent always online? Yes" masih menunggu konfirmasi bahwa Temporal benar-benar menjalankan agent sebagai durable workflow. Sekarang klaim itu ada di dua permukaan, bukan satu. Kalau belum jalan, cabut dua-duanya sebelum menambah permukaan ketiga.
