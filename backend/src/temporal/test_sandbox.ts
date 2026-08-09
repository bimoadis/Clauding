import { runPythonSandbox } from './sandbox';

async function testSandbox() {
  console.log('--- Testing Python Sandbox ---');

  // Test Case 1: Simple execution
  const res1 = await runPythonSandbox('print("Hello World!")');
  console.log('Test 1 (Simple):', res1);
  if (res1.stdout === 'Hello World!' && res1.exitCode === 0) {
    console.log('✅ Test 1 Passed');
  } else {
    console.error('❌ Test 1 Failed');
  }

  // Test Case 2: Security check - blocked keyword
  const res2 = await runPythonSandbox('import os\nos.system("ls")');
  console.log('Test 2 (Security Block):', res2);
  if (res2.stderr.includes('Security Exception') && res2.exitCode === 1) {
    console.log('✅ Test 2 Passed (blocked correctly)');
  } else {
    console.error('❌ Test 2 Failed');
  }

  // Test Case 3: Infinite loop timeout
  console.log('Running infinite loop test (should take ~10s to timeout)...');
  const res3 = await runPythonSandbox('while True: pass');
  console.log('Test 3 (Timeout):', res3);
  if (res3.exitCode !== 0) {
    console.log('✅ Test 3 Passed (killed correctly)');
  } else {
    console.error('❌ Test 3 Failed');
  }
}

testSandbox();
