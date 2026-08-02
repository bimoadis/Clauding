'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mascot component reused for the brand mark
const MascotMini: React.FC = () => {
  const N = 22, cx = 10.5, cy = 9.3, r = 7.6;
  const O = '#F6A21C', D = '#C24A18', K = '#151515', W = '#ffffff', B = '#1E52A6', R = '#E8451B', P = '#F3854B';

  const rects: { x: number; y: number; fill: string }[] = [];
  const addPx = (x: number, y: number, c: string) => {
    rects.push({ x, y, fill: c });
  };

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) addPx(x, y, d > r - 1.05 ? D : O);
    }
  }

  return (
    <svg viewBox="-1 0 24 23" shapeRendering="crispEdges" style={{ width: '24px', height: '24px' }}>
      {rects.map((rc, idx) => (
        <rect key={idx} x={rc.x} y={rc.y} width="1.04" height="1.04" fill={rc.fill} />
      ))}
    </svg>
  );
};

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'characters' | 'billing'>('agents');

  // Chat/Playground state
  const [prompt, setPrompt] = useState('');
  const [costTier, setCostTier] = useState<'economy' | 'balanced' | 'premium'>('balanced');
  const [chatLog, setChatLog] = useState<{ role: string; content: string; model?: string; cost?: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentModel, setCurrentModel] = useState('');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#f8f9fc', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Loading Console...</h2>
      </div>
    );
  }

  // Characters catalog
  const characters = [
    { icon: "📊", name: "The Analyst", tag: "Data-first, evidence based" },
    { icon: "🧭", name: "The Strategist", tag: "Big picture calculations" },
    { icon: "💬", name: "The Companion", tag: "Friendly and highly interactive" }
  ];

  const handleSendPrompt = async () => {
    if (!prompt.trim() || isStreaming) return;

    console.log('[DEBUG] Sending prompt to agent:', prompt);
    console.log('[DEBUG] Active Cost Tier:', costTier);

    setIsStreaming(true);
    setCurrentResponse('');
    setCurrentModel('');

    const userMsg = { role: 'user', content: prompt };
    setChatLog(prev => [...prev, userMsg]);

    const targetUrl = `http://localhost:3001/v1/chat/stream?message=${encodeURIComponent(prompt)}&costTier=${costTier}`;
    console.log('[DEBUG] Target SSE Stream URL:', targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET'
      });

      console.log('[DEBUG] Connection established. Response Status:', response.status);
      console.log('[DEBUG] Response Headers:', Array.from(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Failed to open chat stream connection. Status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let tempResp = '';
      let activeModelId = '';

      if (reader) {
        console.log('[DEBUG] Stream reader initialized. Waiting for chunks...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[DEBUG] Stream reading complete (done: true).');
            break;
          }

          const chunkText = decoder.decode(value);
          console.log('[DEBUG] Raw Chunk Received:', JSON.stringify(chunkText));
          const lines = chunkText.split('\n');

          let currentEvent = '';
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim();
              console.log(`[DEBUG] Found event type: "${currentEvent}"`);
            } else if (line.startsWith('data:')) {
              const dataRaw = line.replace('data:', '').trim();
              console.log(`[DEBUG] Found data for event "${currentEvent}":`, dataRaw);
              try {
                const payload = JSON.parse(dataRaw);
                console.log('[DEBUG] Parsed SSE Payload:', payload);
                if (currentEvent === 'run.started') {
                  activeModelId = payload.model;
                  setCurrentModel(payload.model);
                } else if (currentEvent === 'token') {
                  tempResp += payload.delta;
                  setCurrentResponse(tempResp);
                }
              } catch (e) {
                console.warn('[DEBUG] Failed to parse JSON payload:', dataRaw, e);
              }
            }
          }
        }
      }

      setChatLog(prev => [...prev, { role: 'assistant', content: tempResp, model: activeModelId }]);
      setCurrentResponse('');
      setPrompt('');
    } catch (err) {
      console.error('[DEBUG] Chat Stream connection failed with error:', err);
      setChatLog(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err instanceof Error ? err.message : 'Unknown connection error'}` }]);
    } finally {
      setIsStreaming(false);
      console.log('[DEBUG] Chat session handleSendPrompt finalized.');
    }
  };

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header Bar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', color: '#0d0d10' }}>
          <MascotMini />
          Kirble Console
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <WalletMultiButton />
        </div>
      </header>

      {/* Main Console Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: '240px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('agents')}
            style={{ padding: '12px 16px', borderRadius: '12px', border: 0, textAlign: 'left', background: activeTab === 'agents' ? '#fdeacd' : 'transparent', color: activeTab === 'agents' ? '#cf5f00' : '#54545c', fontWeight: 600, cursor: 'pointer', transition: '.2s' }}
          >
            🤖 Agents Playground
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            style={{ padding: '12px 16px', borderRadius: '12px', border: 0, textAlign: 'left', background: activeTab === 'characters' ? '#fdeacd' : 'transparent', color: activeTab === 'characters' ? '#cf5f00' : '#54545c', fontWeight: 600, cursor: 'pointer', transition: '.2s' }}
          >
            🎭 Reusable Personas
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            style={{ padding: '12px 16px', borderRadius: '12px', border: 0, textAlign: 'left', background: activeTab === 'billing' ? '#fdeacd' : 'transparent', color: activeTab === 'billing' ? '#cf5f00' : '#54545c', fontWeight: 600, cursor: 'pointer', transition: '.2s' }}
          >
            💳 Wallet Ledger
          </button>
        </aside>

        {/* Viewport Content */}
        <main style={{ flex: 1, padding: '32px' }}>
          {!connected ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
              <h2 style={{ marginBottom: '12px' }}>Connect Solana Wallet</h2>
              <p style={{ color: '#54545c', marginBottom: '24px' }}>Please connect your Solana wallet to access the builder console, configure custom agents, and fund your usage ledger.</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <WalletMultiButton />
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Agent Playgrounds */}
              {activeTab === 'agents' && (
                <div>
                  <h2 style={{ marginBottom: '6px' }}>Agents Sandbox</h2>
                  <p style={{ color: '#54545c', marginBottom: '24px' }}>Test prompt routing models and chat streaming performance against active adapters.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                    {/* Live Playground Chat */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', height: '550px' }}>
                      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                        {chatLog.length === 0 && (
                          <div style={{ color: '#9a9aa2', textAlign: 'center', marginTop: '120px' }}>
                            <p style={{ fontSize: '24px', marginBottom: '8px' }}>💬</p>
                            <p>No messages yet. Ask something to compile and route your agent!</p>
                          </div>
                        )}
                        {chatLog.map((log, idx) => (
                          <div key={idx} style={{ marginBottom: '16px', textAlign: log.role === 'user' ? 'right' : 'left' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9a9aa2', display: 'block', marginBottom: '4px' }}>
                              {log.role === 'user' ? 'YOU' : log.model ? `AGENT (${log.model.toUpperCase()})` : 'AGENT'}
                            </span>
                            <div style={{ display: 'inline-block', padding: '12px 16px', borderRadius: '14px', background: log.role === 'user' ? '#f5820a' : '#f1f5f9', color: log.role === 'user' ? '#fff' : '#0d0d10', maxWidth: '80%', textAlign: 'left' }}>
                              {log.content}
                            </div>
                          </div>
                        ))}
                        {isStreaming && (
                          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9a9aa2', display: 'block', marginBottom: '4px' }}>
                              AGENT ({currentModel ? currentModel.toUpperCase() : 'ROUTING...'})
                            </span>
                            <div style={{ display: 'inline-block', padding: '12px 16px', borderRadius: '14px', background: '#f1f5f9', color: '#0d0d10', maxWidth: '80%', textAlign: 'left' }}>
                              {currentResponse || 'Thinking…'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat inputs */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                          placeholder="Describe a task or compile a new instruction..."
                          style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 0 }}
                        />
                        <button onClick={handleSendPrompt} disabled={isStreaming} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
                          Send
                        </button>
                      </div>
                    </div>

                    {/* Routing Configurations Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                        <h3 style={{ marginBottom: '14px' }}>Routing Quality Policy</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="radio" checked={costTier === 'economy'} onChange={() => setCostTier('economy')} />
                            <div>
                              <strong>Economy Tier</strong>
                              <div style={{ fontSize: '12px', color: '#54545c' }}>Prioritizes cheapest model, high delay fallback thresholds</div>
                            </div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="radio" checked={costTier === 'balanced'} onChange={() => setCostTier('balanced')} />
                            <div>
                              <strong>Balanced Tier (Recommended)</strong>
                              <div style={{ fontSize: '12px', color: '#54545c' }}>Harmonious score weighting Quality, Cost, and Latency</div>
                            </div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="radio" checked={costTier === 'premium'} onChange={() => setCostTier('premium')} />
                            <div>
                              <strong>Premium Tier</strong>
                              <div style={{ fontSize: '12px', color: '#54545c' }}>Routes exclusively to high-capacity models (e.g. Claude 3.5 Sonnet)</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Active Catalogs</h3>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span>Claude 3.5 Sonnet</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>Active</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span>GPT-4o</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>Active</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Llama 3 (vLLM)</span> <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Inactive (Cooldown)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Reusable Personas */}
              {activeTab === 'characters' && (
                <div>
                  <h2 style={{ marginBottom: '6px' }}>Reusable Personas</h2>
                  <p style={{ color: '#54545c', marginBottom: '24px' }}>Personas shape the system instructions injected across provider adapter runtimes.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {characters.map((char, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{char.icon}</div>
                        <h3 style={{ marginBottom: '6px' }}>{char.name}</h3>
                        <p style={{ color: '#54545c', fontSize: '14px', marginBottom: '16px' }}>{char.tag}</p>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px', background: '#ececef', fontWeight: 'bold' }}>BUILT-IN</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Wallet Ledger */}
              {activeTab === 'billing' && (
                <div>
                  <h2 style={{ marginBottom: '6px' }}>Wallet Credit Ledger</h2>
                  <p style={{ color: '#54545c', marginBottom: '24px' }}>Double-entry transaction balances denominated in micro USD credits.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
                      <span style={{ color: '#9a9aa2', fontSize: '14px' }}>Current Balance</span>
                      <h1 style={{ fontSize: '48px', color: '#f5820a', margin: '12px 0' }}>$15.40</h1>
                      <p style={{ fontSize: '12px', color: '#54545c', marginBottom: '24px' }}>15,400,000 micro-USD credits</p>
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Top Up Balance</button>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                      <h3 style={{ marginBottom: '16px' }}>Ledger Activity</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '8px 0' }}>Type</th>
                            <th>Amount</th>
                            <th>Reference</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 0', color: '#10b981', fontWeight: 'bold' }}>Credit (Top up)</td>
                            <td>+$10.00</td>
                            <td>Solana Deposit tx...</td>
                            <td>2026-07-30</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 0', color: '#ef4444', fontWeight: 'bold' }}>Debit (Usage)</td>
                            <td>-$0.0024</td>
                            <td>run_x8d21 (GPT-4o)</td>
                            <td>2026-07-31</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
