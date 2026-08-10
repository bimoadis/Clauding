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

  // Step 3: Editable Agent Config states
  const [name, setName] = useState('Crypto Scout Agent');
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

      setName(data.name || 'Crypto Scout Agent');
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

      setName('Crypto Scout Agent');
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
      background: '#FAFAF8',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#0A0A0A',
      position: 'relative',
      backgroundImage: "linear-gradient(to bottom, #FAFAF8 0%, rgba(250, 250, 248, 0) 15%, rgba(250, 250, 248, 0) 70%, #FAFAF8 85%, #FAFAF8 100%), url('/hero-bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center 80px',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Preload background image to optimize LCP and boost Lighthouse score */}
      <link rel="preload" as="image" href="/hero-bg.png" />

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

      {/* Header bar (Styled exactly like Home page navbar with mobile hamburger support) */}
      <header className="responsive-header" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px 40px',
        background: 'transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px', color: '#0A0A0A' }}>
          <LogoIconMini />
          Clauding Builder
        </div>

        {/* Stepper Wizard Indicator (Desktop Only) */}
        <div className="desktop-stepper" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step !== 'prompt' ? '#10b981' : '#F5601C' }}>
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: step !== 'prompt' ? '#10b981' : '#F5601C',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '10px'
            }}>{step !== 'prompt' ? '✓' : '1'}</span>
            <span>Prompt</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#cbd5e1' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (step === 'configure' || step === 'playground') ? '#10b981' : (step === 'compiling' ? '#F5601C' : '#94a3b8') }}>
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: (step === 'configure' || step === 'playground') ? '#10b981' : (step === 'compiling' ? '#F5601C' : '#ecefef'),
              color: (step === 'configure' || step === 'playground' || step === 'compiling') ? '#fff' : '#64748b',
              display: 'grid',
              placeItems: 'center',
              fontSize: '10px'
            }}>{(step === 'configure' || step === 'playground') ? '✓' : '2'}</span>
            <span>Configure</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#cbd5e1' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'playground' ? '#10b981' : (step === 'configure' ? '#F5601C' : '#94a3b8') }}>
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: step === 'playground' ? '#10b981' : (step === 'configure' ? '#F5601C' : '#ecefef'),
              color: (step === 'playground' || step === 'configure') ? '#fff' : '#64748b',
              display: 'grid',
              placeItems: 'center',
              fontSize: '10px'
            }}>{step === 'playground' ? '✓' : '3'}</span>
            <span>Review</span>
          </div>
          <span style={{ width: '20px', height: '1px', background: '#cbd5e1' }}></span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'playground' ? '#F5601C' : '#94a3b8' }}>
            <span style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: step === 'playground' ? '#F5601C' : '#ecefef',
              color: step === 'playground' ? '#fff' : '#64748b',
              display: 'grid',
              placeItems: 'center',
              fontSize: '10px'
            }}>4</span>
            <span>Launch</span>
          </div>
        </div>

        <div className="desktop-wallet">
          <WalletMultiButton style={{
            background: '#F5601C',
            borderRadius: '999px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0 24px',
            height: '40px',
            border: 0,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(245, 96, 28, 0.2)'
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
      <main className="responsive-main" style={{ flex: 1, zIndex: 1, display: 'flex', flexDirection: 'column', paddingTop: '90px' }}>

        {/* Step 1: Prompt AI View */}
        {step === 'prompt' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px'
          }}>
            {/* Mascot header badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#fff', border: '1px solid #e2e8f0', color: '#F5601C', padding: '6px 14px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', background: '#F5601C', borderRadius: '50%' }}></span>
                1 wallet = unlimited agents
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 14px', borderRadius: '999px' }}>
                ✓ Keep spec private
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 5vw, 64px)', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.1 }}>
              Compile AI Agent
            </h1>
            <p style={{ color: '#475569', fontSize: 'clamp(15px, 2vw, 18px)', textAlign: 'center', maxWidth: '580px', marginBottom: '32px', lineHeight: 1.5 }}>
              Give Clauding the idea. Auto-compile capabilities, review system prompts, and launch your agent.
            </p>

            {/* Dark input prompt window card */}
            <div style={{
              width: '100%',
              maxWidth: '720px',
              background: '#18181C',
              border: '1px solid #2E2E34',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.15)',
              padding: '24px 20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ width: '8px', height: '8px', background: '#F5601C', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent prompt</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#71717A' }}>describe task instructions or integrations</span>
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the AI agent you want to build (e.g. 'check solana balance and monitor high-value spl token swaps')..."
                rows={5}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  resize: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  marginBottom: '20px'
                }}
              />

              {/* Controls bar inside dark container */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2E2E34', paddingTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A1A1AA' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fullStackToggle} onChange={() => setFullStackToggle(!fullStackToggle)} style={{ cursor: 'pointer' }} />
                    <span>AUTONOMOUS</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={noVibeToggle} onChange={() => setNoVibeToggle(!noVibeToggle)} style={{ cursor: 'pointer' }} />
                    <span>EXPERT TOOLS ▾</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>

                  <button
                    onClick={() => triggerCompilation(aiPrompt)}
                    style={{
                      background: '#F5601C',
                      color: '#fff',
                      border: 0,
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(245, 96, 28, 0.3)'
                    }}
                  >
                    CLAUDING IT
                  </button>
                </div>
              </div>

              {/* Floating mascot cute peek */}
              <div style={{
                position: 'absolute',
                top: '-32px',
                right: '40px',
                fontSize: '44px',
                pointerEvents: 'none'
              }}>
                🤖
              </div>
            </div>

            {/* Badges footer list */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { text: 'Auto-routed LLMs', icon: '⚡' },
                { text: '24/7 Autonomous Loops', icon: '🌐' },
                { text: 'Custom Solana Tools', icon: '🪄' }
              ].map(pill => (
                <span key={pill.text} style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  background: 'rgba(255, 255, 255, 0.45)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: '#475569',
                  padding: '10px 24px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                }}>
                  <span style={{ color: '#F5601C' }}>{pill.icon}</span>
                  {pill.text}
                </span>
              ))}
            </div>

            {/* Available Agent Skills Header */}
            <div style={{ margin: '48px 0 24px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#F5601C', marginBottom: '8px' }}>
                <span style={{ height: '1px', width: '20px', background: 'linear-gradient(to left, #F5601C, transparent)' }}></span>
                <span>✦</span>
                <span style={{ height: '1px', width: '20px', background: 'linear-gradient(to right, #F5601C, transparent)' }}></span>
              </div>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '800',
                color: '#F5601C',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                margin: 0
              }}>
                Available Agent Capabilities & Skills
              </h3>
            </div>

            {/* Available Agent Skills Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
              width: '100%',
              maxWidth: '1100px',
              marginBottom: '32px'
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
                  background: 'rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  borderRadius: '24px',
                  padding: '24px',
                  position: 'relative',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
                }}>
                  {/* Top Icon & Title */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    <img src={skill.icon} alt="" style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }} />
                    <strong style={{ fontSize: '18px', fontWeight: '800', color: '#0A0A0A', lineHeight: '1.2' }}>
                      {skill.title}
                    </strong>
                  </div>

                  {/* Orange Divider */}
                  <div style={{ width: '24px', height: '2px', background: '#F5601C', marginBottom: '12px' }}></div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 24px 0', paddingRight: '20px' }}>
                    {skill.desc}
                  </p>

                  {/* Bottom Right Arrow Button */}
                  <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '24px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(245, 96, 28, 0.1)',
                    color: '#F5601C',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    →
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Info Banner */}
            <div style={{
              width: '100%',
              maxWidth: '1000px',
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '24px',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
            }}>

              <button style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '999px',
                padding: '10px 24px',
                fontWeight: 'bold',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Explore All Capabilities →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Compiling Spec View */}
        {step === 'compiling' && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '80px 24px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '32px',
              padding: '64px 48px',
              textAlign: 'center',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.08)',
              maxWidth: '580px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Premium Gradient Cogwheel Icon */}
              <svg className="spin-gear" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gear-gradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
                <defs>
                  <linearGradient id="gear-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>

              <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '16px', color: '#0A0A0A' }}>
                Compiling<br />Agent Spec...
              </h2>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, maxWidth: '380px', margin: 0 }}>
                Structuring prompt tools, mapping provider adapters, and establishing voice model directives.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review Settings View */}
        {step === 'configure' && (
          <div style={{ flex: 1, maxWidth: '1100px', margin: '10px auto', padding: '0 24px', width: '100%' }}>

            {/* Back button */}
            <button
              onClick={() => setStep('prompt')}
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                color: '#334155',
                cursor: 'pointer',
                marginBottom: '24px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              ← Back to Compiler
            </button>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'start' }}>

              {/* Left panel: Spec Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ fontSize: '36px', background: '#ffedd5', padding: '8px', borderRadius: '12px' }}>🤖</div>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Review Agent Settings</h2>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Review your agent configuration before launching it live.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    <img src="/icons/form-agent-name.svg" alt="" style={{ width: '16px', height: '16px' }} />
                    Agent Name
                  </label>
                  <input
                    type="text"
                    className="design-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    <img src="/icons/form-description.svg" alt="" style={{ width: '16px', height: '16px' }} />
                    Description
                  </label>
                  <input
                    type="text"
                    className="design-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    <img src="/icons/form-system-instructions.svg" alt="" style={{ width: '16px', height: '16px' }} />
                    System Instructions
                  </label>
                  <textarea
                    className="design-textarea"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={5}
                  />
                </div>

                {/* Launch CTA inside the card at the bottom */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleLaunchAgent}
                    disabled={isPublishing}
                    style={{
                      background: isPublishing ? '#94a3b8' : '#F5601C',
                      color: '#fff',
                      border: 0,
                      borderRadius: '999px',
                      padding: '16px 36px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 8px 24px rgba(245, 96, 28, 0.25)',
                      textAlign: 'center',
                      width: '100%',
                      maxWidth: '360px'
                    }}
                  >
                    {isPublishing ? 'Launching Live...' : '🚀 Launch Agent Live'}
                  </button>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                    Secure • Private • Encrypted
                  </div>
                </div>

              </div>

              {/* Right panel: Capabilities Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.02)'
              }}>
                {/* Custom Mockup Header with Briefcase Card and Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#FDF8F5',
                    border: '1px solid #F3EBE1',
                    borderRadius: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="8" width="18" height="12" rx="2" />
                      <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
                      <circle cx="12" cy="14" r="2.5" fill="#F5601C" stroke="#1E293B" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      CAPABILITIES (TOOLS)
                    </span>
                  </div>
                </div>

                {/* Styled dynamic tool pills exactly like mockup */}
                <div style={{ display: 'flex', gap: '6px 4px', flexWrap: 'wrap' }}>
                  {tools.map(tool => (
                    <span key={tool} style={{
                      padding: '5px 10px',
                      background: '#FDF8F5',
                      border: '1px solid #F3EBE1',
                      color: '#2D3748',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F5601C', display: 'inline-block' }}></span>
                      {tool}
                      <button
                        onClick={() => setTools(prev => prev.filter(t => t !== tool))}
                        style={{
                          background: 'none',
                          border: 0,
                          color: '#A0AEC0',
                          cursor: 'pointer',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          marginLeft: '4px',
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

                {/* Add Tool selector */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    onChange={(e) => {
                      const selectedTool = e.target.value;
                      if (selectedTool && !tools.includes(selectedTool)) {
                        setTools(prev => [...prev, selectedTool]);
                      }
                      e.target.value = ''; // Reset select
                    }}
                    defaultValue=""
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      background: '#fff',
                      color: '#475569',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="" disabled>+ Add Capability (Tool)...</option>
                    {ALL_CATALOG_TOOLS.filter(t => !tools.includes(t)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '24px', lineHeight: 1.4 }}>
                  ℹ️ These tools will be available for your agent to use during execution.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 4: Live Agent Chat Playground View */}
        {step === 'playground' && (
          <div className="responsive-playground" style={{ flex: 1, display: 'flex', height: 'calc(100vh - 110px)' }}>

            {/* Sidebar Controls */}
            <aside className="responsive-sidebar" style={{
              width: '280px',
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(12px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.45)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Agent</span>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🤖</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0A0A0A' }}>{name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>● Running Live</span>
                        <button
                          onClick={async () => {
                            if (!selectedAgentId) return;
                            if (!confirm(`Are you sure you want to delete agent "${name}" and all of its chat logs?`)) return;

                            try {
                              const token = jwtToken || localStorage.getItem(`jwt_token_${publicKey!.toBase58()}`) || '';
                              const res = await fetch(`${API_BASE_URL}/v1/agents/delete?agentId=${selectedAgentId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.success) {
                                  setModalConfig({
                                    isOpen: true,
                                    title: 'Agent Deleted',
                                    message: `Successfully deleted agent "${name}" and its chat history.`,
                                    type: 'success'
                                  });
                                  // Reload agent list
                                  const listRes = await fetch(`${API_BASE_URL}/v1/agents/list`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (listRes.ok) {
                                    const listData = await listRes.json();
                                    setMyAgents(listData);
                                    if (listData.length > 0) {
                                      const latestAgent = listData[listData.length - 1];
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
                                      // Fetch history for the new selected agent
                                      const histRes = await fetch(`${API_BASE_URL}/v1/chat/history?agentId=${latestAgent.id}`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      if (histRes.ok) {
                                        const histData = await histRes.json();
                                        setChatLog(histData.length > 0 ? histData : [{ role: 'assistant', content: `🤖 Switched to agent **${latestAgent.name}**. Ready for instructions.` }]);
                                      }
                                    } else {
                                      // No agents left, reset to prompt wizard step!
                                      setSelectedAgentId('');
                                      setName('');
                                      setChatLog([]);
                                      setStep('prompt');
                                    }
                                  }
                                } else {
                                  alert('Failed to delete: ' + (data.error || 'Unknown error'));
                                }
                              }
                            } catch (e) {
                              console.error('Failed to delete agent:', e);
                            }
                          }}
                          title="Delete Current Agent"
                          style={{
                            background: 'transparent',
                            border: 0,
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {myAgents.length > 1 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Switch Agent</span>
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
                            if (targetAgent.spec.modelPolicy && targetAgent.spec.modelPolicy.costTier) {
                              setCostTier(targetAgent.spec.modelPolicy.costTier);
                            }
                          }
                          // Fetch and load chat history for this agent!
                          (async () => {
                            try {
                              const token = jwtToken || localStorage.getItem(`jwt_token_${publicKey!.toBase58()}`) || '';
                              const histRes = await fetch(`${API_BASE_URL}/v1/chat/history?agentId=${targetAgent.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (histRes.ok) {
                                const histData = await histRes.json();
                                if (histData.length > 0) {
                                  setChatLog(histData);
                                } else {
                                  setChatLog([
                                    { role: 'assistant', content: `🤖 Switched to agent **${targetAgent.name}**. Ready for instructions.` }
                                  ]);
                                }
                              } else {
                                setChatLog([
                                  { role: 'assistant', content: `🤖 Switched to agent **${targetAgent.name}**. Ready for instructions.` }
                                ]);
                              }
                            } catch (e) {
                              console.error('Failed to load chat history:', e);
                              setChatLog([
                                { role: 'assistant', content: `🤖 Switched to agent **${targetAgent.name}**. Ready for instructions.` }
                              ]);
                            }
                          })();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.45)',
                        background: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#0A0A0A',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {myAgents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reset / Compile new button */}
              <button
                onClick={() => {
                  console.log('Step 4 Action: Resetting builder pipeline to start compile of new agent.');
                  setAiPrompt('');
                  setChatLog([]);
                  setStep('prompt');
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  color: '#0A0A0A',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '20px'
                }}
              >
                + Compile New Agent
              </button>
            </aside>

            {/* Sandbox Chat Playground */}
            <section className="responsive-chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', padding: '0 24px 24px' }}>
              <div style={{
                height: '600px',
                maxHeight: '100%',
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.01)'
              }}>

                {/* Chat window viewport */}
                <div ref={chatViewportRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {chatLog.map((log, idx) => (
                    <div key={idx} style={{ alignSelf: log.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px', textAlign: log.role === 'user' ? 'right' : 'left' }}>
                        {log.role === 'user' ? 'YOU' : log.model ? `AGENT (${log.model.toUpperCase()})` : 'AGENT'}
                      </span>
                      <div style={{
                        padding: '12px 18px',
                        borderRadius: '16px',
                        background: log.role === 'user' ? '#F5601C' : '#f1f5f9',
                        color: log.role === 'user' ? '#fff' : '#0A0A0A'
                      }}>
                        <MessageContent content={log.content} isUser={log.role === 'user'} />
                      </div>
                    </div>
                  ))}

                  {/* Streaming Assistant message */}
                  {isStreaming && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        AGENT ({currentModel ? currentModel.toUpperCase() : 'ROUTING...'})
                      </span>
                      <div style={{ padding: '12px 18px', borderRadius: '16px', background: '#f1f5f9', color: '#0A0A0A' }}>
                        <MessageContent content={currentResponse || 'Thinking...'} isUser={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input action bar */}
                <div style={{ padding: '18px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={sandboxPrompt}
                    onChange={(e) => setSandboxPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendSandboxPrompt()}
                    placeholder={`Instruct ${name} to check solana balances, analyze spl tokens, or run loops...`}
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 0, fontSize: '14px' }}
                  />
                  <button
                    onClick={handleSendSandboxPrompt}
                    disabled={isStreaming}
                    style={{
                      background: '#0A0A0A',
                      color: '#fff',
                      border: 0,
                      borderRadius: '12px',
                      padding: '0 24px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Send
                  </button>
                </div>

              </div>
            </section>

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
