import { SiwsService, SiwsVerifyDto } from './siws.service';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

async function testSiws() {
  console.log('--- Starting SIWS Cryptographic Service Test ---');

  // 1. Generate a test Solana wallet keypair
  const keyPair = nacl.sign.keyPair();
  const walletAddress = bs58.encode(keyPair.publicKey);
  console.log(`Generated Wallet Address: ${walletAddress}`);

  // 2. Prepare SIWS Message
  const message = `kirble.xyz wants you to sign in with your Solana account:
${walletAddress}

To authenticate and access your agent dashboard.
Expiration Time: ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}`;

  // 3. Cryptographically sign the message
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.sign.detached(messageBytes, keyPair.secretKey);
  const signature = bs58.encode(signatureBytes);
  console.log(`Generated Cryptographic Signature: ${signature}`);

  // 4. Run Verification Service
  const siwsService = new SiwsService();
  const dto: SiwsVerifyDto = {
    wallet: walletAddress,
    message: message,
    signature: signature
  };

  try {
    const isVerified = siwsService.verify(dto);
    if (isVerified) {
      console.log('✅ TEST PASSED: SIWS verification succeeded for a valid signature.');
    } else {
      console.error('❌ TEST FAILED: SIWS verification returned false.');
    }
  } catch (err) {
    console.error('❌ TEST FAILED: SIWS verification threw an error:', err);
  }

  // 5. Test Invalid Wallet Verification
  try {
    const wrongWallet = bs58.encode(nacl.sign.keyPair().publicKey);
    siwsService.verify({
      ...dto,
      wallet: wrongWallet
    });
    console.error('❌ TEST FAILED: Verification should have failed with a mismatched wallet address.');
  } catch (err) {
    console.log('✅ TEST PASSED: Successfully rejected verification for mismatched wallet address.');
  }

  // 6. Test Expired Message Verification
  try {
    const expiredMessage = `kirble.xyz wants you to sign in with your Solana account:
${walletAddress}
Expiration Time: ${new Date(Date.now() - 1000).toISOString()}`; // Expired

    const expiredBytes = new TextEncoder().encode(expiredMessage);
    const expiredSig = bs58.encode(nacl.sign.detached(expiredBytes, keyPair.secretKey));

    siwsService.verify({
      wallet: walletAddress,
      message: expiredMessage,
      signature: expiredSig
    });
    console.error('❌ TEST FAILED: Verification should have failed for an expired message.');
  } catch (err) {
    console.log('✅ TEST PASSED: Successfully rejected verification for expired message.');
  }
}

testSiws();
