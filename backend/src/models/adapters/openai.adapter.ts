import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';
import { toolCatalog } from '../../temporal/tool-catalog';

export class OpenAIAdapter implements ProviderAdapter {
  readonly provider = 'openai';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.includes('proj-...') || apiKey.includes('your-')) {
      // Mock Response for Development
      return {
        message: `[Mock OpenAI - ${req.model}] This is a mocked response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 50, outputTokens: 20 }
      };
    }

    const endpoint = 'https://api.openai.com/v1/chat/completions';
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

    const messagesToSend = [...req.messages];
    if (req.allowedTools && req.allowedTools.length > 0) {
      messagesToSend.unshift({
        role: 'system',
        content: `[Strict Scope Guardrail]
You are a highly specialized AI agent restricted ONLY to the following allowed capabilities (tools): ${req.allowedTools.join(', ')}.
You must strictly refuse to answer any questions, write code (such as HTML, Python, JS), or discuss topics that are not directly related to these allowed capabilities.
If the user asks about anything else, politely decline and state that you are configured only as a specialized agent with capabilities: ${req.allowedTools.join(', ')}.`
      });
    }

    if (dataInjections.length > 0) {
      console.log(`[DEBUG] Injecting ${dataInjections.length} tool outputs into system context...`);
      messagesToSend.splice(messagesToSend.length - 1, 0, {
        role: 'system',
        content: `[Layer 3: Session Context - Real-time Data Access]
The user requested info requiring live data. The backend automatically ran these catalog tools and fetched this live data:
${dataInjections.join('\n\n')}
Integrate this live data and answer the user prompt accurately.`
      });
    }

    console.log(`[DEBUG] Invoking real AI API via endpoint: ${endpoint} (model: ${activeModel})`);

    // Real API Call Implementation
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: activeModel,
        messages: messagesToSend,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`AI Provider API failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0
      }
    };
  }

  async *stream(req: NormalizedChatRequest): AsyncIterable<ChatChunk> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const useRealAPI = openaiKey && !openaiKey.includes('proj-...');

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

      // 1. Stream thinking process
      let intro = `[Agent Active - ${req.model.toUpperCase()}]\n🤖 Reasoning: Analyzing prompt for required capabilities...\n`;
      if (matchedTools.length > 0) {
        intro += `👉 Identified matched tools in catalog: [${matchedTools.join(', ')}]\n\n`;
      } else {
        intro += `👉 No specialized external tools required for this request. Processing general response...\n\n`;
      }
      
      for (const char of intro) {
        yield { delta: char };
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // 2. Execute matching tools and stream output
      const toolResults: string[] = [];
      for (const toolName of matchedTools) {
        if (req.allowedTools && !req.allowedTools.includes(toolName)) {
          let guardrailLog = `⚠️ [GUARDRAIL] Eksekusi tool [${toolName}] diblokir karena tool ini tidak diizinkan dalam review spesifikasi agen.\n\n`;
          for (const char of guardrailLog) {
            yield { delta: char };
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          continue;
        }
        const tool = toolCatalog.find(t => t.name === toolName);
        if (tool) {
          let execLog = `⚙️ Action: Executing tool [${toolName}]...\n`;
          for (const char of execLog) {
            yield { delta: char };
            await new Promise(resolve => setTimeout(resolve, 5));
          }

          // Execute handler
          try {
            const res = await tool.handler({
              query: 'latest Solana trend',
              wallet: req.wallet || '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
              code: 'print("Running Python Sandbox Code")',
              text: 'Simulated Audio Transcription Result'
            });
            const resStr = JSON.stringify(res, null, 2);
            toolResults.push(`[${toolName}]: ${resStr}`);
            
            let resLog = `📥 Observation: \n\`\`\`json\n${resStr}\n\`\`\`\n\n`;
            for (const char of resLog) {
              yield { delta: char };
              await new Promise(resolve => setTimeout(resolve, 5));
            }
          } catch (err) {
            const errLog = `❌ Observation Error: ${err instanceof Error ? err.message : 'failed'}\n\n`;
            for (const char of errLog) {
              yield { delta: char };
              await new Promise(resolve => setTimeout(resolve, 5));
            }
          }
        }
      }

      // 3. Stream final synthesis
      let finalSynthesis = `📝 Final Synthesis:\n`;
      if (req.allowedTools && req.allowedTools.length > 0 && matchedTools.length === 0) {
        finalSynthesis += `Maaf, saya dikonfigurasi sebagai agen khusus dengan keahlian: [${req.allowedTools.join(', ')}]. Saya tidak dapat menjawab pertanyaan atau menulis kode di luar keahlian tersebut.`;
      } else if (matchedTools.length > 0) {
        finalSynthesis += `Based on the active tool results above, the agent confirms all operations completed successfully and the ledger records have been updated accordingly.`;
      } else {
        finalSynthesis += `Here is the response to your message: "${userPrompt}"`;
      }

      for (const char of finalSynthesis) {
        yield { delta: char };
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      yield { usage: { inputTokens: 40, outputTokens: 80 } };
      return;
    }

    // Real Streaming Implementation using fetch / SSE parsing can go here
    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
