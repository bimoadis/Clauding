import { AgentsController } from './agents.controller';

async function runIntegratedSkillsTests() {
  console.log('--- Starting Integrated Skills Compiler Verification ---');
  const controller = new AgentsController();

  // Test Case 1: Solana and Twitter keywords
  const prompt1 = 'Verify Solana balance and tweet the update';
  const spec1 = await controller.compileAgent({ prompt: prompt1 });
  console.log(`Prompt: "${prompt1}"`);
  console.log('Compiled Tools:', spec1.tools);
  if (spec1.tools.includes('solana_balance') && spec1.tools.includes('twitter_post')) {
    console.log('✅ TEST PASSED: Successfully mapped Solana and Twitter tools.');
  } else {
    console.error('❌ TEST FAILED: Mismatched tools for prompt 1.');
  }

  // Test Case 2: Translation and voice keywords
  const prompt2 = 'Translate text context and output speech audio';
  const spec2 = await controller.compileAgent({ prompt: prompt2 });
  console.log(`Prompt: "${prompt2}"`);
  console.log('Compiled Tools:', spec2.tools);
  if (spec2.tools.includes('text_translator') && spec2.tools.includes('text_to_speech')) {
    console.log('✅ TEST PASSED: Successfully mapped Translation and Speech tools.');
  } else {
    console.error('❌ TEST FAILED: Mismatched tools for prompt 2.');
  }

  // Test Case 3: Sentiment and OCR keywords
  const prompt3 = 'Read transaction logs using ocr scanner and score sentiment';
  const spec3 = await controller.compileAgent({ prompt: prompt3 });
  console.log(`Prompt: "${prompt3}"`);
  console.log('Compiled Tools:', spec3.tools);
  if (spec3.tools.includes('image_ocr') && spec3.tools.includes('text_sentiment_score')) {
    console.log('✅ TEST PASSED: Successfully mapped OCR and Sentiment tools.');
  } else {
    console.error('❌ TEST FAILED: Mismatched tools for prompt 3.');
  }
}

runIntegratedSkillsTests();
