import { Controller, Post, Body } from '@nestjs/common';

export interface AgentSpec {
  name: string;
  description: string;
  instructions: string;
  characterId: string;
  modelPolicy: {
    mode: 'auto' | 'pinned';
    pinnedModel: string | null;
    costTier: 'economy' | 'balanced' | 'premium';
    maxLatencyMs: number;
    requires: string[];
  };
  tools: string[];
  memory: {
    episodic: boolean;
    semanticProfile: boolean;
    windowStrategy: 'summarize' | 'truncate' | 'buffer';
  };
  triggers: { type: string; expr?: string }[];
  guardrails: {
    maxSteps: number;
    maxTokensPerRun: number;
    budgetUsdPerRun: number;
  };
  output: {
    channels: string[];
  };
}

import { toolCatalog } from '../temporal/tool-catalog';

@Controller('v1/agents')
export class AgentsController {
  @Post('compile')
  public compileAgent(@Body() body: { prompt: string }): AgentSpec {
    const rawPrompt = body.prompt || 'general assistant';
    const isCrypto = rawPrompt.toLowerCase().includes('crypto') || rawPrompt.toLowerCase().includes('sol');
    const isNews = rawPrompt.toLowerCase().includes('news') || rawPrompt.toLowerCase().includes('track');

    // Dynamically compile spec based on user prompt keywords (Mocking LLM Compiler schema output)
    const name = isCrypto
      ? 'Crypto Scout Agent'
      : isNews
      ? 'News Crawler Agent'
      : 'General Assistant Agent';

    const description = `Compiled from prompt: "${rawPrompt}"`;

    const instructions = isCrypto
      ? 'Monitor crypto sources. Surface high-signal Solana and SPL token announcements. Always verify information before alerts.'
      : isNews
      ? 'Scan RSS feeds and fetch URLs to track market developments. Categorize key events.'
      : 'Help users with general queries, format data structure, and answer queries accurately.';

    // Dynamic keyword matching from the 50 tools catalog
    const words = rawPrompt.toLowerCase().split(/\s+/);
    const compiledTools = toolCatalog
      .filter(tool => {
        const nameMatch = words.some(w => w.length > 2 && tool.name.toLowerCase().includes(w));
        const descMatch = words.some(w => w.length > 3 && tool.description.toLowerCase().includes(w));
        return nameMatch || descMatch;
      })
      .map(tool => tool.name);

    // Fallback default tools if no keyword matches
    const tools = compiledTools.length > 0 ? compiledTools : ['web_search', 'http_fetch'];

    return {
      name,
      description,
      instructions,
      characterId: 'char_analyst',
      modelPolicy: {
        mode: 'auto',
        pinnedModel: null,
        costTier: 'balanced',
        maxLatencyMs: 8000,
        requires: ['function_calling']
      },
      tools,
      memory: {
        episodic: true,
        semanticProfile: true,
        windowStrategy: 'summarize'
      },
      triggers: [
        { type: 'chat' },
        ...(isNews ? [{ type: 'cron', expr: '*/30 * * * *' }] : [])
      ],
      guardrails: {
        maxSteps: 12,
        maxTokensPerRun: 60000,
        budgetUsdPerRun: 0.25
      },
      output: {
        channels: ['chat', ...(isCrypto ? ['dm'] : [])]
      }
    };
  }
}
