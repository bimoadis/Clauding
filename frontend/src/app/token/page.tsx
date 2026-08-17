'use client';

import React from 'react';

export default function TokenPage() {
  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0A0A0A', padding: '60px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ color: '#F5601C', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
            &larr; Back to Home
          </a>
          <a
            href="https://x.com/usecldg?s=11"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0A0A0A',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>@usecldg</span>
          </a>
        </div>

        <h1 style={{ fontSize: '40px', fontWeight: 800, margin: '24px 0 16px 0', letterSpacing: '-0.03em' }}>
          How $CLDG Access Works
        </h1>

        <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.6, marginBottom: '40px' }}>
          $CLDG is the utility token powering Clauding Autonomous Compiler loops. Holding $CLDG grants tiers of compiler execution, priority model routing, and custom tool binding without recurring credit cards.
        </p>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Pro Access Threshold</h2>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
            Holding <strong>50,000 $CLDG</strong> tokens in your Solana wallet automatically unlocks Pro Tier capabilities:
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#334155', fontSize: '15px' }}>
            <li>✓ Unlimited active agent compilations</li>
            <li>✓ Priority model routing via <code>claude-fable-5</code></li>
            <li>✓ Unlimited ReAct loop execution steps</li>
            <li>✓ Direct 1-click cloud deployment</li>
          </ul>
        </div>

        <div style={{ background: '#0A0A0A', color: '#FFFFFF', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Acquire $CLDG Token</h3>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
            Official Solana token trading on decentralized exchanges.
          </p>
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#F5601C',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: '999px',
              fontWeight: 'bold',
              fontSize: '15px',
              display: 'inline-block'
            }}
          >
            View on Pump.fun &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
