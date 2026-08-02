import { BillingService } from './billing.service';

function runBillingTests() {
  console.log('--- Starting Billing Ledger Unit Tests ---');
  const service = new BillingService();
  const userId = '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv';

  // 1. Check initial wallet creation
  const wallet = service.getOrCreateWallet(userId);
  console.log(`Initial Balance: ${wallet.balanceMicroUsd.toString()} micro-USD`);
  if (wallet.balanceMicroUsd === 10000000n) {
    console.log('✅ TEST PASSED: Initial wallet successfully seeded with $10 free credit.');
  } else {
    console.error('❌ TEST FAILED: Initial wallet balance mismatched.');
  }

  // 2. Test reserveHold (reserve $1.50)
  try {
    const runId = 'run_abc123';
    service.reserveHold(userId, runId, 1500000n);
    console.log('Hold reserved successfully.');
    console.log('Ledger logs after hold:', service.getLedgerEntries(userId));
    console.log('✅ TEST PASSED: Hold successfully reserved.');
  } catch (err) {
    console.error('❌ TEST FAILED: Hold reservation crashed:', err);
  }

  // 3. Test settleRun (release hold, charge $1.20 without discount)
  try {
    const runId = 'run_abc123';
    const finalCost = service.settleRun(userId, runId, 1200000n, false);
    console.log(`Settle charge cost: ${finalCost.toString()} micro-USD`);
    console.log(`Updated Balance: ${wallet.balanceMicroUsd.toString()} micro-USD`);
    if (finalCost === 1200000n && wallet.balanceMicroUsd === 8800000n) {
      console.log('✅ TEST PASSED: Settle successfully released hold and debited exact balance.');
    } else {
      console.error('❌ TEST FAILED: Settle cost or final balance mismatched.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: Settle crashed:', err);
  }

  // 4. Test settleRun with token discount (charge $1.00 with 10% discount -> $0.90)
  try {
    const runId2 = 'run_xyz456';
    service.reserveHold(userId, runId2, 1000000n);
    const finalCost = service.settleRun(userId, runId2, 1000000n, true);
    console.log(`Settle with discount charge: ${finalCost.toString()} micro-USD`);
    console.log(`Updated Balance: ${wallet.balanceMicroUsd.toString()} micro-USD`);
    if (finalCost === 900000n && wallet.balanceMicroUsd === 7900000n) {
      console.log('✅ TEST PASSED: Settle with token discount correctly computed 10% off.');
    } else {
      console.error('❌ TEST FAILED: Discount computation failed.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: Settle with discount crashed:', err);
  }

  // 5. Test creditDeposit (Deposit 0.05 SOL with SOL priced at $240 -> $12.00 / 12,000,000 micro-USD)
  const txSig = '5tVzGkNu7zCsd8v2J6q1mQJk29gBf2T9qJ5T1gV9hS2W';
  try {
    const amountNative = 50000000n; // 0.05 SOL in lamports
    const credited = service.creditDeposit(userId, txSig, 'SOL', amountNative, 240.0);
    console.log(`Credited Deposit: ${credited.toString()} micro-USD`);
    console.log(`Updated Balance: ${wallet.balanceMicroUsd.toString()} micro-USD`);
    if (credited === 12000000n && wallet.balanceMicroUsd === 19900000n) {
      console.log('✅ TEST PASSED: Credit deposit successfully converted SOL lamports to Micro USD.');
    } else {
      console.error('❌ TEST FAILED: Deposit credit value mismatched.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: Deposit topup crashed:', err);
  }

  // 6. Test duplicate deposit transaction prevention
  try {
    service.creditDeposit(userId, txSig, 'SOL', 50000000n, 240.0);
    console.error('❌ TEST FAILED: Duplicate deposit transaction was not rejected.');
  } catch (err) {
    console.log('✅ TEST PASSED: Successfully blocked duplicate deposit signature.');
  }
}

runBillingTests();
