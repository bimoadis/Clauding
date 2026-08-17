'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration mismatches
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const ALL_CATALOG_TOOLS = [
  'solana_balance',
  'spl_token_balance',
  'solana_transaction_history',
  'dex_token_price',
  'token_metadata',
  'jupiter_route_swap',
  'solana_sign_message',
  'solana_validators',
  'solana_block_details',
  'solana_airdrop_request',
  'web_search',
  'http_fetch',
  'news_search',
  'wikipedia_query',
  'reddit_subreddit_scan',
  'python_sandbox',
  'javascript_sandbox',
  'regex_parse',
  'json_validator',
  'hash_generator',
  'telegram_send',
  'discord_webhook',
  'slack_post',
  'email_send',
  'webhook_post',
  'scheduler_cron',
  'memory_durable_write',
  'memory_durable_read',
  'math_evaluate',
  'format_data_table',
  'coingecko_trending',
  'fear_greed_index',
  'solana_priority_fees',
  'token_holders_list',
  'liquidity_pool_depth',
  'twitter_post',
  'twitter_mentions',
  'rss_feed_reader',
  'farcaster_post',
  'farcaster_search',
  's3_upload',
  's3_download',
  'csv_to_json',
  'base64_encode',
  'base64_decode',
  'uuid_generator',
  'text_translator',
  'text_sentiment_score',
  'currency_exchange_converter',
  'text_to_speech',
  'speech_to_text',
  'image_ocr'
];

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Logo / Mascot mini icon
const LogoIconMini: React.FC = () => (
  <img
    src="/logo.png"
    alt="Clauding Logo"
    style={{
      width: '41px',
      height: '41px',
      objectFit: 'contain',
      borderRadius: '6px'
    }}
  />
);

// Message renderer helper for chat logs
const MessageContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
  }

  const lines = content.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-word' }}>
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#0f172a' }}>{trimmed.slice(2)}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#1e293b' }}>{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} style={{ fontSize: '14px', fontWeight: 'bold', margin: '6px 0 2px 0', color: '#334155' }}>{trimmed.slice(4)}</h3>;
        }
        if (trimmed === '---') {
          return <hr key={idx} style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
              <span>•</span>
              <span>{renderTextWithBold(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={idx} style={{ margin: 0 }}>{renderTextWithBold(line)}</p>;
      })}
    </div>
  );
};

function renderTextWithBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 'bold', color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function DashboardContent() {
  const router = useRouter();
  const { connected, publicKey, signMessage } = useWallet();
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const loginSIWS = async (walletAddress: string): Promise<string | null> => {
    try {
      console.log('Initiating SIWS login...');
      const nonceRes = await fetch(`${API_BASE_URL}/v1/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: walletAddress })
      });
      if (!nonceRes.ok) {
        throw new Error('Failed to fetch nonce from backend');
      }
      const { nonce, expiresAt } = await nonceRes.json();

      const message = `clauding.xyz wants you to sign in with your Solana account:\n${walletAddress}\n\nNonce: ${nonce}\nExpiration Time: ${expiresAt}`;

      if (!signMessage) {
        throw new Error('Wallet does not support message signing!');
      }
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      const verifyRes = await fetch(`${API_BASE_URL}/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: walletAddress,
          message,
          signature
        })
      });
      if (!verifyRes.ok) {
        throw new Error('Cryptographic signature verification failed');
      }
      const { accessToken } = await verifyRes.json();
      localStorage.setItem(`jwt_token_${walletAddress}`, accessToken);
      setJwtToken(accessToken);
      return accessToken;
    } catch (e: any) {
      console.error('SIWS Login failed:', e.message);
      setModalConfig({
        isOpen: true,
        title: 'Authentication Failed',
        message: `Failed to sign in with wallet: ${e.message}`,
        type: 'error'
      });
      return null;
    }
  };

  const [hasMounted, setHasMounted] = useState(false);

  // Builder state steps: 'prompt' | 'compiling' | 'configure' | 'playground'
  const [step, setStep] = useState<'prompt' | 'compiling' | 'configure' | 'playground'>('prompt');

  // Step 1: Prompt AI input state
  const [aiPrompt, setAiPrompt] = useState('');
  const [fullStackToggle, setFullStackToggle] = useState(true);
  const [noVibeToggle, setNoVibeToggle] = useState(false);

  // Unique agent name generator helper
  const generateClientUniqueName = (prompt?: string) => {
    const prefixes = ['Apex', 'Nova', 'Cyber', 'Aegis', 'Vanguard', 'Quantum', 'Hyper', 'Nexus', 'Prime', 'Solar', 'Pulse', 'Phantom', 'Aura', 'Helios', 'Krono', 'Orion'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomId = Math.floor(100 + Math.random() * 900);
    const lower = (prompt || '').toLowerCase();

    let role = 'Solana Scout';
    if (lower.includes('ca') || lower.includes('contract') || lower.includes('token')) {
      role = 'Token Scanner';
    } else if (lower.includes('saldo') || lower.includes('balance') || lower.includes('wallet')) {
      role = 'Vault Sentinel';
    } else if (lower.includes('price') || lower.includes('harga') || lower.includes('dex')) {
      role = 'Liquidity Oracle';
    } else if (lower.includes('news') || lower.includes('track')) {
      role = 'Signal Crawler';
    }
    return `${randomPrefix} ${role} #${randomId}`;
  };

  // Step 3: Editable Agent Config states
  const [name, setName] = useState(() => generateClientUniqueName());
  const [description, setDescription] = useState('Compiled from prompt: "make solana report"');
  const [instructions, setInstructions] = useState('Monitor crypto sources. Surface high-signal Solana and SPL token announcements. Always verify information before alerts.');
  const [tools, setTools] = useState<string[]>([
    'solana_balance',
    'spl_token_balance',
    'solana_transaction_history',
    'solana_sign_message',
    'solana_validators',
    'solana_block_details',
    'solana_airdrop_request',
    'solana_priority_fees',
    'token_metadata',
    'dex_token_price',
    'liquidity_pool_depth'
  ]);
  const [selectedCharId, setSelectedCharId] = useState('char_analyst');
  const [costTier, setCostTier] = useState<'economy' | 'balanced' | 'premium'>('balanced');

  // Launching lock state
  const [isPublishing, setIsPublishing] = useState(false);

  // Step 4: Sandbox Chat state
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; content: string; model?: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentModel, setCurrentModel] = useState('');

  // Mobile menu toggle state inside dashboard
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [myAgents, setMyAgents] = useState<{ id: string; name: string; spec: any }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'error' | 'success' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Sandbox Chat viewport ref for auto-scrolling
  const chatViewportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [chatLog, currentResponse, isStreaming]);

  useEffect(() => {
    setHasMounted(true);
    console.log('Console mounted. Initializing dashboard components.');

    // Parse query params using native window object to avoid NextJS useSearchParams hydration hang
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const promptQuery = params.get('prompt');
      if (promptQuery) {
        console.log('Query parameter prompt detected:', promptQuery);
        setAiPrompt(promptQuery);
        triggerCompilation(promptQuery);
      }
    }
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toBase58();
      (async () => {
        try {
          let token = localStorage.getItem(`jwt_token_${walletAddress}`);
          if (!token) {
            token = await loginSIWS(walletAddress);
          } else {
            setJwtToken(token);
          }

          if (!token) return;

          console.log(`Fetching compiled agents list for wallet: ${walletAddress}...`);
          const res = await fetch(`${API_BASE_URL}/v1/agents/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setMyAgents(data);
            if (data.length > 0) {
              console.log(`Detected ${data.length} registered agents. Auto-transitioning to Step 4 Live Chat.`);
              setStep('playground');
              const latestAgent = data[data.length - 1];
              setSelectedAgentId(latestAgent.id);
              setName(latestAgent.name);
              if (latestAgent.spec) {
                setDescription(latestAgent.spec.description || '');
                setInstructions(latestAgent.spec.instructions || '');
                setTools(latestAgent.spec.tools || []);
                if (latestAgent.spec.modelPolicy && latestAgent.spec.modelPolicy.costTier) {
                  setCostTier(latestAgent.spec.modelPolicy.costTier);
                }
              }
              // Fetch history for the latest agent
              try {
                const histRes = await fetch(`${API_BASE_URL}/v1/chat/history?agentId=${latestAgent.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (histRes.ok) {
                  const histData = await histRes.json();
                  if (histData.length > 0) {
                    setChatLog(histData);
                  } else {
                    setChatLog([
                      { role: 'assistant', content: `🤖 **Welcome back!** Loaded your existing agent **${latestAgent.name}**. I am ready to monitor balances, run tasks, and assist you. How can I help?` }
                    ]);
                  }
                } else {
                  setChatLog([
                    { role: 'assistant', content: `🤖 **Welcome back!** Loaded your existing agent **${latestAgent.name}**. I am ready to monitor balances, run tasks, and assist you. How can I help?` }
                  ]);
                }
              } catch (e) {
                console.error('Failed to load chat history:', e);
                setChatLog([
                  { role: 'assistant', content: `🤖 **Welcome back!** Loaded your existing agent **${latestAgent.name}**. I am ready to monitor balances, run tasks, and assist you. How can I help?` }
                ]);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load agents list:', e);
        }
      })();
    } else {
      setMyAgents([]);
      setSelectedAgentId('');
      setJwtToken(null);
    }
  }, [connected, publicKey]);

  const triggerCompilation = async (promptText: string) => {
    if (!promptText.trim()) {
      console.warn('Compilation triggered with empty prompt. Action ignored.');
      return;
    }
    console.log('Step 1: Triggering spec compilation...');
    console.log('Prompt input:', promptText);
    console.log('Active toggles - AUTONOMOUS:', fullStackToggle, 'EXPERT TOOLS:', noVibeToggle);

    setStep('compiling');
    console.log(`Step 2: Switch to compiling state screen. Sending request to ${API_BASE_URL}/v1/agents/compile`);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/agents/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken || localStorage.getItem('jwt_token_' + publicKey?.toBase58()) || ''}`
        },
        body: JSON.stringify({
          prompt: promptText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to compile agent spec');
      }

      const data = await response.json();
      console.log('Step 2 Success: Compiler returned agent spec data:', data);

      setName(data.name || generateClientUniqueName(promptText));
      setDescription(data.description || `Compiled from prompt: "${promptText}"`);
      setInstructions(data.instructions || '');
      setTools(data.tools || [
        'solana_balance',
        'spl_token_balance',
        'solana_transaction_history',
        'solana_sign_message',
        'solana_validators',
        'solana_block_details',
        'solana_airdrop_request',
        'solana_priority_fees'
      ]);
      if (data.modelPolicy?.costTier) setCostTier(data.modelPolicy.costTier);
      if (data.characterId) setSelectedCharId(data.characterId);

      setStep('configure');
      console.log('Step 2 ➔ Step 3: Switched wizard to configure & review settings view.');
    } catch (err) {
      console.error('Step 2 Error: Spec compilation failed. Error logs:', err);
      console.log('Step 2 Fallback: Loading developer fallback spec values to configure screen.');

      setName(generateClientUniqueName(promptText));
      setDescription(`Compiled from prompt: "${promptText}"`);
      setStep('configure');
    }
  };

  const handleLaunchAgent = async () => {
    if (isPublishing) {
      console.warn('Step 3 Warning: Launch ignored because publication is already in progress.');
      return;
    }

    console.log('Step 3: Initiating agent launch live command...');
    console.log('Launch Settings - Name:', name);
    console.log('Launch Settings - Description:', description);
    console.log('Launch Settings - System Instructions:', instructions);
    console.log('Launch Settings - Selected Capabilities (Tools):', tools);

    if (!connected || !publicKey) {
      console.warn('Step 3 Warning: Launch cancelled because Solana wallet is not connected.');
      setModalConfig({
        isOpen: true,
        title: 'Wallet Connection Required',
        message: 'Please connect your Solana wallet to launch the agent.',
        type: 'info'
      });
      return;
    }
    console.log('Wallet verification passed. Public Key Base58:', publicKey.toBase58());

    setIsPublishing(true);

    try {
      console.log(`Step 3: Sending agent launch compile payload to ${API_BASE_URL}/v1/agents/compile...`);
      const response = await fetch(`${API_BASE_URL}/v1/agents/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken || localStorage.getItem('jwt_token_' + publicKey?.toBase58()) || ''}`
        },
        body: JSON.stringify({
          prompt: aiPrompt || `Name: ${name}`,
          name: name,
          description: description,
          instructions: instructions,
          tools: tools,
          costTier: costTier
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish agent');
      }

      const data = await response.json();
      if (data.id) {
        setSelectedAgentId(data.id);
      }

      try {
        const listRes = await fetch(`${API_BASE_URL}/v1/agents/list`, {
          headers: { 'Authorization': `Bearer ${jwtToken || localStorage.getItem('jwt_token_' + publicKey?.toBase58()) || ''}` }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          setMyAgents(listData);
        }
      } catch (e) {
        console.error('Failed to reload agents list after compilation:', e);
      }

      console.log('Step 3 Success: Agent successfully launched live in database.');
      setChatLog([
        { role: 'assistant', content: `🤖 **Agent Live!** Hello, I am **${name}** (routed with *${costTier.toUpperCase()}* tier policy). I am ready to monitor balances, run tasks, and assist you. How can I help?` }
      ]);
      setStep('playground');
      console.log('Step 3 ➔ Step 4: Switched view to live chat sandbox playground.');
    } catch (err) {
      console.error('Step 3 Error: Failed to publish live agent. Error:', err);
      setModalConfig({
        isOpen: true,
        title: 'Launch Failed',
        message: 'Failed to launch agent on backend database.',
        type: 'error'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendSandboxPrompt = async () => {
    if (!sandboxPrompt.trim()) return;
    if (isStreaming) {
      console.warn('Step 4 Warning: Send message blocked because chat stream is already busy.');
      return;
    }

    console.log('Step 4: Sending message to sandbox console:', sandboxPrompt);
    setIsStreaming(true);
    setCurrentResponse('');
    setCurrentModel('');

    const userMsg = { role: 'user', content: sandboxPrompt };
    setChatLog(prev => [...prev, userMsg]);
    setSandboxPrompt('');

    const agentParam = selectedAgentId ? `&agentId=${selectedAgentId}` : '';
    const token = jwtToken || (publicKey ? localStorage.getItem(`jwt_token_${publicKey.toBase58()}`) : null) || '';
    const targetUrl = `${API_BASE_URL}/v1/chat/stream?message=${encodeURIComponent(sandboxPrompt)}&costTier=${costTier}&tools=${encodeURIComponent(JSON.stringify(tools))}&token=${token}${agentParam}`;
    console.log('Step 4: Opening SSE (Server-Sent Events) network chat stream connection at:', targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 429) {
          let resetMsg = "";
          try {
            const errJson = await response.json();
            if (errJson && typeof errJson.resetInSecs === 'number') {
              const minutes = Math.floor(errJson.resetInSecs / 60);
              const seconds = errJson.resetInSecs % 60;
              if (minutes > 0) {
                resetMsg = ` for ${minutes}m ${seconds}s`;
              } else {
                resetMsg = ` for ${seconds}s`;
              }
            }
          } catch (e) {
            // Ignore parsing error
          }
          throw new Error(`Rate limit exceeded. Please wait${resetMsg} before trying again, or hold 50,000 $CLDG to unlock Pro Tier for unlimited access!`);
        }
        throw new Error(`Chat stream connection failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let tempResp = '';
      let activeModelId = '';

      if (reader) {
        console.log('Step 4 Stream: Successfully opened reader loop.');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Step 4 Stream: Server finished sending data stream.');
            break;
          }

          const chunkText = decoder.decode(value);
          const lines = chunkText.split('\n');

          let currentEvent = '';
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const dataRaw = line.replace('data:', '').trim();
              try {
                const payload = JSON.parse(dataRaw);
                if (currentEvent === 'run.started') {
                  activeModelId = payload.model;
                  console.log('Step 4 Routing: Router picked active model:', payload.model);
                  setCurrentModel(payload.model);
                } else if (currentEvent === 'token') {
                  tempResp += payload.delta;
                  setCurrentResponse(tempResp);
                }
              } catch (e) {
                // Ignore parse errors on SSE ticks
              }
            }
          }
        }
      }

      console.log('Step 4 Success: Chat response completed. Final response message length:', tempResp.length);
      setChatLog(prev => [...prev, { role: 'assistant', content: tempResp, model: activeModelId }]);
      setCurrentResponse('');
    } catch (err) {
      console.error('Step 4 Error: Stream reading loop failed. Details:', err);
      setChatLog(prev => [...prev, { role: 'assistant', content: `⚠️ Error communicating with agent: ${err instanceof Error ? err.message : 'Connection lost'}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!hasMounted) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ fontWeight: 'bold' }}>Loading Console...</h3>
      </div>
    );
  }

  return (
    <div style={{
      backgroundImage: "linear-gradient(rgba(250, 250, 249, 0.3), rgba(250, 250, 249, 0.3)), url('/hero-bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#FAFAF9',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#0A0A0A',
      position: 'relative'
    }}>

      {/* Vanilla Responsive CSS Stylesheet */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (min-width: 901px) {
          .dashboard-mobile-btn { display: none !important; }
          .dashboard-mobile-overlay { display: none !important; }
        }

        @media (max-width: 900px) {
          .desktop-stepper { display: none !important; }
          .desktop-wallet { display: none !important; }
          .dashboard-mobile-btn { display: block !important; }

          .responsive-header {
            padding: 20px 24px !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid #e2e8f0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
          }
          .responsive-main {
            padding-top: 80px !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .responsive-playground {
            flex-direction: column-reverse !important; /* Stack chat window ABOVE sidebar agent details */
            height: auto !important;
          }
          .responsive-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 24px 16px !important;
          }
          .responsive-chat-window {
            height: 550px !important;
            padding: 16px !important;
          }
        }

        /* Design System Input Fields Styling */
        .design-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          font-size: 14px;
          color: #0A0A0A;
          background: #FDFBF8;
          transition: all 0.2s ease-in-out;
        }
        .design-input:focus {
          border-color: #F5601C !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(245, 96, 28, 0.08) !important;
        }

        .design-textarea {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          outline: none;
          font-size: 14px;
          line-height: 1.6;
          color: #0A0A0A;
          background: #FDFBF8;
          transition: all 0.2s ease-in-out;
          resize: vertical;
          font-family: inherit;
        }
        .design-textarea:focus {
          border-color: #F5601C !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(245, 96, 28, 0.08) !important;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-gear {
        animation: spin-slow 4s linear infinite;
        }
      `}} />

      {/* Header bar (Styled exactly like Home page navbar) */}
      <header style={{
        width: '100%',
        // background: '#FFFFFF',
        // borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        zIndex: 100
      }}>
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '20px', color: '#0A0A0A', letterSpacing: '-0.02em', cursor: 'pointer' }}
        >
          <LogoIconMini />
          <span>Clauding Builder</span>
        </div>

        {/* Center: Stepper Wizard Indicator inside Floating White Pill Container */}
        <div className="desktop-stepper" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          height: '40px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          padding: '0 24px',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          fontSize: '13px',
          fontWeight: 700,
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step !== 'prompt' ? '#10B981' : '#F5601C' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: step !== 'prompt' ? '#10B981' : '#F5601C',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}>{step !== 'prompt' ? '✓' : '1'}</span>
            <span>Prompt</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#E2E8F0' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (step === 'configure' || step === 'playground') ? '#10B981' : (step === 'compiling' ? '#F5601C' : '#94A3B8') }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: (step === 'configure' || step === 'playground') ? '#10B981' : (step === 'compiling' ? '#F5601C' : '#E2E8F0'),
              color: (step === 'configure' || step === 'playground' || step === 'compiling') ? '#FFFFFF' : '#64748B',
              display: 'grid',
              placeItems: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}>{(step === 'configure' || step === 'playground') ? '✓' : '2'}</span>
            <span>Configure</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#E2E8F0' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'playground' ? '#10B981' : (step === 'configure' ? '#F5601C' : '#94A3B8') }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: step === 'playground' ? '#10B981' : (step === 'configure' ? '#F5601C' : '#E2E8F0'),
              color: (step === 'playground' || step === 'configure') ? '#FFFFFF' : '#64748B',
              display: 'grid',
              placeItems: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}>{step === 'playground' ? '✓' : '3'}</span>
            <span>Review</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#E2E8F0' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'playground' ? '#F5601C' : '#94A3B8' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: step === 'playground' ? '#F5601C' : '#E2E8F0',
              color: step === 'playground' ? '#FFFFFF' : '#64748B',
              display: 'grid',
              placeItems: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}>4</span>
            <span>Launch</span>
          </div>
        </div>

        {/* Right: Connected Wallet MultiButton & Socials */}
        <div className="desktop-wallet" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://x.com/usecldg?s=11"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow @usecldg on X"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0A0A0A',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <WalletMultiButton style={{
            background: '#F5601C',
            borderRadius: '999px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0 24px',
            height: '40px',
            border: 0,
            color: '#FFFFFF'
          }} />
        </div>

        {/* Dashboard Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="dashboard-mobile-btn"
          style={{
            background: 'none',
            border: 0,
            fontSize: '28px',
            cursor: 'pointer',
            color: '#0A0A0A',
            padding: '4px 8px',
            outline: 'none'
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile Dropdown Menu Overlay for Dashboard */}
        {isMobileMenuOpen && (
          <div className="dashboard-mobile-overlay" style={{
            position: 'absolute',
            top: '72px',
            left: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            zIndex: 99
          }}>
            {/* Stepper displayed vertically inside hamburger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', alignItems: 'flex-start', paddingLeft: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: step !== 'prompt' ? '#10b981' : '#F5601C', fontSize: '14px', fontWeight: 'bold' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step !== 'prompt' ? '#10b981' : '#F5601C', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '11px' }}>{step !== 'prompt' ? '✓' : '1'}</span>
                <span>1. Prompt Specification</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: (step === 'configure' || step === 'playground') ? '#10b981' : (step === 'compiling' ? '#F5601C' : '#94a3b8'), fontSize: '14px', fontWeight: 'bold' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: (step === 'configure' || step === 'playground') ? '#10b981' : (step === 'compiling' ? '#F5601C' : '#ecefef'), color: (step === 'configure' || step === 'playground' || step === 'compiling') ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontSize: '11px' }}>{(step === 'configure' || step === 'playground') ? '✓' : '2'}</span>
                <span>2. AI Compilation Spec</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: step === 'playground' ? '#10b981' : (step === 'configure' ? '#F5601C' : '#94a3b8'), fontSize: '14px', fontWeight: 'bold' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 'playground' ? '#10b981' : (step === 'configure' ? '#F5601C' : '#ecefef'), color: (step === 'playground' || step === 'configure') ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontSize: '11px' }}>{step === 'playground' ? '✓' : '3'}</span>
                <span>3. Review Agent Settings</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: step === 'playground' ? '#F5601C' : '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 'playground' ? '#F5601C' : '#ecefef', color: step === 'playground' ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontSize: '11px' }}>4</span>
                <span>4. Launch & Chat Sandbox</span>
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '8px 0' }} />

            <a
              href="https://x.com/usecldg?s=11"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0A0A0A',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: '999px',
                background: '#F1F5F9',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Follow @usecldg on X</span>
            </a>

            <WalletMultiButton style={{
              background: '#F5601C',
              borderRadius: '999px',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '0 24px',
              height: '40px',
              border: 0,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(245, 96, 28, 0.2)',
              width: '100%',
              justifyContent: 'center'
            }} />
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="responsive-main" style={{ flex: 1, zIndex: 1, display: 'flex', flexDirection: 'column', paddingTop: 0 }}>

        {/* Step 1: Prompt AI View */}
        {step === 'prompt' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px 80px 20px',
            position: 'relative',
            width: '100%'
          }}>
            {/* Mascot header badges */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', padding: '6px 16px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ width: '6px', height: '6px', background: '#F5601C', borderRadius: '50%' }}></span>
                1 wallet = unlimited agents
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#475569', padding: '6px 16px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Keep spec private</span>
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: '12px', color: '#0A0A0A', lineHeight: 1.1 }}>
              Compile AI Agent
            </h1>
            <p style={{ color: '#475569', fontSize: 'clamp(15px, 2vw, 17px)', textAlign: 'center', maxWidth: '580px', marginBottom: '32px', lineHeight: 1.5 }}>
              Turn your idea into a production-ready agent.<br />
              Auto-compile capabilities, review the spec, and launch it.
            </p>

            {/* Dark input prompt window card */}
            <div style={{
              width: '100%',
              maxWidth: '780px',
              background: '#111318',
              border: '1px solid #222630',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.15)',
              padding: '24px',
              marginBottom: '28px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#F5601C', borderRadius: '50%' }}></span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AGENT PROMPT
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#88909E' }}>
                  describe task instructions or integrations
                </span>
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the AI agent you want to build (e.g. 'check solana balance and monitor high-value SPL token swaps')..."
                rows={4}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  resize: 'none',
                  fontSize: '16px',
                  lineHeight: 1.5,
                  color: '#FFFFFF',
                  fontFamily: 'inherit',
                  marginBottom: '20px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222630', paddingTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={fullStackToggle}
                      onChange={() => setFullStackToggle(!fullStackToggle)}
                      style={{ accentColor: '#F5601C', cursor: 'pointer' }}
                    />
                    <span>Autonomous</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={noVibeToggle}
                      onChange={() => setNoVibeToggle(!noVibeToggle)}
                      style={{ accentColor: '#F5601C', cursor: 'pointer' }}
                    />
                    <span>Expert tools ▾</span>
                  </label>
                </div>

                <button
                  onClick={() => triggerCompilation(aiPrompt)}
                  style={{
                    background: '#F5601C',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '12px',
                    padding: '12px 28px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(245, 96, 28, 0.3)'
                  }}
                >
                  COMPILE AGENT
                </button>
              </div>
            </div>

            {/* Compact 2-Feature Pills Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', width: '100%', maxWidth: '600px', marginBottom: '36px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#F5601C" stroke="#F5601C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0A' }}>Auto-routed LLMs</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Best model for your task</div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5601C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 4-2 2 4 4 2-2a2.828 2.828 0 1 0-4-4Z" fill="#FFEDD5" />
                    <path d="m13 6-9.5 9.5a2.121 2.121 0 0 0 3 3L16 9" />
                    <path d="M19 15v2" />
                    <path d="M18 16h2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0A' }}>Custom Solana Tools</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Use built-in or your own</div>
                </div>
              </div>
            </div>

            {/* Built-in Solana Tools Header */}
            <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 6px 0' }}>
                  Built-in Solana Tools
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  Use these tools to analyze, monitor, and protect before you trade.
                </p>
              </div>
              <button style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#0A0A0A', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                View all tools →
              </button>
            </div>

            {/* 4x3 Grid of 11 Tools + 1 Add Custom Tool */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              width: '100%',
              maxWidth: '1100px',
              marginBottom: '40px'
            }}>
              {[
                { title: 'Wallet Balance Checker', desc: 'Inspect SOL and SPL token balances instantly.', icon: '/icons/capability-wallet-balance.svg' },
                { title: 'Transaction History', desc: 'Monitor transfer history and high-value swaps.', icon: '/icons/capability-transaction-history.svg' },
                { title: 'Block Explorer Queries', desc: 'Query block hashes, slot times, and validator states.', icon: '/icons/capability-block-explorer.svg' },
                { title: 'Devnet Airdrop Faucet', desc: 'Request SOL drops directly to testnets.', icon: '/icons/capability-airdrop-faucet.svg' },
                { title: 'Transaction Signer', desc: 'Securely sign payload messages or authorize actions.', icon: '/icons/capability-transaction-signer.svg' },
                { title: 'Priority Fee Optimizer', desc: 'Track network congestion and estimate priority fees.', icon: '/icons/capability-priority-fee-optimizer.svg' },
                { title: 'Rugpull Scanner', desc: 'Scan contract addresses for rugpull warning indicators and safety parameters.', icon: '/icons/general-search.svg' },
                { title: 'Token Metadata Analyzer', desc: 'Retrieve and analyze on-chain token metadata details.', icon: '/icons/persona-analyst.svg' },
                { title: 'DEX & Liquidity Tracker', desc: 'Check real-time DEX token prices and liquidity pool depth metrics.', icon: '/icons/capability-priority-fee-optimizer.svg' },
                { title: 'Contract Ownership Verifier', desc: 'Verify contract ownership status and check if authority is renounced.', icon: '/icons/status-verified.svg' },
                { title: 'LP Lock Inspector', desc: 'Check lock and burn status of token liquidity pools.', icon: '/icons/capability-transaction-signer.svg' }
              ].map((skill, index) => (
                <div key={index} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  minHeight: '190px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                      <img src={skill.icon} alt="" style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }} />
                      <strong style={{ fontSize: '15px', fontWeight: '800', color: '#0A0A0A', lineHeight: '1.2' }}>
                        {skill.title}
                      </strong>
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', margin: 0 }}>
                      {skill.desc}
                    </p>
                  </div>

                  <div style={{
                    alignSelf: 'flex-end',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#FAFAF8',
                    border: '1px solid #E5E7EB',
                    color: '#0A0A0A',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '16px'
                  }}>
                    →
                  </div>
                </div>
              ))}

              {/* 12th Card: Add Custom Tool */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #FDBA74',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                minHeight: '190px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(245, 96, 28, 0.05)'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#FFF7ED', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '32px', color: '#F5601C', fontWeight: 800 }}>
                      +
                    </div>
                    <strong style={{ fontSize: '15px', fontWeight: '800', color: '#F5601C', lineHeight: '1.2' }}>
                      Add Custom Tool
                    </strong>
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', margin: 0 }}>
                    Integrate your own API or on-chain tool.
                  </p>
                </div>

                <div style={{
                  alignSelf: 'flex-end',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  color: '#F5601C',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '16px'
                }}>
                  →
                </div>
              </div>
            </div>

            {/* Bottom Security Info Banner */}
            <div style={{
              width: '100%',
              maxWidth: '1100px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
            }}>
              {/* Item 1: Private by default */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Private by default</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Your agent spec stays private on-chain & in transit.</p>
                </div>
              </div>

              {/* Item 2: Secure execution */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" fill="#0A0A0A" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Secure execution</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Tools run in isolated sandbox with scoped permissions.</p>
                </div>
              </div>

              {/* Item 3: Up-to-date data */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Up-to-date data</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Real-time Solana data from reliable sources.</p>
                </div>
              </div>

              {/* Item 4: Developer first */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Developer first</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Open APIs, webhooks, and easy integrations.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Compiling Spec View */}
        {step === 'compiling' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 20px 80px 20px',
            position: 'relative',
            width: '100%'
          }}>
            {/* Status header badge */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', padding: '6px 16px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ width: '8px', height: '8px', background: '#F5601C', borderRadius: '50%' }}></span>
                Fable 5 Compiler Active
              </span>
            </div>

            {/* Solid White Card styled like Step 1 */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '48px 40px',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.04)',
              maxWidth: '560px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px'
            }}>
              {/* Brand Orange Animated Cogwheel */}
              <div style={{ position: 'relative', width: '72px', height: '72px', display: 'grid', placeItems: 'center', marginBottom: '24px' }}>
                <svg className="spin-gear" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F5601C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px', color: '#0A0A0A' }}>
                Compiling Agent Spec...
              </h2>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, maxWidth: '420px', margin: '0 0 28px 0' }}>
                Structuring prompt tools, mapping Solana adapters, and establishing voice model directives.
              </p>

              {/* Dark Terminal Output Log matching Step 1 dark card style */}
              <div style={{
                width: '100%',
                background: '#111318',
                border: '1px solid #222630',
                borderRadius: '12px',
                padding: '16px 20px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#A0AEC0',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981' }}>
                  <span>✓</span> <span>[1/3] Parsing prompt requirements...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F5601C' }}>
                  <span className="spin-gear" style={{ display: 'inline-block' }}>⚙</span> <span>[2/3] Auto-routing LLMs & tool specs...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B' }}>
                  <span>○</span> <span>[3/3] Establishing sandbox directives...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Step 3: Review Settings View */}
        {step === 'configure' && (
          <div style={{ flex: 1, maxWidth: '1140px', margin: '0 auto', padding: '24px 20px 80px 20px', width: '100%' }}>

            {/* Back button */}
            <button
              onClick={() => setStep('prompt')}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#475569',
                cursor: 'pointer',
                marginBottom: '24px',
                fontSize: '13px',
                fontWeight: 700,
                padding: '8px 18px',
                borderRadius: '999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Back to Compiler
            </button>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '32px', alignItems: 'start', marginBottom: '40px' }}>

              {/* Left panel: Spec Summary Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#0A0A0A' }}>
                    Review Agent Settings
                  </h2>
                  <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
                    Review your agent specification before launching it live.
                  </p>
                </div>

                {/* Card 1: Agent Name, Version, Mode */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.2fr', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FAFAF8', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AGENT NAME</span>
                        <button
                          type="button"
                          onClick={() => setName(generateClientUniqueName(aiPrompt))}
                          title="Generate Unique Name"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          Shuffle Name
                        </button>
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ fontSize: '15px', fontWeight: 800, color: '#0A0A0A', border: 0, outline: 0, background: 'transparent', width: '100%', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>VERSION</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0A' }}>1.0.0</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>MODE</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0A' }}>Autonomous</div>
                  </div>
                </div>

                {/* Card 2: Description */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>DESCRIPTION</div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Compiled from prompt: "cek solana"'
                    style={{ fontSize: '14px', color: '#0A0A0A', border: 0, outline: 0, background: 'transparent', width: '100%', fontFamily: 'inherit', fontWeight: 500 }}
                  />
                </div>

                {/* Card 3: System Instructions */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>SYSTEM INSTRUCTIONS</div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    style={{ fontSize: '14px', lineHeight: 1.5, color: '#0A0A0A', border: 0, outline: 0, background: 'transparent', width: '100%', fontFamily: 'inherit', resize: 'none', fontWeight: 500 }}
                  />
                </div>

                {/* 4 Meta Stats Seamless Row with Vertical Dividers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '6px 0' }}>
                  {/* Item 1: PRIVACY */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #E5E7EB', paddingRight: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>PRIVACY</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Spec kept private</div>
                    </div>
                  </div>

                  {/* Item 2: ESTIMATED COST */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #E5E7EB', paddingRight: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v12M15 9.5a2.5 2.5 0 0 0-5 0c0 1.5 1 2 2.5 2.5s2.5 1 2.5 2.5a2.5 2.5 0 0 1-5 0" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>ESTIMATED COST</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Low</div>
                    </div>
                  </div>

                  {/* Item 3: TOOLS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #E5E7EB', paddingRight: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>TOOLS</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{tools.length} enabled</div>
                    </div>
                  </div>

                  {/* Item 4: LAST UPDATED */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>LAST UPDATED</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', lineHeight: 1.2, whiteSpace: 'nowrap' }}>May 13, 2025 10:24 AM</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button: Full Width Launch Agent Live */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: '8px' }}>
                  <button
                    onClick={handleLaunchAgent}
                    disabled={isPublishing}
                    style={{
                      background: isPublishing ? '#94A3B8' : '#F5601C',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '12px',
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 16px rgba(245, 96, 28, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%'
                    }}
                  >
                    {isPublishing ? 'Launching Live...' : 'Launch Agent Live'}
                  </button>
                  <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '8px' }}>
                    Secure • Private • Encrypted
                  </div>
                </div>
              </div>

              {/* Right panel: Capabilities (Tools) Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0A', margin: 0 }}>
                    Selected Capabilities (Tools)
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', padding: '4px 12px', borderRadius: '999px' }}>
                    {tools.length} enabled
                  </span>
                </div>

                {/* Styled dynamic tool chips matching reference image */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tools.map(tool => (
                    <span key={tool} style={{
                      padding: '6px 12px',
                      background: '#FAFAF9',
                      border: '1px solid #E5E7EB',
                      color: '#0A0A0A',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                      <span>{tool}</span>
                      <button
                        onClick={() => setTools(prev => prev.filter(t => t !== tool))}
                        style={{
                          background: 'none',
                          border: 0,
                          color: '#94A3B8',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginLeft: '2px',
                          padding: '0 2px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Custom Tool Dropdown/Selector Button */}
                <div style={{ marginTop: '8px' }}>
                  <select
                    onChange={(e) => {
                      const selectedTool = e.target.value;
                      if (selectedTool && !tools.includes(selectedTool)) {
                        setTools(prev => [...prev, selectedTool]);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: '#0A0A0A',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="" disabled>+ Add Custom Tool...</option>
                    {ALL_CATALOG_TOOLS.filter(t => !tools.includes(t)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Bottom Callout Info Box */}
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '16px', fontWeight: 'bold' }}>ⓘ</span>
                  <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                    These tools will be available for your agent to use during execution.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Security Info Banner across both columns */}
            <div style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Spec kept private</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Your agent specification is encrypted and never shared.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" fill="#0A0A0A" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Secure execution</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Tools run in isolated environment with scoped permissions.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: '20px' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Up-to-date data</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Built-in tools use reliable, real-time Solana data sources.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: '#0A0A0A' }}>Developer first</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>Open APIs, webhooks, and easy integrations.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Live Agent Chat Playground View */}
        {step === 'playground' && (
          <div style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '12px 20px 16px 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Main 3-Column Desktop Grid */}
            <div className="responsive-playground-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', gap: '16px', alignItems: 'start' }}>

              {/* Column 1: Left Agent Controls Sidebar */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px',
                height: '550px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      ACTIVE AGENT
                    </div>
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FAFAF8', border: '1px solid #F1F5F9', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: '14px' }}>
                        🤖
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name || 'Crypto Scout Agent'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }}></span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981' }}>Live</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      SWITCH AGENT
                    </div>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        const targetAgent = myAgents.find(a => a.id === targetId);
                        if (targetAgent) {
                          setSelectedAgentId(targetAgent.id);
                          setName(targetAgent.name);
                          if (targetAgent.spec) {
                            setDescription(targetAgent.spec.description || '');
                            setInstructions(targetAgent.spec.instructions || '');
                            setTools(targetAgent.spec.tools || []);
                          }
                          (async () => {
                            try {
                              const token = jwtToken || localStorage.getItem(`jwt_token_${publicKey!.toBase58()}`) || '';
                              const histRes = await fetch(`${API_BASE_URL}/v1/chat/history?agentId=${targetAgent.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (histRes.ok) {
                                const histData = await histRes.json();
                                setChatLog(histData.length > 0 ? histData : [{ role: 'assistant', content: `🤖 Switched to agent **${targetAgent.name}**. Ready for instructions.` }]);
                              }
                            } catch (e) {
                              console.error('Failed to load chat history:', e);
                            }
                          })();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        background: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#0A0A0A',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {myAgents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      {myAgents.length === 0 && <option value="">{name || 'Solana Wallet Monitor'}</option>}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAiPrompt('');
                    setChatLog([]);
                    setStep('prompt');
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0A0A0A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  Compile New Agent
                </button>
              </div>

              {/* Column 2: Center Sandbox Chat Playground */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                height: '550px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
              }}>
                {/* Chat Log Viewport */}
                <div ref={chatViewportRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {chatLog.map((log, idx) => (
                    <div key={idx} style={{ alignSelf: log.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, marginBottom: '3px', textAlign: log.role === 'user' ? 'right' : 'left' }}>
                        {log.role === 'user' ? 'You 10:24 AM' : `[Agent Active — ${log.model ? log.model.toUpperCase() : 'CLAUDE-3-5-SONNET'}]`}
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: log.role === 'user' ? '14px 14px 4px 14px' : '14px',
                        background: log.role === 'user' ? '#F5601C' : '#FAFAF9',
                        border: log.role === 'user' ? 0 : '1px solid #F1F5F9',
                        color: log.role === 'user' ? '#FFFFFF' : '#0A0A0A',
                        boxShadow: log.role === 'user' ? '0 4px 12px rgba(245, 96, 28, 0.25)' : 'none',
                        fontSize: '13px'
                      }}>
                        <MessageContent content={log.content} isUser={log.role === 'user'} />
                      </div>
                    </div>
                  ))}

                  {/* Live Streaming Message Bubble */}
                  {isStreaming && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, marginBottom: '3px' }}>
                        [Agent Active — {currentModel ? currentModel.toUpperCase() : 'CLAUDE-3-5-SONNET'}]
                      </div>
                      <div style={{ padding: '10px 14px', borderRadius: '14px', background: '#FAFAF9', border: '1px solid #F1F5F9', color: '#0A0A0A', fontSize: '13px' }}>
                        <MessageContent content={currentResponse || 'Executing agent spec reasoning...'} isUser={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Interactive Chat Input Box */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '3px 4px 3px 12px',
                    background: '#FFFFFF'
                  }}>
                    <span style={{ fontSize: '15px', color: '#94A3B8' }}>📎</span>
                    <input
                      type="text"
                      value={sandboxPrompt}
                      onChange={(e) => setSandboxPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendSandboxPrompt()}
                      placeholder={`Instruct ${name || 'Solana Wallet Monitor'} to check solana balances, analyze spl tokens, or run loops...`}
                      style={{ flex: 1, border: 0, outline: 0, fontSize: '13px', color: '#0A0A0A', background: 'transparent' }}
                    />
                    <button
                      onClick={handleSendSandboxPrompt}
                      disabled={isStreaming}
                      style={{
                        background: '#0A0A0A',
                        color: '#FFFFFF',
                        border: 0,
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: isStreaming ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Send
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', marginTop: '4px' }}>
                    Enter to send &nbsp;•&nbsp; Shift + Enter for new line
                  </div>
                </div>
              </div>

              {/* Column 3: Right Monitoring & Analytics Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Card 2: Dynamic Recent Activity */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '16px',
                  height: '550px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0A0A0A', margin: 0 }}>
                        Recent Activity
                      </h3>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '999px' }}>
                        Real-time
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Item 1: Agent Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#10B981', fontWeight: 800, fontSize: '13px' }}>✓</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0A' }}>{name || 'Agent Active'}</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>Status: Live & Listening</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>Just now</span>
                      </div>

                      {/* Dynamic Tool Items */}
                      {tools.map((t, idx) => {
                        const toolTitle = t === 'solana_balance' ? 'Solana Balance'
                          : t === 'spl_token_balance' ? 'SPL Token Balance'
                            : t === 'solana_transaction_history' ? 'On-Chain Transactions'
                              : t === 'token_metadata' ? 'Token Metadata'
                                : t === 'web_search' ? 'Web Search Intelligence'
                                  : t === 'custom_solana_tool' ? 'Custom Solana Program'
                                    : t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                        const toolSubtext = t === 'solana_balance' ? 'RPC Connected'
                          : t === 'spl_token_balance' ? 'Token Indexer Active'
                            : t === 'solana_transaction_history' ? 'Tx Parser Enabled'
                              : t === 'token_metadata' ? 'Metaplex Parser Active'
                                : t === 'web_search' ? 'Live Web Crawler'
                                  : 'Tool Active & Configured';

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#10B981', fontWeight: 800, fontSize: '13px' }}>✓</span>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0A' }}>{toolTitle}</div>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>{toolSubtext}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: '#94A3B8' }}>Active</span>
                          </div>
                        );
                      })}

                      {/* Fallback if tools empty */}
                      {tools.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#10B981', fontWeight: 800, fontSize: '13px' }}>✓</span>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A0A0A' }}>Default Capability</div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>Solana RPC Node Active</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Callout box */}
                  <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', color: '#64748B', lineHeight: 1.35 }}>
                    Monitoring enabled. <strong>{name || 'Agent'}</strong> is live with {tools.length} configured tool{tools.length === 1 ? '' : 's'}.
                  </div>
                </div>

              </div>

            </div>

            {/* Page Footer Subtext */}
            <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>🔒</span> All data is encrypted end-to-end. Spec kept private.
            </div>

          </div>
        )}

      </main>

      {/* Premium Glassmorphic Alert Modal */}
      {modalConfig.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 10, 10, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '24px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: modalConfig.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 96, 28, 0.1)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '24px'
            }}>
              {modalConfig.type === 'error' ? '❌' : '⚠️'}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0A0A0A' }}>
              {modalConfig.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              {modalConfig.message}
            </p>
            <button
              onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              style={{
                width: '100%',
                padding: '12px',
                background: '#F5601C',
                color: '#fff',
                border: 0,
                borderRadius: '999px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 96, 28, 0.2)',
                marginTop: '8px'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
