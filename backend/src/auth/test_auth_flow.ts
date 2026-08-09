import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

async function testAuthFlow() {
  console.log('--- Starting Integration Test for Solana SIWS & JWT Auth Flow ---');

  const BASE_URL = 'http://localhost:3001';

  // 1. Generate two test Solana keypairs (Wallet A and Wallet B)
  const walletA = nacl.sign.keyPair();
  const publicKeyA = bs58.encode(walletA.publicKey);

  const walletB = nacl.sign.keyPair();
  const publicKeyB = bs58.encode(walletB.publicKey);

  console.log(`Wallet A: ${publicKeyA}`);
  console.log(`Wallet B: ${publicKeyB}`);

  try {
    // 2. Request nonce for Wallet A
    console.log('\n[1/5] Requesting nonce for Wallet A...');
    const nonceRes = await fetch(`${BASE_URL}/v1/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: publicKeyA })
    });
    
    if (!nonceRes.ok) {
      throw new Error(`Failed to request nonce: ${await nonceRes.text()}`);
    }
    
    const { nonce } = await nonceRes.json() as { nonce: string };
    console.log(`Received Nonce: ${nonce}`);

    // 3. Construct SIWS Message and Sign it with Wallet A's secret key
    const message = `clauding.xyz wants you to sign in with your Solana account:
${publicKeyA}

Nonce: ${nonce}
Expiration Time: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()}`;

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, walletA.secretKey);
    const signature = bs58.encode(signatureBytes);

    // 4. Verify signature & obtain JWT
    console.log('\n[2/5] Verifying signature for Wallet A to get JWT...');
    const verifyRes = await fetch(`${BASE_URL}/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: publicKeyA,
        message,
        signature
      })
    });

    if (!verifyRes.ok) {
      throw new Error(`Verification failed: ${await verifyRes.text()}`);
    }

    const { accessToken } = await verifyRes.json() as { accessToken: string };
    console.log(`Received JWT Access Token: ${accessToken.substring(0, 20)}...`);

    // 5. Test accessing protected endpoint WITHOUT token (should fail with 401)
    console.log('\n[3/5] Testing protected endpoint without token...');
    const unauthRes = await fetch(`${BASE_URL}/v1/chat/history`);
    console.log(`Status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status === 401) {
      console.log('✅ PASS: Protected endpoint rejected unauthenticated request.');
    } else {
      console.error('❌ FAIL: Protected endpoint did not reject unauthenticated request.');
    }

    // 6. Test accessing protected endpoint WITH Wallet A's token
    console.log('\n[4/5] Testing protected endpoint with Wallet A token...');
    const authRes = await fetch(`${BASE_URL}/v1/chat/history`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Status: ${authRes.status} (Expected: 200)`);
    if (authRes.status === 200) {
      const history = await authRes.json();
      console.log('✅ PASS: Protected endpoint allowed authenticated request.', history);
    } else {
      console.error(`❌ FAIL: Protected endpoint rejected authenticated request: ${await authRes.text()}`);
    }

    // 7. Test replay attack: trying to use the same nonce/signature again
    console.log('\n[5/5] Testing replay attack (re-verifying with same signature)...');
    const replayRes = await fetch(`${BASE_URL}/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: publicKeyA,
        message,
        signature
      })
    });
    console.log(`Status: ${replayRes.status} (Expected: 401)`);
    if (replayRes.status === 401) {
      console.log('✅ PASS: Replay attack successfully blocked (nonce consumed).');
    } else {
      console.error('❌ FAIL: Replay attack succeeded or returned unexpected status.');
    }

  } catch (e) {
    console.error('Error during integration test:', e);
  }
}

testAuthFlow();
