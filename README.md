<div align="center">

<img src="docs/assets/banner.png" alt="KIRBLE Banner" width="100%" />

# KIRBLE

**Autonomous AI Agent Compiler & Web3 Orchestration Engine**

*One prompt. Any AI agent. Compile, orchestrate, and launch autonomous Solana agents with transparent execution specs.*

[![Chain](https://img.shields.io/badge/chain-Solana-9945FF?style=flat-square&labelColor=0A0F0C&logo=solana)](#solana-integration)
[![Runtime](https://img.shields.io/badge/runtime-Next.js%2014%20·%20NestJS-E9E4D6?style=flat-square&labelColor=0A0F0C)](#tech-stack)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20·%20pgvector-336791?style=flat-square&labelColor=0A0F0C&logo=postgresql)](#database--vector-memory)
[![Engine](https://img.shields.io/badge/engine-ReAct%20Loop%20·%20Drizzle%20ORM-FF6B6B?style=flat-square&labelColor=0A0F0C)](#agent-runtime)
[![Auth](https://img.shields.io/badge/auth-SIWS%20(Ed25519)-10B981?style=flat-square&labelColor=0A0F0C)](#security--authentication)
[![X (Twitter)](https://img.shields.io/badge/X-@usecldg-000000.svg?style=flat-square&logo=X&logoColor=white)](https://x.com/usecldg?s=11)
[![License](https://img.shields.io/badge/license-MIT-38C172?style=flat-square&labelColor=0A0F0C)](#license)

</div>

---

**KIRBLE** (formerly Clauding) is an autonomous AI agent platform and compilation engine designed to design, compile, and execute goal-driven AI agents using natural language prompts. Powered by Solana wallet authentication, thread-based memory, a dynamic ReAct (Reasoning + Acting) execution loop, and real-time on-chain and market analysis tools.

---

## ⚡ Why KIRBLE

Building and orchestrating autonomous on-chain agents typically requires complex boilerplate, custom RPC wrappers, fragile prompt chains, and opaque agent execution logic. **KIRBLE** solves this by providing:

- **One-Prompt Agent Compiler**: Describe an agent in plain language (English or Indonesian), and KIRBLE autonomously generates a transparent `AgentSpec` schema (system persona, behavioral guardrails, LLM models, and dynamic tool bindings).
- **Autonomous ReAct Execution Loop**: Agents do not merely return text—they reason over intermediate states, evaluate conditions, execute tool calls, and adapt their plan until the objective is reached.
- **Cryptographic Solana SIWS Authentication**: Zero-friction login and chat thread isolation via Sign-In-With-Solana (Ed25519 challenge-response signatures), keeping session histories strictly bound to wallet public keys.
- **Built-in Web3 & Analytics Tool Catalog**: Instant integration with DexScreener price/liquidity endpoints, on-chain ledger queries, and safe code evaluation sandboxes.
- **Ultra-Responsive Real-Time Streaming**: Low-latency token streaming via Server-Sent Events (SSE) combined with an elegant, modern dark glassmorphism dashboard.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────┐
                               │     USER / SOLANA WALLET       │
                               │   (Phantom / Solflare SIWS)    │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │      FRONTEND (NEXT.JS 14)     │
                               │   • One-Prompt Compiler UI     │
                               │   • Agent Playground Dashboard │
                               │   • SSE Stream Consumer        │
                               └───────────────┬────────────────┘
                                               │ REST / SSE API
                                               ▼
                               ┌────────────────────────────────┐
                               │      BACKEND (NESTJS API)      │
                               │   • SIWS Auth Guard (JWT)      │
                               │   • Model Router & Adapters    │
                               │   • Agent Spec Compiler        │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
      ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
      │   LLM ADAPTERS  │             │   ReAct ENGINE  │             │   PERSISTENCE   │
      │ • Claude 3.5    │             │ • Step Planning │             │ • PostgreSQL 16 │
      │ • GPT-4o / Mini │             │ • Tool Dispatch │             │ • pgvector      │
      │ • Prompt Engine │             │ • State Loop    │             │ • Drizzle ORM   │
      └────────┬────────┘             └────────┬────────┘             └─────────────────┘
               │                               │
               └───────────────────────┬───────┘
                                       ▼
                     ┌───────────────────────────────────┐
                     │          TOOL CATALOG             │
                     │  • DexScreener Solana API         │
                     │  • On-Chain Ledger & Balances     │
                     │  • Python Evaluation Sandbox      │
                     │  • Helius RPC & Webhook Triggers  │
                     └───────────────────────────────────┘
```

---

## 🌟 Key Features

### 1. One-Prompt Compiler & Spec Engine
Describe what you need: *"Create a Solana memecoin sentiment analyst that tracks 5m volume spikes on DexScreener and verifies liquidity lock status."*  
KIRBLE will automatically compile the agent's identity, system prompt layers, assigned LLM engine, and required capabilities.

### 2. Multi-Model Intelligent Routing
Seamlessly dispatches queries to top-tier foundation models (Anthropic Claude 3.5 Sonnet / OpenAI GPT-4o) depending on reasoning requirements, latency, and cost constraints.

### 3. Native Solana Web3 Integration
- Cryptographic wallet sign-in with Ed25519 signature validation.
- Agent chat history and configurations are safely tied to the wallet address.
- Double-entry ledger integration for token billing and treasury top-ups.

### 4. Real-Time Tool Execution
- **DexScreener API**: Query live pairs, liquidity, 24h volume, price changes, and FDV.
- **Solana On-Chain Balance**: Fetch token balances and transaction status.
- **Python Sandbox**: Run deterministic data calculations and formatting safely.

### 5. High-Performance Glassmorphism Dashboard
Modern, responsive Next.js 14 user interface featuring agent creation consoles, real-time markdown token rendering, thread persistence, and model inspection tools.

---

## 📁 Monorepo Structure

```
KIRBLE/
├── backend/                     # NestJS & Fastify Backend Service
│   ├── src/
│   │   ├── agents/              # Agent Compiler & CRUD Controllers
│   │   ├── auth/                # SIWS Nonce & Signature Verification (JWT)
│   │   ├── billing/             # Double-entry ledger & Solana deposits
│   │   ├── characters/          # Built-in agent personas & prompts
│   │   ├── chat/                # SSE Stream Chat & Message Histories
│   │   ├── db/                  # PostgreSQL Schema & pgvector (Drizzle ORM)
│   │   ├── models/              # LLM Adapters (OpenAI, Anthropic) & ReAct Engine
│   │   └── temporal/            # Durable Tool Catalog & Execution Workers
│   └── package.json
│
├── frontend/                    # Next.js 14 Frontend Application
│   ├── src/app/
│   │   ├── page.tsx             # Interactive landing page with compiler console
│   │   ├── dashboard/           # Main playground, agent sidebar, & chat cards
│   │   ├── compile/             # Standalone agent compiler wizard
│   │   ├── token/               # Tokenomics & staking tiers page
│   │   └── layout.tsx           # Solana Wallet Adapter & Global Layout
│   └── package.json
│
├── docs/                        # Architecture briefs, specs, & assets
│   └── assets/
│       └── banner.png           # Repository Banner Asset
│
├── package.json                 # Root pnpm monorepo configuration
├── pnpm-workspace.yaml          # Monorepo workspace configuration
└── vercel.json                  # Frontend deployment configuration
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript, Vanilla CSS / CSS Modules |
| **Web3 & Wallet** | `@solana/wallet-adapter-react`, `@solana/web3.js`, `tweetnacl`, `bs58` |
| **Backend API** | [NestJS](https://nestjs.org/), Fastify, Server-Sent Events (SSE) |
| **Database & Memory** | [PostgreSQL 16](https://www.postgresql.org/), [pgvector](https://github.com/pgvector/pgvector), [Drizzle ORM](https://orm.drizzle.team/) |
| **AI Models** | [Anthropic Claude 3.5](https://www.anthropic.com/), [OpenAI GPT-4o](https://openai.com/) |
| **Blockchain Data** | [Helius RPC](https://helius.dev/), [DexScreener API](https://dexscreener.com/) |
| **Package Manager** | [pnpm](https://pnpm.io/) Workspaces (v9+) |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have installed on your local system:
- **Node.js** (v20.x LTS or higher)
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL 16** with `pgvector` extension enabled

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/bimoadis/KIRBLE.git
cd KIRBLE

# Install all monorepo dependencies
pnpm install
```

---

### 2. Configure Environment Variables

#### Backend `.env`
Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/kirble

# Security & Authentication
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000

# LLM Providers
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Solana RPC & Treasury
HELIUS_API_KEY=your_helius_api_key
TREASURY_WALLET_ADDRESS=your_solana_treasury_public_key
```

#### Frontend `.env.local`
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
```

---

### 3. Database Schema Migration

Apply database schemas with Drizzle ORM:

```bash
# Generate migrations
pnpm --filter backend db:generate

# Apply migrations to database
pnpm --filter backend db:migrate
```

---

### 4. Run Development Servers

Start both services concurrently:

```bash
# Run backend on port 3001
pnpm dev:backend

# Run frontend on port 3000 (in a separate terminal)
pnpm dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start building agents.

---

## 📦 Production Build

```bash
# Build backend
pnpm build:backend

# Build frontend
pnpm build:frontend

# Start production processes
pnpm --filter backend start:prod
pnpm --filter frontend start
```

---

## 🌐 Production Deployment

### 1. Backend (Railway / Render / Docker)
- Deploy using **Railway** with native pnpm monorepo support.
- Set root directory to `backend`.
- **Build command:** `pnpm install && pnpm --filter backend build`
- **Start command:** `pnpm --filter backend start:prod`
- Attach a PostgreSQL database add-on with `pgvector` enabled.

### 2. Frontend (Vercel)
- Connect repository to **Vercel**.
- Set root directory to `frontend`.
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app` (without trailing slash).

---

## 🛡️ Security & Verification

- **SIWS Challenge-Response**: Nonces expire in 5 minutes and are single-use to eliminate replay attacks.
- **Zero-Custody Boundary**: KIRBLE never stores private keys or signs transactions on behalf of users without explicit client approval.
- **Isolated Execution**: User-defined scripts and tool payloads run in bounded sandboxes.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
