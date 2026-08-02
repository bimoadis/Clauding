import { Injectable, BadRequestException } from '@nestjs/common';

export interface Wallet {
  userId: string;
  balanceMicroUsd: bigint;
  kirbleBalance: bigint;
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
   * Reserve credit balance before running an agent task.
   */
  public reserveHold(userId: string, runId: string, estimatedCostMicroUsd: bigint): void {
    const wallet = this.getOrCreateWallet(userId);
    const activeHolds = this.getActiveHolds(userId);

    const availableCredits = wallet.balanceMicroUsd - activeHolds;
    if (availableCredits < estimatedCostMicroUsd) {
      throw new BadRequestException('Insufficient credits balance for hold reservation');
    }

    // Add hold record to ledger
    this.mockLedgers.push({
      id: 'ledg_' + Math.random().toString(36).substring(7),
      userId,
      kind: 'hold',
      amountMicroUsd: -estimatedCostMicroUsd,
      refType: 'run',
      refId: runId
    });
  }

  /**
   * Release reservation and settle the actual token usage against the ledger.
   */
  public settleRun(userId: string, runId: string, actualCostMicroUsd: bigint, discountApplied: boolean = false): bigint {
    const wallet = this.getOrCreateWallet(userId);

    // 1. Release the hold
    const holdEntryIndex = this.mockLedgers.findIndex(l => l.userId === userId && l.refId === runId && l.kind === 'hold');
    let holdAmount = 0n;
    if (holdEntryIndex !== -1) {
      holdAmount = -this.mockLedgers[holdEntryIndex].amountMicroUsd;
      this.mockLedgers.splice(holdEntryIndex, 1); // Remove/release the hold
    }

    // 2. Calculate Token Discount (e.g. 10% off when paying in $KIRBLE tokens)
    let finalCost = actualCostMicroUsd;
    if (discountApplied) {
      finalCost = (actualCostMicroUsd * 90n) / 100n; // 10% discount
    }

    // 3. Update Wallet Balance
    wallet.balanceMicroUsd -= finalCost;

    // 4. Write Settlement ledger entry
    this.mockLedgers.push({
      id: 'ledg_' + Math.random().toString(36).substring(7),
      userId,
      kind: 'usage',
      amountMicroUsd: -finalCost,
      refType: 'run',
      refId: runId,
      metadata: JSON.stringify({ originalCost: actualCostMicroUsd.toString(), discountApplied })
    });

    return finalCost;
  }

  /**
   * Process and credit crypto deposits securely using txSignature idempotency.
   */
  public creditDeposit(
    userId: string,
    txSignature: string,
    asset: 'SOL' | 'KIRBLE',
    amountNative: bigint,
    oraclePriceUsd: number
  ): bigint {
    if (this.processedDeposits.has(txSignature)) {
      throw new BadRequestException('Deposit transaction has already been credited');
    }

    // Convert Native SOL lamports / token units to Micro USD
    // 1 USD = 1,000,000 micro-USD.
    // Example: SOL amount is in lamports (10^9), Oracle price is in USD
    let creditedMicroUsd = 0n;
    if (asset === 'SOL') {
      const solAmount = Number(amountNative) / 1e9;
      creditedMicroUsd = BigInt(Math.floor(solAmount * oraclePriceUsd * 1000000));
    } else {
      // $KIRBLE token has 9 decimals as well
      const tokenAmount = Number(amountNative) / 1e9;
      creditedMicroUsd = BigInt(Math.floor(tokenAmount * oraclePriceUsd * 1000000));
    }

    const wallet = this.getOrCreateWallet(userId);
    wallet.balanceMicroUsd += creditedMicroUsd;

    // Record topup on ledger
    this.mockLedgers.push({
      id: 'ledg_' + Math.random().toString(36).substring(7),
      userId,
      kind: 'topup',
      amountMicroUsd: creditedMicroUsd,
      refType: 'deposit',
      refId: txSignature
    });

    this.processedDeposits.add(txSignature);
    return creditedMicroUsd;
  }

  public getOrCreateWallet(userId: string): Wallet {
    if (!this.mockWallets.has(userId)) {
      this.mockWallets.set(userId, {
        userId,
        balanceMicroUsd: 10000000n, // Start with $10 free credit balance
        kirbleBalance: 0n
      });
    }
    return this.mockWallets.get(userId)!;
  }

  private getActiveHolds(userId: string): bigint {
    return this.mockLedgers
      .filter(l => l.userId === userId && l.kind === 'hold')
      .reduce((sum, current) => sum - current.amountMicroUsd, 0n);
  }

  public getLedgerEntries(userId: string): LedgerEntry[] {
    return this.mockLedgers.filter(l => l.userId === userId);
  }
}
