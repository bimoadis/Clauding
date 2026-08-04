# 🤖 Kirble — Monorepo

> **One line. Any AI agent.** 
> Kirble adalah platform untuk mendesain, mengompilasi, dan meluncurkan AI Agent otonom hanya dengan satu baris instruksi bahasa alami. Didukung oleh integrasi Wallet Solana, sistem memori thread, ReAct execution loop, dan alat analisis on-chain real-time.

---

## 🌟 Fitur Utama

- **One-Prompt Compiler**: Cukup deskripsikan agen yang Anda inginkan (dalam Bahasa Indonesia atau Inggris), dan Kirble akan otomatis menganalisis serta mengonfigurasi kepribadian (*persona*), aturan, model LLM yang cocok, dan daftar kapabilitas (*tools*).
- **Sistem ReAct Loop Dinamis**: Agen tidak hanya menjawab pertanyaan, melainkan dapat secara mandiri berpikir, mengambil keputusan, dan mengeksekusi serangkaian tugas/alat untuk mencapai tujuan.
- **Integrasi Solana Wallet**: Otentikasi dan identifikasi thread chat diikat secara aman berdasarkan alamat publik Phantom Wallet / Solana Wallet Adapter terhubung.
- **Kapabilitas Agen (Tools Catalog)**:
  - **DexScreener API**: Pencarian data harga, likuiditas, volume, dan kontrak token Solana secara real-time.
  - **Python Sandbox**: Eksekusi kode pemrograman aman di sisi backend.
  - **Ledger & Balances**: Pengecekan saldo on-chain dan histori transaksi.
- **Glassmorphism UI Premium**: Halaman utama (*landing page*) dan dashboard dirancang dengan estetika modern, responsif penuh di perangkat seluler, serta dilengkapi dengan kontrol manajemen agen (pembuatan, pemilihan, dan penghapusan agen beserta riwayatnya).

---

## 📁 Struktur Monorepo

```
KIRBLE/
├── backend/               # NestJS & Temporal Backend Service
│   ├── src/
│   │   ├── agents/        # Controller & Management Agen (Create, List, Delete)
│   │   ├── chat/          # SSE Stream Chat Playground & Threads History
│   │   ├── db/            # Database PostgreSQL + pgvector Schema (Drizzle ORM)
│   │   ├── models/        # LLM Adapters (OpenAI & Anthropic) dengan ReAct Loop
│   │   └── temporal/      # Tool catalog & implementasi pemicu kapabilitas
│   └── package.json
│
├── frontend/              # Next.js 14 Frontend Application
│   ├── src/app/
│   │   ├── page.tsx       # Landing page interaktif & macOS Mockup
│   │   ├── dashboard/     # Area Playground Utama, Sidebar Agen, & Chat Card
│   │   └── layout.tsx     # Root wrapper & Solana Wallet Adapter
│   └── package.json
│
├── package.json           # Root konfigurasi monorepo pnpm
└── pnpm-workspace.yaml    # Workspace konfigurasi pnpm
```

---

## 🛠️ Persyaratan Sistem

Pastikan Anda telah menginstal:
* [Node.js](https://nodejs.org/) (v20 atau versi LTS terbaru)
* [pnpm](https://pnpm.io/) (v9+)
* [PostgreSQL](https://www.postgresql.org/) (dengan ekstensi `pgvector` aktif)

---

## 🚀 Panduan Memulai Lokal

### 1. Kloning Repositori & Instal Dependensi
Jalankan di terminal root monorepo:
```bash
# Install seluruh package frontend dan backend
pnpm install
```

### 2. Konfigurasi Variabel Lingkungan (.env)
Buat berkas `.env` di dalam folder `/backend`:
```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/kirble
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Migrasi Database (Drizzle ORM)
Jalankan migrasi tabel ke dalam PostgreSQL lokal Anda:
```bash
# Membuat migrasi skema tabel
pnpm --filter backend db:generate

# Menerapkan migrasi ke database
pnpm --filter backend db:migrate
```

### 4. Jalankan Aplikasi
Buka dua terminal terpisah untuk menjalankan backend dan frontend secara bersamaan:

* **Terminal 1: Backend Dev**
  ```bash
  pnpm dev:backend
  ```
  Backend akan berjalan pada port `3001` (`http://localhost:3001`).

* **Terminal 2: Frontend Dev**
  ```bash
  pnpm dev:frontend
  ```
  Frontend akan berjalan pada port `3000` (`http://localhost:3000`).

---

## 📦 Panduan Build Produksi

Untuk melakukan kompilasi siap pakai di server staging/produksi:

```bash
# Build backend NestJS
pnpm build:backend

# Build frontend Next.js
pnpm build:frontend

# Jalankan dalam mode produksi
pnpm --filter backend start:prod
pnpm --filter frontend start
```

---

## 🔒 Lisensi
Proyek ini dibuat dan dikembangkan secara privat.
