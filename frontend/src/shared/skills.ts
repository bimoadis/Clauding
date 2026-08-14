export type SkillId = string;

export type SkillCategory = 'solana' | 'web' | 'compute';

export type Skill = {
  id: SkillId;
  label: string;
  icon: string;
  category: SkillCategory;
  description: string;
  tier: 'free' | 'pro';
  estimatedSteps: number;
  aliases: string[];
};

export const SKILL_CATALOG: Skill[] = [
  {
    id: 'solana_balance',
    label: 'Wallet Balance Checker',
    icon: '/icons/capability-wallet-balance.svg',
    category: 'solana',
    description: 'Inspect SOL and SPL token balances instantly.',
    tier: 'free',
    estimatedSteps: 1,
    aliases: ['wallet', 'balance', 'sol', 'account']
  },
  {
    id: 'rugpull_scanner',
    label: 'Rugpull Scanner',
    icon: '/icons/general-search.svg',
    category: 'solana',
    description: 'Scan contract addresses for rugpull warning indicators and safety parameters.',
    tier: 'free',
    estimatedSteps: 2,
    aliases: ['rugpull', 'scan', 'safety', 'contract', 'audit']
  },
  {
    id: 'lp_lock_inspector',
    label: 'LP Lock Inspector',
    icon: '/icons/capability-transaction-signer.svg',
    category: 'solana',
    description: 'Check lock and burn status of token liquidity pools.',
    tier: 'pro',
    estimatedSteps: 2,
    aliases: ['lp', 'lock', 'liquidity', 'raydium', 'meteora']
  },
  {
    id: 'contract_verifier',
    label: 'Contract Ownership Verifier',
    icon: '/icons/status-verified.svg',
    category: 'solana',
    description: 'Verify contract ownership status and check if authority is renounced.',
    tier: 'pro',
    estimatedSteps: 1,
    aliases: ['ownership', 'revoke', 'immutable', 'verify']
  },
  {
    id: 'dex_tracker',
    label: 'DEX & Liquidity Tracker',
    icon: '/icons/capability-priority-fee-optimizer.svg',
    category: 'solana',
    description: 'Check real-time DEX token prices and liquidity pool depth metrics.',
    tier: 'pro',
    estimatedSteps: 2,
    aliases: ['dex', 'price', 'liquidity', 'tracker']
  },
  {
    id: 'web_search',
    label: 'Web Search',
    icon: '/icons/general-search.svg',
    category: 'web',
    description: 'Search live web data, news, and developer documentation.',
    tier: 'free',
    estimatedSteps: 1,
    aliases: ['search', 'web', 'google', 'find', 'news']
  },
  {
    id: 'execute_code',
    label: 'Python Sandbox Code Execution',
    icon: '/icons/persona-analyst.svg',
    category: 'compute',
    description: 'Execute Python scripts in a safe isolated environment for data processing.',
    tier: 'pro',
    estimatedSteps: 3,
    aliases: ['code', 'python', 'exec', 'script', 'run']
  }
];

export const getSkillById = (id: SkillId): Skill | undefined => {
  return SKILL_CATALOG.find((s) => s.id === id);
};
