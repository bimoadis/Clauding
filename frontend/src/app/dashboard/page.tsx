'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Logo / Mascot mini icon
const LogoIconMini: React.FC = () => (
  <div style={{
    width: '28px',
    height: '28px',
    background: '#F5601C',
    borderRadius: '6px',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(245, 96, 28, 0.2)'
  }}>
    🤖
  </div>
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
  const { connected, publicKey } = useWallet();

  const [hasMounted, setHasMounted] = useState(false);
  
  // Builder state steps: 'prompt' | 'compiling' | 'configure' | 'playground'
  const [step, setStep] = useState<'prompt' | 'compiling' | 'configure' | 'playground'>('prompt');
  
  // Step 1: Prompt AI input state
  const [aiPrompt, setAiPrompt] = useState('');
  const [fullStackToggle, setFullStackToggle] = useState(false);
  const [noVibeToggle, setNoVibeToggle] = useState(true);

  // Step 3: Editable Agent Config states
  const [name, setName] = useState('Crypto Scout Agent');
  const [description, setDescription] = useState('Compiled from prompt: "make solana report"');
  const [instructions, setInstructions] = useState('Monitor crypto sources. Surface high-signal Solana and SPL token announcements. Always verify information before alerts.');
  const [tools, setTools] = useState<string[]>(['solana_balance', 'spl_token_balance', 'solana_transaction_history']);
  const [selectedCharId, setSelectedCharId] = useState('char_analyst');
  const [costTier, setCostTier] = useState<'economy' | 'balanced' | 'premium'>('balanced');

  // Step 4: Sandbox Chat state
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ role: string; content: string; model?: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentModel, setCurrentModel] = useState('');

  useEffect(() => {
    setHasMounted(true);
    // Parse query params using native window object to avoid NextJS useSearchParams hydration hang
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const promptQuery = params.get('prompt');
      if (promptQuery) {
        setAiPrompt(promptQuery);
        triggerCompilation(promptQuery);
      }
    }
  }, []);

  const triggerCompilation = async (promptText: string) => {
    if (!promptText.trim()) return;
    setStep('compiling');
    
    try {
      const response = await fetch('http://localhost:3001/v1/agents/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          wallet: publicKey ? publicKey.toBase58() : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to compile agent spec');
      }

      const data = await response.json();
      setName(data.name || 'Crypto Scout Agent');
      setDescription(data.description || `Compiled from prompt: "${promptText}"`);
      setInstructions(data.instructions || '');
      setTools(data.tools || ['solana_balance', 'spl_token_balance', 'solana_transaction_history']);
      if (data.modelPolicy?.costTier) setCostTier(data.modelPolicy.costTier);
      if (data.characterId) setSelectedCharId(data.characterId);
      
      setStep('configure');
    } catch (err) {
      console.error(err);
      // fallback mock so development is smooth
      setName('Crypto Scout Agent');
      setDescription(`Compiled from prompt: "${promptText}"`);
      setStep('configure');
    }
  };

  const handleLaunchAgent = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your Solana wallet to launch the agent.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/v1/agents/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Name: ${name}. Description: ${description}. Instructions: ${instructions}. Tools: ${tools.join(', ')}`,
          wallet: publicKey.toBase58()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish agent');
      }

      setChatLog([
        { role: 'assistant', content: `🤖 **Agent Live!** Hello, I am **${name}** (routed with *${costTier.toUpperCase()}* tier policy). I am ready to monitor balances, run tasks, and assist you. How can I help?` }
      ]);
      setStep('playground');
    } catch (err) {
      console.error(err);
      alert('Failed to launch agent on backend database.');
    }
  };

  const handleSendSandboxPrompt = async () => {
    if (!sandboxPrompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setCurrentResponse('');
    setCurrentModel('');

    const userMsg = { role: 'user', content: sandboxPrompt };
    setChatLog(prev => [...prev, userMsg]);
    setSandboxPrompt('');

    const targetUrl = `http://localhost:3001/v1/chat/stream?message=${encodeURIComponent(sandboxPrompt)}&costTier=${costTier}`;

    try {
      const response = await fetch(targetUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Chat stream connection failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let tempResp = '';
      let activeModelId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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
                  setCurrentModel(payload.model);
                } else if (currentEvent === 'token') {
                  tempResp += payload.delta;
                  setCurrentResponse(tempResp);
                }
              } catch (e) {
                // Ignore parse errors on ticks
              }
            }
          }
        }
      }

      setChatLog(prev => [...prev, { role: 'assistant', content: tempResp, model: activeModelId }]);
      setCurrentResponse('');
    } catch (err) {
      console.error(err);
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

      {/* Header bar (Styled exactly like Home page navbar) */}
      <header style={{
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
          Kirble Builder
        </div>
        
        {/* Stepper Wizard Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
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

        <div>
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
      </header>

      {/* Main Workspace Frame */}
      <main style={{ flex: 1, zIndex: 1, display: 'flex', flexDirection: 'column', paddingTop: '110px' }}>
        
        {/* Step 1: Prompt AI View */}
        {step === 'prompt' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 24px'
          }}>
            {/* Mascot header badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#fff', border: '1px solid #e2e8f0', color: '#F5601C', padding: '6px 14px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', background: '#F5601C', borderRadius: '50%' }}></span>
                1 token = 1 app
              </span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 14px', borderRadius: '999px' }}>
                ✓ keep the code
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.1 }}>
              One-shot apps
            </h1>
            <p style={{ color: '#475569', fontSize: '18px', textAlign: 'center', maxWidth: '580px', marginBottom: '40px', lineHeight: 1.5 }}>
              Give Clonk the idea. Get the app, preview, deploy, and code in minutes.
            </p>

            {/* Dark input prompt window card */}
            <div style={{
              width: '100%',
              maxWidth: '720px',
              background: '#18181C',
              border: '1px solid #2E2E34',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.15)',
              padding: '24px 28px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ width: '8px', height: '8px', background: '#F5601C', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App prompt</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#71717A' }}>paste an idea or attach a repo</span>
              </div>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the app you want to build..."
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2E2E34', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A1A1AA' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={fullStackToggle} onChange={() => setFullStackToggle(!fullStackToggle)} style={{ cursor: 'pointer' }} />
                    <span>FULL-STACK</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={noVibeToggle} onChange={() => setNoVibeToggle(!noVibeToggle)} style={{ cursor: 'pointer' }} />
                    <span>NO VIBE ▾</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#71717A' }}>💎 1  Ctrl+Enter</span>
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
                    CLONK IT
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
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              {['⚡ Keep the code', '🌐 Auto deployed', '🖥️ Instant preview'].map(badge => (
                <span key={badge} style={{ fontSize: '13px', background: '#FAFAF8', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 14px', borderRadius: '8px' }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Compiling Spec View */}
        {step === 'compiling' && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '80px 24px' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
              maxWidth: '480px',
              width: '100%'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 3s linear infinite' }}>⚙️</div>
              <h2 style={{ marginBottom: '8px' }}>Compiling Agent Spec...</h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
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
                background: '#fff',
                border: '1px solid #e2e8f0',
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
              ← Back to home
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'start' }}>
              
              {/* Left panel: Spec Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>🪪 Agent Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 0, fontSize: '14px', color: '#0A0A0A' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>✍️ Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 0, fontSize: '14px', color: '#0A0A0A' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>⚙️ System Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={5}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 0, fontFamily: 'inherit', resize: 'vertical', fontSize: '14px', lineHeight: 1.5, color: '#0A0A0A' }}
                  />
                </div>

                {/* Launch CTA inside the card at the bottom */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleLaunchAgent}
                    style={{
                      background: '#F5601C',
                      color: '#fff',
                      border: 0,
                      borderRadius: '16px',
                      padding: '16px 36px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(245, 96, 28, 0.25)',
                      textAlign: 'center',
                      width: '100%',
                      maxWidth: '360px'
                    }}
                  >
                    🚀 Launch Agent Live
                  </button>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                    Secure • Private • Encrypted
                  </div>
                </div>

              </div>

              {/* Right panel: Capabilities Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.02)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>
                  💼 Capabilities (Tools)
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tools.map(tool => (
                    <span key={tool} style={{ padding: '6px 12px', background: '#e3f5ee', color: '#0d6b46', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🛠️ {tool}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '16px', lineHeight: 1.4 }}>
                  ℹ️ These tools will be available for your agent to use during execution.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 4: Live Agent Chat Playground View */}
        {step === 'playground' && (
          <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 110px)' }}>
            
            {/* Sidebar Controls */}
            <aside style={{
              width: '280px',
              background: '#fff',
              borderRight: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Agent</span>
                  <div style={{ background: '#FAFAF8', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🤖</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0A0A0A' }}>{name}</strong>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>● Running Live</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Voice Persona</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ fontSize: '20px' }}>
                      📊
                    </span>
                    <strong>The Analyst</strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Routing Quality Tier</span>
                  <span style={{ fontSize: '12px', background: '#ffedd5', color: '#c2410c', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {costTier}
                  </span>
                </div>
              </div>

              {/* Reset / Compile new button */}
              <button
                onClick={() => {
                  setAiPrompt('');
                  setChatLog([]);
                  setStep('prompt');
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid #e2e8f0',
                  color: '#0A0A0A',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                + Compile New Agent
              </button>
            </aside>

            {/* Sandbox Chat Playground */}
            <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAFAF8', padding: '24px' }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.01)' }}>
                
                {/* Chat window viewport */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    placeholder={`Instruct ${name} to check solana balances, analyze split tokens, or run loops...`}
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
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ fontWeight: 'bold' }}>Loading Console...</h3>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
