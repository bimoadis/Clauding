'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mascot component
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
    <svg viewBox="-1 0 24 23" shapeRendering="crispEdges" style={{ width: '28px', height: '28px' }}>
      {rects.map((rc, idx) => (
        <rect key={idx} x={rc.x} y={rc.y} width="1.04" height="1.04" fill={rc.fill} />
      ))}
    </svg>
  );
};

function CompileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  const promptParam = searchParams.get('prompt') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable Agent Spec state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [costTier, setCostTier] = useState<'economy' | 'balanced' | 'premium'>('balanced');
  const [selectedCharId, setSelectedCharId] = useState('char_analyst');

  // Characters config
  const characters = [
    { id: 'char_analyst', icon: '📊', name: 'The Analyst', tagline: 'Precise and data-first.' },
    { id: 'char_strategist', icon: '🧭', name: 'The Strategist', tagline: 'Big picture thinker.' },
    { id: 'char_companion', icon: '💬', name: 'The Companion', tagline: 'Friendly and always on.' }
  ];

  useEffect(() => {
    if (!promptParam) {
      setLoading(false);
      return;
    }

    // Call NestJS Agent Compiler API
    const fetchCompiledSpec = async () => {
      try {
        const response = await fetch('http://localhost:3001/v1/agents/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: promptParam,
            wallet: publicKey ? publicKey.toBase58() : undefined
          })
        });

        if (!response.ok) {
          throw new Error('Failed to compile agent spec');
        }

        const data = await response.json();
        setName(data.name);
        setDescription(data.description);
        setInstructions(data.instructions);
        setTools(data.tools);
        setCostTier(data.modelPolicy.costTier);
        setSelectedCharId(data.characterId);
      } catch (err) {
        setError('Error compiling spec. Make sure NestJS backend is running on port 3001.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompiledSpec();
  }, [promptParam, publicKey]);

  const handlePublish = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your Solana wallet to publish.');
      return;
    }

    try {
      // Persist the final edited settings in the backend database under this user's wallet
      const response = await fetch('http://localhost:3001/v1/agents/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Name: ${name}. Description: ${description}. Instructions: ${instructions}. Tools: ${tools.join(', ')}`,
          wallet: publicKey.toBase58()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register compiled agent');
      }

      alert(`Successfully launched "${name}"!\nRedirecting you to the dashboard console...`);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to launch agent on the backend database.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#fcfafc', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Compiling Agent Profile...</h2>
          <p style={{ color: '#54545c' }}>Structuring instructions and selecting resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fdf6ef', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', color: '#0d0d10' }}>
          <MascotMini />
          Kirble Builder
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <WalletMultiButton />
        </div>
      </header>

      {/* Main workspace */}
      <main style={{ flex: 1, maxWidth: '1000px', margin: '40px auto', padding: '0 24px', width: '100%' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 0, color: '#54545c', cursor: 'pointer', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
          ← Back to home
        </button>

        {error ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '20px', borderRadius: '14px', color: '#b91c1c' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px' }}>
            {/* Spec Editor Form */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
              <h2 style={{ marginBottom: '24px' }}>Review Agent Settings</h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#54545c', marginBottom: '6px' }}>AGENT NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 0 }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#54545c', marginBottom: '6px' }}>DESCRIPTION</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 0 }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#54545c', marginBottom: '6px' }}>SYSTEM INSTRUCTIONS</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={6}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 0, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#54545c', marginBottom: '6px' }}>CAPABILITIES (TOOLS)</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {tools.map(tool => (
                    <span key={tool} style={{ padding: '6px 12px', background: '#e3f5ee', color: '#0d6b46', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px' }}>
                      🛠️ {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Persona and Publish configuration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ marginBottom: '14px' }}>Select Voice Persona</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {characters.map(char => (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharId(char.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: `2px solid ${selectedCharId === char.id ? '#f5820a' : '#e2e8f0'}`,
                        cursor: 'pointer',
                        transition: '.18s'
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>{char.icon}</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px' }}>{char.name}</strong>
                        <span style={{ fontSize: '12px', color: '#54545c' }}>{char.tagline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ marginBottom: '14px' }}>Model Routing Policy</h3>
                <select value={costTier} onChange={(e: any) => setCostTier(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 0 }}>
                  <option value="economy">Economy Tier (Cheapest models)</option>
                  <option value="balanced">Balanced Tier (Auto quality-price check)</option>
                  <option value="premium">Premium Tier (Claude 3.5 Sonnet / GPT-4o only)</option>
                </select>
              </div>

              <button
                onClick={handlePublish}
                style={{
                  background: '#f5820a',
                  color: '#fff',
                  border: 0,
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(245, 130, 10, 0.2)',
                  transition: '.18s'
                }}
              >
                Launch Agent Live
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CompilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#fcfafc', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Loading workspace...</h2>
        </div>
      </div>
    }>
      <CompileContent />
    </Suspense>
  );
}
