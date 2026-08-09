import { Controller, Post, Body, Get, Query, Delete, Req, UseGuards } from '@nestjs/common';
import { db } from '../db/db';
import { users, agents, agentVersions, threads } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { toolCatalog } from '../temporal/tool-catalog';
import { AuthGuard } from '../auth/auth.guard';

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
  @UseGuards(AuthGuard)
  public async compileAgent(
    @Req() req: any,
    @Body() body?: {
      prompt: string;
      name?: string;
      description?: string;
      instructions?: string;
      tools?: string[];
      costTier?: 'economy' | 'balanced' | 'premium';
    }
  ): Promise<any> {
    // Support test scripts calling the controller directly with a single argument
    let actualBody = body;
    let wallet: string | undefined = undefined;

    if (!body && req && 'prompt' in req) {
      actualBody = req;
    } else if (req && req.user) {
      wallet = req.user.sub;
    }

    const rawPrompt = actualBody?.prompt || 'general assistant';
    
    const promptLower = rawPrompt.toLowerCase();
    const isCrypto = promptLower.includes('crypto') || promptLower.includes('sol') || promptLower.includes('token') || promptLower.includes('ca') || promptLower.includes('saldo') || promptLower.includes('wallet');
    const isNews = promptLower.includes('news') || promptLower.includes('berita') || promptLower.includes('track');

    // Prioritize client-provided overrides from Step 3 editing form
    let name = actualBody?.name;
    if (!name) {
      if (promptLower.includes('ca') || promptLower.includes('token') || promptLower.includes('scan') || promptLower.includes('kontrak')) {
        name = 'Token Analyzer Agent';
      } else if (promptLower.includes('saldo') || promptLower.includes('balance') || promptLower.includes('wallet') || promptLower.includes('dompet')) {
        name = 'Solana Wallet Monitor';
      } else if (isNews) {
        name = 'News Crawler Agent';
      } else if (isCrypto) {
        name = 'Crypto Scout Agent';
      } else {
        name = 'General Assistant Agent';
      }
    }

    const description = actualBody?.description || `Compiled from prompt: "${rawPrompt}"`;

    const instructions = actualBody?.instructions || (isCrypto
      ? 'Monitor crypto sources. Surface high-signal Solana and SPL token announcements. Always verify information before alerts.'
      : isNews
      ? 'Scan RSS feeds and fetch URLs to track market developments. Categorize key events.'
      : 'Help users with general queries, format data structure, and answer queries accurately.');

    // Prioritize custom tools list
    let tools: string[];
    if (actualBody?.tools && Array.isArray(actualBody.tools)) {
      tools = actualBody.tools;
    } else {
      // Indonesian & English keyword synonym mapping for tools
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
        twitter_post: ['twitter', 'tweet', 'post', 'cuit', 'cuitan'],
        text_translator: ['translate', 'translation', 'terjemah', 'terjemahan', 'bahasa'],
        text_to_speech: ['speech', 'suara', 'audio', 'voice', 'bicara'],
        speech_to_text: ['transcribe', 'transcription', 'rekaman', 'dengar'],
        image_ocr: ['ocr', 'scanner', 'scan', 'baca gambar', 'image'],
        text_sentiment_score: ['sentiment', 'score', 'nilai', 'sentiment score', 'emosi']
      };

      const matchedTools = new Set<string>();
      for (const [toolName, keywords] of Object.entries(keywordMappings)) {
        for (const kw of keywords) {
          if (promptLower.includes(kw)) {
            matchedTools.add(toolName);
          }
        }
      }

      const compiledTools = Array.from(matchedTools);
      // Fallback default tools if no keyword matches
      tools = compiledTools.length > 0 ? compiledTools : ['web_search', 'http_fetch'];
    }

    const costTier = actualBody?.costTier || 'balanced';

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
    let createdAgentRecordId: string | null = null;
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
        createdAgentRecordId = agentRecord.id;

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

    return {
      id: createdAgentRecordId,
      ...spec
    };
  }

  @Get('list')
  @UseGuards(AuthGuard)
  public async getAgentsByWallet(@Req() req: any) {
    const wallet = req.user.sub;
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

  @Delete('delete')
  @UseGuards(AuthGuard)
  public async deleteAgent(
    @Req() req: any,
    @Query('agentId') agentId: string
  ) {
    const wallet = req.user.sub;
    if (!agentId || !wallet) {
      return { success: false, error: 'agentId is required' };
    }
    try {
      // Find user
      const userRecord = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1).then(r => r[0]);
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Find agent to make sure owner matches
      const agentRecord = await db.select().from(agents)
        .where(and(eq(agents.id, agentId), eq(agents.ownerId, userRecord.id)))
        .limit(1)
        .then(r => r[0]);

      if (!agentRecord) {
        return { success: false, error: 'Agent not found or unauthorized' };
      }

      // Delete all threads belonging to this agent (which cascades to messages)
      await db.delete(threads).where(eq(threads.agentId, agentId));

      // Delete the agent itself (which cascades to agent_versions and memory_chunks)
      await db.delete(agents).where(eq(agents.id, agentId));

      console.log(`[DB] Agent ${agentId} and its associated chat threads were deleted.`);
      return { success: true };
    } catch (err) {
      console.error('Failed to delete agent:', err);
      return { success: false, error: err.message };
    }
  }
}
