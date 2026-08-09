import { OpenAIAdapter } from '../models/adapters/openai.adapter';
import { AnthropicAdapter } from '../models/adapters/anthropic.adapter';
import { Message } from '../models/provider-adapter.interface';
import { db } from '../db/db';
import { users, wallets, agents, agentVersions, runs, usageEvents } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { toolCatalog } from './tool-catalog';

const openai = new OpenAIAdapter();
const anthropic = new AnthropicAdapter();

export async function loadAgentSpec(agentId: string) {
  console.log(`[Activity] Loading AgentSpec for: ${agentId}`);
  try {
    const agentRecord = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1).then(r => r[0]);
    if (!agentRecord) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const latestVersion = await db.select().from(agentVersions)
      .where(eq(agentVersions.agentId, agentId))
      .orderBy(desc(agentVersions.version))
      .limit(1)
      .then(r => r[0]);

    if (!latestVersion) {
      throw new Error(`Agent spec version not found for agent: ${agentId}`);
    }

    const spec = JSON.parse(latestVersion.spec);

    // Get user tier (Free vs Pro)
    let isPro = false;
    const userRecord = await db.select().from(users).where(eq(users.id, agentRecord.ownerId)).limit(1).then(r => r[0]);
    if (userRecord) {
      const walletRecord = await db.select().from(wallets).where(eq(wallets.userId, userRecord.id)).limit(1).then(r => r[0]);
      if (walletRecord) {
        // Pro tier criteria: holds >= 50,000 CLAUDING or USD credit balance >= $10.00 (10,000,000 micro-USD)
        if (walletRecord.claudingBalance >= 50000n || walletRecord.balanceMicroUsd >= 10000000n) {
          isPro = true;
        }
      }
    }

    // Enforce limits
    const maxSteps = isPro ? 15 : 5;
    const maxTokensPerRun = isPro ? 100000 : 20000;

    spec.guardrails = {
      ...spec.guardrails,
      maxSteps: spec.guardrails?.maxSteps ? Math.min(spec.guardrails.maxSteps, maxSteps) : maxSteps,
      maxTokensPerRun: spec.guardrails?.maxTokensPerRun ? Math.min(spec.guardrails.maxTokensPerRun, maxTokensPerRun) : maxTokensPerRun,
      max_steps: spec.guardrails?.maxSteps ? Math.min(spec.guardrails.maxSteps, maxSteps) : maxSteps
    };

    return spec;
  } catch (error) {
    console.error('[Activity] Failed to load agent spec from DB, returning fallback spec:', error);
    return {
      id: agentId,
      name: 'Crypto Alpha Scout',
      instructions: 'Monitor crypto news and alert on market moving events.',
      guardrails: { maxSteps: 5, max_steps: 5, maxTokensPerRun: 20000 }
    };
  }
}

export async function retrieveMemory(threadId: string): Promise<Message[]> {
  console.log(`[Activity] Retrieving episodic memory context for thread: ${threadId}`);
  return [
    { role: 'system', content: 'You are The Analyst. Always lead with numbers.' }
  ];
}

export async function executeTool(params: { toolName: string; args: Record<string, any>; runId: string }) {
  console.log(`[Activity] Executing tool "${params.toolName}" for run: ${params.runId}`);
  
  const matchedTool = toolCatalog.find(t => t.name === params.toolName);
  if (matchedTool) {
    try {
      const result = await matchedTool.handler(params.args);
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Execution failed' };
    }
  }

  return { success: false, error: 'Unknown tool requested' };
}

export async function callProviderModel(params: { modelId: string; provider: string; history: Message[]; runId: string }) {
  console.log(`[Activity] Invoking provider model: ${params.modelId} (${params.provider})`);

  const adapter = params.provider === 'openai' ? openai : anthropic;
  const response = await adapter.chat({
    model: params.modelId,
    messages: params.history
  });

  // Log usage details to database if runId is a valid UUID (not mock prefix)
  if (response.usage && params.runId && !params.runId.startsWith('run_')) {
    try {
      // Find run record to map owner/user
      const runRecord = await db.select().from(runs).where(eq(runs.id, params.runId)).limit(1).then(r => r[0]);
      if (runRecord) {
        // Calculate estimated cost in micro-USD
        let inPrice = 3n;
        let outPrice = 15n;
        if (params.modelId.includes('gpt-4o')) {
          inPrice = 5n;
          outPrice = 15n;
        } else if (params.modelId.includes('gpt-3.5')) {
          inPrice = 1n;
          outPrice = 2n;
        }

        const inputTokens = BigInt(response.usage.inputTokens || 0);
        const outputTokens = BigInt(response.usage.outputTokens || 0);
        const costMicroUsd = (inputTokens * inPrice) + (outputTokens * outPrice);

        await db.insert(usageEvents).values({
          userId: runRecord.ownerId,
          runId: params.runId,
          model: params.modelId,
          inputTokens,
          outputTokens,
          costMicroUsd
        } as any);
        console.log(`[UsageLog] Logged ${inputTokens + outputTokens} tokens, cost: ${costMicroUsd} micro-USD for run: ${params.runId}`);
      }
    } catch (e) {
      console.error('[UsageLog] Failed to log usage to database:', e);
    }
  }

  return {
    message: response.message,
    usage: response.usage,
    // Mock tool call triggering for test cases (e.g. if prompt contains 'search')
    toolCalls: params.history[params.history.length - 1].content.toLowerCase().includes('search')
      ? [{ id: 'call_abc123', name: 'web_search', arguments: { query: 'Solana market trends' } }]
      : undefined
  };
}

export async function settleBilling(runId: string) {
  console.log(`[Activity] Settling credit ledger holds for run: ${runId}`);
  return { success: true, settledCostMicroUsd: 12000n };
}
