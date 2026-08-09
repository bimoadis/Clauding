import { Controller, Post, Get, Body, Query, Headers, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/auth.guard';

interface HeliusWebhookDto {
  signature: string;
  type: string;
  tokenTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }[];
  nativeTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
}

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook/helius')
  public handleHeliusWebhook(
    @Body() payload: HeliusWebhookDto[],
    @Headers('authorization') authHeader?: string
  ) {
    // Optional webhook authentication check
    console.log(`[Helius Webhook] Received webhook transaction alert.`);

    for (const tx of payload) {
      // 1. Process SOL transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        for (const transfer of tx.nativeTransfers) {
          // Check if receiver matches our mock Treasury wallet address
          if (transfer.toUserAccount === 'KIRB_TREASURY_SOL_ADDRESS') {
            const credited = this.billingService.creditDeposit(
              transfer.fromUserAccount,
              tx.signature,
              'SOL',
              BigInt(transfer.amount),
              240.0 // Mock SOL Price Oracle TWAP ($240 USD)
            );
            console.log(`Credited SOL transfer: ${credited.toString()} micro-USD to ${transfer.fromUserAccount}`);
          }
        }
      }

      // 2. Process $CLAUDING SPL Token transfers
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        for (const transfer of tx.tokenTransfers) {
          if (transfer.toUserAccount === 'KIRB_TREASURY_TOKEN_ADDRESS') {
            const credited = this.billingService.creditDeposit(
              transfer.fromUserAccount,
              tx.signature,
              'CLAUDING',
              BigInt(Math.floor(transfer.tokenAmount * 1e9)),
              0.15 // Mock $CLAUDING Token Price Oracle TWAP ($0.15 USD)
            );
            console.log(`Credited CLAUDING transfer: ${credited.toString()} micro-USD to ${transfer.fromUserAccount}`);
          }
        }
      }
    }

    return { status: 'success' };
  }

  @Get('wallet')
  @UseGuards(AuthGuard)
  public getWalletDetails(@Req() req: any) {
    const userId = req.user.sub;
    if (!userId) throw new BadRequestException('userId is required');
    const wallet = this.billingService.getOrCreateWallet(userId);
    const ledger = this.billingService.getLedgerEntries(userId);

    return {
      balanceUsd: (Number(wallet.balanceMicroUsd) / 1000000).toFixed(2),
      balanceMicroUsd: wallet.balanceMicroUsd.toString(),
      claudingBalance: wallet.claudingBalance.toString(),
      ledger: ledger.map(l => ({
        ...l,
        amountMicroUsd: l.amountMicroUsd.toString()
      }))
    };
  }
}
