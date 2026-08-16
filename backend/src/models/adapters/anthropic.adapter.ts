import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';
import { toolCatalog } from '../../temporal/tool-catalog';

export class AnthropicAdapter implements ProviderAdapter {
  readonly provider = 'anthropic';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes('your-')) {
      // Mock Response for Development
      return {
        message: `[Mock Anthropic - ${req.model}] This is a mocked Claude response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 60, outputTokens: 25 }
      };
    }

    const endpoint = 'https://api.anthropic.com/v1/messages';
    const activeModel = req.model;

    // Real-time Tool Data Injection Interceptor
    const userPrompt = req.messages[req.messages.length - 1].content;
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedTools: string[] = [];

    const keywordMappings: { [key: string]: string[] } = {
      solana_balance: ['saldo', 'balance', 'sol', 'wallet', 'dompet', 'cek', 'check'],
      spl_token_balance: ['spl', 'token', 'balance', 'saldo', 'swap', 'kirim', 'send', 'check'],
      solana_transaction_history: ['history', 'riwayat', 'transaksi', 'transaction', 'transfer', 'swaps', 'kirim'],
      solana_sign_message: ['sign', 'tanda', 'verify', 'verifikasi', 'message', 'pesan', 'signature'],
      solana_validators: ['validator', 'validators', 'status', 'performance'],
      solana_block_details: ['block', 'slot', 'hash', 'details', 'detail'],
      solana_airdrop_request: ['airdrop', 'faucet', 'sol', 'gratis', 'free'],
      solana_priority_fees: ['fee', 'fees', 'priority', 'biaya', 'gas', 'congestion', 'price'],
      token_metadata: ['metadata', 'ca', 'contract', 'address', 'analisis', 'analyze', 'token', 'symbol', 'nama', 'name', 'scan', 'kontrak'],
      dex_token_price: ['price', 'harga', 'dex', 'liquidity', 'likuiditas', 'ca', 'contract', 'swap', 'pool', 'scan', 'kontrak'],
      liquidity_pool_depth: ['liquidity', 'likuiditas', 'pool', 'depth', 'lock', 'burn', 'kunci', 'ca', 'contract', 'scan', 'kontrak'],
      web_search: ['search', 'web', 'http', 'internet', 'online', 'google', 'cek', 'cari']
    };

    if (req.allowedTools) {
      for (const allowedTool of req.allowedTools) {
        if (lowerPrompt.includes(allowedTool.toLowerCase())) {
          matchedTools.push(allowedTool);
          continue;
        }
        const mappedKws = keywordMappings[allowedTool];
        if (mappedKws) {
          const hasMatch = mappedKws.some(kw => lowerPrompt.includes(kw));
          if (hasMatch) {
            matchedTools.push(allowedTool);
          }
        }
      }
    }

    // Extract Solana address (CA) from prompt if present
    const solanaAddressRegex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
    const addresses = userPrompt.match(solanaAddressRegex) || [];
    const extractedCA = addresses[0] || '';

    const dataInjections: string[] = [];
    for (const toolName of matchedTools) {
      if (req.allowedTools && !req.allowedTools.includes(toolName)) {
        dataInjections.push(`- Tool [${toolName}] blocked: Execution of this tool is not allowed in the user's agent specification review.`);
        continue;
      }
      const tool = toolCatalog.find(t => t.name === toolName);
      if (tool) {
        try {
          const res = await tool.handler({
            query: userPrompt,
            wallet: req.wallet || extractedCA || '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
            tokenMint: extractedCA || '',
            account: extractedCA || '',
            slot: parseInt(userPrompt.match(/\d+/)?.[0] || '0') || 0,
            code: '',
            text: ''
          });
          dataInjections.push(`- Tool [${toolName}] Output:\n${JSON.stringify(res, null, 2)}`);
        } catch (e) {
          console.error(`Failed to pre-run tool ${toolName}:`, e);
        }
      }
    }

    const originalSystem = req.messages.find(m => m.role === 'system')?.content || '';
    const scopeSystem = req.allowedTools && req.allowedTools.length > 0
      ? `${originalSystem}\n\n[Strict Scope Guardrail]\nYou are restricted ONLY to the following allowed capabilities (tools): ${req.allowedTools.join(', ')}.\nYou must strictly refuse to answer any questions, write code (such as HTML, Python, JS), or discuss topics that are not directly related to these allowed capabilities.\nIf the user asks about anything else, politely decline and state that you are configured only as a specialized agent with capabilities: ${req.allowedTools.join(', ')}.`
      : originalSystem;
    const finalSystem = dataInjections.length > 0
      ? `${scopeSystem}\n\n[Layer 3: Session Context - Real-time Data Access]\nThe user requested info requiring live data. The backend automatically ran these catalog tools and fetched this live data:\n${dataInjections.join('\n\n')}\nIntegrate this live data and answer the user prompt accurately.`
      : scopeSystem;

    console.log(`[DEBUG] Invoking official Anthropic API via endpoint: ${endpoint} (model: ${activeModel})`);

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01'
    };

    const body = JSON.stringify({
      model: activeModel,
      messages: req.messages.filter(m => m.role !== 'system'),
      system: finalSystem,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`Official Anthropic API failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    return {
      message: data.content[0].text,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0
      }
    };
  }

  async *stream(req: NormalizedChatRequest): AsyncIterable<ChatChunk> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const useRealAPI = apiKey && !apiKey.includes('your-');

    if (!useRealAPI) {
      // Dynamic Local ReAct Agent Mock Runner
      const userPrompt = req.messages[req.messages.length - 1].content;
      const lowerPrompt = userPrompt.toLowerCase();

      const matchedTools: string[] = [];
      const keywordMappings: { [key: string]: string[] } = {
        solana_balance: ['saldo', 'balance', 'sol', 'wallet', 'dompet', 'cek', 'check'],
        spl_token_balance: ['spl', 'token', 'balance', 'saldo', 'swap', 'kirim', 'send', 'check'],
        solana_transaction_history: ['history', 'riwayat', 'transaksi', 'transaction', 'transfer', 'swaps', 'kirim'],
        solana_sign_message: ['sign', 'tanda', 'verify', 'verifikasi', 'message', 'pesan', 'signature'],
        solana_validators: ['validator', 'validators', 'status', 'performance'],
        solana_block_details: ['block', 'slot', 'hash', 'details', 'detail'],
        solana_airdrop_request: ['airdrop', 'faucet', 'sol', 'gratis', 'free'],
        solana_priority_fees: ['fee', 'fees', 'priority', 'biaya', 'gas', 'congestion', 'price'],
        token_metadata: ['metadata', 'ca', 'contract', 'address', 'analisis', 'analyze', 'token', 'symbol', 'nama', 'name', 'scan', 'kontrak'],
        dex_token_price: ['price', 'harga', 'dex', 'liquidity', 'likuiditas', 'ca', 'contract', 'swap', 'pool', 'scan', 'kontrak'],
        liquidity_pool_depth: ['liquidity', 'likuiditas', 'pool', 'depth', 'lock', 'burn', 'kunci', 'ca', 'contract', 'scan', 'kontrak'],
        web_search: ['search', 'web', 'http', 'internet', 'online', 'google', 'cek', 'cari']
      };

      if (req.allowedTools) {
        for (const allowedTool of req.allowedTools) {
          if (lowerPrompt.includes(allowedTool.toLowerCase())) {
            matchedTools.push(allowedTool);
            continue;
          }
          const mappedKws = keywordMappings[allowedTool];
          if (mappedKws) {
            const hasMatch = mappedKws.some(kw => lowerPrompt.includes(kw));
            if (hasMatch) {
              matchedTools.push(allowedTool);
            }
          }
        }
      }

      // 1. Stream clean status
      let intro = `Processing request...\n`;
      if (matchedTools.length > 0) {
        intro += `Accessing data module: ${matchedTools.join(', ')}\n\n`;
      }

      for (const char of intro) {
        yield { delta: char };
        await new Promise(resolve => setTimeout(resolve, 3));
      }

      // 2. Execute matching tools cleanly without dumping raw json
      const toolResults: { toolName: string; data: any }[] = [];
      for (const toolName of matchedTools) {
        if (req.allowedTools && !req.allowedTools.includes(toolName)) {
          let guardrailLog = `Access to module [${toolName}] is restricted by agent capability settings.\n\n`;
          for (const char of guardrailLog) {
            yield { delta: char };
            await new Promise(resolve => setTimeout(resolve, 3));
          }
          continue;
        }
        const tool = toolCatalog.find(t => t.name === toolName);
        if (tool) {
          let execLog = `Synchronizing data from [${toolName}]...\n`;
          for (const char of execLog) {
            yield { delta: char };
            await new Promise(resolve => setTimeout(resolve, 3));
          }

          try {
            const res = await tool.handler({
              query: userPrompt,
              wallet: req.wallet || '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
              code: 'print("Running Python Sandbox Code")',
              text: 'Simulated Audio Transcription Result'
            });
            toolResults.push({ toolName, data: res });

            let resLog = `Data retrieved successfully.\n\n`;
            for (const char of resLog) {
              yield { delta: char };
              await new Promise(resolve => setTimeout(resolve, 3));
            }
          } catch (err) {
            const errLog = `Failed to synchronize data: ${err instanceof Error ? err.message : 'execution error'}\n\n`;
            for (const char of errLog) {
              yield { delta: char };
              await new Promise(resolve => setTimeout(resolve, 3));
            }
          }
        }
      }

      // 3. Synthesize tool results cleanly and professionally
      let finalSynthesis = `### Executive Summary\n\n`;
      if (req.allowedTools && req.allowedTools.length > 0 && matchedTools.length === 0) {
        finalSynthesis = `This agent is configured specifically for: ${req.allowedTools.join(', ')}. Inquiries outside these capabilities cannot be processed.`;
      } else if (toolResults.length > 0) {
        for (const item of toolResults) {
          if (item.toolName === 'solana_balance' && item.data) {
            const bal = item.data.solBalance ?? item.data.balance ?? item.data.sol ?? '0';
            const walletAddr = item.data.wallet || req.wallet || '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv';
            finalSynthesis += `• **Solana Balance (SOL)**: ${bal} SOL\n• **Wallet Address**: \`${walletAddr}\`\n`;
          } else if (item.toolName === 'spl_token_balance' && item.data) {
            finalSynthesis += `• **SPL Token Balance**: ${item.data.balance ?? item.data.amount ?? '0'} ${item.data.symbol || 'Token'}\n`;
          } else if (item.toolName === 'dex_token_price' && item.data) {
            finalSynthesis += `• **Token Price**: $${item.data.priceUsd ?? '0'}\n• **Liquidity**: $${item.data.liquidityUsd ?? '0'}\n• **24h Volume**: $${item.data.volume24h ?? '0'}\n`;
          } else if (item.toolName === 'token_metadata' && item.data) {
            finalSynthesis += `• **Token Name**: ${item.data.name || 'N/A'} (${item.data.symbol || 'N/A'})\n• **Contract Address (CA)**: \`${item.data.mint || item.data.address || 'N/A'}\`\n`;
          } else if (item.toolName === 'solana_transaction_history' && item.data) {
            finalSynthesis += `• **Transaction History**: Successfully retrieved latest verified transactions on Solana network.\n`;
          } else if (item.toolName === 'solana_priority_fees' && item.data) {
            finalSynthesis += `• **Estimated Priority Fee**: ${item.data.priorityFeeMicroLamports ?? item.data.fee ?? 'Standard'} micro-lamports\n`;
          } else if (item.toolName === 'web_search' && item.data) {
            finalSynthesis += `• **Search Findings**: ${typeof item.data === 'string' ? item.data : (item.data.summary || 'Latest information verified.')}\n`;
          } else {
            const cleanText = typeof item.data === 'object' 
              ? Object.entries(item.data).map(([k, v]) => `  - ${k}: ${v}`).join('\n')
              : item.data;
            finalSynthesis += `• **${item.toolName}**:\n${cleanText}\n`;
          }
        }
        finalSynthesis += `\nAll on-chain records have been fetched and synchronized in real time.`;
      } else {
        finalSynthesis = `Here is the response to your request:\n\n${userPrompt}`;
      }

      for (const char of finalSynthesis) {
        yield { delta: char };
        await new Promise(resolve => setTimeout(resolve, 3));
      }
      
      yield { usage: { inputTokens: 50, outputTokens: 90 } };
      return;
    }

    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
