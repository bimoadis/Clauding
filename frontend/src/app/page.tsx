'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration mismatches
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Mascot component that renders the logo icon
const LogoIcon: React.FC = () => (
  <img
    src="/logo.png"
    alt="Clauding Logo"
    style={{
      width: '46px',
      height: '46px',
      objectFit: 'contain',
      borderRadius: '8px'
    }}
  />
);

export default function Home() {
  const router = useRouter();
  const { connected } = useWallet();
  const [prompt, setPrompt] = useState('');
  const [buildStatus, setBuildStatus] = useState('Create');
  const [isYearly, setIsYearly] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Accordion FAQs
  const faqs = [
    { q: "Do I need to code?", a: "No. You describe your agent in plain language and pick a character. Clauding builds and runs it for you — developers can still drop into the API if they want." },
    { q: "Which models can my agent use?", a: "Claude and GPT. The compiler selects the best model from Claude 3.5 Sonnet and GPT-4o automatically, or you can pin a favorite model." },
    { q: "How do I pay?", a: "Top up with crypto (Coming Soon) or run locally using your own API keys. No cards or per-provider subscriptions required." },
    { q: "Can I change my agent's character later?", a: "Anytime. Swap characters to change your agent's tone and style without rebuilding it." },
    { q: "Is my agent always online?", a: "Yes. Once launched, your agent runs as a persistent Temporal workflow on our infrastructure and stays available to handle tasks asynchronously." }
  ];
  const [openFaq, setOpenFaq] = useState(0 as number | null);

  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#0A0A0A', position: 'relative' }}>
      {/* Import Plus Jakarta Sans for premium typography match */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Preload background image to optimize LCP and boost Lighthouse score */}
      <link rel="preload" as="image" href="/hero-bg.png" />

      {/* Vanilla Responsive CSS with Hamburger Menu Support */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (min-width: 901px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-menu-overlay { display: none !important; }
        }

        @media (max-width: 900px) {
          .desktop-nav-links { display: none !important; }
          .desktop-nav-wallet { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          
          .landing-nav {
            padding: 20px 24px !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .landing-hero {
            padding-top: 40px !important;
            min-height: auto !important;
          }
          .console-mockup-content {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .console-mockup-sidebar {
            display: none !important;
          }
          .console-mockup-chat {
            padding: 20px !important;
            height: 300px !important;
          }
          .how-it-works-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .comparison-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .lifetime-card {
            flex-direction: column !important;
            text-align: center !important;
            gap: 20px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}} />

      <nav className="landing-nav" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '30px 40px',
        background: 'transparent',
        pointerEvents: 'auto'
      }}>
        {/* Left: Brand */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '20px', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          <LogoIcon />
          Clauding
        </span>

        {/* Center: Navigation Links in Capsule (Desktop Only) */}
        <div className="desktop-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          padding: '4px 6px',
          borderRadius: '999px',
          zIndex: 110
        }}>
          <a href="#how" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>How it works</a>
          <a href="#pricing" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>Pricing</a>
          <a href="#faq" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 16px', borderRadius: '999px', transition: 'background 0.2s' }}>FAQ</a>
        </div>

        {/* Right: Connect Button (Desktop Only) */}
        <div className="desktop-nav-wallet" style={{ zIndex: 110 }}>
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

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
          style={{
            background: 'none',
            border: 0,
            fontSize: '28px',
            cursor: 'pointer',
            color: '#0A0A0A',
            padding: '4px 8px',
            outline: 'none',
            zIndex: 110
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile Dropdown Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" style={{
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
            gap: '18px',
            alignItems: 'center',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            zIndex: 99
          }}>
            <a href="#how" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: '#334155', textDecoration: 'none', width: '100%', textAlign: 'center', padding: '8px 0' }}>How it works</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: '#334155', textDecoration: 'none', width: '100%', textAlign: 'center', padding: '8px 0' }}>Pricing</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: '#334155', textDecoration: 'none', width: '100%', textAlign: 'center', padding: '8px 0' }}>FAQ</a>

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
      </nav>

      {/* Hero Section */}
      <header className="landing-hero" style={{
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
        backgroundRepeat: 'no-repeat',
        zIndex: 1 // Explicitly stack below absolute nav
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
            One prompt.<br />
            <span style={{ color: '#F5601C' }}>Launch any AI agent.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 1.8vw, 20px)', color: '#475569', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            describe what you want and launch an agent powered by the best AI models. no code, no setup, just ship.
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
            {['Claude 3.5', 'GPT-4o'].map((m) => (
              <span key={m} style={{
                fontSize: '12px',
                fontWeight: 'bold',
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                color: '#334155'
              }}>{m}</span>
            ))}
          </div>

          {/* macOS Window App Mockup inside Hero */}
          <div style={{
            width: '100%',
            maxWidth: '960px',
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            textAlign: 'left'
          }}>
            {/* macOS window title bar */}
            <div style={{ background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.45)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
              <span style={{ margin: '0 auto', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>clauding-console-v1.0.app</span>
            </div>
            {/* Mock Console Content */}
            <div className="console-mockup-content" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: '360px', background: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="console-mockup-sidebar" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.45)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(254, 237, 213, 0.5)', color: '#c2410c', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/icons/general-chat.svg" alt="" style={{ width: '24px', height: '24px' }} />
                  Agents Sandbox
                </div>
                <div style={{ color: '#475569', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/icons/step-2-select-persona.svg" alt="" style={{ width: '24px', height: '24px' }} />
                  Reusable Personas
                </div>
                <div style={{ color: '#475569', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/icons/capability-wallet-balance.svg" alt="" style={{ width: '24px', height: '24px' }} />
                  Wallet Ledger
                </div>
              </div>
              <div className="console-mockup-chat" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                  <div style={{ alignSelf: 'flex-end', background: '#F5601C', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }}>
                    check solana balance and search the web
                  </div>
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.45)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', maxWidth: '85%' }}>
                    <strong>AGENT (CLAUDING-V1.0-PRO)</strong><br />
                    Analyzing query... Executing tool [solana_balance]... Balance is 50.4 SOL. Executing [web_search]... Finished task!
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <input disabled placeholder="Describe a task or compile a new instruction..." style={{ flex: 1, padding: '10px', border: '1px solid rgba(255, 255, 255, 0.45)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.5)' }} />
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

          <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img src="/icons/step-1-describe-it.svg" alt="Step 1" style={{ width: '64px', height: '64px', marginBottom: '12px', display: 'block' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>1. Describe It</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Describe what your agent should do in plain English. Clauding interprets your logic and maps required tools.</p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img src="/icons/step-2-select-persona.svg" alt="Step 2" style={{ width: '64px', height: '64px', marginBottom: '12px', display: 'block' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>2. Review Spec & Tools</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Customize name, description, system instructions, and assign custom blockchain capabilities (tools) to your agent.</p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF8', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img src="/icons/step-3-deploy-run.svg" alt="Step 3" style={{ width: '64px', height: '64px', marginBottom: '12px', display: 'block' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>3. Deploy & Run</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>Launch your agent live. The routing engine handles model choices, runs loops, and charges in micro-USD.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>Flexible Access</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, margin: '12px 0', letterSpacing: '-0.02em' }}>Access built for compilers.</h2>
            <p style={{ color: '#475569' }}>Hold $CLDG tokens for free agent compilation, or subscribe to Pro for managed cloud loops.</p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            <div style={{ background: '#FAFAF8', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Free Trial</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>For hobbyists testing prompts & prototyping ideas.</p>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px' }}>Free <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#64748b' }}>/ rate-limited</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
                  <li>✓ 20 Free Messages Every Hour</li>
                  <li>✓ 100 Daily Agent Launches</li>
                  <li>✓ 5-Step Autonomous ReAct Loop</li>
                  <li>✓ Claude & GPT Standard Models</li>
                  <li>✓ 1 Active Live Agent Workspace</li>
                </ul>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: 'transparent', border: '2px solid #e2e8f0', color: '#0a0a0a', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '32px', cursor: 'pointer' }}
              >
                Get Started
              </button>
            </div>

            {/* Pro Card */}
            <div style={{ background: '#0A0A0A', color: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'scale(1.02)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Pro Tier</h3>
                  <span style={{ background: '#F5601C', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', color: '#fff' }}>POPULAR</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                  For active autonomous loops.
                </p>

                <div style={{ fontSize: '26px', fontWeight: '800', color: '#F5601C', marginBottom: '2px', letterSpacing: '-0.02em' }}>
                  Hold 50,000 $CLDG
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '24px' }}>
                  for unlimited active agents
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
                  <li>✓ Unlimited active agents via 50,000 $CLDG hold</li>
                  <li>✓ 24h+ Autonomous agentic loops</li>
                  <li>✓ 1-click cloud ship</li>
                  <li>✓ Zero-fee compilation loops</li>
                  <li>✓ Access to clauding-v1.0-pro models</li>
                  <li>✓ Priority custom catalog tools</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  alert("You will be redirected to Pump.fun to buy $CLDG tokens to unlock Pro Tier!");
                  window.open("https://pump.fun", "_blank");
                }}
                style={{ background: '#fff', color: '#0a0a0a', border: 0, padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '32px', cursor: 'pointer' }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Token Buy Card */}
          <div className="token-buy-card" style={{ background: '#0A0A0A', color: '#fff', borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', marginTop: '40px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <span style={{ background: '#F5601C', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', marginRight: '10px' }}>LAUNCH OFFER</span>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', display: 'inline' }}>Get $CLDG Token</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Hold 50,000 $CLDG to unlock unlimited compiler access, live cloud launches, and zero-fee agent execution.</p>
            </div>
            <a
              href="https://pump.fun"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#F5601C',
                color: '#fff',
                textDecoration: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(245, 96, 28, 0.3)',
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              Buy on Pump.fun
            </a>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section id="faq" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F5601C' }}>Got Questions?</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0', letterSpacing: '-0.02em' }}>Everything you need to know.</h2>
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
      <footer style={{ padding: '80px 24px 40px 24px', background: '#FAFAF8', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: '48px', marginBottom: '64px' }}>

            {/* Left Brand Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '24px', color: '#0A0A0A', letterSpacing: '-0.03em' }}>
                <LogoIcon />
                Clauding
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#0A0A0A', margin: 0, maxWidth: '420px' }}>
                Ship agents without burning credits.
              </h2>
              <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.5, maxWidth: '380px', margin: 0 }}>
                Unlock autonomous agentic dev powered by $CLDG compilation loops.
              </p>

              {/* Social Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <a href="#" style={{
                  width: '40px',
                  height: '40px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#0A0A0A',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" style={{
                  width: '40px',
                  height: '40px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#0A0A0A',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Link Columns */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'lowercase', color: '#F5601C', marginBottom: '20px', letterSpacing: '0.05em' }}>product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="/dashboard" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>Dashboard</a>
                <a href="#how" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>How it Works</a>
                <a href="#pricing" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>Pricing</a>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'lowercase', color: '#F5601C', marginBottom: '20px', letterSpacing: '0.05em' }}>legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="/privacy" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>Privacy Policy</a>
                <a href="/eula" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>EULA</a>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'lowercase', color: '#F5601C', marginBottom: '20px', letterSpacing: '0.05em' }}>more</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>Twitter (X)</a>
                <a href="https://github.com/bimoadis/KIRBLE" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>GitHub</a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Credits */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '24px',
            fontSize: '13px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>© 2026 Clauding. All rights reserved.</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '600px', lineHeight: '1.4' }}>
                Disclaimer: CLAUDING is an independent product and is not affiliated, partnered, endorsed, or officially associated with Anthropic or OpenAI. CLAUDING runs on Anthropic and OpenAI models.
              </span>
            </div>
            <span>powered by <span style={{ color: '#F5601C', fontWeight: 'bold' }}>Clauding Autonomous Compiler</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
