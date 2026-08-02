import { PromptComposer } from './prompt-composer.service';
import { Character } from './character.interface';

function runComposerTests() {
  console.log('--- Starting Prompt Composer Unit Tests ---');
  const composer = new PromptComposer();

  // 1. Mock Character
  const mockCharacter: Character = {
    id: 'char_analyst',
    name: 'The Analyst',
    tagline: 'Precise and data-first.',
    identity: 'A rigorous financial analyst who values data integrity.',
    voice: {
      tone: ['precise', 'direct', 'calm'],
      formality: 0.9,     // High formality
      verbosity: 0.2,     // Terse responses
      emoji: false,       // No emojis
      signatureMoves: ['always leads with numbers']
    },
    values: ['accuracy', 'clarity'],
    dos: ['Double check token quantities', 'Cite blocks/tx hashes'],
    donts: ['Never give financial advice', 'Avoid hype words'],
    sampleUtterances: ['Here is what the raw ledger states.'],
    modelAffinity: { preferred: 'gpt-4o', temperature: 0.3 },
    safetyLocked: true
  };

  // 2. Mock Agent Spec instructions
  const agentInstructions = 'Verify user balance and alert on large transactions.';

  // 3. Mock Session Context
  const sessionContext = {
    userWallet: '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
    timestamp: '2026-07-31T14:30:00Z',
    memory: ['User deposited 5 SOL on 2026-07-30']
  };

  // 4. Compose System Prompt
  const prompt = composer.compose(agentInstructions, mockCharacter, sessionContext);

  console.log('--- Generated Compiled Prompt Output ---');
  console.log(prompt);
  console.log('----------------------------------------');

  // Assertions
  if (prompt.includes('[Layer 0: Platform Policy]')) {
    console.log('✅ TEST PASSED: Layer 0 Platform safety rules found.');
  } else {
    console.error('❌ TEST FAILED: Layer 0 Platform safety rules missing.');
  }

  if (prompt.includes('[Layer 1: Character Persona - The Analyst]')) {
    console.log('✅ TEST PASSED: Layer 1 Character header and attributes found.');
  } else {
    console.error('❌ TEST FAILED: Layer 1 Character persona missing.');
  }

  // Check voice directives mapping: formality = 0.9 => "Speak in a highly professional and structured manner."
  if (prompt.includes('Speak in a highly professional and structured manner.')) {
    console.log('✅ TEST PASSED: Formality voice knob correctly mapped to prompt text.');
  } else {
    console.error('❌ TEST FAILED: Formality mapping failed.');
  }

  // Check voice directives mapping: verbosity = 0.2 => "Provide extremely brief, direct, and terse responses."
  if (prompt.includes('Provide extremely brief, direct, and terse responses.')) {
    console.log('✅ TEST PASSED: Verbosity voice knob correctly mapped to prompt text.');
  } else {
    console.error('❌ TEST FAILED: Verbosity mapping failed.');
  }

  // Check voice directives mapping: emoji = false => "Do not use emojis under any circumstances."
  if (prompt.includes('Do not use emojis under any circumstances.')) {
    console.log('✅ TEST PASSED: Emoji exclusion correctly mapped to prompt text.');
  } else {
    console.error('❌ TEST FAILED: Emoji mapping failed.');
  }

  if (prompt.includes('[Layer 2: Agent Specific Instructions]')) {
    console.log('✅ TEST PASSED: Layer 2 Agent tasks found.');
  } else {
    console.error('❌ TEST FAILED: Layer 2 Agent tasks missing.');
  }

  if (prompt.includes('[Layer 3: Session Context]')) {
    console.log('✅ TEST PASSED: Layer 3 Session parameters (wallet, time, episodic memory) found.');
  } else {
    console.error('❌ TEST FAILED: Layer 3 Session context missing.');
  }
}

runComposerTests();
