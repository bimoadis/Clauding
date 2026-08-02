'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mascot component that renders the pixel art logo dynamically
const Mascot: React.FC = () => {
  const N = 22, cx = 10.5, cy = 9.3, r = 7.6;
  const O = '#F6A21C', D = '#C24A18', K = '#151515', W = '#ffffff', B = '#1E52A6', R = '#E8451B', P = '#F3854B';

  const rects: { x: number; y: number; fill: string }[] = [];
  const addPx = (x: number, y: number, c: string) => {
    rects.push({ x, y, fill: c });
  };
  
  // Base head body circle
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) {
        addPx(x, y, d > r - 1.05 ? D : O);
      }
    }
  }

  // Left/Right cheeks
  [[1.5, 10.4], [19.5, 10.4]].forEach(([ax, ay]) => {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.hypot(x - ax, y - ay);
        if (d <= 2.15) {
          addPx(x, y, d > 1.25 ? D : O);
        }
      }
    }
  });

  // Feet
  [[6.3, 18.4], [14.7, 18.4]].forEach(([fx, fy]) => {
    for (let y = 0; y < N + 2; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.hypot((x - fx) / 1.35, (y - fy) / 0.95);
        if (d <= 1.95) {
          addPx(x, y, d > 1.3 ? D : R);
        }
      }
    }
  });

  // Blushes
  addPx(6, 10.5, P);
  addPx(7, 10.5, P);
  addPx(15, 10.5, P);
  addPx(16, 10.5, P);

  // Eyes
  [[7.6, 7], [12.4, 7]].forEach(([ex, ey]) => {
    for (let yy = 0; yy < 3; yy++) {
      for (let xx = 0; xx < 2; xx++) {
        addPx(ex + xx, ey + yy, K);
      }
    }
    addPx(ex, ey, W);
    addPx(ex + 1, ey, W);
    addPx(ex, ey + 2, B);
    addPx(ex + 1, ey + 2, B);
  });

  // Nose/mouth
  addPx(10.3, 10.4, R);
  addPx(11.3, 10.4, R);
  addPx(10.3, 11.4, R);
  addPx(11.3, 11.4, R);

  return (
    <svg viewBox="-1 0 24 23" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kirble logo">
      {rects.map((rc, idx) => (
        <rect key={idx} x={rc.x} y={rc.y} width="1.04" height="1.04" fill={rc.fill} />
      ))}
    </svg>
  );
};

export default function Home() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [activeSection, setActiveSection] = useState('top');
  const [prompt, setPrompt] = useState('');
  const [buildStatus, setBuildStatus] = useState('Create');

  // Characters config
  const characters = [
    { icon: "📊", bg: "#e6f0fb", name: "The Analyst", desc: "Precise and data first. Cuts straight to the numbers with no fluff.", quote: '"Here\'s what the data actually says."' },
    { icon: "🧭", bg: "#efeafe", name: "The Strategist", desc: "Big picture thinker. Weighs the angles and makes the sharp call.", quote: '"Let\'s think two moves ahead."' },
    { icon: "💬", bg: "#fbe9f1", name: "The Companion", desc: "Warm, friendly, and always on. Talks with you, not at you.", quote: '"I\'ve got you — where do we start?"' },
    { icon: "🛠", bg: "#e3f5ee", name: "The Builder", desc: "Hands on and fast. Turns ideas into something that ships.", quote: '"Say the word, I\'ll build it."' },
    { icon: "🎨", bg: "#fbeee6", name: "The Muse", desc: "Playful and bold. Brings creative energy to everything it touches.", quote: '"Let\'s make something wild."' },
    { icon: "📚", bg: "#fbf1dc", name: "The Scholar", desc: "Deep and patient. Explains the why, not just the what.", quote: '"Let me walk you through it."' }
  ];
  const [selectedChar, setSelectedChar] = useState(characters[0]);

  // Accordion FAQs
  const faqs = [
    { q: "Do I need to code?", a: "No. You describe your agent in plain language and pick a character. Kirble builds and runs it for you — developers can still drop into the API if they want." },
    { q: "Which models can my agent use?", a: "Claude, GPT, Gemini, Grok, Llama and more. Kirble picks the best model for each task automatically, or you can pin a favorite." },
    { q: "How do I pay?", a: "Top up once with crypto and spend across every model from one balance. No cards, no per-provider subscriptions." },
    { q: "Can I change my agent's character later?", a: "Anytime. Swap characters to change your agent's tone and style without rebuilding it." },
    { q: "Is my agent always online?", a: "Yes. Once launched, your agent runs on Kirble's infrastructure and stays available across the tools you connect it to." }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Scroll active section listener
  useEffect(() => {
    const handleScroll = () => {
      const secs = ['top', 'how', 'characters', 'models', 'faq'];
      let current = 'top';
      for (const id of secs) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <>
      <nav>
        <div className="navbar">
          <span className="brand">
            <span className="mark">
              <Mascot />
            </span>
            Kirble
          </span>
          <span className="navlinks">
            <a href="#top" className={activeSection === 'top' ? 'active' : ''}>Home</a>
            <a href="#how" className={activeSection === 'how' ? 'active' : ''}>How it works</a>
            <a href="#characters" className={activeSection === 'characters' ? 'active' : ''}>Characters</a>
            <a href="#models" className={activeSection === 'models' ? 'active' : ''}>Models</a>
            <a href="#faq" className={activeSection === 'faq' ? 'active' : ''}>FAQ</a>
          </span>

          <WalletMultiButton className="nav-cta" />
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="glow sun"></div>
        <div className="glow mist"></div>
        <div className="hero-mascot" id="heroMascot">
          <Mascot />
        </div>
        <div className="wrap">
          <div className="hero-inner">
            <span className="eyebrow reveal in"><span className="dot"></span> Build agents in plain language</span>
            <h1 className="reveal in">One line.<br /><span className="accent">Any AI agent.</span></h1>
            <p className="lead reveal in">Describe what you want, give it a character, and launch an agent powered by the best AI models. No code, no setup.</p>
            <div className="prompt reveal in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 10h8M8 14h5" /><path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h1a8 8 0 0 1 8 8z" /></svg>
              <input
                id="promptIn"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="An agent that tracks crypto news and DMs me the alpha"
              />
              <button className="btn-primary" onClick={handleBuild}>
                {buildStatus}
                {buildStatus === 'Create' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                )}
              </button>
            </div>
            <div className="poweredby reveal in">
              <span>Powered by</span>
              <span className="models"><span>Claude</span><span>GPT</span><span>Gemini</span><span>Grok</span><span>Llama</span></span>
            </div>
          </div>
        </div>
      </header>

      <section className="how wrap" id="how">
        <div className="lbl reveal in">How it works</div>
        <h2 className="reveal in">From a single sentence to a working agent.</h2>
        <div className="rows">
          <div className="row reveal in"><div className="k">Describe it</div><div className="v">Say what your agent should do in plain words. Kirble turns your sentence into a working setup.</div></div>
          <div className="row reveal in"><div className="k">Give it character</div><div className="v">Choose a personality that shapes how your agent thinks, talks, and makes decisions.</div></div>
          <div className="row reveal in"><div className="k">Launch</div><div className="v">Your agent goes live instantly, running on whichever AI model does each task best.</div></div>
        </div>
      </section>

      <section className="chars" id="characters">
        <div className="wrap">
          <div className="lbl reveal in">Characters</div>
          <h2 className="reveal in">Give your agent a character.</h2>
          <p className="sub reveal in">A personality shapes how your agent thinks, talks, and decides. Pick one to preview.</p>
          <div className="avatars reveal in">
            {characters.map((c, i) => (
              <div
                key={i}
                className={`avatar ${selectedChar.name === c.name ? 'sel' : ''}`}
                onClick={() => setSelectedChar(c)}
              >
                <div className="disc" style={{ background: c.bg }}>{c.icon}</div>
                <div className="nm">{c.name.replace('The ', '')}</div>
              </div>
            ))}
          </div>
          <div className="char-preview reveal in" id="charPreview">
            <div className="who">{selectedChar.name}</div>
            <div className="desc">{selectedChar.desc}</div>
            <div className="quote">{selectedChar.quote}</div>
          </div>
        </div>
      </section>

      <section className="wrap" id="models">
        <div className="models-sec">
          <div>
            <div className="lbl reveal in">Under the hood</div>
            <h2 className="reveal in">One agent. Every model.</h2>
            <p className="sub reveal in">Kirble routes each task to the model that handles it best, so your agent always runs on the right brain. One balance, no accounts to juggle.</p>
          </div>
          <div className="reveal in">
            <svg className="diagram" viewBox="0 0 500 380" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M250 190 C160 120 120 110 90 90" stroke="#ecdcc4" stroke-width="1.5" />
              <path d="M250 190 C170 170 130 190 80 200" stroke="#ecdcc4" stroke-width="1.5" />
              <path d="M250 190 C170 230 140 280 110 310" stroke="#ecdcc4" stroke-width="1.5" />
              <path d="M250 190 C340 120 380 110 410 90" stroke="#ecdcc4" stroke-width="1.5" />
              <path d="M250 190 C340 230 370 280 400 310" stroke="#ecdcc4" stroke-width="1.5" />
              <g fontFamily="Space Grotesk, sans-serif" fontSize="14" fontWeight="600">
                <g><rect x="30" y="72" width="98" height="38" rx="19" fill="#fff" stroke="#efe3d0" /><text x="79" y="96" textAnchor="middle" fill="#3a3a44">Claude</text></g>
                <g><rect x="18" y="182" width="80" height="38" rx="19" fill="#fff" stroke="#efe3d0" /><text x="58" y="206" textAnchor="middle" fill="#3a3a44">GPT</text></g>
                <g><rect x="42" y="292" width="98" height="38" rx="19" fill="#fff" stroke="#efe3d0" /><text x="91" y="316" textAnchor="middle" fill="#3a3a44">Gemini</text></g>
                <g><rect x="372" y="72" width="86" height="38" rx="19" fill="#fff" stroke="#efe3d0" /><text x="415" y="96" textAnchor="middle" fill="#3a3a44">Grok</text></g>
                <g><rect x="360" y="292" width="94" height="38" rx="19" fill="#fff" stroke="#efe3d0" /><text x="407" y="316" textAnchor="middle" fill="#3a3a44">Llama</text></g>
              </g>
              <circle cx="250" cy="190" r="52" fill="#f5820a" />
              <text x="250" y="196" textAnchor="middle" fill="#fff" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" letterSpacing="-0.02em">Kirble</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="faq wrap" id="faq">
        <div className="lbl reveal in">FAQ</div>
        <h2 className="reveal in">Common questions.</h2>
        <div className="qa">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`qitem ${openFaq === idx ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span>{faq.q}</span>
                <span className="ic">{openFaq === idx ? '×' : '+'}</span>
              </button>
              <div
                className="ans"
                style={{
                  maxHeight: openFaq === idx ? '200px' : '0px',
                  transition: 'max-height .35s ease'
                }}
              >
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta wrap">
        <div className="cta-inner reveal in">
          <h2>Build your first agent.</h2>
          <p className="sub">Describe it, give it a character, and watch it come alive in minutes.</p>
          <button
            className="btn-primary"
            onClick={() => {
              document.getElementById('promptIn')?.focus();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Start building
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <span className="brand">
                <span className="mark">
                  <Mascot />
                </span>
                Kirble
              </span>
              <p>Any AI agent you can describe. Give it a character and launch it on the best models — no code.</p>
              <a className="foot-x" href="#"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5-6.6L5.5 22H2.4l8-9.2L1.7 2h6.9l4.6 6.1L18.9 2zm-2.4 18h1.9L7.5 3.9H5.5L16.5 20z" /></svg> Follow on X</a>
            </div>
            <div>
              <h4>Explore</h4>
              <a href="#how">How it works</a>
              <a href="#characters">Characters</a>
              <a href="#models">Models</a>
            </div>
            <div>
              <h4>More</h4>
              <a href="#faq">FAQ</a>
              <a href="#">Docs</a>
              <a href="#">X / Twitter</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Kirble. Placeholder brand.</span>
            <span className="links"><a href="#how">How it works</a><a href="#characters">Characters</a><a href="#models">Models</a><a href="#faq">FAQ</a></span>
          </div>
        </div>
      </footer>
    </>
  );
}
