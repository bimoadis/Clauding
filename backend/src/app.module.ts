import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ModelRouter } from './models/model-router.service';
import { AgentsController } from './agents/agents.controller';
import { PromptComposer } from './characters/prompt-composer.service';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WalletThrottlerGuard } from './auth/wallet-throttler.guard';
import { TemporalService } from './temporal/temporal.service';

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: 'hourly',
        ttl: 2 * 3600 * 1000, // 2 hours TTL (20 questions per 2 hours)
        limit: 20,
      },
      {
        name: 'daily',
        ttl: 24 * 3600 * 1000,
        limit: 100,
      }
    ])
  ],
  controllers: [ChatController, AgentsController, BillingController],
  providers: [
    ModelRouter,
    PromptComposer,
    BillingService,
    TemporalService,
    {
      provide: APP_GUARD,
      useClass: WalletThrottlerGuard
    }
  ],
})
export class AppModule {}
