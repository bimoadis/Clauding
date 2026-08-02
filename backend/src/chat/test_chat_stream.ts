import * as http from 'http';

function testChatStream() {
  console.log('--- Starting Chat Stream HTTP Integration Test ---');

  const message = encodeURIComponent('Hello, explain Solana price trends briefly.');
  const costTier = 'balanced';

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/v1/chat/stream?message=${message}&costTier=${costTier}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('--- Incoming Token Stream ---');

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      // Print chunk text
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.replace('data:', '').trim();
            const payload = JSON.parse(jsonStr);
            if (payload.delta) {
              process.stdout.write(payload.delta);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    res.on('end', () => {
      console.log('\n-----------------------------');
      console.log('✅ TEST PASSED: Stream connection successfully closed.');
    });
  });

  req.on('error', (e) => {
    console.error(`❌ TEST FAILED: Connection error: ${e.message}`);
  });

  req.end();
}

testChatStream();
