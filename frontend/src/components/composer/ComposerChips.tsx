'use client';

import React from 'react';
import { SkillId, getSkillById } from '../../shared/skills';

interface ComposerChipsProps {
  pinnedSkills: SkillId[];
  onRemoveSkill: (id: SkillId) => void;
  maxStepsBudget: number;
}

export const ComposerChips: React.FC<ComposerChipsProps> = ({
  pinnedSkills,
  onRemoveSkill,
  maxStepsBudget
}) => {
  const currentStepsUsed = pinnedSkills.reduce((total, id) => {
    const skill = getSkillById(id);
    return total + (skill?.estimatedSteps || 1);
  }, 0);

  if (pinnedSkills.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      padding: '8px 12px',
      background: '#F8FAFC',
      borderBottom: '1px solid #E2E8F0',
      borderRadius: '8px 8px 0 0'
    }}>
      {pinnedSkills.map((id) => {
        const skill = getSkillById(id);
        if (!skill) return null;
        return (
          <span
            key={id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              background: skill.tier === 'pro' ? '#FEF3C7' : '#EFF6FF',
              color: skill.tier === 'pro' ? '#92400E' : '#1E40AF',
              border: `1px solid ${skill.tier === 'pro' ? '#FCD34D' : '#BFDBFE'}`
            }}
          >
            <span>{skill.icon}</span>
            <span>{skill.label}</span>
            {skill.tier === 'pro' && <span style={{ fontSize: '10px', fontWeight: 800 }}>PRO</span>}
            <button
              onClick={() => onRemoveSkill(id)}
              style={{
                background: 'none',
                border: 0,
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '0 2px',
                color: 'inherit'
              }}
              title="Remove skill chip"
            >
              ×
            </button>
          </span>
        );
      })}

      <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
        Budget: <strong style={{ color: currentStepsUsed > maxStepsBudget ? '#EF4444' : '#0F172A' }}>{currentStepsUsed}</strong> of {maxStepsBudget} steps
      </div>
    </div>
  );
};
