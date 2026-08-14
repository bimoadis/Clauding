'use client';

import React from 'react';
import { SKILL_CATALOG, SkillId } from '../../shared/skills';

interface StarterSkillCardsProps {
  onPinSkill: (skillId: SkillId) => void;
}

export const StarterSkillCards: React.FC<StarterSkillCardsProps> = ({ onPinSkill }) => {
  const starterSkills = SKILL_CATALOG.slice(0, 4);

  return (
    <div style={{ padding: '24px 0', textAlign: 'center' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
        Start with a capability
      </h3>
      <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
        Tap any skill card below or type <code>/</code> in composer to attach tools to your agent prompt.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        maxWidth: '720px',
        margin: '0 auto'
      }}>
        {starterSkills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => onPinSkill(skill.id)}
            style={{
              padding: '16px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{skill.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {skill.label}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              {skill.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
