import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ModelRouter } from './models/model-router.service';
import { AgentsController } from './agents/agents.controller';
import { PromptComposer } from './characters/prompt-composer.service';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';

@Module({
  imports: [],
  controllers: [ChatController, AgentsController, BillingController],
  providers: [ModelRouter, PromptComposer, BillingService],
})
export class AppModule {}
