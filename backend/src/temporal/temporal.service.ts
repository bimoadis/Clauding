import { Injectable, OnModuleInit } from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit {
  private client: Client | null = null;

  async onModuleInit() {
    try {
      const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
      });
      this.client = new Client({
        connection
      });
      console.log('[Temporal] Successfully connected to Temporal server.');
    } catch (err: any) {
      console.warn('[Temporal] Failed to connect to Temporal server (running in standalone mock mode):', err.message);
    }
  }

  public getClient(): Client | null {
    return this.client;
  }

  public async startAgentRun(params: { runId: string; agentId: string; threadId: string; userMessage: string }) {
    if (!this.client) {
      console.warn('[Temporal] Temporal client not active. Skipping workflow startup.');
      return null;
    }
    try {
      const handle = await this.client.workflow.start('runAgentWorkflow', {
        taskQueue: 'clauding-agent-tasks',
        workflowId: `agent-run-${params.runId}`,
        args: [params]
      });
      console.log(`[Temporal] Dispatched runAgentWorkflow successfully. Workflow ID: agent-run-${params.runId}`);
      return handle;
    } catch (err: any) {
      console.error('[Temporal] Failed to dispatch workflow:', err.message);
      return null;
    }
  }
}
