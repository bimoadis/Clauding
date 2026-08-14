'use client';

import React, { useState } from 'react';

export const RealSpecOutput: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'json' | 'curl'>('json');

  const sampleSpec = {
    name: "solana-swap-sentinel",
    description: "Monitors high-value SPL swaps and sends real-time safety alerts",
    model: "claude-fable-5",
    maxSteps: 5,
    systemPrompt: "You are an autonomous Solana security monitoring agent. Inspect transactions for liquidity lock parameters and rugpull indicators.",
    tools: [
      "solana_balance",
      "rugpull_scanner",
      "lp_lock_inspector",
      "web_search"
    ],
    executionSchedule: "trigger_on_event"
  };

  const sampleCurl = `curl -X POST https://api.claudingagent.tech/v1/compile \\
  -H "Authorization: Bearer $CLAUDING_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "monitor high-value spl swaps and alert me on rugpull risks",
    "forcedTools": ["rugpull_scanner", "lp_lock_inspector"],
    "model": "claude-fable-5"
  }'`;

  return (
    <section style={{ padding: '80px 24px', background: '#FAFAF8', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Built for developers. Inspected by code
          </h2>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '640px', lineHeight: 1.6 }}>
            Every prompt compiles into a clean, deterministic agent specification schema. Inspect the raw JSON spec or trigger it directly via API.
          </p>
        </div>

        <div style={{
          background: '#0F172A',
          borderRadius: '16px',
          border: '1px solid #1E293B',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }}>
          {/* Header Bar */}
          <div style={{
            background: '#1E293B',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('json')}
                style={{
                  background: activeTab === 'json' ? '#0F172A' : 'transparent',
                  color: activeTab === 'json' ? '#F5601C' : '#94A3B8',
                  border: 0,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                compiled-spec.json
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                style={{
                  background: activeTab === 'curl' ? '#0F172A' : 'transparent',
                  color: activeTab === 'curl' ? '#F5601C' : '#94A3B8',
                  border: 0,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                cURL / API Request
              </button>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
              compiler-version: v1.0.4
            </span>
          </div>

          {/* Content */}
          <pre style={{
            padding: '24px',
            margin: 0,
            color: '#E2E8F0',
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontSize: '13px',
            lineHeight: 1.6,
            overflowX: 'auto'
          }}>
            <code>
              {activeTab === 'json' ? JSON.stringify(sampleSpec, null, 2) : sampleCurl}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
};
