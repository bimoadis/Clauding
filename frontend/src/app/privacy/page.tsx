'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
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

        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Last updated: August 9, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>1. Information We Collect</h2>
            <p>We collect and store only the necessary information to provide the CLAUDING service:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Solana Wallet Address:</strong> Used as your primary account identifier and to verify ownership.</li>
              <li><strong>Chat Thread Content:</strong> Your messages, agent responses, and tool execution logs to maintain conversation history.</li>
              <li><strong>Usage Logs:</strong> Token consumption count and estimated transaction costs in micro-USD.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>2. How We Use Information</h2>
            <p>Your data is used solely to:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Provide and maintain conversation histories with your agents.</li>
              <li>Enforce rate limits based on your hold tiers (Free vs Pro).</li>
              <li>Calculate and settle internal credit billing rates.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>3. Data Sharing & Third-Parties</h2>
            <p>We do not sell your personal data. To execute agent instructions, prompts and histories are sent to AI model provider APIs (specifically OpenAI and Anthropic). Your Solana wallet address and private credentials are never shared with these third-party AI providers.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '12px' }}>4. Data Deletion & Account Erasure</h2>
            <p>Under GDPR and other privacy laws, you have the right to erase all your data. You can delete your account and instantly purge all wallet logs, agents, specs, and message history directly via the dashboard or by sending a request to our API endpoint.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
