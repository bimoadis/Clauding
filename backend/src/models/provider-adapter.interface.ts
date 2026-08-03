export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface NormalizedChatRequest {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  allowedTools?: string[];
  temperature?: number;
  maxTokens?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface NormalizedChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
}

export interface ChatChunk {
  delta?: string;
  toolCalls?: ToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ProviderAdapter {
  readonly provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'llama';

  chat(req: NormalizedChatRequest): Promise<NormalizedChatResponse>;
  stream(req: NormalizedChatRequest): AsyncIterable<ChatChunk>;
}
