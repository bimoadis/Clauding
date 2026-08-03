import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { db } from '../db/db';
import { users, agents, agentVersions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { toolCatalog } from '../temporal/tool-catalog';

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

@Controller('v1/agents')
export class AgentsController {
  @Post('compile')
  public async compileAgent(@Body() body: {
    prompt: string;
    wallet?: string;
    name?: string;
    description?: string;
    instructions?: string;
    tools?: string[];
    costTier?: 'economy' | 'balanced' | 'premium';
  }): Promise<AgentSpec> {
    const rawPrompt = body.prompt || 'general assistant';
    const wallet = body.wallet;
    
    const isCrypto = rawPrompt.toLowerCase().includes('crypto') || rawPrompt.toLowerCase().includes('sol');
    const isNews = rawPrompt.toLowerCase().includes('news') || rawPrompt.toLowerCase().includes('track');

    // Prioritize client-provided overrides from Step 3 editing form
    const name = body.name || (isCrypto
      ? 'Crypto Scout Agent'
      : isNews
      ? 'News Crawler Agent'
      : 'General Assistant Agent');

    const description = body.description || `Compiled from prompt: "${rawPrompt}"`;

    const instructions = body.instructions || (isCrypto
      ? 'Monitor crypto sources. Surface high-signal Solana and SPL token announcements. Always verify information before alerts.'
      : isNews
      ? 'Scan RSS feeds and fetch URLs to track market developments. Categorize key events.'
      : 'Help users with general queries, format data structure, and answer queries accurately.');

    // Prioritize custom tools list
    let tools: string[];
    if (body.tools && Array.isArray(body.tools)) {
      tools = body.tools;
    } else {
      // Dynamic keyword matching from the tools catalog
      const words = rawPrompt.toLowerCase().split(/\s+/);
      const compiledTools = toolCatalog
        .filter(tool => {
          const nameMatch = words.some(w => w.length > 2 && tool.name.toLowerCase().includes(w));
          const descMatch = words.some(w => w.length > 3 && tool.description.toLowerCase().includes(w));
          return nameMatch || descMatch;
        })
        .map(tool => tool.name);

      // Fallback default tools if no keyword matches
      tools = compiledTools.length > 0 ? compiledTools : ['web_search', 'http_fetch'];
    }

    const costTier = body.costTier || 'balanced';

    const spec: AgentSpec = {
      name,
      description,
      instructions,
      characterId: 'char_analyst',
      modelPolicy: {
        mode: 'auto',
        pinnedModel: null,
        costTier,
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

    // If wallet address is provided, register user and agent in database
    if (wallet && wallet.trim().length > 0) {
      try {
        console.log(`[DB] Registering agent for wallet: ${wallet}`);
        
        // Find or create user
        let userRecord = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1).then(r => r[0]);
        if (!userRecord) {
          const [newUser] = await db.insert(users).values({ wallet }).returning();
          userRecord = newUser;
          console.log(`[DB] Created new user record with ID: ${userRecord.id}`);
        }

        // Insert agent
        const [agentRecord] = await db.insert(agents).values({
          ownerId: userRecord.id,
          name: spec.name
        }).returning();

        // Insert version specs
        await db.insert(agentVersions).values({
          agentId: agentRecord.id,
          version: 1,
          spec: JSON.stringify(spec)
        });

        console.log(`[DB] Agent persisted successfully (Agent ID: ${agentRecord.id}, Name: ${spec.name})`);
      } catch (err) {
        console.error('[DB] Failed to persist agent to database:', err);
      }
    }

    return spec;
  }

  @Get('list')
  public async getAgentsByWallet(@Query('wallet') wallet: string) {
    if (!wallet || wallet.trim().length === 0) {
      return [];
    }
    try {
      const userRecord = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1).then(r => r[0]);
      if (!userRecord) {
        return [];
      }
      const userAgents = await db.select().from(agents).where(eq(agents.ownerId, userRecord.id));
      
      const agentsWithSpecs = [];
      for (const agent of userAgents) {
        const latestVersion = await db.select().from(agentVersions)
          .where(eq(agentVersions.agentId, agent.id))
          .orderBy(desc(agentVersions.version))
          .limit(1)
          .then(r => r[0]);
        
        let spec = null;
        if (latestVersion && latestVersion.spec) {
          try {
            spec = JSON.parse(latestVersion.spec);
          } catch (e) {
            console.error('Failed to parse agent spec JSON:', e);
          }
        }
        
        agentsWithSpecs.push({
          id: agent.id,
          name: agent.name,
          spec
        });
      }
      return agentsWithSpecs;
    } catch (err) {
      console.error('Failed to fetch agents list:', err);
      return [];
    }
  }
}
