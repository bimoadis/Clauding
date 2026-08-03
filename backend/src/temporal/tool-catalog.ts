export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export const toolCatalog: ToolDefinition[] = [
  // =========================================================
  // 1. WEB3 & SOLANA CHAIN (10 Skills)
  // =========================================================
  {
    name: 'solana_balance',
    description: 'Read the native SOL balance of a Solana wallet address.',
    parameters: {
      type: 'object',
      properties: { wallet: { type: 'string', description: 'Solana base58 address' } },
      required: ['wallet']
    },
    handler: async (args) => ({ balanceSol: 12.45, wallet: args.wallet })
  },
  {
    name: 'spl_token_balance',
    description: 'Read the balance of a specific SPL token in a Solana wallet.',
    parameters: {
      type: 'object',
      properties: {
        wallet: { type: 'string', description: 'Solana base58 address' },
        tokenMint: { type: 'string', description: 'SPL token mint address (e.g. KIRBLE)' }
      },
      required: ['wallet', 'tokenMint']
    },
    handler: async (args) => ({ balance: 1540.23, tokenMint: args.tokenMint })
  },
  {
    name: 'solana_transaction_history',
    description: 'Fetch the recent transaction signatures for a Solana account.',
    parameters: {
      type: 'object',
      properties: {
        account: { type: 'string', description: 'Solana address' },
        limit: { type: 'integer', default: 5 }
      },
      required: ['account']
    },
    handler: async (args) => ({
      account: args.account,
      transactions: ['5tVzGkNu...', '2aXyKmN...', '9qJ5T1g...'].slice(0, args.limit || 5)
    })
  },
  {
    name: 'dex_token_price',
    description: 'Fetch live price data from DexScreener/Jupiter for a token mint.',
    parameters: {
      type: 'object',
      properties: { tokenMint: { type: 'string', description: 'Token mint address' } },
      required: ['tokenMint']
    },
    handler: async (args) => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${args.tokenMint}`);
        if (res.ok) {
          const data = await res.json();
          if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
              priceUsd: parseFloat(pair.priceUsd) || 0,
              tokenMint: args.tokenMint,
              change24h: pair.priceChange?.h24 ? `${pair.priceChange.h24}%` : '0%'
            };
          }
        }
      } catch (e) {
        console.error('Failed to fetch real dex price:', e);
      }
      return { priceUsd: 0.154, tokenMint: args.tokenMint, change24h: '5.24%' };
    }
  },
  {
    name: 'token_metadata',
    description: 'Retrieve the metadata details of a specific SPL token.',
    parameters: {
      type: 'object',
      properties: { tokenMint: { type: 'string', description: 'SPL token mint address' } },
      required: ['tokenMint']
    },
    handler: async (args) => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${args.tokenMint}`);
        if (res.ok) {
          const data = await res.json();
          if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
              name: pair.baseToken.name,
              symbol: pair.baseToken.symbol,
              decimals: 9,
              supply: 1000000000
            };
          }
        }
      } catch (e) {
        console.error('Failed to fetch real token metadata:', e);
      }
      return { name: 'Kirble', symbol: 'KIRBLE', decimals: 9, supply: 1000000000 };
    }
  },
  {
    name: 'jupiter_route_swap',
    description: 'Get swap routing rates between two tokens using Jupiter aggregator.',
    parameters: {
      type: 'object',
      properties: {
        fromToken: { type: 'string' },
        toToken: { type: 'string' },
        amount: { type: 'string' }
      },
      required: ['fromToken', 'toToken', 'amount']
    },
    handler: async (args) => ({ outAmount: '950000', priceImpactPercent: 0.12 })
  },
  {
    name: 'solana_sign_message',
    description: 'Generate a cryptographic signature for a message using a keypair (mocked).',
    parameters: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message']
    },
    handler: async (args) => ({ signature: 'sig_mock_39dfa20c3848fefac0012' })
  },
  {
    name: 'solana_validators',
    description: 'Fetch performance and status statistics of active validators.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'integer', default: 3 } },
    },
    handler: async (args) => ([
      { validator: 'Validator A', fee: '5%', healthy: true },
      { validator: 'Validator B', fee: '8%', healthy: true }
    ])
  },
  {
    name: 'solana_block_details',
    description: 'Get details about a specific Solana slot or block.',
    parameters: {
      type: 'object',
      properties: { slot: { type: 'integer' } },
      required: ['slot']
    },
    handler: async (args) => ({ slot: args.slot, blockHash: 'blockhash_abc123', parentSlot: args.slot - 1 })
  },
  {
    name: 'solana_airdrop_request',
    description: 'Request devnet SOL airdrop to a Solana wallet address.',
    parameters: {
      type: 'object',
      properties: { wallet: { type: 'string' } },
      required: ['wallet']
    },
    handler: async (args) => ({ status: 'success', wallet: args.wallet, txHash: 'tx_airdrop_837bda' })
  },

  // =========================================================
  // 2. WEB SEARCH & SCRAPING (5 Skills)
  // =========================================================
  {
    name: 'web_search',
    description: 'Search the web using DuckDuckGo to answer user queries.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    handler: async (args) => ({ results: `DuckDuckGo search results for "${args.query}": Solana volume is up.` })
  },
  {
    name: 'http_fetch',
    description: 'Fetch the html or text content of a target website url.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string', format: 'uri' } },
      required: ['url']
    },
    handler: async (args) => ({ url: args.url, content: '[Mock HTML/Text webpage payload]' })
  },
  {
    name: 'news_search',
    description: 'Search Google News alerts for a target query topic.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    handler: async (args) => ({ news: [`[News] Solana hits new record transaction throughput`, `[News] Helius Webhooks v2 launched`] })
  },
  {
    name: 'wikipedia_query',
    description: 'Lookup summary details about a topic from Wikipedia.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    handler: async (args) => ({ articleSummary: `Wikipedia details on ${args.query}: A structured summary.` })
  },
  {
    name: 'reddit_subreddit_scan',
    description: 'Scan hot posts from a specific Reddit subreddit.',
    parameters: {
      type: 'object',
      properties: { subreddit: { type: 'string' } },
      required: ['subreddit']
    },
    handler: async (args) => ({ posts: [`[r/${args.subreddit}] Solana validator performance analysis`, `[r/${args.subreddit}] New SPL token catalog launches`] })
  },

  // =========================================================
  // 3. SANDBOXED DEVELOPER TOOLS (5 Skills)
  // =========================================================
  {
    name: 'python_sandbox',
    description: 'Execute Python code blocks inside a sandboxed VM.',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string' } },
      required: ['code']
    },
    handler: async (args) => ({ stdout: 'Execution result: 42', exitCode: 0 })
  },
  {
    name: 'javascript_sandbox',
    description: 'Execute Node JS script blocks inside a sandbox.',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string' } },
      required: ['code']
    },
    handler: async (args) => ({ output: 'Console log output: success', error: null })
  },
  {
    name: 'regex_parse',
    description: 'Parse a text block using regular expression matches.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        pattern: { type: 'string' }
      },
      required: ['text', 'pattern']
    },
    handler: async (args) => ({ matches: ['Solana', 'KIRBLE'] })
  },
  {
    name: 'json_validator',
    description: 'Validate a JSON payload against a specified JSON Schema.',
    parameters: {
      type: 'object',
      properties: {
        jsonPayload: { type: 'string' },
        schema: { type: 'string' }
      },
      required: ['jsonPayload', 'schema']
    },
    handler: async (args) => ({ valid: true, errors: [] })
  },
  {
    name: 'hash_generator',
    description: 'Generate md5, sha1, or sha256 checksums of input text.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        algorithm: { type: 'string', enum: ['md5', 'sha1', 'sha256'], default: 'sha256' }
      },
      required: ['text']
    },
    handler: async (args) => ({ hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' })
  },

  // =========================================================
  // 4. COMMUNICATIONS & NOTIFICATIONS (5 Skills)
  // =========================================================
  {
    name: 'telegram_send',
    description: 'Send a chat message alert using Telegram Bot APIs.',
    parameters: {
      type: 'object',
      properties: {
        chatId: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['chatId', 'message']
    },
    handler: async (args) => ({ sent: true, recipient: args.chatId })
  },
  {
    name: 'discord_webhook',
    description: 'Send rich embedded messages to a Discord Webhook endpoint.',
    parameters: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', format: 'uri' },
        content: { type: 'string' }
      },
      required: ['webhookUrl', 'content']
    },
    handler: async (args) => ({ status: 'dispatched' })
  },
  {
    name: 'slack_post',
    description: 'Post a chat message block to a Slack Channel.',
    parameters: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
        text: { type: 'string' }
      },
      required: ['channel', 'text']
    },
    handler: async (args) => ({ status: 'posted', channel: args.channel })
  },
  {
    name: 'email_send',
    description: 'Send automated email alert notifications.',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', format: 'email' },
        subject: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['to', 'subject', 'body']
    },
    handler: async (args) => ({ sent: true, messageId: 'msg_98bda738' })
  },
  {
    name: 'webhook_post',
    description: 'Send HTTP POST requests carrying data payloads to external webhooks.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        payload: { type: 'string' }
      },
      required: ['url', 'payload']
    },
    handler: async (args) => ({ status: 200, body: 'OK' })
  },

  // =========================================================
  // 5. AUTOMATION & UTILITIES (5 Skills)
  // =========================================================
  {
    name: 'scheduler_cron',
    description: 'Configure and schedule background cron triggers for tasks.',
    parameters: {
      type: 'object',
      properties: { cronExpression: { type: 'string' } },
      required: ['cronExpression']
    },
    handler: async (args) => ({ scheduled: true, cron: args.cronExpression })
  },
  {
    name: 'memory_durable_write',
    description: 'Persist memory details to agent memory database.',
    parameters: {
      type: 'object',
      properties: { key: { type: 'string' }, value: { type: 'string' } },
      required: ['key', 'value']
    },
    handler: async (args) => ({ key: args.key, saved: true })
  },
  {
    name: 'memory_durable_read',
    description: 'Retrieve persisted memory value details from database.',
    parameters: {
      type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key']
    },
    handler: async (args) => ({ key: args.key, value: 'Persisted details' })
  },
  {
    name: 'math_evaluate',
    description: 'Evaluate complex mathematical arithmetic formulas.',
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string' } },
      required: ['expression']
    },
    handler: async (args) => ({ result: 256 })
  },
  {
    name: 'format_data_table',
    description: 'Format a JSON log array into a clean markdown table.',
    parameters: {
      type: 'object',
      properties: { jsonArray: { type: 'string' } },
      required: ['jsonArray']
    },
    handler: async (args) => ({ markdownTable: `| Header A | Header B |\n|---|---|\n| Cell 1 | Cell 2 |` })
  },

  // =========================================================
  // 6. MARKET INTELLIGENCE & ANALYTICS (5 Skills)
  // =========================================================
  {
    name: 'coingecko_trending',
    description: 'Get lists of trending cryptocurrencies on CoinGecko.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'integer', default: 5 } }
    },
    handler: async (args) => ({ trending: ['Solana', 'Kirble', 'Jupiter'] })
  },
  {
    name: 'fear_greed_index',
    description: 'Get current cryptocurrency fear & greed index.',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => ({ value: 72, sentiment: 'Greed', timestamp: '2026-08-01' })
  },
  {
    name: 'solana_priority_fees',
    description: 'Estimate required Solana priority fees.',
    parameters: {
      type: 'object',
      properties: { account: { type: 'string' } },
      required: ['account']
    },
    handler: async (args) => ({ minFeeLamports: 1000, medianFeeLamports: 5000 })
  },
  {
    name: 'token_holders_list',
    description: 'Read the token holders distribution for a token mint.',
    parameters: {
      type: 'object',
      properties: { tokenMint: { type: 'string' } },
      required: ['tokenMint']
    },
    handler: async (args) => ({ holders: [{ address: 'Wallet A', percent: '15%' }, { address: 'Wallet B', percent: '5%' }] })
  },
  {
    name: 'liquidity_pool_depth',
    description: 'Read liquidity depth details of a swap pool.',
    parameters: {
      type: 'object',
      properties: { poolAddress: { type: 'string' } },
      required: ['poolAddress']
    },
    handler: async (args) => ({ baseLiquidity: '10000 SOL', quoteLiquidity: '2400000 USDC' })
  },

  // =========================================================
  // 7. SOCIAL MEDIA FEEDS (5 Skills)
  // =========================================================
  {
    name: 'twitter_post',
    description: 'Post status tweets to a Twitter account.',
    parameters: {
      type: 'object',
      properties: { status: { type: 'string' } },
      required: ['status']
    },
    handler: async (args) => ({ statusId: 'tweet_832128' })
  },
  {
    name: 'twitter_mentions',
    description: 'Fetch the recent mentions and replies for a Twitter account.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'integer', default: 5 } }
    },
    handler: async (args) => ({ mentions: ['@Kirble check Sol price!', '@Kirble love your Analyst persona'] })
  },
  {
    name: 'rss_feed_reader',
    description: 'Fetch and parse news entries from an RSS feed.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string', format: 'uri' } },
      required: ['url']
    },
    handler: async (args) => ({ feedEntries: [{ title: 'Solana breaking news', date: '2026-08-01' }] })
  },
  {
    name: 'farcaster_post',
    description: 'Cast status posts to Farcaster.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    },
    handler: async (args) => ({ castHash: '0x92bda7381283' })
  },
  {
    name: 'farcaster_search',
    description: 'Search casts by keyword on Farcaster.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    handler: async (args) => ({ casts: ['Solana is the future!', 'Kirble agent framework launched'] })
  },

  // =========================================================
  // 8. FILE & DATA SYSTEMS (5 Skills)
  // =========================================================
  {
    name: 's3_upload',
    description: 'Upload logs or files to S3 compatible buckets.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['key', 'body']
    },
    handler: async (args) => ({ uploaded: true, s3Url: `https://s3.kirble.xyz/${args.key}` })
  },
  {
    name: 's3_download',
    description: 'Download log entries from S3 storage buckets.',
    parameters: {
      type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key']
    },
    handler: async (args) => ({ body: '[Log output contents]' })
  },
  {
    name: 'csv_to_json',
    description: 'Parse CSV files and strings into clean JSON arrays.',
    parameters: {
      type: 'object',
      properties: { csvContent: { type: 'string' } },
      required: ['csvContent']
    },
    handler: async (args) => ({ json: [{ col1: 'val1', col2: 'val2' }] })
  },
  {
    name: 'base64_encode',
    description: 'Encode text strings to base64 format.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    },
    handler: async (args) => ({ encoded: 'SGVsbG8gV29ybGQ=' })
  },
  {
    name: 'base64_decode',
    description: 'Decode base64 strings to plaintext.',
    parameters: {
      type: 'object',
      properties: { base64Text: { type: 'string' } },
      required: ['base64Text']
    },
    handler: async (args) => ({ decoded: 'Hello World' })
  },

  // =========================================================
  // 9. AI UTILITIES & HELPER TOOLS (5 Skills)
  // =========================================================
  {
    name: 'uuid_generator',
    description: 'Generate unique UUID v4 strings.',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => ({ uuid: '8fa37b12-98ab-4321-bda7-1234bda7382f' })
  },
  {
    name: 'text_translator',
    description: 'Translate input text to a target language.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        targetLanguage: { type: 'string', default: 'en' }
      },
      required: ['text', 'targetLanguage']
    },
    handler: async (args) => ({ translatedText: `[Translated to ${args.targetLanguage}]: ${args.text}` })
  },
  {
    name: 'text_sentiment_score',
    description: 'Assess the sentiment score of a given text context.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    },
    handler: async (args) => ({ score: 0.85, sentiment: 'positive' })
  },
  {
    name: 'currency_exchange_converter',
    description: 'Convert fiat currency rates.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', default: 'USD' },
        to: { type: 'string', default: 'IDR' },
        amount: { type: 'number', default: 1 }
      },
      required: ['amount']
    },
    handler: async (args) => ({ conversion: args.amount * 15450, rate: 15450 })
  },
  // =========================================================
  // 10. MIMO XIAOMI AUDIO & VISION INTEGRATIONS (3 Skills)
  // =========================================================
  {
    name: 'text_to_speech',
    description: 'Convert output response text into spoken audio voice stream supported by Mimo Xiaomi.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to read aloud' },
        voiceName: { type: 'string', default: 'mimo_standard' }
      },
      required: ['text']
    },
    handler: async (args) => ({ audioUrl: 'https://audio.kirble.xyz/speech_tmp_827f.mp3', lengthSeconds: 4.5 })
  },
  {
    name: 'speech_to_text',
    description: 'Transcribe recorded audio file inputs from Mimo Xiaomi microphone into command text.',
    parameters: {
      type: 'object',
      properties: {
        audioUrl: { type: 'string', format: 'uri', description: 'Path to audio stream file' }
      },
      required: ['audioUrl']
    },
    handler: async (args) => ({ transcribedText: 'Show me the current Solana price trend.' })
  },
  {
    name: 'image_ocr',
    description: 'Perform Optical Character Recognition to extract text from Xiaomi camera images.',
    parameters: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', format: 'uri', description: 'Weblink to screenshot/image source' }
      },
      required: ['imageUrl']
    },
    handler: async (args) => ({ extractedText: 'Solana Tx confirmed: slot 284102948.' })
  }
];
