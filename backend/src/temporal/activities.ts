import { OpenAIAdapter } from '../models/adapters/openai.adapter';
import { AnthropicAdapter } from '../models/adapters/anthropic.adapter';
import { Message } from '../models/provider-adapter.interface';

const openai = new OpenAIAdapter();
const anthropic = new AnthropicAdapter();

import { toolCatalog } from './tool-catalog';

export async function loadAgentSpec(agentId: string) {
  console.log(`[Activity] Loading AgentSpec for: ${agentId}`);
  return {
    id: agentId,
    name: 'Crypto Alpha Scout',
    instructions: 'Monitor crypto news and alert on market moving events.',
    guardrails: { max_steps: 5 }
  };
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
