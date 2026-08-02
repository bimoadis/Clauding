import * as activities from './activities';

async function runActivitiesTest() {
  console.log('--- Starting Temporal Activities Unit Tests ---');

  // 1. Test loadAgentSpec
  try {
    const spec = await activities.loadAgentSpec('agent_scout');
    console.log('Spec loaded:', spec);
    if (spec.id === 'agent_scout' && spec.guardrails.max_steps === 5) {
      console.log('✅ TEST PASSED: loadAgentSpec returned correct values.');
    } else {
      console.error('❌ TEST FAILED: loadAgentSpec returned wrong schema.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: loadAgentSpec crashed:', err);
  }

  // 2. Test retrieveMemory
  try {
    const memory = await activities.retrieveMemory('thread_chat');
    console.log('Memory retrieved:', memory);
    if (memory.length > 0 && memory[0].role === 'system') {
      console.log('✅ TEST PASSED: retrieveMemory retrieved correct context.');
    } else {
      console.error('❌ TEST FAILED: retrieveMemory returned wrong array.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: retrieveMemory crashed:', err);
  }

  // 3. Test executeTool (web_search)
  try {
    const toolRes = await activities.executeTool({
      toolName: 'web_search',
      args: { query: 'Solana volume' },
      runId: 'run_test_123'
    });
    console.log('Tool Result (web_search):', toolRes);
    if (toolRes.success && toolRes.result?.includes('Solana')) {
      console.log('✅ TEST PASSED: executeTool (web_search) returned correct results.');
    } else {
      console.error('❌ TEST FAILED: executeTool (web_search) output mismatched.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: executeTool crashed:', err);
  }

  // 4. Test callProviderModel
  try {
    const modelRes = await activities.callProviderModel({
      modelId: 'gpt-4o',
      provider: 'openai',
      history: [{ role: 'user', content: 'Do a search on Solana trends' }],
      runId: 'run_test_123'
    });
    console.log('Model Call Response:', modelRes);
    if (modelRes.message && modelRes.toolCalls && modelRes.toolCalls[0].name === 'web_search') {
      console.log('✅ TEST PASSED: callProviderModel routed and parsed search tool calls successfully.');
    } else {
      console.error('❌ TEST FAILED: callProviderModel response mismatch.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: callProviderModel crashed:', err);
  }

  // 5. Test settleBilling
  try {
    const billingRes = await activities.settleBilling('run_test_123');
    console.log('Billing Settle Response:', billingRes);
    if (billingRes.success && billingRes.settledCostMicroUsd === 12000n) {
      console.log('✅ TEST PASSED: settleBilling settled ledger correctly.');
    } else {
      console.error('❌ TEST FAILED: settleBilling returned wrong details.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: settleBilling crashed:', err);
  }
}

runActivitiesTest();
