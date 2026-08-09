import { Controller, Get, Post, Body, Req, Sse, MessageEvent, Query, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { OpenAIAdapter } from '../models/adapters/openai.adapter';
import { AnthropicAdapter } from '../models/adapters/anthropic.adapter';
import { ModelRouter } from '../models/model-router.service';
import { ModelRef } from '../models/model-router.interface';
import { db } from '../db/db';
import { users, threads, messages, agents } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthGuard } from '../auth/auth.guard';
import { TemporalService } from '../temporal/temporal.service';

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

  constructor(private readonly temporalService: TemporalService) {}

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
  @UseGuards(AuthGuard)
  @Sse() // Marks it as an SSE stream
  public handleChatStream(
    @Query('message') message: string,
    @Req() req: any,
    @Query('costTier') costTier?: 'economy' | 'balanced' | 'premium',
    @Query('tools') toolsStr?: string,
    @Query('agentId') agentId?: string
  ): Observable<MessageEvent> {
    const wallet = req.user.sub;
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

          // Database Persistence Integration
          let dbUser = null;
          let dbThread = null;
          if (wallet && wallet.trim().length > 0) {
            try {
              // 1. Find or create user
              dbUser = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1).then(r => r[0]);
              if (!dbUser) {
                const [newUser] = await db.insert(users).values({ wallet }).returning();
                dbUser = newUser;
              }

              // 2. Find or create thread for this user and agent
              const agentUuid = agentId && agentId.trim().length > 0 ? agentId : null;
              if (agentUuid) {
                dbThread = await db.select().from(threads).where(
                  and(
                    eq(threads.ownerId, dbUser.id),
                    eq(threads.agentId, agentUuid)
                  )
                ).limit(1).then(r => r[0]);

                if (!dbThread) {
                  const [newThread] = await db.insert(threads).values({
                    ownerId: dbUser.id,
                    agentId: agentUuid,
                    title: `Chat Session with Agent`
                  } as any).returning();
                  dbThread = newThread;
                }
              } else {
                dbThread = await db.select().from(threads).where(
                  and(
                    eq(threads.ownerId, dbUser.id),
                    eq(threads.title, 'General Chat')
                  )
                ).limit(1).then(r => r[0]);

                if (!dbThread) {
                  const [newThread] = await db.insert(threads).values({
                    ownerId: dbUser.id,
                    title: 'General Chat'
                  } as any).returning();
                  dbThread = newThread;
                }
              }

              // 3. Save User message to db
              await db.insert(messages).values({
                threadId: dbThread.id,
                role: 'user',
                content: message
              });
            } catch (err) {
              console.error('Failed to initialize thread/messages in DB:', err);
            }
          }

          // Retrieve message history context for the LLM session
          let finalMessages: { role: 'user' | 'assistant'; content: string }[] = [{ role: 'user', content: message }];
          if (dbThread) {
            try {
              const pastMsgs = await db.select().from(messages)
                .where(eq(messages.threadId, dbThread.id))
                .orderBy(messages.createdAt);
              
              if (pastMsgs.length > 0) {
                finalMessages = pastMsgs.map(m => ({
                  role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                  content: m.content
                }));
              }
            } catch (err) {
              console.error('Failed to load thread history for LLM context:', err);
            }
          }

          const runId = 'run_' + Math.random().toString(36).substring(7);

          // Send run.started event
          subscriber.next({
            type: 'run.started',
            data: JSON.stringify({ runId, model: activeModel.id })
          });

          // Dispatch to Temporal workflow as a background process
          if (dbThread && agentId) {
            this.temporalService.startAgentRun({
              runId,
              agentId,
              threadId: dbThread.id,
              userMessage: message
            }).catch((err) => {
              console.error('[Temporal] Asynchronous startAgentRun failed:', err);
            });
          }

          // 2. Stream tokens from the adapter
          const adapter = activeModel.provider === 'openai' ? this.openai : this.anthropic;
          const stream = adapter.stream({
            model: activeModel.id,
            messages: finalMessages,
            allowedTools,
            wallet: wallet || undefined
          });

          let fullResponse = '';
          for await (const chunk of stream) {
            if (chunk.delta) {
              fullResponse += chunk.delta;
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

          // Save assistant response to DB
          if (dbThread && fullResponse.length > 0) {
            try {
              await db.insert(messages).values({
                threadId: dbThread.id,
                role: 'assistant',
                content: fullResponse
              });
            } catch (err) {
              console.error('Failed to save assistant message to DB:', err);
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

  @Get('history')
  @UseGuards(AuthGuard)
  public async getChatHistory(
    @Req() req: any,
    @Query('agentId') agentId?: string
  ) {
    const wallet = req.user.sub;
    if (!wallet) {
      return [];
    }
    try {
      const dbUser = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1).then(r => r[0]);
      if (!dbUser) {
        return [];
      }

      let dbThread = null;
      const agentUuid = agentId && agentId.trim().length > 0 ? agentId : null;
      if (agentUuid) {
        dbThread = await db.select().from(threads).where(
          and(
            eq(threads.ownerId, dbUser.id),
            eq(threads.agentId, agentUuid)
          )
        ).limit(1).then(r => r[0]);
      } else {
        dbThread = await db.select().from(threads).where(
          and(
            eq(threads.ownerId, dbUser.id),
            eq(threads.title, 'General Chat')
          )
        ).limit(1).then(r => r[0]);
      }

      if (!dbThread) {
        return [];
      }

      const history = await db.select().from(messages).where(
        eq(messages.threadId, dbThread.id)
      ).orderBy(messages.createdAt);

      return history.map(m => ({
        role: m.role,
        content: m.content
      }));
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      return [];
    }
  }

  @Get('health')
  public checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
