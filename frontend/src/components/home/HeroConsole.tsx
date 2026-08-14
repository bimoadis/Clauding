'use client';

import React, { useState, useEffect, useRef } from 'react';

export type HeroConsoleMode = 'live' | 'capture';

interface HeroConsoleProps {
  mode?: HeroConsoleMode;
  loop?: boolean;
  speed?: number;
  modelLabel?: string;
}

export const HeroConsole: React.FC<HeroConsoleProps> = ({
  mode = 'live',
  loop = true,
  speed = 1,
  modelLabel = 'CLAUDING-V1.0-PRO'
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [inView, setInView] = useState(mode === 'capture');
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose clock setter for Playwright recorder in capture mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__heroSetTime = (seconds: number) => {
        setCurrentTime(seconds);
      };
    }
  }, []);

  // IntersectionObserver for live mode CPU optimization
  useEffect(() => {
    if (mode === 'capture') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [mode]);

  // Animation Loop Timer for Live mode
  useEffect(() => {
    if (mode === 'capture' || !inView) return;

    let startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const elapsed = ((now - startTime) / 1000) * speed;
      const totalLoopDuration = 10.0; // 10 seconds total

      if (loop) {
        setCurrentTime(elapsed % totalLoopDuration);
      } else {
        setCurrentTime(Math.min(elapsed, totalLoopDuration));
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode, inView, loop, speed]);

  // Storyboard timing milestones
  // 0.3s: Typewriter starts "check solana balance and search the web"
  const fullText = "check solana balance and search the web";
  const typewriterStart = 0.3;
  const typewriterEnd = 1.8;

  let currentPromptText = "";
  if (currentTime >= typewriterStart) {
    const progress = Math.min(1, (currentTime - typewriterStart) / (typewriterEnd - typewriterStart));
    const charsToShow = Math.floor(progress * fullText.length);
    currentPromptText = fullText.slice(0, charsToShow);
  }

  // 2.0s: User message slides in
  const showUserMsg = currentTime >= 2.0;

  // 2.3s: Agent card fade-in
  const showAgentCard = currentTime >= 2.3;

  // 2.6s: "Analyzing query..."
  const showAnalyzing = currentTime >= 2.6;

  // 3.4s: Chip [solana_balance] spinner -> checkmark at 4.2s
  const showSolanaChip = currentTime >= 3.4;
  const isSolanaDone = currentTime >= 4.2;

  // 5.0s: Chip [web_search] spinner -> checkmark at 6.0s
  const showWebSearchChip = currentTime >= 5.0;
  const isWebSearchDone = currentTime >= 6.0;

  // 6.6s: Finished task badge
  const showFinishedBadge = currentTime >= 6.6;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '854px',
        aspectRatio: '16 / 9',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* macOS window title bar */}
      <div style={{
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }} />
        <span style={{ margin: '0 auto', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '0.02em' }}>
          clauding-console-v1.0.app
        </span>
      </div>

      {/* Mock Console Content Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '180px 1fr', background: '#FAFAF8', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ borderRight: '1px solid #E2E8F0', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#FFFFFF' }}>
          <div style={{ background: '#FFF7ED', color: '#C2410C', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span> Sandbox
          </div>
          <div style={{ color: '#475569', padding: '8px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤</span> Personas
          </div>
          <div style={{ color: '#475569', padding: '8px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💳</span> Ledger
          </div>
        </div>

        {/* Chat / Console Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
            {/* User message slide in */}
            {showUserMsg && (
              <div style={{
                alignSelf: 'flex-end',
                background: '#F5601C',
                color: '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '12px 12px 2px 12px',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(245, 96, 28, 0.25)'
              }}>
                {fullText}
              </div>
            )}

            {/* Agent response card */}
            {showAgentCard && (
              <div style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '12px',
                maxWidth: '90%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.02em' }}>
                  AGENT ({modelLabel})
                </div>

                {showAnalyzing && (
                  <div style={{ color: '#64748B', marginBottom: '8px', fontSize: '12px' }}>
                    Analyzing query...
                  </div>
                )}

                {/* Solana Tool Chip */}
                {showSolanaChip && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '6px', marginRight: '6px' }}>
                    <span>{isSolanaDone ? '✓' : '⏳'}</span>
                    <code>[solana_balance]</code>
                    {isSolanaDone && <span style={{ color: '#16A34A', fontWeight: 700 }}>50.4 SOL</span>}
                  </div>
                )}

                {/* Web Search Chip */}
                {showWebSearchChip && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', marginBottom: '6px' }}>
                    <span>{isWebSearchDone ? '✓' : '⏳'}</span>
                    <code>[web_search]</code>
                  </div>
                )}

                {/* Finished Task Badge */}
                {showFinishedBadge && (
                  <div style={{ marginTop: '8px', background: '#DCFCE7', border: '1px solid #A7F3D0', color: '#15803D', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '11px', width: 'fit-content' }}>
                    ✓ Finished task!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer Input Bar */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexShrink: 0 }}>
            <input
              readOnly
              value={showUserMsg ? '' : currentPromptText}
              placeholder="Type / for skill palette..."
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                background: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                color: '#0F172A'
              }}
            />
            <button style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 0,
              padding: '0 20px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
