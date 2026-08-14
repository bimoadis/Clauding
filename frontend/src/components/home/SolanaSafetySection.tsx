'use client';

import React from 'react';

export const SolanaSafetySection: React.FC = () => {
  const tools = [
    {
      id: 'rugpull_scanner',
      title: 'Rugpull Scanner',
      desc: 'Scan contract addresses for rugpull warning indicators and safety parameters.',
      icon: '/icons/general-search.svg'
    },
    {
      id: 'lp_lock_inspector',
      title: 'LP Lock Inspector',
      desc: 'Check lock and burn status of token liquidity pools.',
      icon: '/icons/capability-transaction-signer.svg'
    },
    {
      id: 'contract_verifier',
      title: 'Contract Ownership Verifier',
      desc: 'Verify contract ownership status and check if authority is renounced.',
      icon: '/icons/status-verified.svg'
    },
    {
      id: 'dex_tracker',
      title: 'DEX & Liquidity Tracker',
      desc: 'Check real-time DEX token prices and liquidity pool depth metrics.',
      icon: '/icons/capability-priority-fee-optimizer.svg'
    }
  ];

  return (
    <section style={{ padding: '80px 24px', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Your agent checks the contract before you buy
          </h2>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '640px', lineHeight: 1.6 }}>
            Built-in Solana security capabilities give your autonomous agents instant access to smart contract auditing and liquidity inspection tools.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {tools.map((tool) => (
            <div
              key={tool.id}
              style={{
                padding: '24px',
                background: '#FAFAF8',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <img src={tool.icon} alt={tool.title} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0A0A0A', marginBottom: '8px' }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {tool.desc}
                </p>
              </div>
              <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: 700, color: '#F5601C' }}>
                Tool key: <code>{tool.id}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
