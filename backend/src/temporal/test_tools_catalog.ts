import * as activities from './activities';

async function testToolsCatalog() {
  console.log('--- Starting Expanded Tools Catalog Verification ---');

  const testCases = [
    {
      name: 'solana_balance',
      args: { wallet: '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv' }
    },
    {
      name: 'dex_token_price',
      args: { tokenMint: 'KIRBLE_MINT_ADDRESS' }
    },
    {
      name: 'python_sandbox',
      args: { code: 'print("Hello from Sandbox")' }
    },
    {
      name: 'telegram_send',
      args: { chatId: 'user_123', message: 'Hello from Kirble!' }
    },
    {
      name: 'coingecko_trending',
      args: {}
    },
    {
      name: 'text_to_speech',
      args: { text: 'Welcome to Kirble agent platform.' }
    },
    {
      name: 'speech_to_text',
      args: { audioUrl: 'https://audio.kirble.xyz/user_voice.mp3' }
    },
    {
      name: 'image_ocr',
      args: { imageUrl: 'https://images.kirble.xyz/snap_tx.png' }
    }
  ];

  for (const tc of testCases) {
    try {
      const res = await activities.executeTool({
        toolName: tc.name,
        args: tc.args,
        runId: 'run_catalog_test'
      });
      console.log(`Tool [${tc.name}] Result:`, res);
      if (res.success) {
        console.log(`✅ TEST PASSED: Tool ${tc.name} executed successfully.`);
      } else {
        console.error(`❌ TEST FAILED: Tool ${tc.name} failed:`, res.error);
      }
    } catch (err) {
      console.error(`❌ TEST FAILED: Tool ${tc.name} crashed with error:`, err);
    }
  }
}

testToolsCatalog();
