'use client';

import React, { useState, useEffect } from 'react';
import { SKILL_CATALOG, Skill, SkillId } from '../../shared/skills';

interface SlashPaletteProps {
  filterQuery: string;
  onSelectSkill: (skillId: SkillId) => void;
  onClose: () => void;
}

export const SlashPalette: React.FC<SlashPaletteProps> = ({
  filterQuery,
  onSelectSkill,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const query = filterQuery.toLowerCase().trim();
  const filteredSkills = SKILL_CATALOG.filter((skill) => {
    if (!query) return true;
    return (
      skill.label.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      skill.aliases.some((alias) => alias.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filterQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredSkills.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredSkills.length) % (filteredSkills.length || 1));
      } else if (e.key === 'Enter') {
        if (filteredSkills[selectedIndex]) {
          e.preventDefault();
          onSelectSkill(filteredSkills[selectedIndex].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSkills, selectedIndex, onSelectSkill, onClose]);

  if (filteredSkills.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: '8px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        fontSize: '13px',
        color: '#64748B'
      }}>
        No skills found matching "/{filterQuery}"
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      marginBottom: '8px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '8px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
      maxHeight: '260px',
      overflowY: 'auto',
      zIndex: 50
    }}>
      <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Skill Palette — Press Enter to select
      </div>
      {filteredSkills.map((skill, index) => {
        const isSelected = index === selectedIndex;
        return (
          <div
            key={skill.id}
            onClick={() => onSelectSkill(skill.id)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: isSelected ? '#F1F5F9' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{skill.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  {skill.label}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {skill.description}
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: skill.tier === 'pro' ? '#FEF3C7' : '#F1F5F9',
              color: skill.tier === 'pro' ? '#D97706' : '#64748B'
            }}>
              {skill.tier.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};
