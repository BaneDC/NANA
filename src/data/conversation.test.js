import { describe, expect, it } from 'vitest';
import { remainingQuestions, resumeAt } from './conversation';

const aboutYou = { 'about-you': { values: { 'your-name': 'Anna', 'your-phone': '+358 40 1' } } };

describe('resuming the onboarding', () => {
  it('a first visit starts on the blank page', () => {
    expect(resumeAt({})).toBeNull();
    expect(resumeAt(aboutYou)).toBeNull();
  });
  it('coming back, the first question not answered yet', () => {
    const first = remainingQuestions(aboutYou)[0].id;
    const answers = { ...aboutYou, [first]: { value: 'x' } };
    expect(resumeAt(answers)).toBe(remainingQuestions(answers)[0].id);
    expect(resumeAt(answers)).not.toBe(first);
  });
});
