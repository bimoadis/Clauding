import { ProviderAdapter, NormalizedChatRequest, NormalizedChatResponse, ChatChunk } from '../provider-adapter.interface';

export class OpenAIAdapter implements ProviderAdapter {
  readonly provider = 'openai';

  async chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    if (!process.env.OPENAI_API_KEY) {
      // Mock Response for Development
      return {
        message: `[Mock OpenAI - ${req.model}] This is a mocked response to: "${req.messages[req.messages.length - 1].content}"`,
        usage: { inputTokens: 50, outputTokens: 20 }
      };
    }

    // Real API Call Implementation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens
      }
    };
  }

  async *stream(req: NormalizedChatRequest): AsyncIterable<ChatChunk> {
    if (!process.env.OPENAI_API_KEY) {
      // Mock Streaming Response
      const words = `[Mock OpenAI Stream - ${req.model}] Hello, I am your agent. How can I assist you today?`.split(' ');
      for (const word of words) {
        yield { delta: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      yield { usage: { inputTokens: 40, outputTokens: 15 } };
      return;
    }

    // Real Streaming Implementation using fetch / SSE parsing can go here
    // For simplicity of Milestone 1 E2E flow, we yield a quick response
    const res = await this.chat(req);
    yield { delta: res.message };
    yield { usage: res.usage };
  }
}
