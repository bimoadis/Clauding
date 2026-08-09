import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

async function runTest(scriptPath: string): Promise<boolean> {
  const absolutePath = path.join(__dirname, scriptPath);
  console.log(`\n=== Running Test: ${path.basename(scriptPath)} ===`);
  try {
    const { stdout, stderr } = await execAsync(`pnpm ts-node "${absolutePath}"`, {
      cwd: path.join(__dirname, '..')
    });
    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (err: any) {
    console.error(`❌ Test failed with error:`, err.message);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

async function runAllTests() {
  console.log('======================================================');
  console.log('       CLAUDING MASTER TEST SUITE (P0 - P3)           ');
  console.log('======================================================');

  // 1. SIWS Cryptographic Signature Helper Test
  const siwsOk = await runTest('auth/test_siws.ts');

  // 2. Python Sandbox Execution, Security Checks & Timeout Test
  const sandboxOk = await runTest('temporal/test_sandbox.ts');

  // 3. Agent Spec integrated skills compiler Test
  const integratedSkillsOk = await runTest('agents/test_integrated_skills.ts');

  // 4. Temporal tools catalog Test
  const toolsCatalogOk = await runTest('temporal/test_tools_catalog.ts');

  // 5. Auth Flow Challenge-Response Integration Test (requires server running)
  // We run this test hitting the active dev server on port 3001
  const authFlowOk = await runTest('auth/test_auth_flow.ts');

  console.log('\n======================================================');
  console.log('                 FINAL TEST REPORT                    ');
  console.log('======================================================');
  console.log(`1. Cryptographic SIWS Verification:  ${siwsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. Python Sandbox & Timeout Limits:   ${sandboxOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. Agent Spec Compiler (Skills):      ${integratedSkillsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`4. Temporal Tools Catalog:            ${toolsCatalogOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`5. End-to-End Auth Flow (SIWS + JWT): ${authFlowOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('======================================================');

  if (siwsOk && sandboxOk && integratedSkillsOk && toolsCatalogOk && authFlowOk) {
    console.log('\n🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY! CLAUDING IS SECURE & COMPLIANT.');
  } else {
    console.error('\n❌ SOME TESTS FAILED. PLEASE AUDIT LOGS.');
    process.exit(1);
  }
}

runAllTests();
