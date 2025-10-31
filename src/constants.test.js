import { describe, it, expect } from 'vitest';
import { STAGES, STAGE_COLORS, TAGS_OPTIONS, TEAM_MEMBERS } from './constants';

describe('Constants', () => {
  it('STAGES contains all expected stages', () => {
    expect(STAGES).toEqual([
      'applied',
      'screen',
      'tech',
      'offer',
      'hired',
      'rejected',
    ]);
  });

  it('STAGE_COLORS has color for each stage', () => {
    STAGES.forEach(stage => {
      expect(STAGE_COLORS[stage]).toBeDefined();
      expect(STAGE_COLORS[stage]).toContain('bg-');
    });
  });

  it('TAGS_OPTIONS is not empty', () => {
    expect(TAGS_OPTIONS.length).toBeGreaterThan(0);
  });

  it('TEAM_MEMBERS are prefixed with @', () => {
    TEAM_MEMBERS.forEach(member => {
      expect(member).toMatch(/^@/);
    });
  });
});
