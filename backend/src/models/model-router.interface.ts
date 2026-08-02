export interface ModelRef {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'llama';
  displayName: string;
  inPriceMicroUsd: bigint;
  outPriceMicroUsd: bigint;
  qualityRank: number;
  latencyAvgMs: number;
  healthy: boolean;
  capabilities: string[];
}

export interface RoutingRequest {
  requires?: string[];
  costTier?: 'economy' | 'balanced' | 'premium';
  maxLatencyMs?: number;
  pinnedModel?: string;
  estTokens?: { input: number; output: number };
}
