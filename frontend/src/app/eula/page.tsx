'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Eula() {
  const router = useRouter();

  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#0A0A0A', padding: '80px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '48px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 0, color: '#F5601C', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          &larr; Back to Home
        </button>

        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>End User License Agreement (EULA)</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Last updated: August 9, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>1. Scope of License</h2>
            <p>Subject to your compliance with this Agreement, CLAUDING grants you a limited, non-exclusive, non-transferable, revocable license to access and use the platform to compile, run, and interact with AI agents using your Solana wallet.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>2. Independent Product & Affiliation Disclaimer</h2>
            <p style={{ fontWeight: 'bold', color: '#0A0A0A' }}>
              CLAUDING is an independent product. It is NOT affiliated, partnered, endorsed, or officially associated in any way with Anthropic, OpenAI, or any other LLM providers. All model invocations are executed via public APIs.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>3. Crypto Assets & Smart Contracts</h2>
            <p>Usage of the CLAUDING platform requires holding the $CLAUDING utility token or depositing SOL/crypto. Blockchain transactions are irreversible, and you acknowledge that cryptocurrency prices are highly volatile. CLAUDING is not responsible for any token loss, transaction failures, or gas fees incurred.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>4. Limitation of Liability</h2>
            <p>The software is provided "as is", without warranty of any kind. In no event shall CLAUDING or its developers be liable for any direct, indirect, special, incidental, or consequential damages arising out of the use or inability to use the platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
