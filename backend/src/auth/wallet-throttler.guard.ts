import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { db } from '../db/db';
import { users, wallets } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WalletThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration } = requestProps;
    const request = context.switchToHttp().getRequest();
    const walletAddress = request.user?.sub;

    if (!walletAddress) {
      // Default to IP tracker if not logged in
      const tracker = request.ip || 'anonymous';
      const key = this.generateKey(context, tracker, throttler.name);
      const { totalHits } = await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name
      );
      if (totalHits > limit) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }

    // Resolve tier from DB (Free vs Pro)
    let isPro = false;
    try {
      const userRecord = await db.select().from(users).where(eq(users.wallet, walletAddress)).limit(1).then(r => r[0]);
      if (userRecord) {
        const walletRecord = await db.select().from(wallets).where(eq(wallets.userId, userRecord.id)).limit(1).then(r => r[0]);
        if (walletRecord) {
          // Pro tier criteria: holds >= 50,000 CLAUDING or USD credit balance >= $10.00 (10,000,000 micro-USD)
          if (walletRecord.claudingBalance >= 50000n || walletRecord.balanceMicroUsd >= 10000000n) {
            isPro = true;
          }
        }
      }
    } catch (e) {
      console.error('[RateLimit] Failed to query wallet balance, defaulting to Free tier:', e);
    }

    // Determine limit dynamically based on throttler config and user tier
    let finalLimit = limit;
    if (throttler.name === 'hourly') {
      finalLimit = isPro ? 100 : 20; // Pro gets 100 per hour, Free gets 20
    } else if (throttler.name === 'daily') {
      finalLimit = isPro ? 300 : 100; // Pro gets 300 per day, Free gets 100
    }

    const tracker = walletAddress;
    const key = this.generateKey(context, tracker, throttler.name);
    const { totalHits } = await this.storageService.increment(
      key,
      ttl,
      finalLimit,
      blockDuration,
      throttler.name
    );

    if (totalHits > finalLimit) {
      throw new HttpException({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Rate limit exceeded for tier: ${isPro ? 'Pro' : 'Free'}.`,
        tier: isPro ? 'Pro' : 'Free',
        limit: finalLimit
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
