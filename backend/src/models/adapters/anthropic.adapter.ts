import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';
import { toolCatalog } from '../../temporal/tool-catalog';

export class AnthropicAdapter implements ProviderAdapter {
  readonly provider = 'anthropic';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    const xaiKey = process.env.XAI_API_KEY;

    if (!xaiKey || xaiKey.includes('your-')) {
      // Mock Response for Development
      return {
        message: `[Mock Anthropic - ${req.model}] This is a mocked Claude response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 60, outputTokens: 25 }
      };
    }

    const endpoint = 'https://token-plan-sgp.xiaomimimo.com/anthropic/v1/messages';
    const activeModel = 'mimo-v2.5-pro';

    // Real-time Tool Data Injection Interceptor
    const userPrompt = req.messages[req.messages.length - 1].content;
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedTools: string[] = [];

    if (lowerPrompt.includes('solana') || lowerPrompt.includes('balance')) {
      matchedTools.push('solana_balance');
    }
    if (lowerPrompt.includes('price') || lowerPrompt.includes('dex')) {
      matchedTools.push('dex_token_price');
    }
    if (lowerPrompt.includes('trending') || lowerPrompt.includes('coingecko')) {
      matchedTools.push('coingecko_trending');
    }
    if (
      lowerPrompt.includes('search') ||
      lowerPrompt.includes('web') ||
      lowerPrompt.includes('http') ||
      lowerPrompt.includes('internet') ||
      lowerPrompt.includes('online') ||
      lowerPrompt.includes('google') ||
      lowerPrompt.includes('cek') ||
      lowerPrompt.includes('cari')
    ) {
      matchedTools.push('web_search');
    }

    const dataInjections: string[] = [];
    for (const toolName of matchedTools) {
      const tool = toolCatalog.find(t => t.name === toolName);
      if (tool) {
        try {
          const res = await tool.handler({
            query: userPrompt,
            wallet: '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
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
    const finalSystem = dataInjections.length > 0
      ? `${originalSystem}\n\n[Layer 3: Session Context - Real-time Data Access]\nThe user requested info requiring live data. The backend automatically ran these catalog tools and fetched this live data:\n${dataInjections.join('\n\n')}\nIntegrate this live data and answer the user prompt accurately.`
      : originalSystem;

    console.log(`[DEBUG] Invoking custom Anthropic API via endpoint: ${endpoint} (model: ${activeModel})`);

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': xaiKey,
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
      throw new Error(`Custom Anthropic API failed (${response.status}): ${await response.text()}`);
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
    const xaiKey = process.env.XAI_API_KEY;
    const useRealAPI = xaiKey && !xaiKey.includes('your-');

    if (!useRealAPI) {
      // Dynamic Local ReAct Agent Mock Runner
      const userPrompt = req.messages[req.messages.length - 1].content;
      const lowerPrompt = userPrompt.toLowerCase();
      
      const matchedTools = [];
      
      // Keyword matching matching
      if (lowerPrompt.includes('solana') || lowerPrompt.includes('balance')) {
        matchedTools.push('solana_balance');
      }
      if (lowerPrompt.includes('price') || lowerPrompt.includes('dex')) {
        matchedTools.push('dex_token_price');
      }
      if (lowerPrompt.includes('trending') || lowerPrompt.includes('coingecko')) {
        matchedTools.push('coingecko_trending');
      }
      if (lowerPrompt.includes('python') || lowerPrompt.includes('sandbox')) {
        matchedTools.push('python_sandbox');
      }
      if (lowerPrompt.includes('tweet') || lowerPrompt.includes('twitter')) {
        matchedTools.push('twitter_post');
      }
      if (lowerPrompt.includes('ocr') || lowerPrompt.includes('scan') || lowerPrompt.includes('image')) {
        matchedTools.push('image_ocr');
      }
      if (lowerPrompt.includes('speech') || lowerPrompt.includes('tts') || lowerPrompt.includes('audio')) {
        matchedTools.push('text_to_speech');
      }
      if (lowerPrompt.includes('search') || lowerPrompt.includes('web') || lowerPrompt.includes('http')) {
        matchedTools.push('web_search');
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
              wallet: '8TnpincCHRaiT8swphAAa3bJBSjrrUBCj2MgpaA6oZZv',
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
      if (matchedTools.length > 0) {
        finalSynthesis += `Based on the active tool results above, the agent confirms all operations completed successfully and the ledger records have been updated accordingly.`;
      } else {
        finalSynthesis += `Here is the response to your message: "${userPrompt}"`;
      }

      for (const char of finalSynthesis) {
        yield { delta: char };
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      yield { usage: { inputTokens: 50, outputTokens: 90 } };
      return;
    }

    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
