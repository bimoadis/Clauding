# Kirble — Project Plan, Tech Stack & Preparation Blueprint
**Prepared by:** Senior Developer / Architect  
**Project Scope:** Fullstack Implementation (Web Application + Backend Gateway + Agent Runtime)

---

## 1. Recommended Tech Stack

Based on the [KIRBLE_BACKEND_DEV_BRIEF.md](file:///d:/Real%20Kerja/KIRBLE/docs/KIRBLE_BACKEND_DEV_BRIEF.md) and the existing [index (1).html](file:///d:/Real%20Kerja/KIRBLE/docs/index%20(1).html) landing page design, here is the optimal fullstack setup:

### Frontend (FE) Stack
*   **Framework:** **Next.js 14/15 (App Router)** or **Vite + React (TypeScript)**
    *   *Why:* Next.js is ideal for SEO optimization on the landing page, offers first-class routing for dashboard app views, and facilitates seamless wallet authentication.
*   **Styling:** **Vanilla CSS / CSS Modules**
    *   *Why:* The design system, fonts (`Inter` and `Space Grotesk`), custom animations, and layout are already fully coded in Vanilla CSS in `index (1).html`. We can directly port these styles into CSS Modules or global stylesheet files without the overhead of rewriting them to Tailwind CSS.
*   **Web3 Integration:** `@solana/wallet-adapter-react` + `@solana/wallet-adapter-react-ui` + `@solana/web3.js`
    *   *Why:* Simplifies connection with Solana wallets (Phantom, Solflare, etc.) and integrates smoothly with SIWS (Sign In With Solana).
*   **Data Fetching:** `@tanstack/react-query` (React Query)
    *   *Why:* Handles client cache, API polling, status updates, and handles token stream SSE bindings easily.

### Backend (BE) Stack (per Dev Brief recommendations)
*   **Runtime:** Node.js 20 (TypeScript)
*   **API Framework:** NestJS (Fastify adapter for optimal Server-Sent Events (SSE) streaming performance)
*   **Durable Engine:** Temporal.io (Ensures reliability of multi-step agent executions and tool calls)
*   **Databases:** PostgreSQL 16 (Relational DB & Double-entry Ledger) + `pgvector` (Agent Memory Vector Store)
*   **Cache & Rate-limiting:** Redis 7 (Token bucket rate limiting, hot configurations, SIWS nonces)
*   **Blockchain Integration:** Helius (RPC Node + Tx Webhooks)

---

## 2. Preparation Checklist (What You Need to Prepare)

To begin coding and deployment, you must set up the following accounts, API credentials, and development environments:

### A. Infrastructure & DevOps Services
*   [ ] **PostgreSQL 16 Database Instance** (e.g., local instance, Supabase, Neon, or RDS) with `pgvector` extension enabled.
*   [ ] **Redis 7 Instance** (e.g., local instance, Upstash, or ElastiCache).
*   [ ] **Temporal Cluster** (Set up local Temporal server via Docker-Compose for development).
*   [ ] **S3-Compatible Storage bucket** (e.g., Cloudflare R2 or AWS S3) for storing logs and output artifacts.

### B. Third-Party API Keys & Accounts
*   [ ] **Solana RPC Provider:** A Helius account and API Key (for webhook notifications of token transfers and RPC transactions).
*   [ ] **LLM Provider API Keys:**
    *   Anthropic API Key (Claude models)
    *   OpenAI API Key (GPT models)
    *   Google Gemini API Key (Gemini models)
    *   xAI API Key (Grok models)
    *   *Alternative:* OpenRouter / LiteLLM API key for consolidated development access.
*   [ ] **Target Wallet Addresses:**
    *   A Treasury Wallet address to receive crypto deposits (SOL and `$KIRBLE` token).

### C. Developer Local Setup
*   [ ] **Node.js 20.x** and **pnpm** installed.
*   [ ] **Docker** installed (to easily spin up PostgreSQL, Redis, and Temporal locally via Compose).

---

## 3. Step-by-Step Implementation Task List

This roadmap organizes the development into logical steps, keeping the Frontend and Backend aligned.

```mermaid
gantt
    title Kirble Project Schedule
    dateFormat  YYYY-MM-DD
    section Backend (BE)
    M0: Base & Auth           :a1, 2026-08-01, 5d
    M1: Adapters, Routing, SSE:a2, after a1, 5d
    M2: Prompt & Character Eng:a3, after a2, 5d
    M3: Temporal Workflows    :a4, after a3, 7d
    M4: Crypto Billing Settle :a5, after a4, 5d
    M5: RLS & Hardening       :a6, after a5, 3d
    section Frontend (FE)
    Landing Page Porting      :f1, 2026-08-01, 4d
    Wallet & SIWS Auth        :f2, after f1, 4d
    Agent Compiler UI         :f3, after f2, 5d
    Character Selector        :f4, after f3, 4d
    Chat Interface & Billing  :f5, after f4, 8d
```

### Milestone 0: Core Architecture Setup
*   **BE Tasks:**
    *   [ ] Initialize NestJS repository, configure TypeScript path aliases, ESLint, and Prettier.
    *   [ ] Write Docker Compose configuration for PostgreSQL, Redis, and Temporal.
    *   [ ] Write and execute database DDL migration (creating tables for Users, API keys, Wallets, Ledgers).
    *   [ ] Set up SIWS (Sign-in-With-Solana) wallet cryptographic validation services.
*   **FE Tasks:**
    *   [ ] Initialize Next.js project with TypeScript and CSS Modules.
    *   [ ] Port the landing page markup and CSS styles from `index (1).html`.
    *   [ ] Configure `@solana/wallet-adapter` components into the App layout.

### Milestone 1: Multi-Model Routing & Streaming APIs
*   **BE Tasks:**
    *   [ ] Build the unified `ProviderAdapter` and create wrappers for OpenAI/Anthropic/Gemini APIs.
    *   [ ] Implement the `ModelRouter` class that scores models based on Quality, Cost, and Latency.
    *   [ ] Create `/v1/chat/stream` SSE endpoints.
*   **FE Tasks:**
    *   [ ] Set up dynamic API fetch client with React Query.
    *   [ ] Build the App dashboard router (managing dynamic views like /dashboard, /dashboard/agents).
    *   [ ] Wire wallet connection to trigger the backend SIWS endpoint for JWT authentication.

### Milestone 2: Character Persona & Compiler Services
*   **BE Tasks:**
    *   [ ] Set up Character JSON schemas and seed built-in personas (The Analyst, The Builder, etc.).
    *   [ ] Implement Layer 0-3 prompt builder engine.
    *   [ ] Create the `/v1/agents/compile` endpoint that uses an LLM to generate `AgentSpec` configs from a prompt.
*   **FE Tasks:**
    *   [ ] Implement the dynamic interactive "Describe your Agent" landing page input.
    *   [ ] Build the character selection screen displaying character quotes and custom card colors.
    *   [ ] Create the Agent Spec editing modal (where users review generated specs before publishing).

### Milestone 3: Temporal Durable Execution & Tool Sandboxing
*   **BE Tasks:**
    *   [ ] Connect NestJS server with the Temporal Worker client.
    *   [ ] Write `runAgentWorkflow` with ReAct execution loop handling step tracking.
    *   [ ] Implement sandboxed system tools (`web_search`, `http_fetch`, memory retrieval).
*   **FE Tasks:**
    *   [ ] Build real-time chat window UI supporting rendering of markdown output and tool execution states.
    *   [ ] Design the Agent management dashboard showing run logs, execution steps, and costs.

### Milestone 4: Billing Ledger & Live Webhooks
*   **BE Tasks:**
    *   [ ] Integrate Helius Webhooks to listen to transfer events towards the Treasury wallet.
    *   [ ] Write transaction-safe ledger adjustments for balance reservations (Holds) and usages (Settles).
    *   [ ] Incorporate `$KIRBLE` token-based balance discounts.
*   **FE Tasks:**
    *   [ ] Build the billing/wallet page showing real-time balance (in USD credits), deposits, and transactional ledger logs.
    *   [ ] Implement the "Top up" modal producing QR codes, wallet transfer requests, or instructions.
