import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  loadAgentSpec,
  retrieveMemory,
  executeTool,
  callProviderModel,
  settleBilling
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumAttempts: 3
  }
});

interface WorkflowParams {
  runId: string;
  agentId: string;
  threadId: string;
  userMessage: string;
}

export async function runAgentWorkflow(params: WorkflowParams): Promise<void> {
  const spec = await loadAgentSpec(params.agentId);
  const conversationHistory = await retrieveMemory(params.threadId);
  conversationHistory.push({ role: 'user', content: params.userMessage });

  let steps = 0;
  // Free tier has max 5 steps, Pro tier has max 15 steps (enforced via spec.guardrails)
  // We apply a hard cap of 15 steps as maximum absolute limit.
  const maxSteps = Math.min(spec.guardrails?.maxSteps || spec.guardrails?.max_steps || 5, 15);
  const maxTokens = spec.guardrails?.maxTokensPerRun || 20000;
  let totalTokens = 0;
  let isDone = false;

  while (steps < maxSteps && totalTokens < maxTokens && !isDone) {
    steps++;

    // Execute completion model call Activity
    const response = await callProviderModel({
      modelId: 'gpt-4o',
      provider: 'openai',
      history: conversationHistory,
      runId: params.runId
    });

    // Track tokens if usage data is returned
    if (response.usage) {
      const input = response.usage.inputTokens || 0;
      const output = response.usage.outputTokens || 0;
      totalTokens += (input + output);
    }

    conversationHistory.push({ role: 'assistant', content: response.message });

    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const tool of response.toolCalls) {
        // Execute sandboxed tool Activity
        const observation = await executeTool({
          toolName: tool.name,
          args: tool.arguments,
          runId: params.runId
        });

        conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(observation),
          toolCallId: tool.id
        });
      }
    } else {
      isDone = true;
    }
  }

  // Settle run cost against ledger Activity
  await settleBilling(params.runId);
}
