'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { HeroConsole } from '../components/home/HeroConsole';
import { SolanaSafetySection } from '../components/home/SolanaSafetySection';
import { RealSpecOutput } from '../components/home/RealSpecOutput';

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
      width: '40px',
      height: '40px',
      objectFit: 'contain',
      borderRadius: '8px'
    }}
  />
);

// Custom SVG Copy / Checkmark Icon Component
const CopyIcon: React.FC<{ copied: boolean }> = ({ copied }) => {
  if (copied) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
};

export default function Home() {
  const router = useRouter();
  const { connected } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [caCopied, setCaCopied] = useState(false);

  // Accordion FAQs (Note: "Is my agent always online?" removed as requested per 24/7 autonomous loop status)
  const faqs = [
    { q: "Do I need to code?", a: "No. You describe your agent in plain language. Clauding compiles and runs it for you — developers can still drop into the raw JSON spec or API if they want." },
    { q: "Which models can my agent use?", a: "Claude Fable 5 and GPT-4o. The routing engine dynamically selects the best model per query response." },
    { q: "How do I pay?", a: "Hold 50,000 $CLDG tokens for unlimited compiler access, or use your own API keys for local dev execution." },
    { q: "Can I inspect the compiled agent logic?", a: "Yes. Every prompt emits a transparent, structured agent specification schema (JSON/YAML) before execution." }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ background: '#FAFAF9', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#0A0A0A', position: 'relative' }}>
      {/* Import Plus Jakarta Sans for premium typography match */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Vanilla Responsive CSS */}
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
            background: #FFFFFF !important;
            border-bottom: 1px solid #E5E7EB !important;
          }
          .landing-hero {
            padding-top: 100px !important;
            min-height: auto !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
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
        padding: '24px 40px',
        background: 'transparent'
      }}>
        {/* Left: Brand */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '20px', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          <LogoIcon />
          Clauding
        </span>

        {/* Center: Navigation Links */}
        <div className="desktop-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          padding: '4px 12px',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <a href="#how" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 14px' }}>How it works</a>
          <a href="#pricing" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 14px' }}>Pricing</a>
          <a href="#faq" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#334155', padding: '6px 14px' }}>FAQ</a>
          <a href="/token" style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#F5601C', padding: '6px 14px' }}>Docs</a>
          <a
            href="https://x.com/usecldg?s=11"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow on X (@usecldg)"
            aria-label="X"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              color: '#0A0A0A',
              padding: '6px 10px',
              borderRadius: '999px',
              transition: 'opacity 0.2s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* Right: Connect Button */}
        <div className="desktop-nav-wallet">
          <WalletMultiButton style={{
            background: '#F5601C',
            borderRadius: '999px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0 24px',
            height: '40px',
            border: 0,
            color: '#fff'
          }} />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
          style={{ background: 'none', border: 0, fontSize: '24px', cursor: 'pointer' }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '120px 24px 60px 24px',
        textAlign: 'center',
        backgroundImage: "linear-gradient(180deg, rgba(250, 250, 249, 0.3) 0%, rgba(250, 250, 249, 0.4) 65%, #FFFFFF 100%), url('/hero-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#FAFAF9'
      }}>
        <div style={{ width: '100%', maxWidth: '854px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Copyable Contract Address Badge */}
          <div
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText('Coming Soon');
              }
              setCaCopied(true);
              setTimeout(() => setCaCopied(false), 2000);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              userSelect: 'all'
            }}
            title="Click to copy Contract Address"
          >
            <span style={{ color: '#F5601C' }}>CA:</span>
            <span>Coming Soon</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: caCopied ? '#10B981' : '#64748B' }}>
              <CopyIcon copied={caCopied} />
              {caCopied && <span>Copied!</span>}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: '20px' }}>
            One prompt.<br />
            <span style={{ color: '#F5601C' }}>Launch any AI agent.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', color: '#475569', maxWidth: '620px', margin: '0 auto 28px auto', lineHeight: 1.5 }}>
            Describe what your agent should do. The compiler generates structured logic schemas and attaches Solana safety tools instantly.
          </p>

          {/* CTA Link to Dashboard */}
          <a href="/dashboard" style={{ textDecoration: 'none', marginBottom: '28px' }}>
            <button style={{
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 800,
              borderRadius: '999px',
              cursor: 'pointer',
              background: '#F5601C',
              color: '#FFFFFF',
              border: 0,
              boxShadow: '0 4px 16px rgba(245, 96, 28, 0.25)'
            }}>
              Go to Dashboard &rarr;
            </button>
          </a>

          {/* Model Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '6px 14px', borderRadius: '8px', color: '#334155' }}>
              Claude Fable 5
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '6px 14px', borderRadius: '8px', color: '#334155' }}>
              GPT-4o
            </span>
          </div>

          {/* Interactive DOM Hero Console Component */}
          <HeroConsole mode="live" loop={true} speed={1} />
        </div>
      </header>

      {/* Section 2: Solana Safety Tools (Elevated from compile page) */}
      <SolanaSafetySection />

      {/* Section 3: Real Spec Output (Developer Evidence) */}
      <RealSpecOutput />

      {/* How it works */}
      <section id="how" style={{ padding: '80px 24px', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '48px', letterSpacing: '-0.02em' }}>
            From a single sentence to a live running agent
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '24px', background: '#FAFAF9', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>📝</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>1. Describe It</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Describe your agent objective in plain language or use slash commands <code>/</code> to pin capabilities.
              </p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF9', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚙️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>2. Review Spec & Tools</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Inspect the generated system prompt and assigned tools. Adjust parameters and step budgets.
              </p>
            </div>
            <div style={{ padding: '24px', background: '#FAFAF9', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>▶️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>3. Deploy & Run</h3>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Execute your agent autonomously. The routing engine handles model choices and tool dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#FAFAF9', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
              Flexible Access
            </h2>
            <p style={{ color: '#475569', margin: 0 }}>
              Free rate-limited testing or Pro access via $CLDG token hold.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {/* Free Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Free Tier</h3>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>For testing prompts & prototyping agent ideas.</p>
                <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '20px' }}>Free</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
                  <li>✓ 20 Free Messages Every 2 Hours</li>
                  <li>✓ 5-Step Autonomous ReAct Loop</li>
                  <li>✓ Access to Standard Models</li>
                  <li>✓ Standard Skill Palette Access</li>
                </ul>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: '#0F172A', color: '#FFFFFF', border: 0, padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 700, marginTop: '32px', cursor: 'pointer' }}
              >
                Get Started
              </button>
            </div>

            {/* Pro Card */}
            <div style={{ background: '#0A0A0A', color: '#FFFFFF', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Pro Tier</h3>
                  <span style={{ background: '#F5601C', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '999px' }}>PRO</span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px' }}>For active autonomous agent compilation.</p>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#F5601C', marginBottom: '4px' }}>
                  Hold 50,000 $CLDG
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#CBD5E1', marginTop: '20px' }}>
                  <li>✓ Unlimited active agent compilations</li>
                  <li>✓ Priority routing via Claude Fable 5</li>
                  <li>✓ Unlimited ReAct loop execution steps</li>
                  <li>✓ Priority custom tool binding</li>
                </ul>
              </div>
              
              {/* Orange button with black text */}
              <div style={{ marginTop: '32px' }}>
                <a
                  href="/token"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <button style={{
                    width: '100%',
                    background: '#F5601C',
                    color: '#0A0A0A',
                    border: 0,
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    How $CLDG access works &rarr;
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section id="faq" style={{ padding: '80px 24px', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '40px', textAlign: 'center', letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ borderTop: '1px solid #E5E7EB' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
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
                    padding: '20px 0',
                    fontSize: '17px',
                    fontWeight: 700,
                    textAlign: 'left',
                    color: '#0A0A0A'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '20px', color: '#64748B' }}>{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <p style={{ padding: '0 0 20px 0', color: '#475569', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 24px 40px 24px', background: '#FAFAF9', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoIcon />
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#0A0A0A' }}>Clauding</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <a
              href="https://x.com/usecldg?s=11"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
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
              <span>Follow @usecldg</span>
            </a>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              © 2026 Clauding. Autonomous Agent Compiler.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
