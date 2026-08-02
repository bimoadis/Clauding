import { ModelRouter } from './model-router.service';
import { ModelRef, RoutingRequest } from './model-router.interface';

function runRouterTests() {
  console.log('--- Starting Model Router Unit Tests ---');
  const router = new ModelRouter();

  // Mock catalog
  const catalog: ModelRef[] = [
    {
      id: 'claude-3-5-sonnet',
      provider: 'anthropic',
      displayName: 'Claude 3.5 Sonnet',
      inPriceMicroUsd: 3000000n, // $3 per 1M
      outPriceMicroUsd: 15000000n, // $15 per 1M
      qualityRank: 95,
      latencyAvgMs: 1200,
      healthy: true,
      capabilities: ['function_calling', 'vision']
    },
    {
      id: 'gpt-4o',
      provider: 'openai',
      displayName: 'GPT-4o',
      inPriceMicroUsd: 5000000n, // $5 per 1M
      outPriceMicroUsd: 15000000n, // $15 per 1M
      qualityRank: 92,
      latencyAvgMs: 800,
      healthy: true,
      capabilities: ['function_calling', 'vision']
    },
    {
      id: 'gpt-3.5-turbo',
      provider: 'openai',
      displayName: 'GPT-3.5 Turbo',
      inPriceMicroUsd: 500000n, // $0.5 per 1M
      outPriceMicroUsd: 1500000n, // $1.5 per 1M
      qualityRank: 60,
      latencyAvgMs: 400,
      healthy: true,
      capabilities: ['function_calling']
    },
    {
      id: 'llama-3-unhealthy',
      provider: 'llama',
      displayName: 'Llama 3 Local',
      inPriceMicroUsd: 0n,
      outPriceMicroUsd: 0n,
      qualityRank: 75,
      latencyAvgMs: 300,
      healthy: false, // Unhealthy
      capabilities: ['function_calling']
    }
  ];

  // 1. Test Economy Tier Routing (should prefer GPT-3.5 Turbo due to cost weighting)
  const economyReq: RoutingRequest = { costTier: 'economy' };
  const economyChain = router.route(economyReq, catalog);
  console.log(`Economy Tier Primary Selection: ${economyChain[0].id}`);
  if (economyChain[0].id === 'gpt-3.5-turbo') {
    console.log('✅ TEST PASSED: Economy tier correctly routed to cheapest model.');
  } else {
    console.error('❌ TEST FAILED: Economy tier did not route to cheapest model.');
  }

  // 2. Test Premium Tier Routing (should prefer Claude-3-5-sonnet due to quality weighting)
  const premiumReq: RoutingRequest = { costTier: 'premium' };
  const premiumChain = router.route(premiumReq, catalog);
  console.log(`Premium Tier Primary Selection: ${premiumChain[0].id}`);
  if (premiumChain[0].id === 'claude-3-5-sonnet') {
    console.log('✅ TEST PASSED: Premium tier correctly routed to highest quality model.');
  } else {
    console.error('❌ TEST FAILED: Premium tier did not route to highest quality model.');
  }

  // 3. Test Pinned Model Routing (should only select the pinned model)
  const pinnedReq: RoutingRequest = { pinnedModel: 'gpt-4o' };
  const pinnedChain = router.route(pinnedReq, catalog);
  console.log(`Pinned Model Selection Chain Length: ${pinnedChain.length}, Model: ${pinnedChain[0].id}`);
  if (pinnedChain.length === 1 && pinnedChain[0].id === 'gpt-4o') {
    console.log('✅ TEST PASSED: Pinned model routing correctly restricted choices.');
  } else {
    console.error('❌ TEST FAILED: Pinned model routing did not enforce bounds.');
  }

  // 4. Test Capabilities Filtering (requires 'vision')
  const visionReq: RoutingRequest = { requires: ['vision'], costTier: 'economy' };
  const visionChain = router.route(visionReq, catalog);
  console.log(`Vision Required Selections: ${visionChain.map(m => m.id).join(', ')}`);
  if (!visionChain.some(m => m.id === 'gpt-3.5-turbo')) {
    console.log('✅ TEST PASSED: Models lacking vision were filtered out.');
  } else {
    console.error('❌ TEST FAILED: Model lacking vision was not filtered out.');
  }

  // 5. Test Unhealthy models exclusion (should not contain llama-3-unhealthy)
  const anyReq: RoutingRequest = { costTier: 'balanced' };
  const anyChain = router.route(anyReq, catalog);
  if (!anyChain.some(m => m.id === 'llama-3-unhealthy')) {
    console.log('✅ TEST PASSED: Unhealthy models were successfully skipped.');
  } else {
    console.error('❌ TEST FAILED: Unhealthy model was included in chain.');
  }
}

runRouterTests();
