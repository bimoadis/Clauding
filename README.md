# 🤖 Kirble — Monorepo

> **One prompt. Any AI agent.** 
> Kirble is a platform to design, compile, and launch autonomous AI agents using just a single line of natural language instruction. Powered by Solana wallet integration, thread-based message history, a ReAct execution loop, and real-time on-chain analysis tools.

---

## 🌟 Key Features

- **One-Prompt Compiler**: Describe the agent you want (in English or Indonesian), and Kirble will automatically analyze and configure its persona, rules, appropriate LLM models, and required capabilities (tools).
- **Dynamic ReAct Loop System**: Agents don't just answer questions—they autonomously reason, make decisions, and execute a sequence of tools to achieve your goals.
- **Solana Wallet Integration**: Authentication and chat thread history are securely bound to the user's public address via Phantom Wallet / Solana Wallet Adapter.
- **Agent Capabilities (Tools Catalog)**:
  - **DexScreener API**: Real-time queries for token prices, liquidity, volume, and contract info on Solana.
  - **Python Sandbox**: Safe code execution on the backend sandbox.
  - **Ledger & Balances**: Check wallet balances and transaction histories on-chain.
- **Premium Glassmorphism UI**: Beautiful, responsive landing page and dashboard dashboard containing controls for creating, selecting, and deleting agents alongside their message logs.

---

## 📁 Monorepo Structure

```
KIRBLE/
├── backend/               # NestJS & Temporal Backend Service
│   ├── src/
│   │   ├── agents/        # Agent Management Controller (Create, List, Delete)
│   │   ├── chat/          # SSE Stream Chat Playground & Threads History
│   │   ├── db/            # PostgreSQL Database + pgvector Schema (Drizzle ORM)
│   │   ├── models/        # LLM Adapters (OpenAI & Anthropic) with ReAct Loop
│   │   └── temporal/      # Tool catalog and dynamic capability triggers
│   └── package.json
│
├── frontend/              # Next.js 14 Frontend Application
│   ├── src/app/
│   │   ├── page.tsx       # Interactive landing page with macOS window mockup
│   │   ├── dashboard/     # Main playground, agent sidebar, & chat cards
│   │   └── layout.tsx     # Root wrapper & Solana Wallet Adapter
│   └── package.json
│
├── package.json           # Root pnpm monorepo configuration
└── pnpm-workspace.yaml    # pnpm workspace configuration
```

---

## 🛠️ System Prerequisites

Ensure you have installed:
* [Node.js](https://nodejs.org/) (v20 or latest LTS version)
* [pnpm](https://pnpm.io/) (v9+)
* [PostgreSQL](https://www.postgresql.org/) (with `pgvector` extension enabled)

---

## 🚀 Local Getting Started Guide

### 1. Clone Repository & Install Dependencies
Run the following in the monorepo root:
```bash
# Install both backend and frontend dependencies
pnpm install
```

### 2. Configure Environment Variables (.env)
Create a `.env` file inside the `/backend` folder:
```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/kirble
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Run Database Migrations (Drizzle ORM)
Migrate the schemas into your local PostgreSQL database:
```bash
# Generate database schema migrations
pnpm --filter backend db:generate

# Apply migrations to the database
pnpm --filter backend db:migrate
```

### 4. Run the Application
Open two separate terminal windows to run both services concurrently:

* **Terminal 1: Backend Dev**
  ```bash
  pnpm dev:backend
  ```
  The backend will listen on port `3001` (`http://localhost:3001`).

* **Terminal 2: Frontend Dev**
  ```bash
  pnpm dev:frontend
  ```
  The frontend will listen on port `3000` (`http://localhost:3000`).

---

## 📦 Production Build Instructions

To compile and launch optimized production builds:

```bash
# Build the NestJS backend
pnpm build:backend

# Build the Next.js frontend
pnpm build:frontend

# Start the production services
pnpm --filter backend start:prod
pnpm --filter frontend start
```

---

## 🔒 License
This project is developed and maintained privately.
