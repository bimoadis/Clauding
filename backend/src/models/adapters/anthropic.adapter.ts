import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';

export class AnthropicAdapter implements ProviderAdapter {
  readonly provider = 'anthropic';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Mock Response for Development
      return {
        message: `[Mock Anthropic - ${req.model}] This is a mocked Claude response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 60, outputTokens: 25 }
      };
    }

    // Real Anthropic API Call (standard fetch conversion)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages.filter(m => m.role !== 'system'),
        system: req.messages.find(m => m.role === 'system')?.content,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API failed: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      }
    };
  }

  async *stream(req: NormalizedChatRequest): AsyncIterable<ChatChunk> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Mock Streaming Response
      const words = `[Mock Claude Stream - ${req.model}] Greetings. I am your specialized AI character. Let us solve the task.`.split(' ');
      for (const word of words) {
        yield { delta: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      yield { usage: { inputTokens: 50, outputTokens: 20 } };
      return;
    }

    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
