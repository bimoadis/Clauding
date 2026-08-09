import { Injectable, BadRequestException } from '@nestjs/common';

export interface Wallet {
  userId: string;
  balanceMicroUsd: bigint;
  claudingBalance: bigint;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  kind: 'topup' | 'usage' | 'hold' | 'hold_release';
  amountMicroUsd: bigint;
  refType?: string;
  refId?: string;
  metadata?: string;
}

@Injectable()
export class BillingService {
  // In-memory mock database state for local test sandbox runs
  private mockWallets = new Map<string, Wallet>();
  private mockLedgers: LedgerEntry[] = [];
  private processedDeposits = new Set<string>();

  /**
   * Reserve credit balance before running an agent task. (Disabled/No-op)
   */
  public reserveHold(userId: string, runId: string, estimatedCostMicroUsd: bigint): void {
    // Billing hold checks disabled
    return;
  }

  /**
   * Release reservation and settle the actual token usage against the ledger. (Disabled/No-op)
   */
  public settleRun(userId: string, runId: string, actualCostMicroUsd: bigint, discountApplied: boolean = false): bigint {
    // Settle/Debit calculations disabled
    return 0n;
  }

  /**
   * Process and credit crypto deposits securely using txSignature idempotency. (Disabled/No-op)
   */
  public creditDeposit(
    userId: string,
    txSignature: string,
    asset: 'SOL' | 'CLAUDING',
    amountNative: bigint,
    oraclePriceUsd: number
  ): bigint {
    // Deposit processing disabled
    return 0n;
  }

  public getOrCreateWallet(userId: string): Wallet {
    return {
      userId,
      balanceMicroUsd: 1000000000n, // $1,000.00 dummy USD balance
      claudingBalance: 5000000000n    // 5,000 CLAUDING dummy balance
    };
  }

  private getActiveHolds(userId: string): bigint {
    return 0n;
  }

  public getLedgerEntries(userId: string): LedgerEntry[] {
    return [];
  }
}
