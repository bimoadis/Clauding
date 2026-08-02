import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';
import { toolCatalog } from '../../temporal/tool-catalog';

export class OpenAIAdapter implements ProviderAdapter {
  readonly provider = 'openai';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;

    const useXAI = (!openaiKey || openaiKey.includes('proj-...')) && xaiKey && !xaiKey.includes('your-');
    const apiKey = useXAI ? xaiKey : openaiKey;

    if (!apiKey || apiKey.includes('proj-...') || apiKey.includes('your-')) {
      // Mock Response for Development
      return {
        message: `[Mock OpenAI - ${req.model}] This is a mocked response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 50, outputTokens: 20 }
      };
    }

    const endpoint = useXAI ? 'https://token-plan-sgp.xiaomimimo.com/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const activeModel = useXAI ? 'mimo-v2.5-pro' : req.model;

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

    const messagesToSend = [...req.messages];
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
    const xaiKey = process.env.XAI_API_KEY;

    const useRealAPI = (openaiKey && !openaiKey.includes('proj-...')) || (xaiKey && !xaiKey.includes('your-'));

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
      
      yield { usage: { inputTokens: 40, outputTokens: 80 } };
      return;
    }

    // Real Streaming Implementation using fetch / SSE parsing can go here
    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
