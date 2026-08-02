'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mascot component that renders the logo icon
const LogoIcon: React.FC = () => (
  <div style={{
    width: '32px',
    height: '32px',
    background: '#F5601C',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(245, 96, 28, 0.2)'
  }}>
    🤖
  </div>
);

export default function Home() {
  const router = useRouter();
  const { connected } = useWallet();
  const [prompt, setPrompt] = useState('');
  const [buildStatus, setBuildStatus] = useState('Create');
  const [isYearly, setIsYearly] = useState(true);

  // Accordion FAQs
  const faqs = [
    { q: "Do I need to code?", a: "No. You describe your agent in plain language and pick a character. Kirble builds and runs it for you — developers can still drop into the API if they want." },
    { q: "Which models can my agent use?", a: "Claude, GPT, Gemini, Grok, Llama and more. Kirble picks the best model for each task automatically, or you can pin a favorite." },
    { q: "How do I pay?", a: "Top up once with crypto and spend across every model from one balance. No cards, no per-provider subscriptions." },
    { q: "Can I change my agent's character later?", a: "Anytime. Swap characters to change your agent's tone and style without rebuilding it." },
    { q: "Is my agent always online?", a: "Yes. Once launched, your agent runs on Kirble's infrastructure and stays available across the tools you connect it to." }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleBuild = () => {
    if (!prompt.trim()) {
      alert('Describe your agent first, then click Create.');
      return;
    }
    setBuildStatus('Building…');
    setTimeout(() => {
      router.push(`/compile?prompt=${encodeURIComponent(prompt)}`);
    }, 450);
  };

  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0A0A0A' }}>

      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px 40px',
        background: 'transparent'
      }}>
        {/* Left: Brand */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px', color: '#0A0A0A' }}>
          <LogoIcon />
          Kirble
        </span>

        {/* Center: Navigation Links in Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.05)',
          padding: '4px 6px',
          borderRadius: '999px'
        }}>
          <a href="#how" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>How it works</a>
          <a href="#comparison" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>Comparison</a>
          <a href="#pricing" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>Pricing</a>
          <a href="#faq" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>FAQ</a>
        </div>

        {/* Right: Connect Button */}
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
      </nav>

      {/* Hero Section */}
      <header style={{
        minHeight: '130vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '140px 24px 80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "linear-gradient(to bottom, #FAFAF8 0%, rgba(250, 250, 248, 0) 15%, rgba(250, 250, 248, 0) 70%, #FAFAF8 85%, #FAFAF8 100%), url('/hero-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 80px',
        backgroundRepeat: 'no-repeat'
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '24px' }}>
            One prompt.<br />
            <span style={{ color: '#F5601C' }}>Launch any AI agent.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 1.8vw, 20px)', color: '#475569', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            describe what you want, give it a character, and launch an agent powered by the best AI models. no code, no setup, just ship.
          </p>

          {/* CTA Link to Dashboard */}
          <a href="/dashboard" style={{ textDecoration: 'none', marginBottom: '32px' }}>
            <button className="btn-primary" style={{
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '999px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(245, 96, 28, 0.25)',
              border: 0
            }}>
              Go to Dashboard &rarr;
            </button>
          </a>

          {/* Model Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', opacity: 0.8, marginBottom: '32px' }}>
            {['Claude 3.5', 'GPT-4o', 'Gemini Pro', 'Grok 2', 'Llama 3'].map((m) => (
              <span key={m} style={{ fontSize: '12px', fontWeight: 'bold', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{m}</span>
            ))}
          </div>

          {/* macOS Window App Mockup inside Hero */}
          <div style={{
            width: '100%',
            maxWidth: '960px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            textAlign: 'left'
          }}>
            {/* macOS window title bar */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
              <span style={{ margin: '0 auto', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>kirble-console-v2.5.app</span>
            </div>
            {/* Mock Console Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: '360px', background: '#FAFAF8' }}>
              <div style={{ borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#ffedd5', color: '#c2410c', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>🤖 Agents Sandbox</div>
                <div style={{ color: '#475569', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>🎭 Reusable Personas</div>
                <div style={{ color: '#475569', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>💳 Wallet Ledger</div>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ alignSelf: 'flex-end', background: '#F5601C', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }}>
                    check solana balance and search the web
                  </div>
                  <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', maxWidth: '80%' }}>
                    <strong>AGENT (MIMO-V2.5-PRO)</strong><br />
                    Analyzing query... Executing tool [solana_balance]... Balance is 50.4 SOL. Executing [web_search]... Finished task!
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input disabled placeholder="Describe a task or compile a new instruction..." style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }} />
                  <button disabled style={{ background: '#0A0A0A', color: '#fff', border: 0, padding: '0 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Send</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* How it works */}
      <section id="how" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>How it works</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0 48px 0', letterSpacing: '-0.02em' }}>From a single sentence to a live running agent.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>✍️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>1. Describe It</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Describe what your agent should do in plain English. Kirble interprets your logic and maps required tools.</p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🎭</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>2. Select Persona</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Choose a reusable voice/tone persona to define how your agent speaks, formats answers, and handles values.</p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚀</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>3. Deploy & Run</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Launch your agent live. The routing engine handles model choices, runs loops, and charges in micro-USD.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison & Benchmarks */}
      <section id="comparison" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>Benchmarks</span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0 48px 0', letterSpacing: '-0.02em' }}>High speed compilation. Zero waste.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '32px' }}>
            {/* Time comparison card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Time to Ship Agent (Hours)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Kirble Agent Spec</span> <span>5 hours</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#ffedd5', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '8%', height: '100%', background: '#F5601C' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Traditional Dev / Code</span> <span>72 hours</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', background: '#94a3b8' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Visual Builder Tools</span> <span>48 hours</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#94a3b8' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost comparison card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Cost for 1,000 runs (USD)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Kirble (BYOK / Proxy)</span> <span>$0.00</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#ffedd5', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '2%', height: '100%', background: '#F5601C' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Standard AI SaaS Tier</span> <span>$150.00</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: '#94a3b8' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>No-Code Platforms</span> <span>$220.00</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '95%', height: '100%', background: '#94a3b8' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>Flexible plans</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, margin: '12px 0', letterSpacing: '-0.02em' }}>Pricing built for scale.</h2>
            <p style={{ color: '#475569' }}>Pay only for what you run, or choose unlimited access.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            {/* Free Card */}
            <div style={{ background: '#FAFAF8', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Free Mode</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>For hobbyists testing prompts.</p>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px' }}>$0 <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#64748b' }}>/ forever</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
                  <li>✓ Manual sandbox runs</li>
                  <li>✓ Basic prompt translation</li>
                  <li>✓ standard LLM catalog models</li>
                  <li>✓ 1 Active agent connection</li>
                </ul>
              </div>
              <button style={{ background: 'transparent', border: '2px solid #e2e8f0', color: '#0a0a0a', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '32px' }}>Get Started</button>
            </div>

            {/* Pro Card */}
            <div style={{ background: '#0A0A0A', color: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'scale(1.02)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Pro Tier</h3>
                  <span style={{ background: '#F5601C', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', color: '#fff' }}>POPULAR</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>For active autonomous loops.</p>

                {/* Yearly Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#262626', padding: '4px', borderRadius: '999px', width: 'fit-content', marginBottom: '24px' }}>
                  <button onClick={() => setIsYearly(false)} style={{ background: !isYearly ? '#404040' : 'transparent', color: '#fff', border: 0, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer' }}>Monthly</button>
                  <button onClick={() => setIsYearly(true)} style={{ background: isYearly ? '#404040' : 'transparent', color: '#fff', border: 0, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer' }}>Yearly (27% Off)</button>
                </div>

                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px' }}>
                  {isYearly ? '$7.25' : '$9.97'} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#94a3b8' }}>/ month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
                  <li>✓ 24h+ Autonomous agentic loops</li>
                  <li>✓ 1-click cloud ship</li>
                  <li>✓ BYO API keys / no markup credits</li>
                  <li>✓ Access to mimo-v2.5-pro models</li>
                  <li>✓ Priority custom catalog tools</li>
                </ul>
              </div>
              <button style={{ background: '#fff', color: '#0a0a0a', border: 0, padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '32px', cursor: 'pointer' }}>Upgrade to Pro</button>
            </div>
          </div>

          {/* Lifetime Card */}
          <div style={{ background: '#0A0A0A', color: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <span style={{ background: '#c2410c', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', marginRight: '10px' }}>LIMITED DEAL</span>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', display: 'inline' }}>Lifetime Access</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Pay once, run forever with your own API endpoints. No recurring fees.</p>

              {/* Progress Step */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', fontSize: '12px' }}>
                <span style={{ color: '#64748b', textDecoration: 'line-through' }}>$67 sold out</span>
                <span style={{ color: '#F5601C', fontWeight: 'bold' }}>$97 active (43 left)</span>
                <span style={{ color: '#64748b' }}>$125 next stage</span>
              </div>
            </div>
            <button style={{ background: '#F5601C', color: '#fff', border: 0, padding: '16px 32px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 96, 28, 0.3)' }}>Get Lifetime for $97</button>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section id="faq" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>FAQ</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0', letterSpacing: '-0.02em' }}>Common questions.</h2>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px 8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    color: '#0A0A0A'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: openFaq === idx ? '#F5601C' : '#fff',
                    color: openFaq === idx ? '#fff' : '#c2410c',
                    border: '1px solid #e2e8f0',
                    display: 'grid',
                    placeItems: 'center',
                    transition: '.2s',
                    transform: openFaq === idx ? 'rotate(45deg)' : 'none',
                    fontSize: '18px'
                  }}>{openFaq === idx ? '×' : '+'}</span>
                </button>
                <div style={{
                  maxHeight: openFaq === idx ? '200px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height .35s ease'
                }}>
                  <p style={{ padding: '0 8px 24px 8px', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 24px 40px 24px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '64px' }}>
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
                <LogoIcon />
                Kirble
              </span>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
                Any AI agent you can describe. Give it a character and launch it on the best models — no code.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#F5601C', marginBottom: '16px' }}>Product</h4>
              <a href="#how" style={{ display: 'block', fontSize: '14px', color: '#475569', padding: '6px 0' }}>How it works</a>
              <a href="#comparison" style={{ display: 'block', fontSize: '14px', color: '#475569', padding: '6px 0' }}>Comparison</a>
              <a href="#pricing" style={{ display: 'block', fontSize: '14px', color: '#475569', padding: '6px 0' }}>Pricing</a>
            </div>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#F5601C', marginBottom: '16px' }}>Legal</h4>
              <a href="#" style={{ display: 'block', fontSize: '14px', color: '#475569', padding: '6px 0' }}>Privacy Policy</a>
              <a href="#" style={{ display: 'block', fontSize: '14px', color: '#475569', padding: '6px 0' }}>Terms of Service</a>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '24px', fontSize: '13px', color: '#64748b' }}>
            <span>© 2026 Kirble. All rights reserved.</span>
            <span>designed by <span style={{ color: '#F5601C', fontWeight: 'bold' }}>Kirble Architect</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
