import { Controller, Get, Post, Body, Req, Sse, MessageEvent, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { OpenAIAdapter } from '../models/adapters/openai.adapter';
import { AnthropicAdapter } from '../models/adapters/anthropic.adapter';
import { ModelRouter } from '../models/model-router.service';
import { ModelRef } from '../models/model-router.interface';

interface ChatStreamDto {
  message: string;
  agentId?: string;
  costTier?: 'economy' | 'balanced' | 'premium';
}

@Controller('v1/chat')
export class ChatController {
  private openai = new OpenAIAdapter();
  private anthropic = new AnthropicAdapter();
  private router = new ModelRouter();

  // Mock database model catalog
  private modelsCatalog: ModelRef[] = [
    {
      id: 'claude-3-5-sonnet',
      provider: 'anthropic',
      displayName: 'Claude 3.5 Sonnet',
      inPriceMicroUsd: 3000000n,
      outPriceMicroUsd: 15000000n,
      qualityRank: 95,
      latencyAvgMs: 1200,
      healthy: true,
      capabilities: ['function_calling', 'vision']
    },
    {
      id: 'gpt-4o',
      provider: 'openai',
      displayName: 'GPT-4o',
      inPriceMicroUsd: 5000000n,
      outPriceMicroUsd: 15000000n,
      qualityRank: 92,
      latencyAvgMs: 800,
      healthy: true,
      capabilities: ['function_calling', 'vision']
    },
    {
      id: 'gpt-3.5-turbo',
      provider: 'openai',
      displayName: 'GPT-3.5 Turbo',
      inPriceMicroUsd: 500000n,
      outPriceMicroUsd: 1500000n,
      qualityRank: 60,
      latencyAvgMs: 400,
      healthy: true,
      capabilities: ['function_calling']
    }
  ];

  @Get('stream')
  @Sse() // Marks it as an SSE stream
  public handleChatStream(
    @Query('message') message: string,
    @Query('costTier') costTier?: 'economy' | 'balanced' | 'premium',
    @Query('tools') toolsStr?: string
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          // Parse allowed tools list
          let allowedTools: string[] | undefined = undefined;
          if (toolsStr) {
            try {
              allowedTools = JSON.parse(toolsStr);
            } catch (e) {
              console.error('Failed to parse tools query parameter:', e);
            }
          }

          // 1. Select Model using Router
          const routedModels = this.router.route(
            { costTier: costTier ?? 'balanced' },
            this.modelsCatalog
          );
          const activeModel = routedModels[0];

          // Send run.started event
          subscriber.next({
            type: 'run.started',
            data: JSON.stringify({ runId: 'run_' + Math.random().toString(36).substring(7), model: activeModel.id })
          });

          // 2. Stream tokens from the adapter
          const adapter = activeModel.provider === 'openai' ? this.openai : this.anthropic;
          const stream = adapter.stream({
            model: activeModel.id,
            messages: [{ role: 'user', content: message }],
            allowedTools
          });

          for await (const chunk of stream) {
            if (chunk.delta) {
              subscriber.next({
                type: 'token',
                data: JSON.stringify({ delta: chunk.delta })
              });
            }
            if (chunk.usage) {
              subscriber.next({
                type: 'usage',
                data: JSON.stringify(chunk.usage)
              });
            }
          }

          // Send run.completed event
          subscriber.next({
            type: 'run.completed',
            data: JSON.stringify({ finishReason: 'stop' })
          });

          subscriber.complete();
        } catch (error) {
          subscriber.next({
            type: 'error',
            data: JSON.stringify({ detail: error instanceof Error ? error.message : 'Unknown routing error' })
          });
          subscriber.complete();
        }
      })();
    });
  }
}
